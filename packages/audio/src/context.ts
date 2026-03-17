import {
    AudioBufferSource,
    AudioElementSource,
    AudioStreamSource
} from './source';
import {
    ChannelVolumeEffect,
    DelayEffect,
    EchoEffect,
    StereoEffect,
    VolumeEffect
} from './effect';
import { logger } from '@motajs/common';
import { VanillaDecoder } from './decoder';
import {
    AudioDecoderCreateFunc,
    AudioType,
    IAudioBufferSource,
    IAudioChannelVolumeEffect,
    IAudioDecodeData,
    IAudioDecoder,
    IAudioDelayEffect,
    IAudioEchoEffect,
    IAudioEffect,
    IAudioElementSource,
    IAudioRoute,
    IAudioSource,
    IAudioStereoEffect,
    IAudioStreamSource,
    IAudioVolumeEffect,
    IMotaAudioContext,
    ISoundPlayer
} from './types';
import { SoundPlayer } from './sound';
import { AudioRoute } from './route';

const fileSignatures: [AudioType, number[]][] = [
    [AudioType.Mp3, [0x49, 0x44, 0x33]],
    [AudioType.Ogg, [0x4f, 0x67, 0x67, 0x53]],
    [AudioType.Wav, [0x52, 0x49, 0x46, 0x46]],
    [AudioType.Flac, [0x66, 0x4c, 0x61, 0x43]],
    [AudioType.Aac, [0xff, 0xf1]],
    [AudioType.Aac, [0xff, 0xf9]]
];
const oggHeaders: [AudioType, number[]][] = [
    [AudioType.Opus, [0x4f, 0x70, 0x75, 0x73, 0x48, 0x65, 0x61, 0x64]]
];

export class MotaAudioContext implements IMotaAudioContext {
    /** 音频播放上下文 */
    readonly ac: AudioContext;

    /** 所有的音频播放路由 */
    readonly audioRoutes: Map<string, IAudioRoute> = new Map();
    /** 音量节点 */
    readonly gain: GainNode;

    /** 测试用 audio 元素 */
    private readonly testAudio: HTMLAudioElement = new Audio();
    /** 所有注册的解码器 */
    private readonly decoders: Map<AudioType, AudioDecoderCreateFunc> =
        new Map();

    /** 最小音量 */
    private readonly minDb = -60;

    constructor() {
        this.ac = new AudioContext();
        this.gain = this.ac.createGain();
        this.gain.connect(this.ac.destination);
    }

    /**
     * 设置音量，音量映射采用 `gain = 10 ** (dB / 20), where minDB = -60`
     * @param volume 音量
     */
    setVolume(volume: number): void {
        if (volume === 0) this.gain.gain.value = 0;
        else {
            const db = this.minDb + -this.minDb * volume;
            const gain = 10 ** (db / 20);
            this.gain.gain.value = gain;
        }
    }

    /**
     * 获取音量，音量映射采用 `gain = 10 ** (dB / 20), where minDB = -60`
     */
    getVolume(): number {
        if (this.gain.gain.value === 0) return 0;
        const db = -Math.log10(this.gain.gain.value) * 20;
        return db / this.minDb;
    }

    /**
     * 创建音效播放器
     */
    createSoundPlayer<T extends string>(): ISoundPlayer<T> {
        return new SoundPlayer(this);
    }

    /**
     * 创建一个音频源
     * @param Source 音频源类
     */
    createSource<T extends IAudioSource>(
        Source: new (ac: IMotaAudioContext) => T
    ): T {
        return new Source(this);
    }

    /**
     * 创建一个兼容流式音频源，可以与流式加载相结合，主要用于处理 opus ogg 不兼容的情况
     */
    createStreamSource(): IAudioStreamSource {
        return new AudioStreamSource(this);
    }

    /**
     * 创建一个通过 audio 元素播放的音频源
     */
    createElementSource(): IAudioElementSource {
        return new AudioElementSource(this);
    }

    /**
     * 创建一个通过 AudioBuffer 播放的音频源
     */
    createBufferSource(): IAudioBufferSource {
        return new AudioBufferSource(this);
    }

    /**
     * 获取音频目的地
     */
    getDestination(): GainNode {
        return this.gain;
    }

