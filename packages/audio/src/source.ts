import { IStreamController, IStreamReader } from '@motajs/loader';
import { logger } from '@motajs/common';
import CodecParser, { CodecFrame, MimeType, OggPage } from 'codec-parser';
import { isNil } from 'lodash-es';
import {
    AudioType,
    EAudioSourceEvent,
    IAudioBufferSource,
    IAudioDecodeData,
    IAudioDecoder,
    IAudioElementSource,
    IAudioInput,
    IAudioStreamSource,
    IMotaAudioContext
} from './types';
import EventEmitter from 'eventemitter3';

const mimeTypeMap: Record<AudioType, MimeType | 'unknown'> = {
    [AudioType.Unknown]: 'unknown',
    [AudioType.Aac]: 'audio/aac',
    [AudioType.Flac]: 'audio/flac',
    [AudioType.Mp3]: 'audio/mpeg',
    [AudioType.Ogg]: 'application/ogg',
    [AudioType.Opus]: 'application/ogg',
    [AudioType.Wav]: 'application/ogg'
};

function isOggPage(data: any): data is OggPage {
    return !isNil(data.isFirstPage);
}

export class AudioStreamSource
    extends EventEmitter<EAudioSourceEvent>
    implements IAudioStreamSource, IStreamReader
{
    readonly ac: AudioContext;
    /** 音频源节点 */
    output: AudioBufferSourceNode;

    /** 音频数据 */
    buffer: AudioBuffer | null = null;

    /** 是否已经完全加载完毕 */
    loaded: boolean = false;
    /** 已经缓冲了多长时间，如果缓冲完那么跟歌曲时长一致 */
    buffered: number = 0;
    /** 已经缓冲的采样点数量 */
    bufferedSamples: number = 0;
    /** 当前是否正在播放 */
    playing: boolean = false;
    /** 歌曲时长，加载完毕之前保持为 0 */
    duration: number = 0;
    /** 当前已经播放了多长时间 */
    get currentTime(): number {
        return this.ac.currentTime - this.lastStartTime + this.lastStartWhen;
    }
    /** 在流传输阶段，至少缓冲多长时间的音频之后才开始播放，单位秒 */
    bufferPlayDuration: number = 1;
    /** 音频的采样率，未成功解析出之前保持为 0 */
    sampleRate: number = 0;

    private controller: IStreamController | null = null;
    private loop: boolean = false;

    private target?: IAudioInput;

    /** 上一次播放是从何时开始的 */
    private lastStartWhen: number = 0;
    /** 开始播放时刻 */
    private lastStartTime: number = 0;
    /** 上一次播放的缓存长度 */
    private lastBufferSamples: number = 0;

    /** 是否已经获取到头文件 */
    private headerRecieved: boolean = false;
    /** 音频类型 */
    private audioType: AudioType | '' = '';
    /** 音频解码器 */
    private decoder: IAudioDecoder | null = null;
    /** 音频解析器 */
    private parser: CodecParser | null = null;
    /** 每多长时间组成一个缓存 Float32Array */
    private bufferChunkSize: number = 10;
    /** 缓存音频数据，每 bufferChunkSize 秒钟组成一个 Float32Array，用于流式解码 */
    private audioData: Float32Array[][] = [];

    private errored: boolean = false;

    constructor(readonly motaAC: IMotaAudioContext) {
        super();
        this.ac = motaAC.ac;
        this.output = motaAC.ac.createBufferSource();
    }

    /**
     * 设置每个缓存数据的大小，默认为10秒钟一个缓存数据
     * @param size 每个缓存数据的时长，单位秒
     */
    setChunkSize(size: number) {
        if (this.controller?.loading || this.loaded) return;
        this.bufferChunkSize = size;
    }

    free(): void {
        this.stop();
        this.audioData = [];
        this.decoder?.destroy();
        this.decoder = null;
        this.parser = null;
        this.audioType = '';
        this.headerRecieved = false;
        this.errored = false;
        this.duration = 0;
        this.buffered = 0;
        this.bufferedSamples = 0;
        this.loaded = false;
        this.sampleRate = 0;
        this.buffer = null;
        this.output.buffer = null;
    }

    piped(controller: IStreamController): void {
        this.controller = controller;
    }

    async pump(data: Uint8Array | undefined, done: boolean): Promise<void> {
        if (!data || this.errored) return;
        if (!this.headerRecieved) {
            // 检查头文件获取音频类型，仅检查前256个字节
            const toCheck = data.slice(0, 256);
            const type = this.motaAC.getAudioTypeFromData(data);
            this.audioType = type;
            if (type === AudioType.Unknown) {
                logger.error(
                    25,
                    [...toCheck]
                        .map(v => v.toString(16).padStart(2, '0'))
                        .join(' ')
                        .toUpperCase()
                );
                return;
            }
            const decoder = this.motaAC.createDecoder(type);
            if (!decoder) {
                this.errored = true;
                logger.error(24, this.audioType);
                return Promise.reject(
                    `Cannot decode stream source type of '${this.audioType}', since there is no registered decoder for that type.`
                );
            }
            this.decoder = decoder;
            // 创建数据解析器
            const mime = mimeTypeMap[this.audioType];
            if (mime !== 'unknown') {
                const parser = new CodecParser(mime);
                this.parser = parser;
                await decoder.create();
                this.headerRecieved = true;
            }
        }

        const decoder = this.decoder;
        const parser = this.parser;
        if (!decoder || !parser) {
            this.errored = true;
            return Promise.reject(
                'No parser or decoder attached in this AudioStreamSource'
            );
        }

        await this.decodeData(data, decoder, parser);
        if (done) await this.decodeFlushData(decoder, parser);
        this.checkBufferedPlay();
    }

    /**
     * 检查采样率，如果还未解析出采样率，那么将设置采样率，如果当前采样率与之前不同，那么发出警告
     */
    private checkSampleRate(info: (OggPage | CodecFrame)[]) {
        for (const one of info) {
            const frame = isOggPage(one) ? one.codecFrames[0] : one;
            if (frame) {
                const rate = frame.header.sampleRate;
                if (this.sampleRate === 0) {
                    this.sampleRate = rate;
                    break;
                } else {
                    if (rate !== this.sampleRate) {
                        logger.warn(48);
                    }
                }
            }
        }
    }

    /**
     * 解析音频数据
     */
    private async decodeData(
        data: Uint8Array,
        decoder: IAudioDecoder,
        parser: CodecParser
    ) {
        // 解析音频数据
        const audioData = await decoder.decode(data);
        if (!audioData) return;
        // @ts-expect-error 库类型声明错误
        const audioInfo = [...parser.parseChunk(data)] as (
            | OggPage
            | CodecFrame
        )[];

        // 检查采样率
        this.checkSampleRate(audioInfo);
        // 追加音频数据
        this.appendDecodedData(audioData, audioInfo);
    }

    /**
     * 解码剩余数据
     */
    private async decodeFlushData(decoder: IAudioDecoder, parser: CodecParser) {
        const audioData = await decoder.flush();
        if (!audioData) return;
        // @ts-expect-error 库类型声明错误
        const audioInfo = [...parser.flush()] as (OggPage | CodecFrame)[];

        this.checkSampleRate(audioInfo);
        this.appendDecodedData(audioData, audioInfo);
    }

    /**
     * 追加音频数据
     */
    private appendDecodedData(
        data: IAudioDecodeData,
        info: (CodecFrame | OggPage)[]
    ) {
        const channels = data.channelData.length;
        if (channels === 0) return;
        if (this.audioData.length !== channels) {
            this.audioData = [];
            for (let i = 0; i < channels; i++) {
                this.audioData.push([]);
            }
        }
        // 计算出应该放在哪
        const chunk = this.sampleRate * this.bufferChunkSize;
        const sampled = this.bufferedSamples;
        const pushIndex = Math.floor(sampled / chunk);
        const bufferIndex = sampled % chunk;
        const dataLength = data.channelData[0].length;
        let buffered = 0;
        let nowIndex = pushIndex;
        let toBuffer = bufferIndex;
        while (buffered < dataLength) {
            const rest = toBuffer !== 0 ? chunk - bufferIndex : chunk;

            for (let i = 0; i < channels; i++) {
                const audioData = this.audioData[i];
                if (!audioData[nowIndex]) {
                    audioData.push(new Float32Array(chunk));
                }
                const toPush = data.channelData[i].slice(
                    buffered,
                    buffered + rest
                );

                audioData[nowIndex].set(toPush, toBuffer);
            }
            buffered += rest;
            nowIndex++;
            toBuffer = 0;
        }

        this.buffered +=
            info.reduce((prev, curr) => prev + curr.duration, 0) / 1000;
        this.bufferedSamples += info.reduce(
            (prev, curr) => prev + curr.samples,
            0
        );
    }

    /**
     * 检查已缓冲内容，并在未开始播放时播放
     */
    private checkBufferedPlay() {
        if (this.playing || this.sampleRate === 0) return;
        const played = this.lastBufferSamples / this.sampleRate;
        const dt = this.buffered - played;
        if (this.loaded) {
            this.playAudio(played);
            return;
        }
        if (dt < this.bufferPlayDuration) return;
        this.lastBufferSamples = this.bufferedSamples;
        // 需要播放
        this.mergeBuffers();
        if (!this.buffer) return;
        if (this.playing) this.output.stop();
        this.createSourceNode(this.buffer);
        this.output.loop = false;
        this.output.start(0, played);
        this.lastStartTime = this.ac.currentTime;
        this.playing = true;
        this.output.addEventListener('ended', () => {
            this.playing = false;
            this.checkBufferedPlay();
        });
    }

    private mergeBuffers() {
        const buffer = this.ac.createBuffer(
            this.audioData.length,
            this.bufferedSamples,
            this.sampleRate
        );
        const chunk = this.sampleRate * this.bufferChunkSize;
        const bufferedChunks = Math.floor(this.bufferedSamples / chunk);
        const restLength = this.bufferedSamples % chunk;
        for (let i = 0; i < this.audioData.length; i++) {
            const audio = this.audioData[i];
            const data = new Float32Array(this.bufferedSamples);
            for (let j = 0; j < bufferedChunks; j++) {
                data.set(audio[j], chunk * j);
            }
            if (restLength !== 0) {
                data.set(
                    audio[bufferedChunks].slice(0, restLength),
                    chunk * bufferedChunks
                );
            }

            buffer.copyToChannel(data, i, 0);
        }
        this.buffer = buffer;
    }

    async start() {
        this.buffer = null;
        this.headerRecieved = false;
        this.audioType = '';
        this.errored = false;
        this.buffered = 0;
        this.sampleRate = 0;
        this.bufferedSamples = 0;
        this.duration = 0;
        this.loaded = false;
        if (this.playing) this.output.stop();
        this.playing = false;
        this.lastStartTime = this.ac.currentTime;
    }

    end(done: boolean, reason?: string): void {
        if (done && this.buffer) {
            this.loaded = true;
            this.controller = null;
            this.mergeBuffers();
            this.duration = this.buffered;
            this.audioData = [];
            this.decoder?.destroy();
            this.decoder = null;
            this.parser = null;
            this.emit('load');
        } else {
            logger.warn(44, reason ?? '');
        }
    }

    private playAudio(when?: number) {
        if (!this.buffer) return;
        this.lastStartTime = this.ac.currentTime;
        if (this.playing) this.output.stop();
        this.createSourceNode(this.buffer);
        this.output.start(0, when);
        this.playing = true;
        this.emit('play');
        this.output.addEventListener('ended', () => {
            this.playing = false;
            if (this.loop && !this.output.loop) this.play(0);
            this.emit('end');
        });
    }

    play(when?: number): void {
        if (this.playing || this.errored) return;
        if (this.loaded && this.buffer) {
            this.playing = true;
            this.playAudio(when);
        } else {
            this.controller?.start();
        }
    }

    private createSourceNode(buffer: AudioBuffer) {
        if (!this.target) return;
        const node = this.ac.createBufferSource();
        node.buffer = buffer;
        if (this.playing) this.output.stop();
        this.playing = false;
        this.output = node;
        node.connect(this.target.input);
        node.loop = this.loop;
    }

    stop(): number {
        if (this.playing) this.output.stop();
        this.playing = false;
        return this.ac.currentTime - this.lastStartTime;
    }

    connect(target: IAudioInput): void {
        this.target = target;
    }

    setLoop(loop: boolean): void {
        this.loop = loop;
    }
}

