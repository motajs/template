import EventEmitter from 'eventemitter3';
import { IStreamReader } from '@motajs/loader';

export interface IAudioInput {
    /** 输入节点 */
    readonly input: AudioNode;
}

export interface IAudioOutput {
    /** 输出节点 */
    readonly output: AudioNode;
}

export const enum AudioType {
    Unknown = 'unknown',
    Mp3 = 'audio/mpeg',
    Wav = 'audio/wav; codecs="1"',
    Flac = 'audio/flac',
    Opus = 'audio/ogg; codecs="opus"',
    Ogg = 'audio/ogg; codecs="vorbis"',
    Aac = 'audio/aac'
}

//#region 音频源

export interface EAudioSourceEvent {
    play: [];
    end: [];
    load: [];
}

export interface IAudioSource
    extends IAudioOutput, EventEmitter<EAudioSourceEvent> {
    /** 所属的 {@link IMotaAudioContext} 上下文 */
    readonly motaAC: IMotaAudioContext;
    /** 音频播放上下文 */
    readonly ac: AudioContext;
    /** 音频源对应的的音频节点 */
    readonly output: AudioNode;
    /** 当前是否正在播放 */
    readonly playing: boolean;
    /** 音频总时长 */
    readonly duration: number;
    /** 当前播放时长 */
    readonly currentTime: number;

    /**
     * 开始播放这个音频源
     */
    play(when?: number): void;

    /**
     * 停止播放这个音频源
     * @returns 音频暂停的时刻
     */
    stop(): number;

    /**
     * 连接到音频路由图上，每次调用播放的时候都会执行一次
     * @param target 连接至的目标
     */
    connect(target: IAudioInput): void;

    /**
     * 设置是否循环播放
     * @param loop 是否循环
     */
    setLoop(loop: boolean): void;

    /**
     * 清空此音频源的缓存，释放其占用的内存
     */
    free(): void;
}

export interface IAudioStreamSource extends IAudioSource, IStreamReader {
    /** 流式加载的输出节点 */
    readonly output: AudioBufferSourceNode;
    /** 音频缓冲区 */
    readonly buffer: AudioBuffer | null;
    /** 当前是否已经加载完毕 */
    readonly loaded: boolean;
    /** 已缓冲时长 */
    readonly buffered: number;
    /** 已缓冲的采样点数量 */
    readonly bufferedSamples: number;
    /** 音频采样率 */
    readonly sampleRate: number;

    /**
     * 设置每个缓存数据的大小，默认为10秒钟一个缓存数据，只能在加载开始前设置
     * @param size 每个缓存数据的时长，单位秒
     */
    setChunkSize(size: number): void;
}

export interface IAudioElementSource extends IAudioSource {
    /** `audio` 元素音频源节点 */
    readonly output: MediaElementAudioSourceNode;
    /** `audio` 元素对象 */
    readonly audio: HTMLAudioElement;

    /**
     * 设置音频源的路径
     * @param url 音频路径
     */
    setSource(url: string): void;
}

export interface IAudioBufferSource extends IAudioSource {
    /** 音频源节点 */
    readonly output: AudioBufferSourceNode;
    /** 音频数据缓冲区 */
    readonly buffer: AudioBuffer | null;

    /**
     * 设置音频源数据
     * @param buffer 音频源，可以是未解析的 ArrayBuffer，也可以是已解析的 AudioBuffer
     */
    setBuffer(buffer: ArrayBuffer | AudioBuffer): Promise<void>;
}

//#endregion

//#region 音频路由

export const enum AudioStatus {
    Playing,
    Pausing,
    Paused,
    Stoping,
    Stoped
}

export interface EAudioRouteEvent {
    updateEffect: [];
    play: [];
    stop: [];
    pause: [];
    resume: [];

    start: [route: IAudioRoute];
    end: [time: number, route: IAudioRoute];
}

