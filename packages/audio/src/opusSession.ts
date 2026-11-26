import { EncodedPacketSink, Input } from 'mediabunny';
import { logger } from '@motajs/common';
import {
    AudioCodec,
    AudioInputSource,
    IAudioCodecDecoder,
    IAudioDecodeError,
    IAudioDecodedChunk,
    IAudioDecodeSession,
    IAudioFormatInfo
} from './types';
import { createMediaInput } from './probe';

interface IOpusIdentificationHeader {
    /** OpusHead 中声明的起始预跳过采样数，解码后需要丢弃 */
    readonly preSkip: number;
    /** 输出声道数 */
    readonly channels: number;
    /** 独立 Opus 流数量 */
    readonly streamCount: number;
    /** 耦合 Opus 流数量 */
    readonly coupledStreamCount: number;
    /** 输出声道到 Opus 流的映射表 */
    readonly channelMappingTable: number[];
}

interface IOpusDecodedAudio {
    /** 每个声道的 PCM 数据 */
    readonly channelData: Float32Array[];
    /** 每个声道解码出的采样数 */
    readonly samplesDecoded: number;
    /** 解码后的采样率 */
    readonly sampleRate: number;
    /** 解码过程中产生的错误列表 */
    readonly errors: IAudioDecodeError[];
}

interface IOpusDecoderOptions {
    /** Opus 输出采样率，固定为 48000 */
    readonly sampleRate: 48000;
    /** 输出声道数 */
    readonly channels: number;
    /** 起始处需要跳过的采样数 */
    readonly preSkip: number;
    /** 独立 Opus 流数量 */
    readonly streamCount: number;
    /** 耦合 Opus 流数量 */
    readonly coupledStreamCount: number;
    /** 输出声道到 Opus 流的映射表 */
    readonly channelMappingTable: number[];
}

interface IOpusDecoderInstance {
    /** WASM 初始化完成的 Promise */
    readonly ready: Promise<void>;

    /**
     * 解码单个 Opus 包
     * @param packet 待解码的 Opus 包
     * @returns 解码后的 PCM 数据，可能是同步值或 Promise
     */
    decodeFrame(
        packet: Uint8Array
    ): IOpusDecodedAudio | Promise<IOpusDecodedAudio>;

    /**
     * 释放解码器占用的资源
     */
    free(): void | Promise<void>;
}

interface IOpusDecoderModule {
    /** 主线程 Opus 解码器构造函数 */
    readonly OpusDecoder: new (
        options: IOpusDecoderOptions
    ) => IOpusDecoderInstance;
    /** Web Worker Opus 解码器构造函数 */
    readonly OpusDecoderWebWorker: new (
        options: IOpusDecoderOptions
    ) => IOpusDecoderInstance;
}

/** 缓存的 opus-decoder 动态导入 Promise，避免并发重复加载 */
let opusModulePromise: Promise<IOpusDecoderModule> | null = null;

/**
 * 解析 Opus 识别头，缺少或非法时返回 null
 * @param description 解码器描述数据，即 OpusHead
 * @returns 解析得到的识别头，缺少或非法时为 null
 */
export function parseOpusIdentificationHeader(
    description: Uint8Array | null
): IOpusIdentificationHeader | null {
    if (!description || description.length < 19) return null;
    const magic = new TextDecoder().decode(description.slice(0, 8));
    if (magic !== 'OpusHead') return null;
    const channelCount = description[9];
    if (channelCount < 1) return null;
    const view = new DataView(
        description.buffer,
        description.byteOffset,
        description.byteLength
    );
    const preSkip = view.getUint16(10, true);
    const mappingFamily = description[18];
    if (mappingFamily !== 0 && description.length < 21 + channelCount) {
        return null;
    }
    if (mappingFamily === 0) {
        return {
            preSkip,
            channels: channelCount,
            streamCount: 1,
            coupledStreamCount: channelCount - 1,
            channelMappingTable: channelCount === 2 ? [0, 1] : [0]
        };
    }
    const streamCount = description[19];
    const coupledStreamCount = description[20];
    const channelMappingTable: number[] = [];
    for (let i = 0; i < channelCount; i++) {
        channelMappingTable.push(description[21 + i]);
    }
    return {
        preSkip,
        channels: channelCount,
        streamCount,
        coupledStreamCount,
        channelMappingTable
    };
}

/**
 * 按 OpusHead 配置并创建 Opus 解码器；浏览器使用 Worker 变体，Node 使用主线程变体
 * @param header 已解析的 Opus 识别头
 */
