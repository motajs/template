import {
    RenderItem,
    MotaOffscreenCanvas2D,
    SizedCanvasImageSource
} from '@motajs/render';
import { isNil } from 'lodash-es';
import { IMotaWinskin } from './types';

export class Winskin extends RenderItem implements IMotaWinskin {
    image: SizedCanvasImageSource | null = null;
    /** 边框宽度，32表示原始宽度 */
    borderSize: number = 32;
    /** 图片名称 */
    imageName: string = '';

    private pendingImage?: ImageIds;

    constructor() {
        super();
        this.setAntiAliasing(false);
    }

    protected getDefaultCache(): boolean {
        return true;
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
