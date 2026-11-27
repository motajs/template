import { IAudioDecodedChunk, IAudioInput } from './types';

/** 新节点相对当前时刻的最小起播余量，单位秒 */
const MIN_START_LEAD = 0.05;

export type PlaybackEndCallback = () => void;

export interface IAudioPcmScheduler {
    /** 音频播放上下文 */
    readonly ac: AudioContext;
    /** 已收到的采样总数 */
    readonly bufferedSamples: number;
    /** 音频采样率，未知时为 0 */
    readonly sampleRate: number;
    /** 当前是否处于播放时间线 */
    readonly playing: boolean;
    /** 当前播放位置，单位秒 */
    readonly currentTime: number;
    /** 音频总时长，单位秒 */
    readonly duration: number;
    /** 最近的播放节点，未起播时返回占位节点 */
    readonly output: AudioBufferSourceNode;

    /**
     * 设置单个调度节点的最大窗口时长
     * @param duration 窗口时长，单位秒
     */
    setWindowDuration(duration: number): void;

    /**
     * 连接至音频路由图
     * @param target 连接目标
     */
    connect(target: IAudioInput): void;

    /**
     * 设置是否循环播放
     * @param loop 是否循环
     */
    setLoop(loop: boolean): void;

    /**
     * 追加解码出的数据块
     * @param chunk 解码出的数据块
     */
    append(chunk: IAudioDecodedChunk): void;

    /**
     * 标记文件已经结束，供循环与结束回调判断
     */
    markEnded(): void;

    /**
     * 从指定时刻开始播放
     * @param when 起播时刻，单位秒
     */
    start(when: number): void;

    /**
     * 暂停播放并返回暂停时刻
     */
    stop(): number;

    /**
     * 合并全部已解码数据为一个音频缓冲区
     */
    merge(): AudioBuffer | null;

    /**
     * 停止播放并清空全部状态
     */
    free(): void;
}

export class AudioPcmScheduler implements IAudioPcmScheduler {
    readonly ac: AudioContext;
    bufferedSamples: number = 0;
    sampleRate: number = 0;
    playing: boolean = false;

    /** 播放彻底结束时回调，循环重排不会触发 */
    private readonly onPlaybackEnd: PlaybackEndCallback;
    /** 未起播时对外暴露的占位节点 */
    private readonly idleNode: AudioBufferSourceNode;
    /** 最近一次创建的播放节点 */
    private lastNode: AudioBufferSourceNode;
    /** 按解码顺序保存的全部数据块 */
    private readonly chunks: IAudioDecodedChunk[] = [];
    /** 每个数据块起始的采样下标 */
    private readonly chunkStarts: number[] = [];
    /** 声道数，首个数据块写入 */
    private channelCount: number = 0;
    /** 单个播放节点的最大窗口时长，单位秒 */
    private windowDuration: number = 10;
    /** 单个播放节点的最大窗口采样数 */
    private maxWindowSamples: number = 0;
    /** 时间线锚点对应的采样下标 */
    private anchorSample: number = 0;
    /** 时间线锚点对应的上下文时刻 */
    private anchorTime: number = 0;
    /** 已经排期到的采样下标 */
    private scheduledSamples: number = 0;
    /** 续播时首个节点内部的偏移采样数 */
    private pendingOffset: number = 0;
    /** 已排期内容的结束上下文时刻 */
    private plannedTime: number = 0;
    /** 暂停或停止时记录的源时刻 */
    private haltedTime: number = 0;
    /** 采样率未知时先记下的起播位置 */
    private pendingStart: number = 0;
    /** 是否循环播放 */
    private loop: boolean = false;
    /** 是否已收到文件结束信号 */
    private ended: boolean = false;
    /** 当前存活的播放节点 */
    private readonly nodes: Set<AudioBufferSourceNode> = new Set();
    /** 每个播放节点已注册的结束监听器 */
    private readonly nodeHandlers: WeakMap<AudioBufferSourceNode, () => void> =
        new WeakMap();
    /** 连接目标，未连接时不创建节点 */
    private target?: IAudioInput;

