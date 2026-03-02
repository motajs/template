import { logger } from '@motajs/common';
import {
    IBlockData,
    IBlockSplitter,
    IMapRenderer,
    IMapRenderResult,
    IMapVertexBlock
} from '../types';
import { IMapTextArea, IMapTextRenderable, IOnMapTextRenderer } from './types';
import { ITransformUpdatable, Transform } from '@motajs/render-core';

export class OnMapTextRenderer
    implements IOnMapTextRenderer, ITransformUpdatable<Transform>
{
    /** 画布元素 */
    readonly canvas: HTMLCanvasElement;
    /** 画布 Canvas2D 上下文 */
    readonly ctx: CanvasRenderingContext2D;

    needResize: boolean = true;

    /** 分块上附着文本区域的标识符 */
    private readonly attachSymbol: symbol = Symbol('onMapTextAreas');

    /** 是否有内容发生变化，需要更新 */
    private dirty: boolean = false;

    /** 分块对象 */
    private readonly block: IBlockSplitter<IMapVertexBlock>;
    /** 变换矩阵 */
    private readonly transform: Transform;

    constructor(readonly renderer: IMapRenderer) {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d')!;
        this.block = renderer.vertex.block;
        this.transform = renderer.transform;
        this.ctx.lineWidth = 2;
        this.transform.bind(this);
    }

    updateTransform() {
        this.dirty = true;
    }

    /**
     * 标记为需要更新
     */
    markDirty(): void {
        this.dirty = true;
    }

    resize(
        width: number,
        height: number,
        scaleX: number,
        scaleY: number
    ): void {
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.translate(width / 2, height / 2);
        this.ctx.scale(1, -1);
        this.ctx.scale(scaleX, scaleY);
        this.dirty = true;
        this.needResize = false;
    }

    getBlockByLoc(x: number, y: number): Readonly<IMapTextArea> | null {
        const index = y * this.renderer.mapWidth + x;
        // 首先尝试使用分块系统获取对应分块并从分块附着数据读取
        const blockData = this.block.getBlockByDataIndex(index);
        if (blockData) {
            const map = blockData.data.getAttachedData<
                Map<number, MapTextArea>
            >(this.attachSymbol);
            if (map) return map.get(index) ?? null;
        }
        return null;
    }

    getBlockByIndex(index: number): Readonly<IMapTextArea> | null {
        const blockData = this.block.getBlockByDataIndex(index);
        if (blockData) {
            const map = blockData.data.getAttachedData<
                Map<number, MapTextArea>
            >(this.attachSymbol);
            if (map) return map.get(index) || null;
        }
        return null;
    }

    render(data: IMapRenderResult): HTMLCanvasElement {
        if (!this.dirty) return this.canvas;

        const ctx = this.ctx;
        const { renderWidth, renderHeight } = this.renderer;

        // clear
        ctx.clearRect(
            -renderWidth / 2,
            -renderHeight / 2,
            renderWidth,
            renderHeight
        );
        ctx.save();

        // apply transform matrix
        const [a, b, , c, d, , e, f] = this.transform.mat;

        ctx.transform(
            a,
            b,
            c,
            d,
            (e * renderWidth) / 2,
            (f * renderHeight) / 2
        );
        ctx.scale(1, -1);

        // draw text in each block
        for (const blk of data.area.blockList) {
            const map = blk.data.getAttachedData<Map<number, MapTextArea>>(
                this.attachSymbol
            );
            if (!map) continue;
            for (const area of map.values()) {
                const baseX = area.mapX * this.renderer.cellWidth;
                const baseY = area.mapY * this.renderer.cellHeight;
                for (const renderable of area.getRenderables()) {
                    const x = baseX + (renderable.px ?? 0) - renderWidth / 2;
                    const y = renderHeight / 2 - (baseY + (renderable.py ?? 0));
                    ctx.font = renderable.font.string();
                    ctx.textAlign = renderable.textAlign ?? 'left';
                    ctx.textBaseline = renderable.textBaseline ?? 'top';
                    if (renderable.stroke) {
                        ctx.strokeStyle = renderable.strokeStyle ?? 'black';
                        ctx.strokeText(renderable.text, x, -y);
                    }
                    if (renderable.fill) {
                        ctx.fillStyle = renderable.fillStyle ?? 'white';
                        ctx.fillText(renderable.text, x, -y);
                    }
                }
            }
        }

        this.dirty = false;
        ctx.restore();

        return this.canvas;
    }

    /**
     * 获取分块所附着的文字数据
     * @param blockData 分块数据
     */
    private getAttachedMap(
        blockData: IBlockData<IMapVertexBlock>
    ): Map<number, MapTextArea> {
        const map = blockData.data.getAttachedData<Map<number, MapTextArea>>(
            this.attachSymbol
        );
        if (map) return map;
        else {
            const map = new Map();
            blockData.data.attach(this.attachSymbol, map);
            return map;
        }
    }

    requireBlockArea(x: number, y: number): Readonly<IMapTextArea> | null {
        const index = y * this.renderer.mapWidth + x;
        // try to find corresponding block by data index
        const blockData = this.block.getBlockByDataIndex(index);
        if (blockData) {
            const map = this.getAttachedMap(blockData);
            const exist = map.get(index);
            if (exist) return exist;
            const area = new MapTextArea(this, x, y);
            map.set(index, area);
            this.markDirty();
            return area;
        } else {
            logger.error(47);
            return null;
        }
    }

    needUpdate(): boolean {
        return this.dirty;
    }

    clear(): void {
        // 清理所有附着在分块上的文本区域
        for (const b of this.block.iterateBlocks()) {
            const blk = b.data;
            const map = blk.getAttachedData<Map<number, MapTextArea>>(
                this.attachSymbol
            );
            if (map) {
                for (const area of map.values()) area.clear();
                blk.deleteAttachedData(this.attachSymbol);
            }
        }

        this.dirty = true;
    }

    destroy(): void {
        this.transform.unbind(this);
        this.clear();
        // the canvas and context references are left intact; consumers may
        // discard the renderer instance to allow GC.  We don't detach the
        // canvas from any DOM since ownership is external.
    }
}

