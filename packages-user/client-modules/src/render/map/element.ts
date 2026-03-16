import { MotaOffscreenCanvas2D, RenderItem } from '@motajs/render';
import { ILayerState } from '@user/data-state';
import { IMapRenderer } from './types';
import { ElementNamespace, ComponentInternalInstance } from 'vue';
import { CELL_HEIGHT, CELL_WIDTH, MAP_HEIGHT, MAP_WIDTH } from '../shared';
import { IMapExtensionManager } from './extension';

export class MapRenderItem extends RenderItem {
    /**
     * @param layerState 地图状态对象
     * @param renderer 地图渲染器对象
     */
    constructor(
        readonly layerState: ILayerState,
        readonly renderer: IMapRenderer,
        readonly exManager: IMapExtensionManager
    ) {
        super(false);

        renderer.setLayerState(layerState);
        renderer.setCellSize(CELL_WIDTH, CELL_HEIGHT);
        renderer.setRenderSize(MAP_WIDTH, MAP_HEIGHT);

        // 元素被销毁时会自动删除所有的激励对象，所以不需要担心会内存泄漏
        this.delegateExcitable(time => {
            this.renderer.tick(time);
            if (this.renderer.needUpdate()) {
                this.update();
            }
            const text = exManager.textRenderer;
            if (text) {
                if (text.needResize) {
                    this.resizeTextRenderer(this.width, this.height);
                }
                if (text.needUpdate()) {
                    this.update();
                }
            }
        });
    }

    private resizeTextRenderer(width: number, height: number) {
        const ex = this.exManager.textRenderer;
        if (!ex) return;
        const ratio = this.highResolution ? devicePixelRatio : 1;
        const scale = ratio * this.scale;
        const w = width * scale;
        const h = height * scale;
        ex.resize(
            w,
            h,
            w / this.renderer.renderWidth,
            h / this.renderer.renderHeight
        );
    }

    private sizeGL(width: number, height: number) {
        const ratio = this.highResolution ? devicePixelRatio : 1;
        const scale = ratio * this.scale;
        const w = width * scale;
        const h = height * scale;
        this.renderer.setCanvasSize(w, h);
        this.renderer.setViewport(0, 0, w, h);
        if (this.exManager.textRenderer) {
            this.exManager.textRenderer.resize(
                w,
                h,
                w / this.renderer.renderWidth,
                h / this.renderer.renderHeight
            );
        }
    }

    onResize(scale: number): void {
        super.onResize(scale);
        this.sizeGL(this.width, this.height);
    }

    size(width: number, height: number): void {
        super.size(width, height);
        this.sizeGL(width, height);
    }

    protected render(canvas: MotaOffscreenCanvas2D): void {
        this.renderer.clear(true, true);
        const map = this.renderer.render();
        canvas.ctx.drawImage(map.canvas, 0, 0, canvas.width, canvas.height);
        if (this.exManager.textRenderer) {
            const text = this.exManager.textRenderer.render(map);
            canvas.ctx.drawImage(text, 0, 0, canvas.width, canvas.height);
        }
    }

    patchProp(
        key: string,
        prevValue: any,
        nextValue: any,
        namespace?: ElementNamespace,
        parentComponent?: ComponentInternalInstance | null
    ): void {
        switch (key) {
            case 'layerState': {
                this.renderer.setLayerState(nextValue);
                break;
            }
        }
        super.patchProp(key, prevValue, nextValue, namespace, parentComponent);
    }
}
