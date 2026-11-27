// 校验采样调度器的排期、暂停、续播与循环语义
import { describe, expect, it } from 'vitest';
import { AudioPcmScheduler, PlaybackEndCallback } from '../pcmScheduler';
import { IAudioDecodedChunk } from '../types';

// 伪造的播放节点，记录起播参数、停止状态与已注册的结束监听器
class FakeNode {
    buffer: AudioBuffer | null = null;
    startWhen: number = 0;
    startOffset: number = 0;
    stopped: boolean = false;

    /** 按事件类型保存的监听器列表 */
    private readonly listeners: Map<string, (() => void)[]> = new Map();

    connect() {}

    start(when: number, offset: number) {
        this.startWhen = when;
        this.startOffset = offset;
    }

    stop() {
        this.stopped = true;
    }

    addEventListener(type: string, handler: () => void) {
        const handlers = this.listeners.get(type) ?? [];
        handlers.push(handler);
        this.listeners.set(type, handlers);
    }

    removeEventListener(type: string, handler: () => void) {
        const handlers = this.listeners.get(type);
        if (!handlers) return;
        const index = handlers.indexOf(handler);
        if (index >= 0) handlers.splice(index, 1);
    }

    dispatchEvent(event: { type: string }) {
        for (const handler of this.handlers(event.type)) handler();
    }

    handlers(type: string): (() => void)[] {
        return [...(this.listeners.get(type) ?? [])];
    }
}

// 派发 ended 事件，模拟播放节点自然结束
function fireEnded(node: FakeNode): void {
    node.dispatchEvent({ type: 'ended' });
}

// 取出节点当前注册的 ended 监听器快照
function endedHandlers(node: FakeNode): (() => void)[] {
    return node.handlers('ended');
}

// 伪造的音频缓冲区，只保留调度器使用到的字段与方法
class FakeBuffer {
    readonly length: number;
    readonly numberOfChannels: number;
    readonly sampleRate: number;

    constructor(channels: number, length: number, sampleRate: number) {
        this.numberOfChannels = channels;
        this.length = length;
        this.sampleRate = sampleRate;
    }

    copyToChannel() {}
}

// 伪造的音频上下文，当前时刻可手动推进
class FakeAudioContext {
    currentTime: number = 0;
    readonly nodes: FakeNode[] = [];

    createBufferSource(): AudioBufferSourceNode {
        const node = new FakeNode();
        this.nodes.push(node);
        return node as unknown as AudioBufferSourceNode;
    }

    createBuffer(
        channels: number,
        length: number,
        sampleRate: number
    ): AudioBuffer {
        const buffer = new FakeBuffer(channels, length, sampleRate);
        return buffer as unknown as AudioBuffer;
    }
}

// 记录结束回调次数的计数器
interface IEndedCounter {
    /** 结束回调已经触发的次数 */
    count: number;
}

// 创建连接好目标的调度器与伪造上下文
function createScheduler(): {
    ctx: FakeAudioContext;
    scheduler: AudioPcmScheduler;
    ended: IEndedCounter;
} {
    const ctx = new FakeAudioContext();
    const ended: IEndedCounter = { count: 0 };
    const onEnd: PlaybackEndCallback = () => {
        ended.count++;
    };
    const scheduler = new AudioPcmScheduler(
        ctx as unknown as AudioContext,
        onEnd
    );
    // 构造器创建的占位节点不属于播放节点，清掉记录以便断言真实排期
    ctx.nodes.length = 0;
    scheduler.connect({ input: {} as AudioNode });
    return { ctx, scheduler, ended };
}

// 生成指定采样数、采样率与声道的递增波形数据块
function makeChunk(
    samples: number,
    sampleRate: number,
    channels: number
): IAudioDecodedChunk {
    const channelData: Float32Array<ArrayBuffer>[] = [];
    for (let c = 0; c < channels; c++) {
        const data = new Float32Array(samples);
        for (let i = 0; i < samples; i++) {
            data[i] = Math.sin((i / sampleRate) * 200 + c);
        }
        channelData.push(data);
    }
    return {
        channelData,
        samplesDecoded: samples,
        sampleRate,
        timestamp: 0,
        duration: samples / sampleRate,
        errors: []
    };
}

