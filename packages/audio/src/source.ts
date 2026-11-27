import { IStreamController, IStreamReader } from '@motajs/loader';
import {
    Hookable,
    HookController,
    IHookController,
    logger
} from '@motajs/common';
import {
    AudioCodec,
    IAudioBufferSource,
    IAudioDecodedChunk,
    IAudioElementSource,
    IAudioInput,
    IAudioSourceHooks,
    IAudioStreamSource,
    IMotaAudioContext
} from './types';
import { AudioStreamDecoder } from './streamDecoder';
import { AudioPcmScheduler } from './pcmScheduler';

export class AudioStreamSource
    extends Hookable<IAudioSourceHooks>
    implements IAudioStreamSource, IStreamReader
{
    readonly ac: AudioContext;

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
        return this.scheduler.currentTime;
    }
    /** 在流传输阶段，至少缓冲多长时间的音频之后才开始播放，单位秒 */
    bufferPlayDuration: number = 1;
    /** 音频的采样率，未成功解析出之前保持为 0 */
    sampleRate: number = 0;

    /** 音频源节点，未起播时返回调度器的占位节点 */
    get output(): AudioBufferSourceNode {
        return this.scheduler.output;
    }

    private controller: IStreamController | null = null;

    /** PCM 采样调度器，负责时间线与节点排期 */
    private readonly scheduler: AudioPcmScheduler;
    /** 当前流式解码器，未开始加载时为空 */
    private decoder: AudioStreamDecoder | null = null;
    /** 后台消费解码数据块的任务 */
    private consumeTask: Promise<void> | null = null;
    /** 是否由用户显式暂停或停止，用于抑制自动起播 */
    private stoppedByUser: boolean = false;
    /** 是否已因格式不支持或解码失败而终止，播放守卫依赖它 */
    private errored: boolean = false;

    constructor(readonly motaAC: IMotaAudioContext) {
        super();
        this.ac = motaAC.ac;
        this.scheduler = new AudioPcmScheduler(this.ac, () =>
            this.handlePlaybackEnd()
        );
    }

    protected createController(
        hook: Partial<IAudioSourceHooks>
    ): IHookController<IAudioSourceHooks> {
        return new HookController(this, hook);
    }

    /**
     * 设置单个调度节点的最大窗口时长，默认为 10 秒
     * @param size 每个缓存数据的时长，单位秒
     */
    setChunkSize(size: number) {
        if (this.controller?.loading || this.loaded) return;
        this.scheduler.setWindowDuration(size);
    }

    free(): void {
        this.stop();
        this.scheduler.free();
        this.teardownDecoder();
        this.consumeTask = null;
        this.buffer = null;
        this.loaded = false;
        this.buffered = 0;
        this.bufferedSamples = 0;
        this.sampleRate = 0;
        this.duration = 0;
        this.errored = false;
        this.stoppedByUser = false;
    }

    piped(controller: IStreamController): void {
        this.controller = controller;
    }

    unpiped(controller: IStreamController): void {
        if (this.controller === controller) {
            this.controller = null;
        }
    }

    async pump(data: Uint8Array | undefined, done: boolean): Promise<void> {
        if (this.errored) return;
        const decoder = this.decoder;
        if (!decoder) return;
        await decoder.push(data, done);
        if (decoder.failed) this.errored = true;
        this.maybeStart();
    }

    async start() {
        this.teardownDecoder();
        this.scheduler.free();
        this.buffer = null;
        this.buffered = 0;
        this.bufferedSamples = 0;
        this.sampleRate = 0;
        this.duration = 0;
        this.loaded = false;
        this.playing = false;
        this.stoppedByUser = false;
        this.errored = false;
        this.decoder = new AudioStreamDecoder(
            this.motaAC.createCodecDecoder(AudioCodec.Opus)
        );
        this.consumeTask = this.consumeChunks();
    }

    end(done: boolean, reason?: string): void {
        if (!done) {
            logger.warn(44, reason ?? '');
            this.teardownDecoder();
            return;
        }
        this.controller = null;
        this.finishLoad();
    }

    play(when?: number): void {
        if (this.playing || this.errored) return;
        this.stoppedByUser = false;
        if (
            this.sampleRate > 0 &&
            (this.loaded || (when ?? 0) <= this.buffered)
        ) {
            this.scheduler.start(when ?? 0);
            this.playing = true;
            this.forEachHook(hook => hook.onPlay?.());
        } else {
            this.controller?.start();
        }
    }

    stop(): number {
        const time = this.scheduler.stop();
        this.playing = false;
        this.stoppedByUser = true;
        return time;
    }

    connect(target: IAudioInput): void {
        this.scheduler.connect(target);
    }

    setLoop(loop: boolean): void {
        this.scheduler.setLoop(loop);
    }

    /**
     * 后台按顺序消费解码数据块，解码器被替换后停止
     */
    private async consumeChunks(): Promise<void> {
        const decoder = this.decoder!;
        for await (const chunk of decoder.chunks) {
            if (this.decoder !== decoder) return;
            this.appendChunk(chunk);
        }
        if (decoder.failed) this.errored = true;
    }

    /**
     * 把一个解码数据块追加到调度器并同步公开计数
     * @param chunk 解码出的数据块
     */
    private appendChunk(chunk: IAudioDecodedChunk): void {
        if (this.errored || chunk.samplesDecoded === 0) return;
        if (chunk.sampleRate === 0) return;
        if (this.sampleRate === 0) {
            this.sampleRate = chunk.sampleRate;
        } else if (this.sampleRate !== chunk.sampleRate) {
            logger.warn(48);
        }
        this.scheduler.append(chunk);
        this.bufferedSamples = this.scheduler.bufferedSamples;
        this.buffered = this.scheduler.duration;
        this.maybeStart();
    }

    /**
     * 在缓冲足够且未被用户暂停时自动起播
     */
    private maybeStart(): void {
        if (this.playing || this.errored || this.stoppedByUser) return;
        if (this.sampleRate === 0) return;
        if (!this.loaded && this.buffered < this.bufferPlayDuration) return;
        this.scheduler.start(0);
        this.playing = true;
        this.forEachHook(hook => hook.onPlay?.());
    }

    /**
     * 等待解码排空后合并音频数据并触发加载完成钩子
     */
    private async finishLoad(): Promise<void> {
        const task = this.consumeTask;
        if (task) await task;
        this.scheduler.markEnded();
        this.buffer = this.scheduler.merge();
        this.buffered = this.scheduler.duration;
        this.duration = this.scheduler.duration;
        this.loaded = true;
        this.maybeStart();
        this.forEachHook(hook => hook.onLoad?.());
        this.teardownDecoder();
    }

    /**
     * 调度器时间线自然结束时的回调
     */
    private handlePlaybackEnd(): void {
        this.playing = false;
        this.forEachHook(hook => hook.onEnd?.());
    }

    /**
     * 关闭当前解码器并清空引用
     */
    private teardownDecoder(): void {
        const decoder = this.decoder;
        this.decoder = null;
        if (!decoder) return;
        decoder.close();
    }
}

export class AudioElementSource
    extends Hookable<IAudioSourceHooks>
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
            this.forEachHook(hook => hook.onPlay?.());
        });
        audio.addEventListener('ended', () => {
            this.playing = false;
            this.forEachHook(hook => hook.onEnd?.());
        });
        audio.addEventListener('load', () => {
            if (audio.src.length > 0) {
                this.forEachHook(hook => hook.onLoad?.());
            }
        });
    }

    protected createController(
        hook: Partial<IAudioSourceHooks>
    ): IHookController<IAudioSourceHooks> {
        return new HookController(this, hook);
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
    extends Hookable<IAudioSourceHooks>
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

    protected createController(
        hook: Partial<IAudioSourceHooks>
    ): IHookController<IAudioSourceHooks> {
        return new HookController(this, hook);
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
        this.forEachHook(hook => hook.onLoad?.());
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
        this.forEachHook(hook => hook.onPlay?.());
        this.output.addEventListener('ended', () => {
            this.playing = false;
            if (this.loop && !this.output.loop) this.play(0);
            this.forEachHook(hook => hook.onEnd?.());
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