    /**
     * 创建一个音频效果器
     * @param Effect 效果器类
     */
    createEffect<T extends IAudioEffect>(
        Effect: new (ac: IMotaAudioContext) => T
    ): T {
        return new Effect(this);
    }

    /**
     * 创建一个修改音量的效果器
     * ```txt
     *             |----------|
     * Input ----> | GainNode | ----> Output
     *             |----------|
     * ```
     */
    createVolumeEffect(): IAudioVolumeEffect {
        return new VolumeEffect(this);
    }

    /**
     * 创建一个立体声效果器
     * ```txt
     *             |------------|
     * Input ----> | PannerNode | ----> Output
     *             |------------|
     * ```
     */
    createStereoEffect(): IAudioStereoEffect {
        return new StereoEffect(this);
    }

    /**
     * 创建一个修改单个声道音量的效果器
     * ```txt
     *                                  |----------|
     *                               -> | GainNode | \
     *             |--------------| /   |----------|  -> |------------|
     * Input ----> | SplitterNode |        ......        | MergerNode | ----> Output
     *             |--------------| \   |----------|  -> |------------|
     *                               -> | GainNode | /
     *                                  |----------|
     * ```
     */
    createChannelVolumeEffect(): IAudioChannelVolumeEffect {
        return new ChannelVolumeEffect(this);
    }

    /**
     * 创建一个延迟效果器
     * ```txt
     *             |-----------|
     * Input ----> | DelayNode | ----> Output
     *             |-----------|
     * ```
     */
    createDelayEffect(): IAudioDelayEffect {
        return new DelayEffect(this);
    }

    /**
     * 创建一个回声效果器
     * ```txt
     *             |----------|
     * Input ----> | GainNode | ----> Output
     *        ^    |----------|   |
     *        |                   |
     *        |   |------------|  ↓
     *        |-- | Delay Node | <--
     *            |------------|
     * ```
     */
    createEchoEffect(): IAudioEchoEffect {
        return new EchoEffect(this);
    }

    /**
     * 创建一个音频播放路由
     * @param source 音频源
     */
    createRoute(source: IAudioSource): IAudioRoute {
        return new AudioRoute(source, this);
    }

    /**
     * 添加一个音频播放路由，可以直接被播放
     * @param id 这个音频播放路由的名称
     * @param route 音频播放路由对象
     */
    addRoute(id: string, route: IAudioRoute): void {
        if (this.audioRoutes.has(id)) {
            logger.warn(45, id);
        }
        this.audioRoutes.set(id, route);
    }

    /**
     * 根据名称获取音频播放路由对象
     * @param id 音频播放路由的名称
     */
    getRoute(id: string): IAudioRoute | null {
        return this.audioRoutes.get(id) ?? null;
    }

    /**
     * 移除一个音频播放路由
     * @param id 要移除的播放路由的名称
     */
    removeRoute(id: string): void {
        const route = this.audioRoutes.get(id);
        if (route) {
            route.destroy();
        }
        this.audioRoutes.delete(id);
    }

    /**
     * 播放音频
     * @param id 音频名称
     * @param when 从音频的哪个位置开始播放，单位秒
     */
    play(id: string, when: number = 0): void {
        const route = this.getRoute(id);
        if (!route) {
            logger.warn(53, 'play', id);
            return;
        }
        route.play(when);
    }

    /**
     * 暂停音频播放
     * @param id 音频名称
     * @returns 当音乐真正停止时兑现
     */
    pause(id: string): Promise<void> {
        const route = this.getRoute(id);
        if (!route) {
            logger.warn(53, 'pause', id);
            return Promise.resolve();
        }
        return route.pause();
    }

    /**
     * 停止音频播放
     * @param id 音频名称
     * @returns 当音乐真正停止时兑现
     */
    stop(id: string): Promise<void> {
        const route = this.getRoute(id);
        if (!route) {
            logger.warn(53, 'stop', id);
            return Promise.resolve();
        }
        return route.stop();
    }

    /**
     * 继续音频播放
     * @param id 音频名称
     */
    resume(id: string): void {
        const route = this.getRoute(id);
        if (!route) {
            logger.warn(53, 'resume', id);
            return;
        }
        route.resume();
    }

