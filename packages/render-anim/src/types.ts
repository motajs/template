import { ITexture, ITextureAnimater } from '@motajs/render';

export const enum AnimationBlendMode {
    /** 普通混合 */
    Normal,
    /** 加算混合 */
    Add
}

export interface IAnimationBitmap {
    /** 位图在纹理中的横坐标 */
    readonly x: number;
    /** 位图在纹理中的纵坐标 */
    readonly y: number;
    /** 位图宽度 */
    readonly width: number;
    /** 位图高度 */
    readonly height: number;
}

export interface IAnimationSound {
    /** 音效名称 */
    readonly name: string;
    /** 播放音量 */
    readonly volume?: number;
    /** 播放音高 */
    readonly pitch?: number;
}

export interface IAnimationObject {
    /** 使用的位图索引 */
    readonly index: number;
    /** 相对帧原点的横坐标 */
    readonly x: number;
    /** 相对帧原点的纵坐标 */
    readonly y: number;
    /** 缩放比例 */
    readonly scale: number;
    /** 不透明度 */
    readonly opacity: number;
    /** 镜像方向 */
    readonly mirror: number;
    /** 旋转角度 */
    readonly rotate: number;
}

export interface IAnimationFrame {
    /** 帧宽度 */
    readonly width: number;
    /** 帧高度 */
    readonly height: number;
    /** 帧原点的横坐标 */
    readonly originX: number;
    /** 帧原点的纵坐标 */
    readonly originY: number;
    /** 帧内的绘制对象 */
    readonly objects: readonly IAnimationObject[];
    /** 帧内播放的音效 */
    readonly sound?: readonly IAnimationSound[];
}

export interface IAnimationParsedData {
    /** 合成帧使用的纹理 */
    readonly texture: ITexture;
    /** 位图列表 */
    readonly bitmaps: readonly IAnimationBitmap[];
    /** 帧列表 */
    readonly frames: readonly IAnimationFrame[];
    /** 混合模式 */
    readonly blend: AnimationBlendMode;
}

export type IAnimationAnimater = ITextureAnimater<IAnimationParsedData>;
