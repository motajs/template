import {
    EncodedPacketSink,
    Input,
    InputAudioTrack,
    OGG,
    ReadableStreamSource,
    WEBM
} from 'mediabunny';
import { logger } from '@motajs/common';
import {
    AudioCodec,
    AudioContainer,
    IAudioCodecDecoder,
    IAudioDecodeError,
    IAudioDecodedChunk,
    IAudioFormatInfo
} from './types';
import { parseOpusIdentificationHeader } from './opusSession';

const enum StreamFormatGuess {
    NeedMore,
    Unsupported,
    OggOpus,
    OggVorbis,
    WebMOpus
}

/** 判定编码前允许缓存的最大前缀字节数 */
const SNIFF_LIMIT = 64 * 1024;

/**
 * 依据前缀字节判断流的容器与编码，字节不足时返回需要更多
 * @param prefix 已收到的文件头字节
 */
function sniffStreamFormat(prefix: Uint8Array): StreamFormatGuess {
    if (prefix.length < 4) return StreamFormatGuess.NeedMore;
    if (
        prefix[0] === 0x4f &&
        prefix[1] === 0x67 &&
        prefix[2] === 0x67 &&
        prefix[3] === 0x53
    ) {
        // Ogg 首页页头第 27 字节记录本页的段数，首包紧随段表之后
        if (prefix.length < 27) return StreamFormatGuess.NeedMore;
        const segments = prefix[26];
        const packetStart = 27 + segments;
        if (prefix.length < packetStart + 8) return StreamFormatGuess.NeedMore;
        const packetHead = new TextDecoder().decode(
            prefix.subarray(packetStart, packetStart + 8)
        );
        if (packetHead === 'OpusHead') return StreamFormatGuess.OggOpus;
        if (packetHead[0] === '\x01' && packetHead.slice(1, 7) === 'vorbis') {
            return StreamFormatGuess.OggVorbis;
        }
        return StreamFormatGuess.Unsupported;
    }
    if (
        prefix[0] === 0x1a &&
        prefix[1] === 0x45 &&
        prefix[2] === 0xdf &&
        prefix[3] === 0xa3
    ) {
        return StreamFormatGuess.WebMOpus;
    }
    return StreamFormatGuess.Unsupported;
}

/**
 * 把前缀字节转换为大写十六进制串，供错误码描述文件头
 * @param prefix 已收到的文件头字节
 */
function toHexHeader(prefix: Uint8Array): string {
    const head = prefix.subarray(0, 256);
    const parts: string[] = [];
    for (let i = 0; i < head.length; i++) {
        parts.push(head[i].toString(16).padStart(2, '0').toUpperCase());
    }
    return parts.join(' ');
}

interface IStreamBridge {
    /** 供 mediabunny 拉取的可读流 */
    readonly readable: ReadableStream<Uint8Array>;
    /** 已经写入桥的字节数 */
    readonly size: number;

    /**
     * 写入新的字节数据
     * @param data 新的字节数据
     */
    push(data: Uint8Array): void;

    /**
     * 关闭桥，后续读取以 EOF 结束
     */
    close(): void;
}

class StreamBridge implements IStreamBridge {
    readonly readable: ReadableStream<Uint8Array>;
    size: number = 0;

    /** 底层可读流的控制器，流创建后立即赋值 */
    private controller: ReadableStreamDefaultController<Uint8Array> | null =
        null;
    /** 是否已经关闭，关闭后忽略后续写入 */
    private closed: boolean = false;

    constructor() {
        this.readable = new ReadableStream<Uint8Array>({
            start: controller => {
                this.controller = controller;
            }
        });
    }

    push(data: Uint8Array): void {
        if (this.closed) return;
        this.controller?.enqueue(data);
        this.size += data.length;
    }

    close(): void {
        if (this.closed) return;
        this.closed = true;
        this.controller?.close();
    }
}

interface IVorbisStreamChunk {
    /** 每个声道的 PCM 数据 */
    readonly channelData: Float32Array[];
    /** 本次解码出的采样数 */
    readonly samplesDecoded: number;
    /** 解码后的采样率 */
    readonly sampleRate: number;
    /** 解码过程中产生的错误列表 */
    readonly errors: IAudioDecodeError[];
}

interface IVorbisStreamDecoder {
    /** WASM 初始化完成的 Promise */
    readonly ready: Promise<void>;