export interface IAudioRoute
    extends IAudioOutput, EventEmitter<EAudioRouteEvent> {
    /** 音频路由图 */
    readonly effectRoute: readonly IAudioEffect[];
    /** 结束时长，当音频暂停或停止时，会经过这么长时间之后才真正终止播放，期间可以做音频淡入淡出等效果 */
    readonly endTime: number;
    /** 当前音频播放状态 */
    readonly status: AudioStatus;
    /** 音频总时长 */
    readonly duration: number;
    /** 当前音频播放时长 */
    readonly currentTime: number;
    /** 音频路由的音频源 */
    readonly source: IAudioSource;

    /**
     * 设置结束时间，暂停或停止时，会经过这么长时间才终止音频的播放，这期间可以做一下音频淡出的效果。
     * @param time 暂停或停止时，经过多长时间之后才会结束音频的播放
     */
    setEndTime(time: number): void;

    /**
     * 开始播放这个音频
     * @param when 从音频的什么时候开始播放，单位秒
     */
    play(when?: number): Promise<void>;

    /**
     * 暂停音频播放
     */
    pause(): Promise<void>;

    /**
     * 继续音频播放
     */
    resume(): void;

    /**
     * 停止音频播放
     */
    stop(): Promise<void>;

    /**
     * 添加效果器
     * @param effect 要添加的效果，可以是数组，表示一次添加多个
     * @param index 从哪个位置开始添加，如果大于数组长度，那么加到末尾，如果小于0，那么将会从后面往前数。默认添加到末尾
     */
    addEffect(effect: IAudioEffect | IAudioEffect[], index?: number): void;

    /**
     * 移除一个效果器
     * @param effect 要移除的效果
     */
    removeEffect(effect: IAudioEffect): void;

    /**
     * 销毁此音频路由
     */
    destroy(): void;
}

//#endregion

//#region 音频效果

export interface IAudioEffect extends IAudioInput, IAudioOutput {
    /** 所属的 {@link IMotaAudioContext} 上下文 */
    readonly motaAC: IMotaAudioContext;
    /** 音频播放上下文 */
    readonly ac: AudioContext;

    /**
     * 当音频播放结束时触发，可以用于节点结束后处理
     */
    end(): void;

    /**
     * 当音频开始播放时触发，可以用于节点初始化
     */
    start(): void;

    /**
     * 连接至其他效果器
     * @param target 目标输入
     * @param output 当前效果器输出通道
     * @param input 目标效果器的输入通道
     */
    connect(target: IAudioInput, output?: number, input?: number): void;

    /**
     * 与其他效果器取消连接
     * @param target 目标输入
     * @param output 当前效果器输出通道
     * @param input 目标效果器的输入通道
     */
    disconnect(target?: IAudioInput, output?: number, input?: number): void;
}

export interface IAudioStereoEffect extends IAudioEffect {
    /**
     * 设置音频朝向，x正方形水平向右，y正方形垂直于地面向上，z正方向垂直屏幕远离用户
     * @param x 朝向x坐标
     * @param y 朝向y坐标
     * @param z 朝向z坐标
     */
    setOrientation(x: number, y: number, z: number): void;

    /**
     * 设置音频位置，x正方形水平向右，y正方形垂直于地面向上，z正方向垂直屏幕远离用户
     * @param x 位置x坐标
     * @param y 位置y坐标
     * @param z 位置z坐标
     */
    setPosition(x: number, y: number, z: number): void;
}

export interface IAudioVolumeEffect extends IAudioEffect {
    /** 输入增益节点 */
    readonly input: GainNode;
    /** 输出增益节点 */
    readonly output: GainNode;

    /**
     * 设置音量大小，不采用音量映射
     * @param volume 音量大小
     */
    setVolume(volume: number): void;

    /**
     * 获取音量大小，不采用音量映射
     */
    getVolume(): number;
}

export interface IAudioChannelVolumeEffect extends IAudioEffect {
    /**
     * 设置某个声道的音量大小
     * @param channel 要设置的声道，可填0-5
     * @param volume 这个声道的音量大小
     */
    setVolume(channel: number, volume: number): void;

    /**
     * 获取某个声道的音量大小，可填0-5
     * @param channel 要获取的声道
     */
    getVolume(channel: number): number;
}

export interface IAudioDelayEffect extends IAudioEffect {
    /**
     * 设置延迟时长
     * @param delay 延迟时长，单位秒
     */
    setDelay(delay: number): void;