    constructor(ac: AudioContext, onPlaybackEnd: PlaybackEndCallback) {
        this.ac = ac;
        this.onPlaybackEnd = onPlaybackEnd;
        this.idleNode = ac.createBufferSource();
        this.lastNode = this.idleNode;
    }

    get currentTime(): number {
        if (!this.playing || this.sampleRate === 0) return this.haltedTime;
        const played = Math.min(
            this.anchorSample + (this.ac.currentTime - this.anchorTime),
            this.scheduledSamples / this.sampleRate
        );
        if (played < 0) return 0;
        if (played > this.duration) return this.duration;
        return played;
    }

    get duration(): number {
        return this.sampleRate > 0 ? this.bufferedSamples / this.sampleRate : 0;
    }

    get output(): AudioBufferSourceNode {
        return this.lastNode;
    }

    setWindowDuration(duration: number): void {
        this.windowDuration = duration;
        if (this.sampleRate > 0) {
            this.maxWindowSamples = Math.max(
                1,
                Math.floor(duration * this.sampleRate)
            );
        }
    }

    connect(target: IAudioInput): void {
        this.target = target;
    }

    setLoop(loop: boolean): void {
        this.loop = loop;
    }

    append(chunk: IAudioDecodedChunk): void {
        if (chunk.sampleRate === 0 || chunk.samplesDecoded === 0) return;
        const sampleRateUnknown = this.sampleRate === 0;
        if (sampleRateUnknown) {
            this.sampleRate = chunk.sampleRate;
            this.channelCount = chunk.channelData.length;
        } else if (this.channelCount !== chunk.channelData.length) {
            return;
        }
        this.maxWindowSamples = Math.max(
            1,
            Math.floor(this.windowDuration * this.sampleRate)
        );
        this.chunkStarts.push(this.bufferedSamples);
        this.chunks.push(chunk);
        this.bufferedSamples += chunk.samplesDecoded;
        if (!this.playing) return;
        if (sampleRateUnknown) {
            // 采样率刚确定时需要按之前的起播位置补建时间线，短暂退出播放态以复用 start 的锚点逻辑
            const when = this.pendingStart;
            this.pendingStart = 0;
            this.playing = false;
            this.start(when);
            return;
        }
        this.schedule();
    }

    markEnded(): void {
        this.ended = true;
    }

    start(when: number): void {
        if (this.playing) return;
        this.playing = true;
        if (this.sampleRate === 0) {
            this.pendingStart = when;
            return;
        }
        const anchorSample = Math.min(when, this.duration);
        this.anchorSample = anchorSample;
        this.anchorTime = this.ac.currentTime;
        this.scheduledSamples = Math.floor(anchorSample * this.sampleRate);
        this.pendingOffset =
            anchorSample * this.sampleRate - this.scheduledSamples;
        this.plannedTime = this.anchorTime;
        this.schedule();
    }

    stop(): number {
        const time = this.currentTime;
        this.haltedTime = time;
        this.playing = false;
        this.nodes.forEach(node => {
            const handler = this.nodeHandlers.get(node);
            if (handler) node.removeEventListener('ended', handler);
            this.nodeHandlers.delete(node);
            node.stop();
        });
        this.nodes.clear();
        return time;
    }

    merge(): AudioBuffer | null {
        if (this.bufferedSamples === 0) return null;
        return this.buildWindow(0, this.bufferedSamples);
    }

    free(): void {
        this.stop();
        this.chunks.length = 0;
        this.chunkStarts.length = 0;
        this.nodes.clear();
        this.sampleRate = 0;
        this.channelCount = 0;
        this.bufferedSamples = 0;
        this.scheduledSamples = 0;
        this.anchorSample = 0;
        this.anchorTime = 0;
        this.plannedTime = 0;
        this.pendingOffset = 0;
        this.pendingStart = 0;
        this.haltedTime = 0;
        this.playing = false;
        this.ended = false;
        this.lastNode = this.idleNode;
    }