    /**
     * 增量解码一段 Ogg Vorbis 字节
     * @param data 本次的字节数据
     */
    decode(data: Uint8Array): Promise<IVorbisStreamChunk>;

    /**
     * 结束解码，返回残余数据
     */
    flush(): Promise<IVorbisStreamChunk>;

    /**
     * 释放解码器占用的资源
     */
    free(): void | Promise<void>;
}

interface IVorbisDecoderModule {
    /** 主线程 Ogg Vorbis 解码器构造函数 */
    readonly OggVorbisDecoder: new () => IVorbisStreamDecoder;
    /** Web Worker Ogg Vorbis 解码器构造函数 */
    readonly OggVorbisDecoderWebWorker: new () => IVorbisStreamDecoder;
}

/** 缓存的 ogg-vorbis 动态导入结果，供后续解码器复用 */
let vorbisModule: IVorbisDecoderModule | null = null;

/**
 * 动态加载流式 Ogg Vorbis 解码器；浏览器使用 Worker 变体，Node 使用主线程变体
 */
async function loadVorbisStreamDecoder(): Promise<IVorbisStreamDecoder> {
    let current = vorbisModule;
    if (!current) {
        current = await import('@wasm-audio-decoders/ogg-vorbis');
        vorbisModule = current;
    }
    const decoder =
        typeof Worker === 'undefined'
            ? new current.OggVorbisDecoder()
            : new current.OggVorbisDecoderWebWorker();
    await decoder.ready;
    return decoder;
}

export interface IAudioStreamDecoder {
    /** 判定出的音频格式信息，未判定时为空 */
    readonly info: IAudioFormatInfo | null;
    /** 按顺序产出的解码数据块 */
    readonly chunks: AsyncIterable<IAudioDecodedChunk>;
    /** 是否已因错误终止 */
    readonly failed: boolean;

    /**
     * 推入新的字节数据
     * @param data 新的字节数据，为 undefined 时表示只做终止处理
     * @param done 是否传输完成
     */
    push(data: Uint8Array | undefined, done: boolean): Promise<void>;

    /**
     * 停止消费并释放桥与解码器
     */
    close(): void;
}

export class AudioStreamDecoder implements IAudioStreamDecoder {
    info: IAudioFormatInfo | null = null;
    readonly chunks: AsyncIterable<IAudioDecodedChunk>;
    failed: boolean = false;

    /** Opus 路径使用的编码解码器，由注册表创建 */
    private readonly opusDecoder: IAudioCodecDecoder | null;
    /** 是否已收到结束信号或已被关闭 */
    private ended: boolean = false;
    /** 判定编码前累积的文件头字节 */
    private prefix: Uint8Array = new Uint8Array(0);
    /** 已累积的前缀字节数 */
    private prefixBytes: number = 0;
    /** 当前判定出的流格式，未判定时为 NeedMore */
    private format: StreamFormatGuess = StreamFormatGuess.NeedMore;
    /** Opus 路径的推送转拉取桥 */
    private bridge: StreamBridge | null = null;
    /** Opus 路径的 mediabunny 输入 */
    private input: Input | null = null;
    /** Vorbis 路径的增量解码器 */
    private vorbis: IVorbisStreamDecoder | null = null;
    /** 已解码但尚未被消费的数据块 */
    private readonly pending: IAudioDecodedChunk[] = [];
    /** 等待下一数据块的生成器回调 */
    private waiter: (() => void) | null = null;
    /** Vorbis 路径已经解码的采样总数，用于推导时间戳 */
    private vorbisSamples: number = 0;
    /** 判定时记录的文件头十六进制串 */
    private headerHex: string = '';
    /** 是否已经记录过解码错误码 */
    private errorReported: boolean = false;

    constructor(opusDecoder: IAudioCodecDecoder | null) {
        this.opusDecoder = opusDecoder;
        this.chunks = this.generateChunks();
    }