    /**
     * 获取延迟时长
     */
    getDelay(): number;
}

export interface IAudioEchoEffect extends IAudioEffect {
    /**
     * 设置回声反馈增益大小
     * @param gain 增益大小，范围 0-1，大于等于1的视为0.5，小于0的视为0
     */
    setFeedbackGain(gain: number): void;

    /**
     * 设置回声间隔时长
     * @param delay 回声时长，范围 0.01-Infinity，小于0.01的视为0.01
     */
    setEchoDelay(delay: number): void;

    /**
     * 获取反馈节点增益
     */
    getFeedbackGain(): number;

    /**
     * 获取回声间隔时长
     */
    getEchoDelay(): number;
}

//#endregion

//#region 音频上下文

export interface IMotaAudioContextCreator {
    /**
     * 创建一个音频源
     * @param Source 音频源类
     */
    createSource<T extends IAudioSource>(
        Source: new (ac: IMotaAudioContext) => T
    ): T;

    /**
     * 创建一个兼容流式音频源，可以与流式加载相结合，主要用于处理 opus ogg 不兼容的情况
     */
    createStreamSource(): IAudioStreamSource;

    /**
     * 创建一个通过 audio 元素播放的音频源
     */
    createElementSource(): IAudioElementSource;

    /**
     * 创建一个通过 AudioBuffer 播放的音频源
     */
    createBufferSource(): IAudioBufferSource;

    /**
     * 创建一个音频效果器
     * @param Effect 效果器类
     */
    createEffect<T extends IAudioEffect>(
        Effect: new (ac: IMotaAudioContext) => T
    ): T;

    /**
     * 创建一个修改音量的效果器
     * ```txt
     *             |----------|
     * Input ----> | GainNode | ----> Output
     *             |----------|
     * ```
     */
    createVolumeEffect(): IAudioVolumeEffect;

    /**
     * 创建一个立体声效果器
     * ```txt
     *             |------------|
     * Input ----> | PannerNode | ----> Output
     *             |------------|
     * ```
     */
    createStereoEffect(): IAudioStereoEffect;

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
    createChannelVolumeEffect(): IAudioChannelVolumeEffect;

    /**
     * 创建一个延迟效果器
     * ```txt
     *             |-----------|
     * Input ----> | DelayNode | ----> Output
     *             |-----------|
     * ```
     */
    createDelayEffect(): IAudioDelayEffect;

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
    createEchoEffect(): IAudioEchoEffect;
}

export type AudioDecoderCreateFunc = (
    context: IMotaAudioContext
) => IAudioDecoder;

export interface IMotaAudioContext extends IMotaAudioContextCreator {
    /** 音频上下文 */
    readonly ac: AudioContext;
    /** 音频播放路由 */
    readonly audioRoutes: Map<string, IAudioRoute>;
    /** 音频增益节点 */
    readonly gain: GainNode;

    /**
     * 设置音量，音量映射采用 `gain = 10 ** (dB / 20), where minDB = -60`
     * @param volume 音量
     */
    setVolume(volume: number): void;

    /**
     * 获取音量，音量映射采用 `gain = 10 ** (dB / 20), where minDB = -60`
     */
    getVolume(): number;

    /**
     * 获取音频目的地
     */
    getDestination(): AudioNode;

    /**
     * 创建音效播放器
     */
    createSoundPlayer<T extends string>(): ISoundPlayer<T>;

    /**
     * 创建一个音频播放路由
     * @param source 音频源
     */
    createRoute(source: IAudioSource): IAudioRoute;

    /**
     * 添加一个音频播放路由，可以直接被播放
     * @param id 这个音频播放路由的名称
     * @param route 音频播放路由对象
     */
    addRoute(id: string, route: IAudioRoute): void;

    /**
     * 根据名称获取音频播放路由对象
     * @param id 音频播放路由的名称
     */
    getRoute(id: string): IAudioRoute | null;

    /**
     * 移除一个音频播放路由
     * @param id 要移除的播放路由的名称
     */
    removeRoute(id: string): void;

