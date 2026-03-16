import { logger } from '@motajs/common';
import {
    RenderItem,
    MotaOffscreenCanvas2D,
    Transform,
    SizedCanvasImageSource
} from '@motajs/render';
import { isNil } from 'lodash-es';
import { RenderableData, AutotileRenderable, texture } from './cache';
import { IExcitable } from '@motajs/animate';
import { IMotaIcon, IMotaWinskin } from './types';

export class Icon extends RenderItem implements IMotaIcon, IExcitable<number> {
    /** 图标id */
    icon: AllNumbers = 0;
    /** 渲染动画的第几帧 */
    frame: number = 0;
    /** 是否启用动画 */
    animate: boolean = false;
    /** 当前动画速度 */
    frameSpeed: number = 300;
    /** 当前帧率 */
    nowFrame: number = 0;

    /** 图标的渲染信息 */
    private renderable?: RenderableData | AutotileRenderable;

    private pendingIcon?: AllNumbers;

    /** 委托激励对象 id，用于图标的动画展示 */
    private delegation: number = -1;

    constructor(cache: boolean = false) {
        super(cache);
        this.setAntiAliasing(false);
        this.setHD(false);
    }

    excited(payload: number): void {
        if (!this.renderable) return;
        const frame = Math.floor(payload / 300);
        if (frame === this.nowFrame) return;
        this.nowFrame = frame;
        this.update();
    }

    protected render(
        canvas: MotaOffscreenCanvas2D,
        _transform: Transform
    ): void {
        const ctx = canvas.ctx;
        const renderable = this.renderable;
        if (!renderable) return;
        const [x, y, w, h] = renderable.render[0];
        const cw = this.width;
        const ch = this.height;
        const frame = this.animate
            ? this.nowFrame % renderable.frame
            : this.frame;

        if (!this.animate) {
            if (renderable.autotile) {
                ctx.drawImage(renderable.image[0], x, y, w, h, 0, 0, cw, ch);
            } else {
                ctx.drawImage(renderable.image, x, y, w, h, 0, 0, cw, ch);
            }
        } else {
            const [x1, y1, w1, h1] = renderable.render[frame];
            if (renderable.autotile) {
                const img = renderable.image[0];
                ctx.drawImage(img, x1, y1, w1, h1, 0, 0, cw, ch);
            } else {
                ctx.drawImage(renderable.image, x1, y1, w1, h1, 0, 0, cw, ch);
            }
        }
    }

    /**
     * 设置图标
     * @param id 图标id
     */
    setIcon(id: AllIdsWithNone | AllNumbers) {
        if (id === 0 || id === 'none') {
            this.renderable = void 0;
            return;
        }
        const num = typeof id === 'number' ? id : texture.idNumberMap[id];

        const { loading } = Mota.require('@user/data-base');
        if (loading.loaded) {
            this.setIconRenderable(num);
        } else {
            if (isNil(this.pendingIcon)) {
                loading.once('loaded', () => {
                    this.setIconRenderable(this.pendingIcon ?? 0);
                    delete this.pendingIcon;
                });
            }
            this.pendingIcon = num;
        }
    }

    setFrameSpeed(speed: number): void {
        this.frameSpeed = speed;
        this.update();
    }

    setFrame(frame: number): void {
        if (frame < 0) {
            this.setAnimateStatus(true);
            return;
        }
        this.frame = frame;
        this.update();
    }

    setAnimateStatus(animate: boolean): void {
        this.animate = animate;
        if (!animate) this.removeExcitable(this.delegation);
        else this.delegation = this.delegateExcitable(this);
        this.update();
    }

    private setIconRenderable(num: AllNumbers) {
        const renderable = texture.getRenderable(num);

        if (!renderable) {
            logger.warn(43, num.toString());
            return;
        } else {
            this.icon = num;
            this.renderable = renderable;
            this.frame = renderable.frame;
        }
        this.update();
    }

    destroy(): void {
        super.destroy();
    }

    protected handleProps(
        key: string,
        _prevValue: any,
        nextValue: any
    ): boolean {
        switch (key) {
            case 'icon':
                this.setIcon(nextValue);
                return true;
            case 'animate':
                if (!this.assertType(nextValue, 'boolean', key)) return false;
                this.setAnimateStatus(nextValue);
                return true;
            case 'frame':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setFrame(nextValue);
                return true;
            case 'speed':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setFrameSpeed(nextValue);
                return true;
        }
        return false;
    }
}

export class Winskin extends RenderItem implements IMotaWinskin {
    image: SizedCanvasImageSource | null = null;
    /** 边框宽度，32表示原始宽度 */
    borderSize: number = 32;
    /** 图片名称 */
    imageName: string = '';

    private pendingImage?: ImageIds;

    constructor(enableCache: boolean = false) {
        super(enableCache);
        this.setAntiAliasing(false);
    }

    protected render(canvas: MotaOffscreenCanvas2D): void {
        const img = this.image;
        if (!img) return;
        const ctx = canvas.ctx;
        const w = this.width;
        const h = this.height;
        const pad = this.borderSize / 2;
        // 背景
        ctx.drawImage(img, 0, 0, 128, 128, 2, 2, w - 4, h - 4);
        // 上下左右边框
        ctx.save();
        ctx.drawImage(img, 144, 0, 32, 16, pad, 0, w - pad * 2, pad);
        ctx.drawImage(img, 144, 48, 32, 16, pad, h - pad, w - pad * 2, pad);
        ctx.drawImage(img, 128, 16, 16, 32, 0, pad, pad, h - pad * 2);
        ctx.drawImage(img, 176, 16, 16, 32, w - pad, pad, pad, h - pad * 2);
        // 四个角的边框
        ctx.drawImage(img, 128, 0, 16, 16, 0, 0, pad, pad);
        ctx.drawImage(img, 176, 0, 16, 16, w - pad, 0, pad, pad);
        ctx.drawImage(img, 128, 48, 16, 16, 0, h - pad, pad, pad);
        ctx.drawImage(img, 176, 48, 16, 16, w - pad, h - pad, pad, pad);
    }

    /**
     * 设置winskin图片
     * @param image winskin图片
     */
    setImage(image: SizedCanvasImageSource) {
        this.image = image;
        this.imageName = '';
        this.update();
    }

    /**
     * 通过图片名称设置winskin
     * @param name 图片名称
     */
    setImageByName(name: ImageIds) {
        const { loading } = Mota.require('@user/data-base');
        if (loading.loaded) {
            const image = core.material.images.images[name];
            this.setImage(image);
        } else {
            if (isNil(this.pendingImage)) {
                loading.once('loaded', () => {
                    const id = this.pendingImage;
                    if (!id) return;
                    const image = core.material.images.images[id];
                    this.setImage(image);
                    delete this.pendingImage;
                });
            }
            this.pendingImage = name;
        }
        this.imageName = name;
    }

    /**
     * 设置边框大小
     * @param size 边框大小
     */
    setBorderSize(size: number) {
        this.borderSize = size;
        this.update();
    }

    protected handleProps(
        key: string,
        _prevValue: any,
        nextValue: any
    ): boolean {
        switch (key) {
            case 'image':
                this.setImage(nextValue);
                return true;
            case 'imageName':
                if (!this.assertType(nextValue, 'string', key)) return false;
                this.setImageByName(nextValue);
                return true;
            case 'borderSize':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setBorderSize(nextValue);
                return true;
        }
        return false;
    }
}