class MapTextArea implements IMapTextArea {
    readonly index: number;
    // maintain both a set for quick membership checks and a map for index lookup
    private renderableSet: Set<IMapTextRenderable> = new Set();
    private renderableMap: Map<number, IMapTextRenderable> = new Map();
    private reverseMap: Map<IMapTextRenderable, number> = new Map();
    private nextRenderableIndex: number = 1;

    /**
     * 获取本区域的所有可渲染对象，用于绘制阶段
     */
    getRenderables(): Iterable<IMapTextRenderable> {
        return this.renderableSet;
    }

    constructor(
        readonly renderer: OnMapTextRenderer,
        public readonly mapX: number,
        public readonly mapY: number
    ) {
        this.index = mapY * renderer.renderer.mapWidth + mapX;
    }

    addTextRenderable(renderable: IMapTextRenderable): number {
        const idx = this.nextRenderableIndex++;
        this.renderableSet.add(renderable);
        this.renderableMap.set(idx, renderable);
        this.reverseMap.set(renderable, idx);
        this.renderer.markDirty();
        return idx;
    }

    removeTextRenderable(renderable: IMapTextRenderable): void {
        const idx = this.reverseMap.get(renderable);
        if (idx !== void 0) {
            this.renderableSet.delete(renderable);
            this.renderableMap.delete(idx);
            this.reverseMap.delete(renderable);
            this.renderer.markDirty();
        }
    }

    removeTextRenderableByIndex(index: number): void {
        const obj = this.renderableMap.get(index);
        if (obj !== void 0) {
            this.renderableMap.delete(index);
            this.renderableSet.delete(obj);
            this.reverseMap.delete(obj);
            this.renderer.markDirty();
        }
    }

    clear(): void {
        if (this.renderableSet.size > 0) {
            this.renderableSet.clear();
            this.renderableMap.clear();
            this.reverseMap.clear();
            this.renderer.markDirty();
        }
    }
}
