import {
    Hookable,
    HookController,
    IHookController,
    logger
} from '@motajs/common';
import { MotaOffscreenCanvas2D } from '@motajs/render';
import { DefaultProps } from '@motajs/render-vue';
import { defineComponent, onMounted, ref, watch } from 'vue';
import { SetupComponentOptions } from '@motajs/system';
import { isNil } from 'lodash-es';
import {
    IBlockSplitter,
    IChunkData,
    IMapRenderer,
    IMapTextArea,
    IMapTextManager,
    IMapTextManagerHooks,
    IMapTextRenderable,
    IMapVertexBlock
} from './types';

export class MapTextManager
    extends Hookable<IMapTextManagerHooks>
    implements IMapTextManager
{
    /** 分块上附着文本区域的标识符 */
    private readonly attachSymbol: symbol = Symbol('onMapTextAreas');
    /** 分块对象 */
    private readonly block: IBlockSplitter<IMapVertexBlock>;

    constructor(private readonly renderer: IMapRenderer) {
        super();
        this.block = renderer.vertex.block;
    }

    protected createController(
        hook: Partial<IMapTextManagerHooks>
    ): IHookController<IMapTextManagerHooks> {
        return new HookController(this, hook);
    }

    /**
     * 触发更新通知
     */
    private update() {
        this.forEachHook(hook => hook.onUpdate?.());
    }

    /**
     * 获取分块所附着的文字数据
     * @param blockData 分块数据
     */
    private getAttachedMap(
        blockData: IChunkData<IMapVertexBlock>
    ): Map<number, MapTextArea> {
        return blockData.data.getOrInsertAttachedData(
            this.attachSymbol,
            () => new Map<number, MapTextArea>()
        );
    }

    requireBlockArea(x: number, y: number): Readonly<IMapTextArea> | null {
        const index = y * this.renderer.mapWidth + x;
        const blockData = this.block.getChunkByElementIndex(index);
        if (!blockData) {
            logger.error(47);
            return null;
        }
        const map = this.getAttachedMap(blockData);
        return map.getOrInsertComputed(index, () => {
            // 新增的时候，TextArea 本身是没有任何内容的，所以不需要触发更新
            return new MapTextArea(index, x, y, () => this.update());
        });
    }

    getBlockByLoc(x: number, y: number): Readonly<IMapTextArea> | null {
        return this.getBlockByIndex(y * this.renderer.mapWidth + x);
    }

    getBlockByIndex(index: number): Readonly<IMapTextArea> | null {
        const blockData = this.block.getChunkByElementIndex(index);
        if (!blockData) return null;
        const map = blockData.data.getAttachedData<Map<number, MapTextArea>>(
            this.attachSymbol
        );
        return map?.get(index) ?? null;
    }

    iterateBlockData(
        block: IChunkData<IMapVertexBlock>
    ): Iterable<IMapTextArea> {
        const attached = this.getAttachedMap(block);
        return attached.values();
    }

    deleteBlockArea(x: number, y: number): void {
        const index = y * this.renderer.mapWidth + x;
        const blockData = this.block.getChunkByElementIndex(index);
        if (!blockData) return;
        const map = this.getAttachedMap(blockData);
        map.delete(index);
        if (map.size === 0) {
            blockData.data.deleteAttachedData(this.attachSymbol);
        }
    }

    clear(): void {
        for (const b of this.block.iterateChunks()) {
            const blk = b.data;
            const map = blk.getAttachedData<Map<number, MapTextArea>>(
                this.attachSymbol
            );
            if (map) {
                for (const area of map.values()) area.clear();
                blk.deleteAttachedData(this.attachSymbol);
            }
        }
        this.update();
    }

    destroy(): void {
        this.clear();
    }
}

class MapTextArea implements IMapTextArea {
    /** 标记管理器需要更新的回调 */
    private readonly markDirty: () => void;
    /** 本区域所有可渲染对象的集合，用于绘制阶段 */
    private readonly renderableSet: Set<IMapTextRenderable> = new Set();
    /** 可渲染对象索引到可渲染对象的映射 */
    private readonly renderableMap: Map<number, IMapTextRenderable> = new Map();
    /** 可渲染对象到其索引的映射 */
    private readonly reverseMap: Map<IMapTextRenderable, number> = new Map();
    /** 下一个可用的可渲染对象索引 */
    private nextRenderableIndex: number = 1;