export class AudioElementSource
    extends EventEmitter<EAudioSourceEvent>
    implements IAudioElementSource
{
    readonly ac: AudioContext;
    output: MediaElementAudioSourceNode;

    /** 当前是否正在播放 */
    playing: boolean = false;

    /** audio 元素 */
    readonly audio: HTMLAudioElement;

    get duration(): number {
        return this.audio.duration;
    }
    get currentTime(): number {
        return this.audio.currentTime;
    }

    constructor(readonly motaAC: IMotaAudioContext) {
        super();
        this.ac = motaAC.ac;
        const audio = new Audio();
        audio.preload = 'none';
        this.output = motaAC.ac.createMediaElementSource(audio);
        this.audio = audio;
        audio.addEventListener('play', () => {
            this.playing = true;
            this.emit('play');
        });
        audio.addEventListener('ended', () => {
            this.playing = false;
            this.emit('end');
        });
        audio.addEventListener('load', () => {
            if (audio.src.length > 0) {
                this.emit('load');
            }
        });
    }

    /**
     * 设置音频源的路径
     * @param url 音频路径
     */
    setSource(url: string) {
        this.audio.src = url;
    }

    free(): void {
        this.stop();
        this.audio.src = '';
        this.audio.load();
    }

    play(when: number = 0): void {
        if (this.playing) return;
        this.audio.currentTime = when;
        this.audio.play();
    }

    stop(): number {
        this.audio.pause();
        this.playing = false;
        return this.audio.currentTime;
    }

    connect(target: IAudioInput): void {
        this.output.connect(target.input);
    }

    setLoop(loop: boolean): void {
        this.audio.loop = loop;
    }
}