async function loadOpusDecoder(
    header: IOpusIdentificationHeader
): Promise<IOpusDecoderInstance> {
    let pending = opusModulePromise;
    if (!pending) {
        pending = import('opus-decoder');
        opusModulePromise = pending;
    }
    const opus = await pending.catch(error => {
        // 加载失败时清空缓存，保证后续调用可以重试
        opusModulePromise = null;
        throw error;
    });
    const options: IOpusDecoderOptions = {
        sampleRate: 48000,
        channels: header.channels,
        preSkip: header.preSkip,
        streamCount: header.streamCount,
        coupledStreamCount: header.coupledStreamCount,
        channelMappingTable: header.channelMappingTable
    };
    const decoder: IOpusDecoderInstance =
        typeof Worker === 'undefined'
            ? new opus.OpusDecoder(options)
            : new opus.OpusDecoderWebWorker(options);
    await decoder.ready;
    return decoder;
}

export class OpusCodecDecoder implements IAudioCodecDecoder {
    /** 当前配置好的 Opus 解码器，未配置时为空 */
    private decoder: IOpusDecoderInstance | null = null;

    async configure(
        info: IAudioFormatInfo,
        description?: Uint8Array
    ): Promise<void> {
        if (info.codec !== AudioCodec.Opus) return;
        const header = parseOpusIdentificationHeader(description ?? null);
        if (!header) return;
        this.decoder = await loadOpusDecoder(header);
    }

    async decode(
        packet: Uint8Array,
        timestamp: number,
        duration: number
    ): Promise<IAudioDecodedChunk | null> {
        const decoder = this.decoder;
        if (!decoder) return null;
        const decoded = await decoder.decodeFrame(packet);
        // 零采样但带解码错误时需要保留错误，交给上层记录失败
        const isEmpty = decoded.samplesDecoded === 0;
        if (isEmpty && decoded.errors.length === 0) return null;
        return {
            channelData: decoded.channelData.map(
                channel => new Float32Array(channel)
            ),
            samplesDecoded: decoded.samplesDecoded,
            sampleRate: decoded.sampleRate,
            timestamp,
            duration,
            errors: decoded.errors
        };
    }

    flush(): Promise<IAudioDecodedChunk | null> {
        return Promise.resolve(null);
    }

    async destroy(): Promise<void> {
        const decoder = this.decoder;
        this.decoder = null;
        if (!decoder) return;
        await decoder.free();
    }
}

export class OpusDecodeSession implements IAudioDecodeSession {
    readonly info: IAudioFormatInfo;
    readonly chunks: AsyncIterable<IAudioDecodedChunk>;

    /** 会话持有的 mediabunny 输入，关闭会话时释放 */
    private readonly input: Input;
    /** 按包顺序读取编码数据的包读取器 */
    private readonly sink: EncodedPacketSink;
    /** 当前会话使用的 Opus 编码解码器 */
    private readonly decoder: IAudioCodecDecoder;
    /** 会话是否已关闭，用于中止异步迭代 */
    private closed: boolean = false;

    constructor(
        input: Input,
        sink: EncodedPacketSink,
        info: IAudioFormatInfo,
        decoder: IAudioCodecDecoder
    ) {
        this.input = input;
        this.sink = sink;
        this.info = info;
        this.decoder = decoder;
        this.chunks = this.generateChunks();
    }

    /**
     * 顺序读取并解码全部 Opus 包，会话关闭后提前结束
     */
    private async *generateChunks(): AsyncGenerator<IAudioDecodedChunk> {
        for await (const packet of this.sink.packets()) {
            if (this.closed) return;
            const chunk = await this.decoder.decode(
                packet.data,
                packet.timestamp,
                packet.duration
            );
            if (chunk) yield chunk;
        }
    }

    close(): void {
        if (this.closed) return;
        this.closed = true;
        this.input.dispose();
        void this.decoder.destroy();
    }
}

/**
 * 为 Ogg / WebM Opus 创建整文件解码会话
 * @param source 音频输入数据
 * @param info 探测得到的格式信息
 * @param decoder 已注册的 Opus 编码解码器
 */
export async function createOpusDecodeSession(
    source: AudioInputSource,
    info: IAudioFormatInfo,
    decoder: IAudioCodecDecoder
): Promise<OpusDecodeSession | null> {
    const input = createMediaInput(source);
    if (!input) return null;
    const readable = await input.canRead();
    if (!readable) {
        input.dispose();
        logger.error(97);
        return null;
    }
    const track = await input.getPrimaryAudioTrack();
    if (!track) {
        input.dispose();
        logger.error(97);
        return null;
    }
    const config = await track.getDecoderConfig();
    if (!config || !(config.description instanceof Uint8Array)) {
        input.dispose();
        logger.error(97);
        return null;
    }
    if (!parseOpusIdentificationHeader(config.description)) {
        input.dispose();
        logger.error(97);
        return null;
    }
    await decoder.configure(info, config.description);
    const sink = new EncodedPacketSink(track);
    return new OpusDecodeSession(input, sink, info, decoder);
}