    /**
     * 把尚未排期的采样按窗口切成节点并提前起播
     */
    private schedule(): void {
        if (!this.target) return;
        while (this.scheduledSamples < this.bufferedSamples) {
            const start = this.scheduledSamples;
            const end = Math.min(
                this.bufferedSamples,
                start + this.maxWindowSamples
            );
            const when = Math.max(
                this.ac.currentTime + MIN_START_LEAD,
                this.plannedTime
            );
            const offset = this.pendingOffset;
            const playDuration = (end - start - offset) / this.sampleRate;
            if (when + playDuration <= this.ac.currentTime) {
                this.scheduledSamples = end;
                this.pendingOffset = 0;
                continue;
            }
            const node = this.ac.createBufferSource();
            node.buffer = this.buildWindow(start, end);
            node.connect(this.target.input);
            const handler = () => this.handleNodeEnd(node);
            this.nodeHandlers.set(node, handler);
            node.addEventListener('ended', handler);
            node.start(when, offset / this.sampleRate);
            this.plannedTime = when + playDuration;
            this.scheduledSamples = end;
            this.pendingOffset = 0;
            this.nodes.add(node);
            this.lastNode = node;
        }
    }

    /**
     * 把指定采样区间合并为一个音频缓冲区
     * @param start 起始采样下标
     * @param end 结束采样下标
     */
    private buildWindow(start: number, end: number): AudioBuffer {
        const length = end - start;
        const buffer = this.ac.createBuffer(
            this.channelCount,
            length,
            this.sampleRate
        );
        const temp = new Float32Array(length);
        for (let channel = 0; channel < this.channelCount; channel++) {
            for (let i = 0; i < this.chunks.length; i++) {
                const chunk = this.chunks[i];
                const chunkStart = this.chunkStarts[i];
                const chunkEnd = chunkStart + chunk.samplesDecoded;
                if (chunkEnd <= start) continue;
                if (chunkStart >= end) break;
                const from = Math.max(start, chunkStart);
                const to = Math.min(end, chunkEnd);
                const data = chunk.channelData[channel];
                if (!data) continue;
                temp.set(
                    data.subarray(from - chunkStart, to - chunkStart),
                    from - start
                );
            }
            buffer.copyToChannel(temp, channel, 0);
        }
        return buffer;
    }

    /**
     * 处理节点结束，仅最后一个自然结束的节点参与重排或结束回调
     * @param node 结束的节点
     */
    private handleNodeEnd(node: AudioBufferSourceNode): void {
        this.nodes.delete(node);
        const handler = this.nodeHandlers.get(node);
        if (handler) node.removeEventListener('ended', handler);
        this.nodeHandlers.delete(node);
        if (!this.playing) return;
        if (this.nodes.size > 0) return;
        if (this.scheduledSamples < this.bufferedSamples) return;
        if (this.ended && this.loop) {
            this.restartLoop();
            return;
        }
        if (!this.ended) return;
        this.playing = false;
        this.haltedTime = this.duration;
        this.onPlaybackEnd();
    }

    /**
     * 回到源时刻 0 重新排期整个文件
     */
    private restartLoop(): void {
        this.nodes.forEach(node => {
            const handler = this.nodeHandlers.get(node);
            if (handler) node.removeEventListener('ended', handler);
            this.nodeHandlers.delete(node);
            node.stop();
        });
        this.nodes.clear();
        this.anchorSample = 0;
        this.anchorTime = Math.max(this.plannedTime, this.ac.currentTime);
        this.scheduledSamples = 0;
        this.pendingOffset = 0;
        this.plannedTime = this.anchorTime;
        this.schedule();
    }
}