    async push(data: Uint8Array | undefined, done: boolean): Promise<void> {
        if (this.failed || this.ended) return;
        if (data) {
            if (this.format === StreamFormatGuess.NeedMore) {
                const merged = new Uint8Array(this.prefixBytes + data.length);
                merged.set(this.prefix);
                merged.set(data, this.prefixBytes);
                this.prefix = merged;
                this.prefixBytes = merged.length;
                await this.decideFormat();
                if (this.failed || this.ended) return;
            } else if (this.format === StreamFormatGuess.OggVorbis) {
                await this.runVorbisChunk(data);
            } else {
                this.bridge?.push(data);
            }
            if (!done) return;
        }
        if (this.format === StreamFormatGuess.OggVorbis) {
            await this.runVorbisChunk(null);
        } else if (this.format === StreamFormatGuess.NeedMore) {
            if (done) this.fail(25);
        } else {
            this.bridge?.close();
        }
    }

    close(): void {
        this.ended = true;
        this.bridge?.close();
        this.vorbis?.free();
        this.vorbis = null;
        this.wake();
    }

    /**
     * 依据前缀判定编码并打开对应的解码路径
     */
    private async decideFormat(): Promise<void> {
        const guess = sniffStreamFormat(this.prefix);
        this.headerHex = toHexHeader(this.prefix);
        if (guess === StreamFormatGuess.NeedMore) {
            if (this.prefixBytes < SNIFF_LIMIT) return;
            this.fail(25);
            return;
        }
        if (guess === StreamFormatGuess.Unsupported) {
            this.fail(25);
            return;
        }
        this.format = guess;
        if (guess === StreamFormatGuess.OggVorbis) {
            await this.openVorbis();
            return;
        }
        this.prepareOpus(guess);
        this.openOpus(guess).catch(() => {
            // 关闭或释放导致的中止不记录错误码
            if (!this.ended && !this.failed) this.fail(97);
        });
    }

    /**
     * 同步建立推送桥并把已收到的前缀写入，供后台打开 Opus 解码
     * @param guess 判定结果
     */
    private prepareOpus(guess: StreamFormatGuess): void {
        this.format = guess;
        const bridge = new StreamBridge();
        this.bridge = bridge;
        if (this.prefixBytes > 0) bridge.push(this.prefix);
        this.prefix = new Uint8Array(0);
        this.prefixBytes = 0;
    }

    /**
     * 从推送桥创建 mediabunny 输入并启动 Opus 包的消费
     * @param guess 判定结果
     */
    private async openOpus(guess: StreamFormatGuess): Promise<void> {
        const bridge = this.bridge;
        if (!bridge) return;
        const isOgg = guess === StreamFormatGuess.OggOpus;
        const input = new Input({
            formats: [isOgg ? OGG : WEBM],
            source: new ReadableStreamSource(bridge.readable)
        });
        this.input = input;
        const readable = await input.canRead();
        if (this.ended || this.failed) {
            this.input?.dispose();
            this.input = null;
            return;
        }
        if (!readable) {
            this.fail(97);
            return;
        }
        const track = await input.getPrimaryAudioTrack();
        if (this.ended || this.failed) {
            this.input?.dispose();
            this.input = null;
            return;
        }
        if (!track) {
            this.fail(97);
            return;
        }
        const config = await track.getDecoderConfig();
        if (this.ended || this.failed) {
            this.input?.dispose();
            this.input = null;
            return;
        }
        if (!config || !(config.description instanceof Uint8Array)) {
            this.fail(97);
            return;
        }
        const header = parseOpusIdentificationHeader(config.description);
        if (!header) {
            this.fail(97);
            return;
        }
        const codec = await track.getCodec();
        if (this.ended || this.failed) {
            this.input?.dispose();
            this.input = null;
            return;
        }
        if (codec !== 'opus') {
            this.fail(25);
            return;
        }
        const decoder = this.opusDecoder;
        if (!decoder) {
            this.fail(97);
            return;
        }
        const info: IAudioFormatInfo = {
            container: isOgg ? AudioContainer.Ogg : AudioContainer.WebM,
            codec: AudioCodec.Opus,
            sampleRate: 48000,
            channels: header.channels,
            duration: null
        };
        await decoder.configure(info, config.description);
        if (this.ended || this.failed) {
            this.input?.dispose();
            this.input = null;
            return;
        }
        this.info = info;
        this.consumeOpus(track).catch(() => {
            if (!this.ended && !this.failed) this.fail(25);
        });
    }

