import { logger } from '@motajs/common';
import {
    AudioCodec,
    AudioInputSource,
    IAudioDecodeError,
    IAudioDecodedChunk,
    IAudioDecodeSession,
    IAudioFormatInfo
} from './types';

interface IVorbisDecodedAudio {
    /** 每个声道的 PCM 数据 */
    readonly channelData: Float32Array[];
    /** 每个声道解码出的采样数 */
    readonly samplesDecoded: number;
    /** 解码后的采样率 */
    readonly sampleRate: number;
    /** 解码过程中产生的错误列表 */
    readonly errors: IAudioDecodeError[];
}

interface IVorbisDecoderInstance {
    /** WASM 初始化完成的 Promise */
    readonly ready: Promise<void>;

    /**
     * 整文件解码 Ogg Vorbis 数据
     * @param data 完整的 Ogg Vorbis 文件字节
     */
    decodeFile(data: Uint8Array): Promise<IVorbisDecodedAudio>;

    /**
     * 释放解码器占用的资源
     */
    free(): void | Promise<void>;
}

interface IVorbisDecoderModule {
    /** 主线程 Ogg Vorbis 解码器构造函数 */
    readonly OggVorbisDecoder: new () => IVorbisDecoderInstance;
    /** Web Worker Ogg Vorbis 解码器构造函数 */
    readonly OggVorbisDecoderWebWorker: new () => IVorbisDecoderInstance;
}

/** 缓存的 ogg-vorbis 模块，加载成功后才写入，失败可以重试 */
let vorbisModule: IVorbisDecoderModule | null = null;

/**
 * 读取音频输入的全部字节，不支持的输入返回 null
 * @param source 音频输入数据
 */
async function readSourceBytes(
    source: AudioInputSource
): Promise<Uint8Array | null> {
    if (source instanceof ArrayBuffer) return new Uint8Array(source);
    if (source instanceof Uint8Array) return source;
    if (source instanceof Blob) {
        return new Uint8Array(await source.arrayBuffer());
    }
    if (typeof source === 'string') {
        const response = await fetch(source);
        return new Uint8Array(await response.arrayBuffer());
    }
    // 不支持的输入类型已由 probe 记录 warn 217，这里不重复记录
    return null;
}

/**
 * 动态加载 Ogg Vorbis 解码器；浏览器使用 Worker 变体，Node 使用主线程变体
 */
async function loadVorbisDecoder(): Promise<IVorbisDecoderInstance> {
    let current = vorbisModule;
    if (!current) {
        current = await import('@wasm-audio-decoders/ogg-vorbis');
        vorbisModule = current;
    }
    const decoder: IVorbisDecoderInstance =
        typeof Worker === 'undefined'
            ? new current.OggVorbisDecoder()
            : new current.OggVorbisDecoderWebWorker();
    await decoder.ready;
    return decoder;
}

export class VorbisDecodeSession implements IAudioDecodeSession {
    readonly info: IAudioFormatInfo;
    readonly chunks: AsyncIterable<IAudioDecodedChunk>;

    /** 本次整文件解码使用的 Vorbis 解码器 */
    private readonly decoder: IVorbisDecoderInstance;
    /** 整文件解码得到的唯一数据块 */
    private readonly chunk: IAudioDecodedChunk;
    /** 会话是否已关闭，用于中止异步迭代 */
    private closed: boolean = false;

    constructor(
        info: IAudioFormatInfo,
        decoder: IVorbisDecoderInstance,
        chunk: IAudioDecodedChunk
    ) {
        this.info = info;
        this.decoder = decoder;
        this.chunk = chunk;
        this.chunks = this.generateChunks();
    }

    /**
     * 产出整文件解码结果，会话关闭后不再产出
     */
    private async *generateChunks(): AsyncGenerator<IAudioDecodedChunk> {
        if (this.closed) return;
        yield this.chunk;
    }

    close(): void {
        if (this.closed) return;
        this.closed = true;
        void this.decoder.free();
    }
}

/**
 * 为 Ogg Vorbis 创建整文件解码会话
 * @param source 音频输入数据
 * @param info 探测得到的格式信息
 */
export async function createVorbisDecodeSession(
    source: AudioInputSource,
    info: IAudioFormatInfo
): Promise<VorbisDecodeSession | null> {
    if (info.codec !== AudioCodec.Vorbis) return null;
    const bytes = await readSourceBytes(source);
    if (!bytes) return null;
    const decoder = await loadVorbisDecoder();
    let decoded: IVorbisDecodedAudio;
    try {
        decoded = await decoder.decodeFile(bytes);
    } catch {
        // 解码库对损坏数据可能直接拒绝，按会话创建失败处理
        void decoder.free();
        logger.error(97);
        return null;
    }
    if (decoded.samplesDecoded === 0) {
        void decoder.free();
        logger.error(97);
        return null;
    }
    const chunk: IAudioDecodedChunk = {
        channelData: decoded.channelData.map(
            channel => new Float32Array(channel)
        ),
        samplesDecoded: decoded.samplesDecoded,
        sampleRate: decoded.sampleRate,
        timestamp: 0,
        duration: decoded.samplesDecoded / decoded.sampleRate,
        errors: decoded.errors
    };
    return new VorbisDecodeSession(info, decoder, chunk);
}
