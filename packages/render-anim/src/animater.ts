import {
    ITexture,
    ITextureAnimater,
    ITextureRenderable,
    MotaOffscreenCanvas2D
} from '@motajs/render';
import { IAnimationFrame, IAnimationParsedData } from './types';

/**
 * 动画合成器，将解析后的动画逐帧合成为离屏画布。
 * 每次 `.next()` 恢复后会释放上一帧，正常播放完毕时释放最后一帧；
 * 提前 `.return()` 会跳过正常结束路径，最后一帧交给垃圾回收。
 */
export class RenderAnimater implements ITextureAnimater<IAnimationParsedData> {
    /**
     * 把当前帧的全部对象按顺序绘制到给定画布上
     * @param canvas 复用的离屏画布
     * @param texture 动画纹理
     * @param data 解析后的动画数据
     * @param frame 当前帧
     */
    private composeFrame(
        canvas: MotaOffscreenCanvas2D,
        texture: ITexture,
        data: IAnimationParsedData,
        frame: IAnimationFrame
    ): void {
        // 复用同一块画布，逐帧重设尺寸会重置变换矩阵并清空上一帧内容
        canvas.size(frame.width, frame.height);
        const ctx = canvas.ctx;
        frame.objects.forEach(object => {
            const bitmap = data.bitmaps[object.index];
            const realWidth = (bitmap.width * object.scale) / 100;
            const realHeight = (bitmap.height * object.scale) / 100;
            ctx.save();
            // 先平移到帧原点，再镜像、旋转，最后按不透明度与目标矩形绘制
            ctx.translate(frame.originX + object.x, frame.originY + object.y);
            if (object.mirror) {
                ctx.scale(-1, 1);
            }
            if (object.rotate) {
                const angle = (-object.rotate * Math.PI) / 180;
                ctx.rotate(angle);
            }
            ctx.globalAlpha = object.opacity / 255;
            ctx.drawImage(
                texture.source,
                bitmap.x,
                bitmap.y,
                bitmap.width,
                bitmap.height,
                -realWidth / 2,
                -realHeight / 2,
                realWidth,
                realHeight
            );
            ctx.restore();
        });
    }

    /**
     * 依次产出帧图像
     * @param texture 动画纹理
     * @param data 解析后的动画数据
     * @param cycled 是否循环播放
     * @returns 逐帧产出可渲染对象的生成器
     */
    private *sequence(
        texture: ITexture,
        data: IAnimationParsedData,
        cycled: boolean
    ): Generator<ITextureRenderable, void> {
        const frames = data.frames;
        if (frames.length === 0) return;
        // 每个序列只创建一块画布，像素素材关闭高清与抗锯齿以避免逐帧缩放模糊
        const canvas = new MotaOffscreenCanvas2D();
        canvas.setHD(false);
        canvas.setAntiAliasing(false);
        let index = 0;
        while (true) {
            const frame = frames[index];
            this.composeFrame(canvas, texture, data, frame);
            yield {
                source: canvas.canvas,
                rect: { x: 0, y: 0, w: frame.width, h: frame.height }
            };
            if (!cycled && index === frames.length - 1) {
                break;
            }
            index = (index + 1) % frames.length;
        }
        // 正常播放结束时清空并归零尺寸；提前 return 时不额外兜底，最后一帧随同一块画布交给垃圾回收
        canvas.clear();
        canvas.canvas.width = 0;
        canvas.canvas.height = 0;
    }

    *once(
        texture: ITexture,
        data: IAnimationParsedData
    ): Generator<ITextureRenderable, void> {
        yield* this.sequence(texture, data, false);
    }

    *cycled(
        texture: ITexture,
        data: IAnimationParsedData
    ): Generator<ITextureRenderable, void> {
        yield* this.sequence(texture, data, true);
    }
}
