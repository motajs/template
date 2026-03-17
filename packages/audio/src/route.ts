import EventEmitter from 'eventemitter3';
import { isNil } from 'lodash-es';
import { sleep } from '@motajs/common';
import { AudioEffect } from './effect';
import {
    IAudioRoute,
    AudioStatus,
    IAudioSource,
    IMotaAudioContext,
    EAudioRouteEvent
} from './types';

export class AudioRoute
    extends EventEmitter<EAudioRouteEvent>
    implements IAudioRoute
{
    output: AudioNode;

    /** 效果器路由图 */
    readonly effectRoute: AudioEffect[] = [];

    /** 结束时长，当音频暂停或停止时，会经过这么长时间之后才真正终止播放，期间可以做音频淡入淡出等效果 */
    endTime: number = 0;

    /** 当前播放状态 */
    status: AudioStatus = AudioStatus.Stoped;
    /** 暂停时刻 */
    private pauseTime: number = 0;
    /** 暂停时播放了多长时间 */
    private pauseCurrentTime: number = 0;

    /** 音频时长，单位秒 */
    get duration() {
        return this.source.duration;
    }
    /** 当前播放了多长时间，单位秒 */
    get currentTime() {
        if (this.status === AudioStatus.Paused) {
            return this.pauseCurrentTime;
        } else {
            return this.source.currentTime;
        }
    }
    set currentTime(time: number) {
        this.source.stop();
        this.source.play(time);
    }

    private shouldStop: boolean = false;
    /**
     * 每次暂停或停止时自增，用于判断当前正在处理的情况。
     * 假如暂停后很快播放，然后很快暂停，那么需要根据这个来判断实际是否应该执行暂停后操作
     */
    stopIdentifier: number = 0;

    constructor(
        public readonly source: IAudioSource,
        public readonly player: IMotaAudioContext
    ) {
        super();
        this.output = source.output;
        source.on('end', () => {
            if (this.status === AudioStatus.Playing) {
                this.status = AudioStatus.Stoped;
            }
        });
        source.on('play', () => {
            if (this.status !== AudioStatus.Playing) {
                this.status = AudioStatus.Playing;
            }
        });
    }

    /**
     * 设置结束时间，暂停或停止时，会经过这么长时间才终止音频的播放，这期间可以做一下音频淡出的效果。
     * @param time 暂停或停止时，经过多长时间之后才会结束音频的播放
     */
    setEndTime(time: number) {
        this.endTime = time;
    }

    /**
     * 开始播放这个音频
     * @param when 从音频的什么时候开始播放，单位秒
     */
    async play(when: number = 0) {
        if (this.status === AudioStatus.Playing) return;
        this.link();
        await this.player.ac.resume();
        if (this.effectRoute.length > 0) {
            const first = this.effectRoute[0];
            this.source.connect(first);
            const last = this.effectRoute.at(-1)!;
            last.connect({ input: this.player.getDestination() });
        } else {
            this.source.connect({ input: this.player.getDestination() });
        }
        this.source.play(when);
        this.status = AudioStatus.Playing;
        this.pauseTime = 0;
        this.emit('start', this);
        this.startAllEffect();
        this.emit('play');
    }

    /**
     * 暂停音频播放
     */
    async pause() {
        if (this.status !== AudioStatus.Playing) return;
        this.status = AudioStatus.Pausing;
        this.stopIdentifier++;
        const identifier = this.stopIdentifier;
        this.emit('end', this.endTime, this);
        await sleep(this.endTime);
        if (
            this.status !== AudioStatus.Pausing ||
            this.stopIdentifier !== identifier
        ) {
            return;
        }
        this.pauseCurrentTime = this.source.currentTime;
        const time = this.source.stop();
        this.pauseTime = time;
        if (this.shouldStop) {
            this.status = AudioStatus.Stoped;
            this.endAllEffect();
            this.emit('stop');
            this.shouldStop = false;
        } else {
            this.status = AudioStatus.Paused;
            this.endAllEffect();
            this.emit('pause');
        }
    }

    /**
     * 继续音频播放
     */
    resume() {
        if (this.status === AudioStatus.Playing) return;
        if (
            this.status === AudioStatus.Pausing ||
            this.status === AudioStatus.Stoping
        ) {
            this.emit('start', this);
            this.emit('resume');
            return;
        }
        if (this.status === AudioStatus.Paused) {
            this.play(this.pauseTime);
        } else {
            this.play(0);
        }
        this.status = AudioStatus.Playing;
        this.pauseTime = 0;
        this.emit('start', this);
        this.startAllEffect();
        this.emit('resume');
    }

    /**
     * 停止音频播放
     */
    async stop() {
        if (this.status !== AudioStatus.Playing) {
            if (this.status === AudioStatus.Pausing) {
                this.shouldStop = true;
            }
            return;
        }
        this.status = AudioStatus.Stoping;
        this.stopIdentifier++;
        const identifier = this.stopIdentifier;
        this.emit('end', this.endTime, this);
        await sleep(this.endTime);
        if (
            this.status !== AudioStatus.Stoping ||
            this.stopIdentifier !== identifier
        ) {
            return;
        }
        this.source.stop();
        this.status = AudioStatus.Stoped;
        this.pauseTime = 0;
        this.endAllEffect();
        this.emit('stop');
    }

    /**
     * 添加效果器
     * @param effect 要添加的效果，可以是数组，表示一次添加多个
     * @param index 从哪个位置开始添加，如果大于数组长度，那么加到末尾，如果小于0，那么将会从后面往前数。默认添加到末尾
     */
    addEffect(effect: AudioEffect | AudioEffect[], index?: number) {
        if (isNil(index)) {
            if (effect instanceof Array) {
                this.effectRoute.push(...effect);
            } else {
                this.effectRoute.push(effect);
            }
        } else {
            if (effect instanceof Array) {
                this.effectRoute.splice(index, 0, ...effect);
            } else {
                this.effectRoute.splice(index, 0, effect);
            }
        }
        this.setOutput();
        if (this.source.playing) this.link();
        this.emit('updateEffect');
    }

    /**
     * 移除一个效果器
     * @param effect 要移除的效果
     */
    removeEffect(effect: AudioEffect) {
        const index = this.effectRoute.indexOf(effect);
        if (index === -1) return;
        this.effectRoute.splice(index, 1);
        effect.disconnect();
        this.setOutput();
        if (this.source.playing) this.link();
        this.emit('updateEffect');
    }

    destroy() {
        this.effectRoute.forEach(v => v.disconnect());
    }

    private setOutput() {
        const effect = this.effectRoute.at(-1);
        if (!effect) this.output = this.source.output;
        else this.output = effect.output;
    }

    /**
     * 连接音频路由图
     */
    private link() {
        this.effectRoute.forEach(v => v.disconnect());
        this.effectRoute.forEach((v, i) => {
            const next = this.effectRoute[i + 1];
            if (next) {
                v.connect(next);
            }
        });
    }

    private startAllEffect() {
        this.effectRoute.forEach(v => v.start());
    }

    private endAllEffect() {
        this.effectRoute.forEach(v => v.end());
    }
}
