import { MotaOffscreenCanvas2D } from './canvas2d';
import { ActionType, EventProgress, ActionEventMap } from './event';
import { RenderItem } from './item';
import { Transform } from './transform';
import { CustomContainerPropagateFn, CustomContainerRenderFn } from './types';

export class Container extends RenderItem {
    protected getDefaultCache(): boolean {
        return true;
    }

    protected render(
        canvas: MotaOffscreenCanvas2D,
        _transform: Transform
    ): void {
        const sorted = this.getSortedChildren() as RenderItem[];
        sorted.forEach(v => {
            if (v.hidden) return;
            v.renderContent(canvas);
        });
    }

    appendTo(parent: RenderItem): void {
        super.appendTo(parent);
        if (this.root) {
            const root = this.root;
            this.forEachChild(ele => {
                ele.setRoot(root);
            });
        }
    }

    protected propagateEvent<T extends ActionType>(
        type: T,
        progress: EventProgress,
        event: ActionEventMap[T]
    ): void {
        const sorted = this.getSortedChildren() as RenderItem[];
        const len = sorted.length;
        if (progress === EventProgress.Capture) {
            let success = false;
            for (let i = len - 1; i >= 0; i--) {
                const child = sorted[i];
                if (child.hidden) continue;
                if (child.captureEvent(type, event)) {
                    success = true;
                    break;
                }
            }
            // 如果没有子元素能够触发，那么自身触发冒泡
            if (!success) {
                this.bubbleEvent(type, event);
            }
        } else {
            this.parent?.bubbleEvent(type, event);
        }
    }

    destroy(): void {
        super.destroy();
        this.children.forEach(v => {
            v.destroy();
        });
    }
}

export class CustomContainer extends Container {
    private renderFn?: CustomContainerRenderFn;
    private propagateFn?: CustomContainerPropagateFn;

    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {
        if (!this.renderFn) {
            super.render(canvas, transform);
        } else {
            const sorted = this.getSortedChildren() as RenderItem[];
            this.renderFn(canvas, sorted, transform);
        }
    }

    protected propagateEvent<T extends ActionType>(
        type: T,
        progress: EventProgress,
        event: ActionEventMap[T]
    ): void {
        if (this.propagateFn) {
            this.propagateFn(type, progress, event, this, () => {
                super.propagateEvent(type, progress, event);
            });
        } else {
            super.propagateEvent(type, progress, event);
        }
    }

    /**
     * 设置这个自定义容器的渲染函数
     * @param render 渲染函数
     */
    setRenderFn(render?: CustomContainerRenderFn) {
        this.renderFn = render;
    }

    /**
     * 设置这个自定义容器的事件传递函数
     * @param propagate 事件传递函数
     */
    setPropagateFn(propagate: CustomContainerPropagateFn) {
        this.propagateFn = propagate;
    }

    protected handleProps(
        key: string,
        prevValue: any,
        nextValue: any
    ): boolean {
        switch (key) {
            case 'render': {
                if (!this.assertType(nextValue, 'function', key)) return false;
                this.setRenderFn(nextValue);
                return true;
            }
            case 'propagate': {
                if (!this.assertType(nextValue, 'function', key)) return false;
                this.setPropagateFn(nextValue);
                return true;
            }
            case 'bindings': {
                if (!this.assertType(nextValue, Array, key)) return false;
                this.update();
                return true;
            }
        }
        return super.handleProps(key, prevValue, nextValue);
    }
}
