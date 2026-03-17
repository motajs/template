import { guessTypeByExt, isAudioSupport } from './support';
import { logger } from '@motajs/common';
import { StreamLoader } from '@motajs/loader';
import {
    IAudioRoute,
    IAudioVolumeEffect,
    IBGMPlayer,
    IMotaAudioContext
} from './types';
import { AudioElementSource, AudioStreamSource } from './source';

interface BGMInfo {
    /** 音频路由 */
    readonly route: IAudioRoute;
    /** 音频播放时执行的函数 */
    readonly startFn: () => void;
    /** 音频结束时执行的函数 */
    readonly endFn: () => void;
}

interface AudioCacheInfo {
    /** 音频路由 */
    readonly route: IAudioRoute;
    /** 当前其占用的内存，如果是 `AudioElementSource`，那么此值为估计值，并非准确值 */
    size: number;
}

export class BGMPlayer<T extends string> implements IBGMPlayer<T> {
    /** bgm音频名称的前缀 */
    prefix: string = 'bgms.';
    /** 每个 bgm 的音量控制器 */
    private readonly gain: Map<T, BGMInfo> = new Map();

    /** 正在播放的 bgm */
    playingBgm?: T;
    /** 是否正在播放 */
    playing: boolean = false;

    /** 是否已经启用 */
    enabled: boolean = true;
    /** 主音量控制器 */
    private readonly mainGain: IAudioVolumeEffect;
    /** 是否屏蔽所有的音乐切换 */
    private blocking: boolean = false;
    /** 渐变时长 */
    private transitionTime: number = 2000;

    /** 最大缓存容量 */
    maxCacheSize: number = 256;
    /** 音频缓存池 */
    private readonly cachePool: AudioCacheInfo[] = [];

    constructor(public readonly ac: IMotaAudioContext) {
        this.mainGain = ac.createVolumeEffect();
    }

    setMaxCacheSize(size: number): void {
        this.maxCacheSize = size;
        this.checkMaxCache();
    }

    private checkMaxCache() {
        if (this.cachePool.length <= 1) return;
        let total = 0;
        let toDelete = 0;
        for (let i = this.cachePool.length - 1; i >= 0; i--) {
            total += this.cachePool[i].size;
            if (total >= this.maxCacheSize) {
                toDelete = i + 1;
                break;
            }
        }
        for (let i = 0; i < toDelete; i++) {
            const data = this.cachePool.shift();
            if (!data) continue;
            data.route.source.free();
            data.size = 0;
        }
    }

    /**
     * 设置音频渐变时长
     * @param time 渐变时长
     */
    setTransitionTime(time: number) {
        this.transitionTime = time;
    }

    /**
     * 屏蔽音乐切换
     */
    blockChange() {
        this.blocking = true;
    }

    /**
     * 取消屏蔽音乐切换
     */
    unblockChange() {
        this.blocking = false;
    }

    /**
     * 设置总音量大小
     * @param volume 音量大小
     */
    setVolume(volume: number) {
        this.mainGain.setVolume(volume);
    }

    /**
     * 获取总音量大小
     */
    getVolume() {
        return this.mainGain.getVolume();
    }

    /**
     * 设置是否启用
     * @param enabled 是否启用
     */
    setEnabled(enabled: boolean) {
        if (enabled) this.resume();
        else this.stop();
        this.enabled = enabled;
    }

    /**
     * 设置 bgm 音频名称的前缀
     */
    setPrefix(prefix: string) {
        this.prefix = prefix;
    }

    private getId(name: T) {
        return `${this.prefix}${name}`;
    }

    /**
     * 根据 bgm 名称获取其 AudioRoute 实例
     * @param id 音频名称
     */
    get(id: T) {
        return this.ac.getRoute(this.getId(id));
    }

    /**
     * 添加一个 bgm
     * @param id 要添加的 bgm 的名称
     * @param url 指定 bgm 的加载地址
     */
    addBGMFromURL(id: T, url: string) {
        const type = guessTypeByExt(id);
        if (!type) {
            logger.warn(50, id.split('.').slice(0, -1).join('.'));
            return;
        }
        const gain = this.ac.createVolumeEffect();
        if (isAudioSupport(type)) {
            const source = this.ac.createElementSource();
            source.setSource(url);
            source.setLoop(true);
            const route = this.ac.createRoute(source);
            route.addEffect([gain, this.mainGain]);
            this.ac.addRoute(this.getId(id), route);
            this.setTransition(id, route, gain);
        } else {
            const source = this.ac.createStreamSource();
            const stream = new StreamLoader(url);
            stream.pipe(source);
            source.setLoop(true);
            const route = this.ac.createRoute(source);
            route.addEffect([gain, this.mainGain]);
            this.ac.addRoute(this.getId(id), route);
            this.setTransition(id, route, gain);
        }
    }