    constructor(
        readonly index: number,
        readonly mapX: number,
        readonly mapY: number,
        markDirty: () => void
    ) {
        this.markDirty = markDirty;
    }

    /**
     * 获取本区域的所有可渲染对象，用于绘制阶段
     */
    getRenderables(): Iterable<IMapTextRenderable> {
        return this.renderableSet;
    }

    addTextRenderable(renderable: IMapTextRenderable): number {
        const idx = this.nextRenderableIndex++;
        this.renderableSet.add(renderable);
        this.renderableMap.set(idx, renderable);
        this.reverseMap.set(renderable, idx);
        this.markDirty();
        return idx;
    }

    removeTextRenderable(renderable: IMapTextRenderable): void {
        const idx = this.reverseMap.get(renderable);
        if (!isNil(idx)) {
            this.renderableSet.delete(renderable);
            this.renderableMap.delete(idx);
            this.reverseMap.delete(renderable);
            this.markDirty();
        }
    }

    removeTextRenderableByIndex(index: number): void {
        const obj = this.renderableMap.get(index);
        if (obj) {
            this.renderableMap.delete(index);
            this.renderableSet.delete(obj);
            this.reverseMap.delete(obj);
            this.markDirty();
        }
    }

    clear(): void {
        if (this.renderableSet.size > 0) {
            this.renderableSet.clear();
            this.renderableMap.clear();
            this.reverseMap.clear();
            this.markDirty();
        }
    }
}

export interface IMapTextProps extends DefaultProps {
    /** 文字管理器，提供文字数据 */
    manager?: IMapTextManager;
    /** 地图渲染器，提供尺寸与可见区域 */
    renderer?: IMapRenderer;
}

const mapTextProps = {
    props: ['loc', 'manager', 'renderer']
} satisfies SetupComponentOptions<IMapTextProps>;

/**
 * 地图文字组件，按照地图坐标系绘制文字管理器中的所有文字。
 * 参数为文字管理器与地图渲染器，前者提供文字数据，后者提供尺寸与可见区域。
 */
export const MapText = defineComponent<IMapTextProps>(props => {
    const counter = ref(0);

    const hook: IMapTextManagerHooks = {
        onUpdate() {
            counter.value++;
        }
    };

    const render = (canvas: MotaOffscreenCanvas2D) => {
        const { manager, renderer } = props;
        if (!manager || !renderer) return;
        const ctx = canvas.ctx;
        const blockList = renderer.viewport.getRenderArea().blockList;
        ctx.lineWidth = 2;
        for (const chunk of blockList) {
            const areas = manager.iterateBlockData(chunk);
            for (const area of areas) {
                const baseX = area.mapX * renderer.cellWidth;
                const baseY = area.mapY * renderer.cellHeight;
                const renderables = area.getRenderables();
                for (const renderable of renderables) {
                    const x = baseX + (renderable.px ?? 0);
                    const y = baseY + (renderable.py ?? 0);
                    ctx.font = renderable.font.string();
                    ctx.textAlign = renderable.textAlign ?? 'left';
                    ctx.textBaseline = renderable.textBaseline ?? 'top';
                    if (renderable.stroke) {
                        ctx.strokeStyle = renderable.strokeStyle ?? 'black';
                        ctx.strokeText(renderable.text, x, y);
                    }
                    if (renderable.fill) {
                        ctx.fillStyle = renderable.fillStyle ?? 'white';
                        ctx.fillText(renderable.text, x, y);
                    }
                }
            }
        }
    };

    onMounted(() => {
        props.manager?.addHook(hook);
    });

    watch(
        () => props.manager,
        (value, old) => {
            old?.removeHook(hook);
            value?.addHook(hook);
        }
    );

    return () => {
        return (
            <custom
                selfTransform
                loc={props.loc}
                render={render}
                bindings={[counter.value]}
            />
        );
    };
}, mapTextProps);