    /**
     * 设置听者位置，x正方向水平向右，y正方向垂直于地面向上，z正方向垂直屏幕远离用户
     * @param x 位置x坐标
     * @param y 位置y坐标
     * @param z 位置z坐标
     */
    setListenerPosition(x: number, y: number, z: number) {
        const listener = this.ac.listener;
        listener.positionX.value = x;
        listener.positionY.value = y;
        listener.positionZ.value = z;
    }

    /**
     * 设置听者朝向，x正方向水平向右，y正方向垂直于地面向上，z正方向垂直屏幕远离用户
     * @param x 朝向x坐标
     * @param y 朝向y坐标
     * @param z 朝向z坐标
     */
    setListenerOrientation(x: number, y: number, z: number) {
        const listener = this.ac.listener;
        listener.forwardX.value = x;
        listener.forwardY.value = y;
        listener.forwardZ.value = z;
    }

    /**
     * 设置听者头顶朝向，x正方向水平向右，y正方向垂直于地面向上，z正方向垂直屏幕远离用户
     * @param x 头顶朝向x坐标
     * @param y 头顶朝向y坐标
     * @param z 头顶朝向z坐标
     */
    setListenerUp(x: number, y: number, z: number) {
        const listener = this.ac.listener;
        listener.upX.value = x;
        listener.upY.value = y;
        listener.upZ.value = z;
    }

    isAudioVanillaSupport(type: AudioType): boolean {
        const support = this.testAudio.canPlayType(type);
        return support === 'probably' || support === 'maybe';
    }

    registerDecoder(type: AudioType, decoder: AudioDecoderCreateFunc): void {
        if (this.isAudioVanillaSupport(type)) return;
        this.decoders.set(type, decoder);
    }

    createDecoder(type: AudioType): IAudioDecoder | null {
        if (this.isAudioVanillaSupport(type)) {
            return new VanillaDecoder(this);
        } else {
            const create = this.decoders.get(type);
            if (!create) return null;
            return create(this);
        }
    }

    getAudioTypeFromData(data: Uint8Array): AudioType {
        let audioType: AudioType = AudioType.Unknown;
        // 检查头文件获取音频类型，仅检查前256个字节
        const toCheck = data.slice(0, 256);
        for (const [type, value] of fileSignatures) {
            if (value.every((v, i) => toCheck[i] === v)) {
                audioType = type;
                break;
            }
        }
        if (audioType === AudioType.Ogg) {
            // 如果是ogg的话，进一步判断是不是opus
            for (const [key, value] of oggHeaders) {
                const has = toCheck.some((_, i) => {
                    return value.every((v, ii) => toCheck[i + ii] === v);
                });
                if (has) {
                    audioType = key;
                    break;
                }
            }
        }
        return audioType;
    }

    private getErrorHeaderInfo(data: Uint8Array) {
        const toCheck = data.slice(0, 256);
        return [...toCheck]
            .map(v => v.toString(16).padStart(2, '0'))
            .join(' ')
            .toUpperCase();
    }

    async decodeAudio(data: Uint8Array): Promise<IAudioDecodeData | null> {
        const type = this.getAudioTypeFromData(data);
        if (type === AudioType.Unknown) {
            logger.error(25, this.getErrorHeaderInfo(data));
            return null;
        }
        const decoder = this.createDecoder(type);
        if (!decoder) {
            logger.error(25, this.getErrorHeaderInfo(data));
            return null;
        }
        await decoder.create();
        const decoded = await decoder.decodeAll(data);
        await decoder.destroy();
        return decoded;
    }

    toAudioBuffer(data: IAudioDecodeData): AudioBuffer {
        const buffer = this.ac.createBuffer(
            data.channelData.length,
            data.samplesDecoded,
            data.sampleRate
        );
        for (let i = 0; i < data.channelData.length; i++) {
            buffer.copyToChannel(data.channelData[i], i);
        }
        return buffer;
    }

    async decodeToAudioBuffer(data: Uint8Array): Promise<AudioBuffer | null> {
        const type = this.getAudioTypeFromData(data);
        if (type === AudioType.Unknown) {
            logger.error(53, this.getErrorHeaderInfo(data));
            return null;
        }
        if (!(data.buffer instanceof ArrayBuffer)) return null;
        if (this.isAudioVanillaSupport(type)) {
            return this.ac.decodeAudioData(data.buffer);
        } else {
            const decoded = await this.decodeAudio(data);
            if (!decoded) return null;
            else return this.toAudioBuffer(decoded);
        }
    }
}