    /**
     * 移除一个 bgm
     * @param id 要移除的 bgm 的名称
     */
    removeBgm(id: T) {
        this.ac.removeRoute(this.getId(id));
        const gain = this.gain.get(id);
        if (gain) {
            gain.route.off('start', gain.startFn);
            gain.route.off('end', gain.endFn);
        }
        this.gain.delete(id);
    }

    private setTransition(id: T, route: IAudioRoute, gain: IAudioVolumeEffect) {
        const startFn = () => {
            gain.output.gain.cancelScheduledValues(this.ac.ac.currentTime);
            gain.output.gain.setTargetAtTime(
                1,
                this.ac.ac.currentTime,
                this.transitionTime / 1000 / 3
            );
        };
        const endFn = () => {
            gain.output.gain.cancelScheduledValues(this.ac.ac.currentTime);
            gain.output.gain.setTargetAtTime(
                0,
                this.ac.ac.currentTime,
                this.transitionTime / 1000 / 3
            );
        };
        route.on('start', startFn);
        route.on('end', endFn);
        route.setEndTime(this.transitionTime);

        this.gain.set(id, { route, startFn, endFn });
    }

    /**
     * 播放一个 bgm
     * @param id 要播放的 bgm 名称
     */
    play(id: T, when?: number) {
        if (this.blocking) return;
        if (id !== this.playingBgm && this.playingBgm) {
            this.ac.pause(this.getId(this.playingBgm));
        }
        this.playingBgm = id;
        if (!this.enabled) return;
        const full = this.getId(id);
        this.ac.play(full, when);
        this.playing = true;
        const route = this.ac.getRoute(full);
        if (!route) return;
        const index = this.cachePool.findIndex(v => v.route === route);
        if (index !== -1) {
            // 说明还在缓冲区内，将其移动至最后面
            const [data] = this.cachePool.splice(index, 1);
            this.cachePool.push(data);
        } else {
            // 不在缓冲区内，则执行加载，加载完毕后检查尺寸
            const cacheInfo: AudioCacheInfo = {
                route,
                size: 0
            };
            const source = route.source;
            if (source instanceof AudioElementSource) {
                // audio 元素音频源
                source.once('load', () => {
                    const duration = source.audio.duration;
                    const estimatedSize = duration * 48000 * 2 * 4;
                    cacheInfo.size = estimatedSize;
                    this.checkMaxCache();
                });
            } else if (source instanceof AudioStreamSource) {
                // 流式加载音频源
                source.once('load', () => {
                    if (!source.buffer) return;
                    const buffer = source.buffer;
                    const size = buffer.numberOfChannels * buffer.length * 4;
                    cacheInfo.size = size;
                    this.checkMaxCache();
                });
            } else {
                // 其他音频源
                source.once('load', () => {
                    const duration = source.duration;
                    const estimatedSize = duration * 48000 * 2 * 4;
                    cacheInfo.size = estimatedSize;
                    this.checkMaxCache();
                });
            }
            this.cachePool.push(cacheInfo);
        }
    }

    /**
     * 继续当前的 bgm
     */
    resume() {
        if (this.blocking || !this.enabled || this.playing) return;
        if (this.playingBgm) {
            this.ac.resume(this.getId(this.playingBgm));
        }
        this.playing = true;
    }

    /**
     * 暂停当前的 bgm
     */
    pause() {
        if (this.blocking || !this.enabled) return;
        if (this.playingBgm) {
            this.ac.pause(this.getId(this.playingBgm));
        }
        this.playing = false;
    }

    /**
     * 停止当前的 bgm
     */
    stop() {
        if (this.blocking || !this.enabled) return;
        if (this.playingBgm) {
            this.ac.stop(this.getId(this.playingBgm));
        }
        this.playing = false;
    }

    destroy(): void {}
}
