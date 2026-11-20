import { ITexture } from '../assets';
import { MotaOffscreenCanvas2D } from './canvas2d';
import { RenderItem, RenderItemDefaultHooks } from './item';
import { IRenderImage, IRenderImageHooks } from './types';

export class RenderImage
    extends RenderItem<IRenderImageHooks>
    implements IRenderImage
{
    image: ITexture | null = null;

    constructor() {
        super();
        this.eventNames.add('onSetImage');
    }

    protected getDefaultCache(): boolean {
        return false;
    }

    protected getDefaultHook(): IRenderImageHooks {
        return new RenderImageDefaultHooks(this.events);
    }

    protected render(canvas: MotaOffscreenCanvas2D): void {
        if (!this.image) return;
        const ctx = canvas.ctx;
        const {
            source,
            rect: { x, y, w, h }
        } = this.image.render();
        ctx.drawImage(source, x, y, w, h, 0, 0, this.width, this.height);
    }

    /**
     * 设置图片资源
     * @param image 图片资源
     */
    setImage(image: ITexture | null) {
        this.image = image;
        this.forEachHook(hook => hook.onSetImage?.(image));
        this.update();
    }

    protected handleProps(
        key: string,
        _prevValue: any,
        nextValue: any
    ): boolean {
        switch (key) {
            case 'image':
                if (!nextValue) this.setImage(null);
                else this.setImage(nextValue);
                return true;
        }
        return false;
    }
}

export class RenderImageDefaultHooks
    extends RenderItemDefaultHooks
    implements IRenderImageHooks
{
    onSetImage(image: ITexture | null): void {
        this.list.get('onSetImage')?.(image);
    }
}