describe('采样调度器', () => {
    // 起播应按时间线连续排期且覆盖全部已缓冲采样
    it('起播排期', () => {
        const { ctx, scheduler } = createScheduler();
        scheduler.append(makeChunk(500, 1000, 1));
        scheduler.append(makeChunk(500, 1000, 1));
        scheduler.start(0);
        expect(ctx.nodes.length).toBeGreaterThanOrEqual(1);
        expect(ctx.nodes[0].startWhen).toBeCloseTo(0.05);
        expect(ctx.nodes[0].startOffset).toBeCloseTo(0);
        expect(scheduler.duration).toBeCloseTo(1);
        ctx.currentTime = 0.3;
        expect(scheduler.currentTime).toBeCloseTo(0.3);
    });

    // 暂停返回当前时刻，续播从该时刻的采样偏移开始
    it('暂停与续播', () => {
        const { ctx, scheduler } = createScheduler();
        scheduler.append(makeChunk(2000, 1000, 1));
        scheduler.start(0);
        ctx.currentTime = 0.5;
        const paused = scheduler.stop();
        expect(paused).toBeCloseTo(0.5);
        const before = ctx.nodes.length;
        scheduler.start(0.5);
        expect(ctx.nodes.length).toBe(before + 1);
        const node = ctx.nodes[ctx.nodes.length - 1];
        const buffer = node.buffer as unknown as FakeBuffer;
        expect(node.startOffset).toBeCloseTo(0);
        expect(buffer.length).toBe(1500);
    });

    // 文件结束后循环播放应回到 0 重新排期且不触发结束回调
    it('循环重排', () => {
        const { ctx, scheduler, ended } = createScheduler();
        scheduler.append(makeChunk(1000, 1000, 1));
        scheduler.setLoop(true);
        scheduler.markEnded();
        scheduler.start(0);
        const first = ctx.nodes[ctx.nodes.length - 1];
        const firstEnd = first.startWhen + 1;
        fireEnded(first);
        expect(ctx.nodes.length).toBe(2);
        const loopNode = ctx.nodes[ctx.nodes.length - 1];
        expect(loopNode.startWhen).toBeGreaterThanOrEqual(firstEnd);
        expect(ended.count).toBe(0);
    });

    // 非循环播放结束时应触发一次结束回调
    it('非循环结束回调', () => {
        const { ctx, scheduler, ended } = createScheduler();
        scheduler.append(makeChunk(1000, 1000, 1));
        scheduler.setLoop(false);
        scheduler.markEnded();
        scheduler.start(0);
        const last = ctx.nodes[ctx.nodes.length - 1];
        fireEnded(last);
        expect(ended.count).toBe(1);
        expect(scheduler.playing).toBe(false);
    });

    // 小窗口下中间节点先结束不应触发重排或结束回调
    it('多窗口中间节点先结束', () => {
        const { ctx, scheduler, ended } = createScheduler();
        scheduler.setWindowDuration(0.1);
        scheduler.append(makeChunk(500, 1000, 1));
        scheduler.start(0);
        expect(ctx.nodes.length).toBeGreaterThanOrEqual(5);
        const nodes = [...ctx.nodes];
        fireEnded(nodes[0]);
        expect(ended.count).toBe(0);
        expect(scheduler.playing).toBe(true);
        scheduler.markEnded();
        for (let i = 1; i < nodes.length; i++) {
            fireEnded(nodes[i]);
        }
        expect(ended.count).toBe(1);
    });

    // stop 后触发已保存的 ended 监听器不得重排循环或触发结束回调
    it('stop 后 ended 监听器不生效', () => {
        const looped = createScheduler();
        looped.scheduler.append(makeChunk(1000, 1000, 1));
        looped.scheduler.setLoop(true);
        looped.scheduler.markEnded();
        looped.scheduler.start(0);
        const loopLast = looped.ctx.nodes[looped.ctx.nodes.length - 1];
        const savedLoop = endedHandlers(loopLast);
        looped.scheduler.stop();
        const countAfterStop = looped.ctx.nodes.length;
        for (const handler of savedLoop) handler();
        expect(looped.ctx.nodes.length).toBe(countAfterStop);
        expect(looped.ended.count).toBe(0);
        expect(looped.scheduler.playing).toBe(false);

        const plain = createScheduler();
        plain.scheduler.append(makeChunk(1000, 1000, 1));
        plain.scheduler.setLoop(false);
        plain.scheduler.markEnded();
        plain.scheduler.start(0);
        const plainLast = plain.ctx.nodes[plain.ctx.nodes.length - 1];
        const savedPlain = endedHandlers(plainLast);
        plain.scheduler.stop();
        for (const handler of savedPlain) handler();
        expect(plain.ended.count).toBe(0);
    });
});