    /**
     * 播放音频
     * @param id 音频名称
     * @param when 从音频的哪个位置开始播放，单位秒
     */
    play(id: string, when?: number): void;

    /**
     * 暂停音频播放
     * @param id 音频名称
     * @returns 当音乐真正停止时兑现
     */
    pause(id: string): Promise<void>;

    /**
     * 停止音频播放
     * @param id 音频名称
     * @returns 当音乐真正停止时兑现
     */
    stop(id: string): Promise<void>;

    /**
     * 继续音频播放
     * @param id 音频名称
     */
    resume(id: string): void;

    /**
     * 设置听者位置，x正方向水平向右，y正方向垂直于地面向上，z正方向垂直屏幕远离用户
     * @param x 位置x坐标
     * @param y 位置y坐标
     * @param z 位置z坐标
     */
    setListenerPosition(x: number, y: number, z: number): void;

    /**
     * 设置听者朝向，x正方向水平向右，y正方向垂直于地面向上，z正方向垂直屏幕远离用户
     * @param x 朝向x坐标
     * @param y 朝向y坐标
     * @param z 朝向z坐标
     */
    setListenerOrientation(x: number, y: number, z: number): void;

    /**
     * 设置听者头顶朝向，x正方向水平向右，y正方向垂直于地面向上，z正方向垂直屏幕远离用户
     * @param x 头顶朝向x坐标
     * @param y 头顶朝向y坐标
     * @param z 头顶朝向z坐标
     */
    setListenerUp(x: number, y: number, z: number): void;

    /**
     * 检查音频格式是否由浏览器所支持
     * @param type 音频格式
     */
    isAudioVanillaSupport(type: AudioType): boolean;

    /**
     * 注册一个音频解码器
     * @param type 解码器解码的音频格式
     * @param decoder 解码器对象
     */
    registerDecoder(type: AudioType, decoder: AudioDecoderCreateFunc): void;

    /**
     * 为指定音频格式创建解码器
     * @param type 音频格式
     */
    createDecoder(type: AudioType): IAudioDecoder | null;

    /**
     * 根据音频未解码二进制数据获取其格式
     * @param data 音频数据
     */
    getAudioTypeFromData(data: Uint8Array): AudioType;

    /**
     * 解码一个完整文件的音频二进制数据，对于浏览器支持的格式会使用浏览器内置接口
     * @param data 音频二进制数据
     */
    decodeAudio(data: Uint8Array): Promise<IAudioDecodeData | null>;

    /**
     * 将解码出的音频数据转换为 `AudioBuffer`
     * @param data 音频解码数据
     */
    toAudioBuffer(data: IAudioDecodeData): AudioBuffer;

    /**
     * 将音频完整文件直接解码为 `AudioBuffer`，如果浏览器本身支持传入的格式，那么可以减少转换次数提高性能
     * @param data 音频二进制数据
     */
    decodeToAudioBuffer(data: Uint8Array): Promise<AudioBuffer | null>;
}

//#endregion

//#region 音效播放器

export type AudioLocationArray = [number, number, number];

export interface ISoundPlayer<T extends string> {
    /** 音频上下文 */
    readonly ac: IMotaAudioContext;
    /** 当前是否启用此音效播放器 */
    readonly enabled: boolean;

    /**
     * 设置是否启用音效
     * @param enabled 是否启用音效
     */
    setEnabled(enabled: boolean): void;

    /**
     * 设置音量大小
     * @param volume 音量大小
     */
    setVolume(volume: number): void;

    /**
     * 获取音量大小
     */
    getVolume(): void;

    /**
     * 添加一个音效
     * @param id 音效名称
     * @param data 音效的Uint8Array数据
     */
    add(id: T, data: Uint8Array | AudioBuffer): Promise<void>;

    /**
     * 播放一个音效
     * @param id 音效名称
     * @param position 音频位置，[0, 0, 0]表示正中心，x轴指向水平向右，y轴指向水平向上，z轴指向竖直向上
     * @param orientation 音频朝向，[0, 1, 0]表示朝向前方
     */
    play(
        id: T,
        position?: AudioLocationArray,
        orientation?: AudioLocationArray
    ): number;