export class AudioBufferSource
    extends EventEmitter<EAudioSourceEvent>
    implements IAudioBufferSource
{
    readonly ac: AudioContext;
    output: AudioBufferSourceNode;

    /** 音频数据 */
    buffer: AudioBuffer | null = null;
    /** 是否循环 */
    private loop: boolean = false;

    /** 当前是否正在播放 */
    playing: boolean = false;

    duration: number = 0;
    get currentTime(): number {
        return this.ac.currentTime - this.lastStartTime + this.lastStartWhen;
    }

    /** 上一次播放是从何时开始的 */
    private lastStartWhen: number = 0;
    /** 播放开始时刻 */
    private lastStartTime: number = 0;
    private target?: IAudioInput;

    constructor(readonly motaAC: IMotaAudioContext) {
        super();
        this.ac = motaAC.ac;
        this.output = motaAC.ac.createBufferSource();
    }

    /**
     * 设置音频源数据
     * @param buffer 音频源，可以是未解析的 ArrayBuffer，也可以是已解析的 AudioBuffer
     */
    async setBuffer(buffer: ArrayBuffer | AudioBuffer) {
        if (buffer instanceof ArrayBuffer) {
            this.buffer = await this.ac.decodeAudioData(buffer);
        } else {
            this.buffer = buffer;
        }
        this.duration = this.buffer.duration;
        this.emit('load');
    }

    free(): void {
        this.stop();
        this.output.buffer = null;
        this.buffer = null;
    }

    play(when?: number): void {
        if (this.playing || !this.buffer) return;
        this.playing = true;
        this.lastStartTime = this.ac.currentTime;
        this.createSourceNode(this.buffer);
        this.output.start(0, when);
        this.emit('play');
        this.output.addEventListener('ended', () => {
            this.playing = false;
            if (this.loop && !this.output.loop) this.play(0);
            this.emit('end');
        });
    }

    private createSourceNode(buffer: AudioBuffer) {
        if (!this.target) return;
        const node = this.ac.createBufferSource();
        node.buffer = buffer;
        this.output = node;
        node.connect(this.target.input);
        node.loop = this.loop;
    }

    stop(): number {
        this.output.stop();
        return this.ac.currentTime - this.lastStartTime;
    }

    connect(target: IAudioInput): void {
        this.target = target;
    }

    setLoop(loop: boolean): void {
        this.loop = loop;
    }
}
