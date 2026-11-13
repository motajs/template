import { RenderItem } from './item';
import { MotaOffscreenCanvas2D } from './canvas2d';
import { CustomRenderFunction } from './types';

const EMPTY = () => {};

export class CustomRenderItem extends RenderItem {
    renderFn: CustomRenderFunction = EMPTY;

    protected getDefaultCache(): boolean {
        return true;
    }

    protected render(canvas: MotaOffscreenCanvas2D): void {
        canvas.ctx.save();
        this.renderFn(canvas);
        canvas.ctx.restore();
    }

    setRenderFn(fn: CustomRenderFunction) {
        this.renderFn = fn;
        this.update(this);
    }

    protected handleProps(
        key: string,
        _prevValue: any,
        nextValue: any
    ): boolean {
        switch (key) {
            case 'render': {
                if (!this.assertType(nextValue, 'function', key)) return false;
                this.setRenderFn(nextValue);
                return true;
            }
            case 'bindings': {
                if (!this.assertType(nextValue, Array, key)) return false;
                this.update();
                return true;
            }
        }
        return false;
    }
}
