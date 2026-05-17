import {
    Hookable,
    HookController,
    IHookController,
    logger
} from '@motajs/common';
import {
    ILayerState,
    ILayerStateHooks,
    IMapLayer,
    IMapLayerHookController,
    IMapLayerHooks
} from './types';
import { IDataCommon, ITileStore } from '@user/data-common';
import { MapLayer } from './mapLayer';

export class LayerState
    extends Hookable<ILayerStateHooks>
    implements ILayerState
{
    readonly layerList: Set<IMapLayer> = new Set();
    /** 具体 MapLayer 实例列表，供内部 resize 使用 */
    private readonly mapLayerList: Set<MapLayer> = new Set();
    /** 图层到图层别名映射 */
    readonly layerAliasMap: WeakMap<IMapLayer, string> = new WeakMap();
    /** 图层别名到图层的映射 */
    readonly aliasLayerMap: Map<symbol, IMapLayer> = new Map();

    /** 背景图块 */
    private backgroundTile: number = 0;

    /** 图层钩子映射 */
    private layerHookMap: Map<IMapLayer, IMapLayerHookController> = new Map();

    active: boolean = false;
    eventLayer: IMapLayer | null = null;

    /** 楼层级脏标记 */
    private dirty: boolean = false;

    constructor(
        public readonly state: IDataCommon,
        public readonly tileStore: ITileStore,
        public width: number,
        public height: number
    ) {
        super();
    }

    addLayer(): IMapLayer {
        const array = new Uint32Array(this.width * this.height);
        const layer = new MapLayer(
            array,
            this.width,
            this.height,
            this,
            this.tileStore
        );
        this.layerList.add(layer);
        this.mapLayerList.add(layer);
        this.forEachHook(hook => {
            hook.onUpdateLayer?.(this.layerList);
        });
        const controller = layer.addHook(new StateMapLayerHook(this, layer));
        this.layerHookMap.set(layer, controller);
        controller.load();
        return layer;
    }

    removeLayer(layer: IMapLayer): void {
        this.layerList.delete(layer);
        this.mapLayerList.delete(layer as MapLayer);
        const alias = this.layerAliasMap.get(layer);
        if (alias) {
            const symbol = Symbol.for(alias);
            this.aliasLayerMap.delete(symbol);
            this.layerAliasMap.delete(layer);
        }
        this.forEachHook(hook => {
            hook.onUpdateLayer?.(this.layerList);
        });
        const controller = this.layerHookMap.get(layer);
        if (!controller) return;
        controller.unload();
        this.layerHookMap.delete(layer);
    }

    hasLayer(layer: IMapLayer): boolean {
        return this.layerList.has(layer);
    }

    setLayerAlias(layer: IMapLayer, alias: string): void {
        const symbol = Symbol.for(alias);
        if (this.aliasLayerMap.has(symbol)) {
            logger.warn(84, alias);
            return;
        }
        this.layerAliasMap.set(layer, alias);
        this.aliasLayerMap.set(symbol, layer);
    }

    getLayerByAlias(alias: string): IMapLayer | null {
        const symbol = Symbol.for(alias);
        return this.aliasLayerMap.get(symbol) ?? null;
    }

    getLayerAlias(layer: IMapLayer): string | undefined {
        return this.layerAliasMap.get(layer);
    }

    resizeLayer(
        width: number,
        height: number,
        keepBlock: boolean = false
    ): void {
        this.width = width;
        this.height = height;
        for (const layer of this.mapLayerList) {
            if (keepBlock) {
                layer.resize(width, height);
            } else {
                layer.resize2(width, height);
            }
        }
    }

    setBackground(tile: number): void {
        this.backgroundTile = tile;
        this.forEachHook(hook => {
            hook.onChangeBackground?.(tile);
        });
    }

    getBackground(): number {
        return this.backgroundTile;
    }

    setActiveStatus(active: boolean): void {
        this.active = active;
    }

    setEventLayer(layer: IMapLayer | null): void {
        if (!layer) {
            this.eventLayer = null;
        } else {
            if (!this.layerList.has(layer)) {
                return;
            }
            this.eventLayer = layer;
        }
    }

    isDirty(): boolean {
        return this.dirty;
    }

    setDirty(dirty: boolean): void {
        this.dirty = dirty;
    }

    protected createController(
        hook: Partial<ILayerStateHooks>
    ): IHookController<ILayerStateHooks> {
        return new HookController(this, hook);
    }
}

class StateMapLayerHook implements Partial<IMapLayerHooks> {
    constructor(
        readonly state: LayerState,
        readonly layer: IMapLayer
    ) {}

    onUpdateArea(x: number, y: number, width: number, height: number): void {
        this.state.setDirty(true);
        this.state.forEachHook(hook => {
            hook.onUpdateLayerArea?.(this.layer, x, y, width, height);
        });
    }

    onUpdateBlock(block: number, x: number, y: number): void {
        this.state.setDirty(true);
        this.state.forEachHook(hook => {
            hook.onUpdateLayerBlock?.(this.layer, block, x, y);
        });
    }

    onResize(width: number, height: number): void {
        this.state.setDirty(true);
        this.state.forEachHook(hook => {
            hook.onResizeLayer?.(this.layer, width, height);
        });
    }
}
