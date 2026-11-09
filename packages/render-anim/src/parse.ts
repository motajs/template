import { logger } from '@motajs/common';
import {
    AnimationBlendMode,
    IAnimationBitmap,
    IAnimationFrame,
    IAnimationObject,
    IAnimationParsedData
} from './types';
import { Texture } from '@motajs/render';

//#region 常量与内部类型

/** 动画文件开头的签名，按大端读取 `ANIM` 的字节 */
const ANIMATION_SIGNATURE = 0x414e494d;
/** 当前支持的动画文件版本 */
const ANIMATION_VERSION = 2;
/** 签名、版本与两段长度字段组成的固定头部字节数 */
const ANIMATION_HEADER_SIZE = 16;

interface IAnimationHeader {
    /** 图像段总字节数，含 sprite 数量、尺寸表与 WebP */
    imageDataSize: number;
    /** 元数据 JSON 的字节数 */
    metaDataSize: number;
}

interface ISpriteDimension {
    /** sprite 宽度 */
    width: number;
    /** sprite 高度 */
    height: number;
}

interface IFrameBox {
    /** 帧画布宽度 */
    width: number;
    /** 帧画布高度 */
    height: number;
    /** 帧原点的横坐标 */
    originX: number;
    /** 帧原点的纵坐标 */
    originY: number;
}

type IRawAnimationObject = [
    index: number,
    x: number,
    y: number,
    scale: number,
    opacity: number,
    mirror?: number,
    rotate?: number
];

interface IRawAnimationSound {
    /** 音效名称 */
    name: string;
    /** 播放音量 */
    volume?: number;
    /** 播放音高 */
    pitch?: number;
}

interface IRawAnimationBitmap {
    /** 位图在纹理中的横坐标 */
    x: number;
    /** 位图在纹理中的纵坐标 */
    y: number;
    /** 位图宽度 */
    width: number;
    /** 位图高度 */
    height: number;
}

interface IRawAnimationFrame {
    /** 帧内的绘制对象，元素是定长的对象元组 */
    objects?: IRawAnimationObject[];
    /** 帧内播放的音效 */
    sound?: IRawAnimationSound[];
}

interface IRawAnimationMeta {
    /** 动画整体缩放系数 */
    ratio: number;
    /** 混合模式，0 为普通，1 为加算 */
    blend: number;
    /** 位图列表 */
    bitmaps: IRawAnimationBitmap[];
    /** 帧列表 */
    frame: IRawAnimationFrame[];
}

//#endregion

//#region 读取与校验

/**
 * 判断值是否为可读取成员的普通对象
 * @param value 待判断的值
 * @returns 是否为可读取成员的普通对象
 */
