import { logger } from '@motajs/common';
import { IAudioVolumeEffect, IMotaAudioContext, ISoundPlayer } from './types';

type LocationArray = [number, number, number];

export class SoundPlayer<
    T extends string = SoundIds
> implements ISoundPlayer<T> {
    /** 每个音效的唯一标识符 */
    private num: number = 0;

    /** 每个音效的数据 */
    readonly buffer: Map<T, AudioBuffer> = new Map();
    /** 所有正在播放的音乐 */
    readonly playing: Set<number> = new Set();
    /** 音量节点 */
    readonly gain: IAudioVolumeEffect;

    /** 是否已经启用 */
    enabled: boolean = true;

    constructor(public readonly ac: IMotaAudioContext) {
        this.gain = ac.createVolumeEffect();
    }

    /**
     * 设置是否启用音效
     * @param enabled 是否启用音效
     */
    setEnabled(enabled: boolean) {
        if (!enabled) this.stopAllSounds();
        this.enabled = enabled;
    }

    /**
     * 设置音量大小
     * @param volume 音量大小
     */
    setVolume(volume: number) {
        this.gain.setVolume(volume);
    }

    /**
     * 获取音量大小
     */
    getVolume() {
        return this.gain.getVolume();
    }

    /**
     * 添加一个音效
     * @param id 音效名称
     * @param data 音效的Uint8Array数据
     */
    async add(id: T, data: Uint8Array | AudioBuffer) {
        if (data instanceof Uint8Array) {
            const buffer = await this.ac.decodeToAudioBuffer(data);
            if (!buffer) {
                logger.warn(51, id);
                return;
            }
            this.buffer.set(id, buffer);
        } else {
            this.buffer.set(id, data);
        }
    }

    /**
     * 播放一个音效
     * @param id 音效名称
     * @param position 音频位置，[0, 0, 0]表示正中心，x轴指向水平向右，y轴指向水平向上，z轴指向竖直向上
     * @param orientation 音频朝向，[0, 1, 0]表示朝向前方
     */
    play(
        id: T,
        position: LocationArray = [0, 0, 0],
        orientation: LocationArray = [1, 0, 0]
    ) {
        if (!this.enabled) return -1;
        const buffer = this.buffer.get(id);
        if (!buffer) {
            logger.warn(52, id);
            return -1;
        }
        const soundNum = this.num++;
        const source = this.ac.createBufferSource();
        source.setBuffer(buffer);
        const route = this.ac.createRoute(source);
        const stereo = this.ac.createStereoEffect();
        stereo.setPosition(position[0], position[1], position[2]);
        stereo.setOrientation(orientation[0], orientation[1], orientation[2]);
        route.addEffect([stereo, this.gain]);
        this.ac.addRoute(`sounds.${soundNum}`, route);
        route.play();
        // 清理垃圾
        source.output.addEventListener('ended', () => {
            this.playing.delete(soundNum);
            this.ac.removeRoute(`sounds.${soundNum}`);
        });
        this.playing.add(soundNum);
        return soundNum;
    }

    /**
     * 停止一个音效
     * @param num 音效的唯一 id
     */
    stop(num: number) {
        const id = `sounds.${num}`;
        const route = this.ac.getRoute(id);
        if (route) {
            route.stop();
            this.ac.removeRoute(id);
            this.playing.delete(num);
        }
    }

    /**
     * 停止播放所有音效
     */
    stopAllSounds() {
        this.playing.forEach(v => {
            const id = `sounds.${v}`;
            const route = this.ac.getRoute(id);
            if (route) {
                route.stop();
                this.ac.removeRoute(id);
            }
        });
        this.playing.clear();
    }
}
