import { RenderItem, RenderItemDefaultHooks } from './item';
import { MotaOffscreenCanvas2D } from './canvas2d';
import { CustomRenderFunction, IRenderItemBaseHooks } from './types';

const EMPTY = () => {};

export class CustomRenderItem extends RenderItem {
    renderFn: CustomRenderFunction = EMPTY;

    protected getDefaultHook(): IRenderItemBaseHooks {
        return new RenderItemDefaultHooks(this.events);
    }

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