    /**
     * 顺序读取并解码全部 Opus 包，结束后释放输入
     * @param track Opus 主音轨
     */
    private async consumeOpus(track: InputAudioTrack): Promise<void> {
        const decoder = this.opusDecoder;
        if (!decoder) return;
        const sink = new EncodedPacketSink(track);
        for await (const packet of sink.packets()) {
            if (this.ended || this.failed) break;
            const chunk = await decoder.decode(
                packet.data,
                packet.timestamp,
                packet.duration
            );
            if (chunk) this.enqueue(chunk);
        }
        this.wake();
        this.ended = true;
        this.input?.dispose();
        this.input = null;
    }

    /**
     * 加载 Vorbis 解码器并把已收到的前缀按原顺序重放
     */
    private async openVorbis(): Promise<void> {
        this.format = StreamFormatGuess.OggVorbis;
        const decoder = await loadVorbisStreamDecoder().catch(() => {
            if (!this.ended && !this.failed) this.fail(97);
            return null;
        });
        if (!decoder) return;
        this.vorbis = decoder;
        const prefix = this.prefix;
        this.prefix = new Uint8Array(0);
        this.prefixBytes = 0;
        if (prefix.length > 0) await this.runVorbisChunk(prefix);
    }

    /**
     * 增量解码一段 Vorbis 字节，传入 null 时结束解码
     * @param data 本次的字节数据，null 表示收尾
     */
    private async runVorbisChunk(data: Uint8Array | null): Promise<void> {
        const vorbis = this.vorbis;
        if (!vorbis) return;
        let decoded: IVorbisStreamChunk;
        try {
            decoded = data ? await vorbis.decode(data) : await vorbis.flush();
        } catch {
            // 解码库对损坏数据可能直接拒绝，按解码失败终止
            vorbis.free();
            this.vorbis = null;
            this.fail(25);
            return;
        }
        this.enqueueVorbis(decoded);
        if (data) return;
        this.ended = true;
        this.wake();
        vorbis.free();
        this.vorbis = null;
    }

    /**
     * 把 Vorbis 解码结果转换为数据块并入队
     * @param decoded Vorbis 解码结果
     */
    private enqueueVorbis(decoded: IVorbisStreamChunk): void {
        if (decoded.samplesDecoded === 0) return;
        if (!this.info) {
            this.info = {
                container: AudioContainer.Ogg,
                codec: AudioCodec.Vorbis,
                sampleRate: decoded.sampleRate,
                channels: decoded.channelData.length,
                duration: null
            };
        }
        const sampleRate = decoded.sampleRate;
        const chunk: IAudioDecodedChunk = {
            channelData: decoded.channelData.map(
                channel => new Float32Array(channel)
            ),
            samplesDecoded: decoded.samplesDecoded,
            sampleRate,
            timestamp: this.vorbisSamples / sampleRate,
            duration: decoded.samplesDecoded / sampleRate,
            errors: decoded.errors
        };
        this.vorbisSamples += decoded.samplesDecoded;
        this.enqueue(chunk);
    }

    /**
     * 把数据块放入有序队列并唤醒消费者
     * @param chunk 解码数据块
     */
    private enqueue(chunk: IAudioDecodedChunk): void {
        if (chunk.errors.length > 0 && !this.errorReported) {
            this.errorReported = true;
            logger.error(25, this.headerHex);
        }
        this.pending.push(chunk);
        this.wake();
    }

    /**
     * 唤醒正在等待下一数据块的生成器
     */
    private wake(): void {
        const waiter = this.waiter;
        if (!waiter) return;
        this.waiter = null;
        waiter();
    }

    /**
     * 记录一次错误码并停止全部解码路径
     * @param code 要记录的日志码
     */
    private fail(code: number): void {
        if (this.failed) return;
        this.failed = true;
        this.ended = true;
        logger.error(code, this.headerHex);
        this.bridge?.close();
        this.vorbis?.free();
        this.vorbis = null;
        this.input?.dispose();
        this.input = null;
        this.wake();
    }

    /**
     * 按顺序产出解码数据块，结束且排空后终止
     */
    private async *generateChunks(): AsyncGenerator<IAudioDecodedChunk> {
        while (true) {
            if (this.pending.length > 0) {
                const [chunk] = this.pending.splice(0, 1);
                yield chunk;
            } else if (this.ended) {
                return;
            } else {
                const { promise, resolve } = Promise.withResolvers<void>();
                this.waiter = resolve;
                await promise;
            }
        }
    }
}