    /**
     * 停止一个音效
     * @param num 音效的唯一 id
     */
    stop(num: number): void;

    /**
     * 停止播放所有音效
     */
    stopAllSounds(): void;
}

//#endregion

//#region bgm 播放器

export interface IBGMPlayer<T extends string> {
    /** 当前是否启用此播放器 */
    readonly enabled: boolean;
    /** 当前正在播放的音乐 */
    readonly playingBGM?: T;
    /** 当前是否有音乐正在播放 */
    readonly playing: boolean;
    /** 最大缓存容量，默认 256MB */
    readonly maxCacheSize: number;

    /**
     * 设置音乐的最大缓存容量，当已加载的音乐占用内存大于指定值时将会优先释放最久未被使用的音乐的缓存。
     * 建议大小为 128MB 或 256MB，超过此值有可能导致内存占用过大。系统会至少缓存一个音频，哪怕其大小超过缓存容量。
     *
     * 大小设置参考：一段时长三分钟，采样率为 48000 的单声道音乐会占用约 33MB 的内存空间。
     * @param size 最大缓存容量，单位为 MB，最大可设置为 512M，最小可设置为 32M。
     */
    setMaxCacheSize(size: number): void;

    /**
     * 设置音频渐变时长
     * @param time 渐变时长
     */
    setTransitionTime(time: number): void;

    /**
     * 屏蔽音乐切换
     */
    blockChange(): void;

    /**
     * 取消屏蔽音乐切换
     */
    unblockChange(): void;

    /**
     * 设置总音量大小，不进行音量映射
     * @param volume 音量大小
     */
    setVolume(volume: number): void;

    /**
     * 获取总音量大小，不进行音量映射
     */
    getVolume(): number;

    /**
     * 设置是否启用
     * @param enabled 是否启用
     */
    setEnabled(enabled: boolean): void;

    /**
     * 根据 bgm 名称获取其 AudioRoute 实例
     * @param id 音频名称
     */
    get(id: T): IAudioRoute | null;

    /**
     * 添加一个 bgm
     * @param id 要添加的 bgm 的名称
     * @param url 指定 bgm 的加载地址
     */
    addBGMFromURL(id: T, url: string): void;

    /**
     * 移除一个 bgm
     * @param id 要移除的 bgm 的名称
     */
    removeBgm(id: T): void;

    /**
     * 播放一个 bgm
     * @param id 要播放的 bgm 名称
     * @param when 播放开始时刻，单位秒
     */
    play(id: T, when?: number): void;

    /**
     * 继续当前的 bgm
     */
    resume(): void;

    /**
     * 暂停当前的 bgm
     */
    pause(): void;

    /**
     * 停止当前的 bgm
     */
    stop(): void;

    /**
     * 销毁此音乐播放器，释放相关资源
     */
    destroy(): void;
}

//#endregion

//#region 解码器

export interface IAudioDecodeError {
    /** 错误信息 */
    readonly message: string;
}

export interface IAudioDecodeData {
    /** 每个声道的音频信息 */
    readonly channelData: Float32Array<ArrayBuffer>[];
    /** 已经被解码的 PCM 采样数 */
    readonly samplesDecoded: number;
    /** 音频采样率 */
    readonly sampleRate: number;
    /** 解码错误信息 */
    readonly errors: IAudioDecodeError[];
}

export interface IAudioDecoder {
    /**
     * 创建音频解码器
     */
    create(): Promise<void>;

    /**
     * 摧毁这个解码器
     */
    destroy(): Promise<void>;

    /**
     * 解码流数据
     * @param data 流数据
     */
    decode(data: Uint8Array): Promise<IAudioDecodeData | null>;

    /**
     * 解码整个文件
     * @param data 文件数据
     */
    decodeAll(data: Uint8Array): Promise<IAudioDecodeData | null>;

    /**
     * 当音频解码完成后，会调用此函数，需要返回之前还未解析或未返回的音频数据。调用后，该解码器将不会被再次使用
     */
    flush(): Promise<IAudioDecodeData | null>;
}

//#endregion
