import {
    ActionEventMap,
    ActionType,
    EventProgress,
    IRenderItemBaseHooks,
    IRenderTreeRoot,
    MotaOffscreenCanvas2D,
    RenderItem,
    RenderItemDefaultHooks,
    Transform
} from '@motajs/render';
import { mat3 } from 'gl-matrix';
import { IMapRenderer, IMapRenderItem } from './types';
import { MapRenderer } from './renderer';

export class MapRenderItem extends RenderItem implements IMapRenderItem {
    /** 当前的委托 id */
    private delegation: number = -1;

    /** 当前使用的地图渲染器 */
    renderer: IMapRenderer | null = null;

    protected onConnected(root: IRenderTreeRoot): void {
        this.delegation = root.delegateExcitable(time => {
            if (!this.renderer) return;
            if (this.renderer.needUpdate()) {
                this.update();
            }
            this.renderer.excited(time);
        });
    }

    protected onDisconnected(prevRoot: IRenderTreeRoot): void {
        prevRoot.removeExcitable(this.delegation);
    }

    protected getDefaultCache(): boolean {
        return true;
    }

    protected getDefaultHook(): IRenderItemBaseHooks {
        return new RenderItemDefaultHooks(this.events);
    }

    /**
     * 重设 WebGL2 画布的宽高
     * @param width 宽度
     * @param height 高度
     */
    private sizeGL(width: number, height: number) {
        if (!this.renderer) return;
        const ratio = this.highResolution ? devicePixelRatio : 1;
        const scale = ratio * this.scale;
        const w = width * scale;
        const h = height * scale;
        this.renderer.setCanvasSize(w, h);
        this.renderer.setViewport(0, 0, w, h);
    }

    onResize(scale: number): void {
        super.onResize(scale);
        this.sizeGL(this.width, this.height);
    }

    size(width: number, height: number): void {
        super.size(width, height);
        this.sizeGL(width, height);
    }

    protected propagateEvent<T extends ActionType>(
        type: T,
        progress: EventProgress,
        event: ActionEventMap[T]
    ): void {
        //
        if (progress === EventProgress.Capture) {
            this.bubbleEvent(type, event);
        } else {
            this.parent?.bubbleEvent(type, event);
        }
    }

    protected render(canvas: MotaOffscreenCanvas2D): void {
        if (!this.renderer) return;
        this.renderer.clear(true, true);
        const map = this.renderer.render();
        canvas.ctx.drawImage(map.canvas, 0, 0, canvas.width, canvas.height);

        // 在外部计算好要乘的视角变换矩阵
        const { renderWidth, renderHeight } = this.renderer;
        const [a, b, , c, d, , e, f] = this.renderer.transform.mat;
        const ee = (e * renderWidth) / 2;
        const ff = (f * renderHeight) / 2;
        const mat = mat3.fromValues(a, b, 0, c, d, 0, ee, ff, 1);
        mat3.mul(mat, mat, mat3.fromValues(1, 0, 0, 0, -1, 0, 0, 0, 1));
        const vTransform = new Transform();
        vTransform.setTransform(mat[0], mat[1], mat[3], mat[4], mat[6], mat[7]);

        const sorted = this.getSortedChildren() as RenderItem[];
        sorted.forEach(item => {
            if (item.hidden) return;
            // sortedChildren 内部存储 RenderItem，transform 可写，倒序相乘后直接写入，渲染完毕后回退，外部无感
            // 元素本身可以通过调整自己的 `selfTransform` 来调整渲染模式
            // TODO: 可能需要调整设计以避免使用 as RenderItem 这种 Hack 设计
            const before = item.transform;
            const targetTransform = item.transform.multiply(vTransform);
            item.transform = targetTransform;
            item.renderContent(canvas);
            item.transform = before;
        });
    }

    setRenderer(renderer: IMapRenderer | null): void {
        this.renderer = renderer;
        this.update();
    }

    handleProps(key: string, prevValue: any, nextValue: any): boolean {
        if (super.handleProps(key, prevValue, nextValue)) return true;
        switch (key) {
            case 'renderer': {
                if (!nextValue) {
                    this.setRenderer(null);
                    return true;
                }
                if (!this.assertType(nextValue, MapRenderer, key)) return false;
                this.setRenderer(nextValue);
                return true;
            }
        }
        return false;
    }
}
