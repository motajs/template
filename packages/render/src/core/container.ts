import { MotaOffscreenCanvas2D } from './canvas2d';
import { ActionType, EventProgress, ActionEventMap } from './event';
import { RenderItem } from './item';
import { Transform } from './transform';
import {
    CustomContainerPropagateFn,
    CustomContainerRenderFn,
    IRenderItem
} from './types';

export class Container extends RenderItem {
    sortedChildren: RenderItem[] = [];

    private needSort: boolean = false;

    protected render(
        canvas: MotaOffscreenCanvas2D,
        _transform: Transform
    ): void {
        if (this.needSort) {
            this.sortChildren();
            this.needSort = false;
        }
        this.sortedChildren.forEach(v => {
            if (v.hidden) return;
            v.renderContent(canvas);
        });
    }

    onResize(scale: number): void {
        this.children.forEach(v => v.onResize(scale));
        super.onResize(scale);
    }

    requestSort() {
        this.needSort = true;
    }

    /**
     * 添加子元素到这个容器上，然后在下一个tick执行更新
     * @param children 要添加的子元素
     */
    appendChild(...children: IRenderItem[]) {
        children.forEach(v => {
            v.appendTo(this);
        });
        this.requestSort();
        this.update();
    }

    removeChild(...child: IRenderItem[]): void {
        let changed = false;
        child.forEach(v => {
            if (v.parent !== this) return;
            const success = v.remove();
            if (success) {
                changed = true;
            }
        });
        if (changed) this.requestSort();
        this.update();
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

    /**
     * 遍历这个元素中的每个子元素，并执行传入的函数
     * @param fn 对每个元素执行的函数
     */
    protected forEachChild(fn: (ele: RenderItem) => void) {
        const stack: RenderItem[] = [this];
        while (stack.length > 0) {
            const ele = stack.pop()!;
            stack.push(...ele.children);
            fn(ele);
        }
    }

    private sortChildren() {
        this.sortedChildren = [...this.children]
            .filter(v => !v.isComment)
            .sort((a, b) => a.zIndex - b.zIndex);
    }

    protected propagateEvent<T extends ActionType>(
        type: T,
        progress: EventProgress,
        event: ActionEventMap[T]
    ): void {
        const len = this.sortedChildren.length;
        if (progress === EventProgress.Capture) {
            let success = false;
            for (let i = len - 1; i >= 0; i--) {
                const child = this.sortedChildren[i];
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
            this.renderFn(canvas, this.sortedChildren, transform);
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
        }
        return super.handleProps(key, prevValue, nextValue);
    }
}