function isRecord(value: unknown): value is Record<string, unknown> {
    // 数组与 null 都不是可读取成员的普通对象
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 判断值是否为有限数字
 * @param value 待判断的值
 * @returns 是否为有限数字
 */
function isNumber(value: unknown): value is number {
    // 排除 NaN 与 Infinity，长度 / 坐标等字段必须有限
    return typeof value === 'number' && Number.isFinite(value);
}

/**
 * 判断值是否为整数
 * @param value 待判断的值
 * @returns 是否为整数
 */
function isInteger(value: unknown): value is number {
    // 位图索引必须是整数，小数索引无法定位位图
    return typeof value === 'number' && Number.isInteger(value);
}

/**
 * 读取并校验文件头部
 * @param data 动画文件字节视图
 * @returns 两段数据的字节长度，头部非法时返回 null
 */
function readHeader(data: DataView): IAnimationHeader | null {
    if (data.byteLength < ANIMATION_HEADER_SIZE) {
        logger.error(82, 'buffer-too-short');
        return null;
    }
    // 偏移 0 签名（大端）、偏移 4 版本（小端）、偏移 8 / 12 两段长度（小端）
    const signature = data.getUint32(0);
    if (signature !== ANIMATION_SIGNATURE) {
        logger.error(83);
        return null;
    }
    const version = data.getUint32(4, true);
    if (version !== ANIMATION_VERSION) {
        logger.error(84);
        return null;
    }
    const imageDataSize = data.getUint32(8, true);
    const metaDataSize = data.getUint32(12, true);
    if (
        imageDataSize < 4 ||
        metaDataSize < 1 ||
        ANIMATION_HEADER_SIZE + imageDataSize + metaDataSize !== data.byteLength
    ) {
        // 三段长度之和必须与总长度严格相等，多一字节或少一字节都视为损坏
        logger.error(82, 'length-mismatch');
        return null;
    }
    return { imageDataSize, metaDataSize };
}

/**
 * 读取并校验 sprite 尺寸表
 * @param data 动画文件字节视图
 * @param count sprite 数量
 * @returns 每个 sprite 的宽高，尺寸非法时返回 null
 */
function readSpriteDimensions(
    data: DataView,
    count: number
): ISpriteDimension[] | null {
    const dimensions: ISpriteDimension[] = [];
    // 尺寸表紧跟在 sprite 数量之后，每个 sprite 固定 8 字节（宽 + 高，小端）
    for (let i = 0; i < count; i++) {
        const offset = ANIMATION_HEADER_SIZE + 4 + i * 8;
        const width = data.getUint32(offset, true);
        const height = data.getUint32(offset + 4, true);
        if (width < 1 || height < 1) {
            // 宽高至少为 1，否则后续按位图裁剪会得到空区域
            logger.error(86, i.toString());
            return null;
        }
        dimensions.push({ width, height });
    }
    return dimensions;
}

/**
 * 读取元数据段并解析为 JSON 对象
 * @param buffer 动画文件二进制
 * @param offset 元数据段起始字节
 * @param size 元数据段字节长度
 * @returns 解析后的原始元数据，非法 JSON 或非对象时返回 null
 */
function readRawMeta(
    buffer: ArrayBuffer,
    offset: number,
    size: number
): IRawAnimationMeta | null {
    // 元数据段位于头部与图像段之后，直接按 UTF-8 解码
    const bytes = new Uint8Array(buffer, offset, size);
    const text = new TextDecoder('utf-8').decode(bytes);
    let meta: IRawAnimationMeta;
    try {
        meta = JSON.parse(text);
    } catch {
        logger.error(95, 'invalid-json');
        return null;
    }
    // JSON 允许 primitive（42 / null / false 等），必须先确认是普通对象再交给后续校验
    if (!isRecord(meta)) {
        logger.error(95, 'not-object');
        return null;
    }
    return meta;
}

/**
 * 校验元数据中的位图数量、帧结构与字段取值范围
 * @param meta 原始元数据
 * @param spriteCount sprite 数量
 * @returns 元数据是否通过全部校验
 */
function validateMeta(meta: IRawAnimationMeta, spriteCount: number): boolean {
    if (!isRecord(meta)) {
        logger.error(95, 'not-object');
        return false;
    }
    // 先校验全局字段（ratio / blend / 位图列表），再逐项校验位图与帧，保证后续索引与包围盒计算不会越界
    if (!isNumber(meta.ratio) || meta.ratio <= 0) {
        logger.error(93, 'invalid-ratio');
        return false;
    }
    // blend 目前只接受 0（普通）与 1（加算）
    if (!isNumber(meta.blend) || (meta.blend !== 0 && meta.blend !== 1)) {
        logger.error(93, 'invalid-blend');
        return false;
    }
    if (!Array.isArray(meta.bitmaps)) {
        logger.error(87, 'not-array');
        return false;
    }
    if (meta.bitmaps.length !== spriteCount) {
        logger.error(87, 'count-mismatch');
        return false;
    }
    for (let i = 0; i < meta.bitmaps.length; i++) {
        const bitmap = meta.bitmaps[i];
        if (!isRecord(bitmap)) {
            logger.error(88, i.toString(), 'not-object');
            return false;
        }
        if (!isNumber(bitmap.x) || bitmap.x < 0) {
            logger.error(88, i.toString(), 'invalid-x');
            return false;
        }
        if (!isNumber(bitmap.y) || bitmap.y < 0) {
            logger.error(88, i.toString(), 'invalid-y');
            return false;
        }
        if (!isNumber(bitmap.width) || bitmap.width < 1) {
            logger.error(88, i.toString(), 'invalid-width');
            return false;
        }
        if (!isNumber(bitmap.height) || bitmap.height < 1) {
            logger.error(88, i.toString(), 'invalid-height');
            return false;
        }
    }
    if (!Array.isArray(meta.frame)) {
        logger.error(90);
        return false;
    }
    for (let frameIndex = 0; frameIndex < meta.frame.length; frameIndex++) {
        const frame = meta.frame[frameIndex];
        if (!isRecord(frame)) {
            logger.error(91, frameIndex.toString(), 'not-object');
            return false;
        }
        const objects = frame.objects;
        if (objects !== undefined) {
            if (!Array.isArray(objects)) {
                logger.error(91, frameIndex.toString(), 'objects-not-array');
                return false;
            }
            for (
                let objectIndex = 0;
                objectIndex < objects.length;
                objectIndex++
            ) {
                const object = objects[objectIndex];
                if (!Array.isArray(object)) {
                    logger.error(
                        92,
                        frameIndex.toString(),
                        objectIndex.toString(),
                        'not-tuple'
                    );
                    return false;
                }
                if (object.length < 5 || object.length > 7) {
                    logger.error(
                        92,
                        frameIndex.toString(),
                        objectIndex.toString(),
                        'invalid-field-count'
                    );
                    return false;
                }
                const index = object[0];
                if (
                    !isInteger(index) ||
                    index < 0 ||
                    index >= meta.bitmaps.length
                ) {
                    logger.error(
                        92,
                        frameIndex.toString(),
                        objectIndex.toString(),
                        'invalid-index'
                    );
                    return false;
                }
                if (!isNumber(object[1])) {
                    logger.error(
                        92,
                        frameIndex.toString(),
                        objectIndex.toString(),
                        'invalid-x'
                    );
                    return false;
                }
                if (!isNumber(object[2])) {
                    logger.error(
                        92,
                        frameIndex.toString(),
                        objectIndex.toString(),
                        'invalid-y'
                    );
                    return false;
                }
                if (!isNumber(object[3]) || object[3] <= 0) {
                    logger.error(
                        92,
                        frameIndex.toString(),
                        objectIndex.toString(),
                        'invalid-scale'
                    );
                    return false;
                }
                if (!isNumber(object[4]) || object[4] < 0 || object[4] > 255) {
                    logger.error(
                        92,
                        frameIndex.toString(),
                        objectIndex.toString(),
                        'invalid-opacity'
                    );
                    return false;
                }
                if (object[5] !== undefined && !isNumber(object[5])) {
                    logger.error(
                        92,
                        frameIndex.toString(),
                        objectIndex.toString(),
                        'invalid-mirror'
                    );
                    return false;
                }
                if (object[6] !== undefined && !isNumber(object[6])) {
                    logger.error(
                        92,
                        frameIndex.toString(),
                        objectIndex.toString(),
                        'invalid-rotate'
                    );
                    return false;
                }
            }
        }
        const sound = frame.sound;
        if (sound !== undefined) {
            if (!Array.isArray(sound)) {
                logger.error(91, frameIndex.toString(), 'sound-not-array');
                return false;
            }
            for (let i = 0; i < sound.length; i++) {
                const item = sound[i];
                if (!isRecord(item)) {
                    logger.error(
                        94,
                        frameIndex.toString(),
                        i.toString(),
                        'not-object'
                    );
                    return false;
                }
                // 音效名称可能来自不可信文件，日志只记录其类型而不是原值
                if (typeof item.name !== 'string' || item.name.length === 0) {
                    logger.error(
                        94,
                        frameIndex.toString(),
                        i.toString(),
                        'invalid-name'
                    );
                    return false;
                }
                if (item.volume !== undefined && !isNumber(item.volume)) {
                    logger.error(
                        94,
                        frameIndex.toString(),
                        i.toString(),
                        'invalid-volume'
                    );
                    return false;
                }
                if (item.pitch !== undefined && !isNumber(item.pitch)) {
                    logger.error(
                        94,
                        frameIndex.toString(),
                        i.toString(),
                        'invalid-pitch'
                    );
                    return false;
                }
            }
        }
    }
    return true;
}

/**
 * 校验位图裁剪范围都落在解码后的纹理内
 * @param bitmaps 位图裁剪区域
 * @param image 解码后的图像
 * @returns 所有位图是否都落在图像内
 */
function validateBitmapBounds(
    bitmaps: readonly IRawAnimationBitmap[],
    image: ImageBitmap
): boolean {
    // 在 close() 之前捕获尺寸，close() 之后 ImageBitmap 的宽高不再可靠
    const imageWidth = image.width;
    const imageHeight = image.height;
    for (let i = 0; i < bitmaps.length; i++) {
        const bitmap = bitmaps[i];
        if (
            bitmap.x < 0 ||
            bitmap.y < 0 ||
            bitmap.width < 1 ||
            bitmap.height < 1 ||
            bitmap.x + bitmap.width > imageWidth ||
            bitmap.y + bitmap.height > imageHeight
        ) {
            // 先关闭位图再记录日志，确保即使日志实现抛错也不会泄漏解码资源
            image.close();
            logger.error(89, i.toString());
            return false;
        }
    }
    return true;
}

//#endregion

//#region 帧转换与帧数学

/**
 * 把 raw 对象元组转换为运行时对象，并把动画整体缩放折入缩放比例
 * @param object 原始对象元组
 * @param ratio 动画整体缩放系数
 * @returns 运行时对象
 */
function toObject(
    object: IRawAnimationObject,
    ratio: number
): IAnimationObject {
    // 整体缩放折入每个对象的缩放比例，运行时不再保留 ratio
    // 可选字段缺省为 0，与运行时对象类型保持非可选
    return {
        index: object[0],
        x: object[1],
        y: object[2],
        scale: object[3] * ratio,
        opacity: object[4],
        mirror: object[5] ?? 0,
        rotate: object[6] ?? 0
    };
}

/**
 * 把 raw 帧转换为运行时帧，并按对象包围盒计算帧尺寸与原点
 * @param frame 原始帧
 * @param bitmaps 已转换的位图列表
 * @param ratio 动画整体缩放系数
 * @returns 运行时帧
 */
function toFrame(
    frame: IRawAnimationFrame,
    bitmaps: readonly IAnimationBitmap[],
    ratio: number
): IAnimationFrame {
    const objects = (frame.objects ?? []).map(object =>
        toObject(object, ratio)
    );
    // 帧尺寸与原点由对象包围盒推导，运行时不需要再计算
    const box = computeFrameBox(objects, bitmaps);
    return {
        width: box.width,
        height: box.height,
        originX: box.originX,
        originY: box.originY,
        objects,
        sound: frame.sound
    };
}

/**
 * 计算旋转后所有对象的轴对齐包围盒，得到帧尺寸与帧原点
 * @param objects 运行时对象列表
 * @param bitmaps 位图列表
 * @returns 帧的轴对齐包围盒
 */
function computeFrameBox(
    objects: readonly IAnimationObject[],
    bitmaps: readonly IAnimationBitmap[]
): IFrameBox {
    // 空帧给 1x1，保证画布尺寸至少为 1
    if (objects.length === 0) {
        return { width: 1, height: 1, originX: 0, originY: 0 };
    }
    let minX = 0;
    let maxX = 0;
    let minY = 0;
    let maxY = 0;
    objects.forEach((object, position) => {
        const bitmap = bitmaps[object.index];
        const w = (bitmap.width * object.scale) / 100;
        const h = (bitmap.height * object.scale) / 100;
        // 旋转 θ 后轴对齐包围盒的半宽 / 半高分别为 |w/2·cosθ| + |h/2·sinθ| 与 |w/2·sinθ| + |h/2·cosθ|
        const angle = (object.rotate * Math.PI) / 180;
        const hx =
            (w / 2) * Math.abs(Math.cos(angle)) +
            (h / 2) * Math.abs(Math.sin(angle));
        const hy =
            (w / 2) * Math.abs(Math.sin(angle)) +
            (h / 2) * Math.abs(Math.cos(angle));
        const left = object.x - hx;
        const right = object.x + hx;
        const top = object.y - hy;
        const bottom = object.y + hy;
        // 以第一个对象初始化包围盒，避免使用 ±Infinity 之类的哨兵值
        if (position === 0) {
            minX = left;
            maxX = right;
            minY = top;
            maxY = bottom;
        } else {
            minX = Math.min(minX, left);
            maxX = Math.max(maxX, right);
            minY = Math.min(minY, top);
            maxY = Math.max(maxY, bottom);
        }
    });
    return {
        width: Math.max(1, Math.ceil(maxX - minX)),
        height: Math.max(1, Math.ceil(maxY - minY)),
        originX: -minX,
        originY: -minY
    };
}

/**
 * 把 raw 混合模式转换为运行时枚举
 * @param blend 原始混合模式
 * @returns 运行时混合模式枚举
 */
function toBlendMode(blend: number): AnimationBlendMode {
    // 只有 1 视为加算，其余（已在校验阶段保证为 0）为普通混合
    return blend === 1 ? AnimationBlendMode.Add : AnimationBlendMode.Normal;
}

//#endregion

/**
 * 将 v2 格式的动画二进制解析为动画数据。
 * @param buffer 动画二进制数据
 * @returns 解析后的动画数据，包含纹理、位图、帧与混合模式；任一步校验或解码失败时输出日志并返回 null
 */
export async function parseRenderAnimation(
    buffer: ArrayBuffer
): Promise<IAnimationParsedData | null> {
    const data = new DataView(buffer);
    const header = readHeader(data);
    if (!header) return null;
    const spriteCount = data.getUint32(ANIMATION_HEADER_SIZE, true);
    if (spriteCount < 1) {
        logger.error(85, 'invalid-count');
        return null;
    }
    // sprite 数量与尺寸表都位于图像段最前面，先把整段长度校验掉再读取 WebP
    if (spriteCount * 8 + 4 >= header.imageDataSize) {
        logger.error(85, 'table-overflow');
        return null;
    }
    const sprites = readSpriteDimensions(data, spriteCount);
    if (!sprites) return null;
    // webpOffset / webpSize 由图像段长度减去 sprite 数量与尺寸表得出
    const webpOffset = ANIMATION_HEADER_SIZE + 4 + sprites.length * 8;
    const webpSize = header.imageDataSize - 4 - sprites.length * 8;
    const webpBytes = new Uint8Array(buffer, webpOffset, webpSize);
    const metaOffset = ANIMATION_HEADER_SIZE + header.imageDataSize;
    const meta = readRawMeta(buffer, metaOffset, header.metaDataSize);
    if (!meta) return null;
    if (!validateMeta(meta, spriteCount)) return null;

    // new Blob 不涉及外部异常源，放在 try 之外
    const webpBlob = new Blob([webpBytes], { type: 'image/webp' });
    let image: ImageBitmap;
    try {
        image = await createImageBitmap(webpBlob);
    } catch {
        logger.error(96, 'decode-failed');
        return null;
    }
    if (!validateBitmapBounds(meta.bitmaps, image)) return null;
    let texture: Texture;
    try {
        texture = new Texture(image);
    } catch {
        // 纹理创建失败时先关闭图像再记录日志，避免解码资源泄漏
        image.close();
        logger.error(96, 'texture-failed');
        return null;
    }
    const bitmaps: IAnimationBitmap[] = meta.bitmaps.map(bitmap => ({
        x: bitmap.x,
        y: bitmap.y,
        width: bitmap.width,
        height: bitmap.height
    }));
    const frames: IAnimationFrame[] = meta.frame.map(frame =>
        toFrame(frame, bitmaps, meta.ratio)
    );
    return { texture, bitmaps, frames, blend: toBlendMode(meta.blend) };
}
