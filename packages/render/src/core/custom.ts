import { RenderItem } from './item';
import { MotaOffscreenCanvas2D } from './canvas2d';
import { CustomRenderFunction } from './types';
import { Ref } from 'vue';

export class CustomRenderItem extends RenderItem {
    renderFn: CustomRenderFunction;

    /**
     * 创建一个精灵，可以自由在上面渲染内容
     * @param type 渲染模式，absolute表示绝对位置，不会跟随自身的Transform改变
     * @param cache 是否启用缓存机制
     */
    constructor(cache: boolean = true) {
        super(cache);
        this.renderFn = () => {};
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
        prevValue: any,
        nextValue: any
    ): boolean {
        switch (key) {
            case 'render':
                if (!this.assertType(nextValue, 'function', key)) return false;
                this.setRenderFn(nextValue);
                return true;
            case 'bindings':
                if (!this.assertType(nextValue, Array, key)) return false;
                if (nextValue !== prevValue) {
                    this.update();
                } else if (nextValue.length !== prevValue.length) {
                    this.update();
                } else {
                    const arr: Ref<any>[] = nextValue as Ref<any>[];
                    const prev: Ref<any>[] = prevValue as Ref<any>[];
                    for (let i = 0; i < nextValue.length; i++) {
                        if (arr[i].value !== prev[i].value) {
                            this.update();
                            break;
                        }
                    }
                }
                return true;
        }
        return false;
    }
}
