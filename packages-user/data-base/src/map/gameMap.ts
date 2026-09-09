import {
    Hookable,
    HookController,
    IHookController,
    logger
} from '@motajs/common';
import {
    IGameMap,
    IGameMapHooks,
    IGameMapSave,
    IMapLayer,
    IMapLayerHookController,
    IMapLayerHooks,
    IMapLayerSave,
    IResizableMapLayer
} from './types';
import {
    IDataCommon,
    ILocationIndexer,
    ITileStore,
    MapLocIndexer,
    SaveCompression
} from '@user/data-common';
import { MapLayer } from './mapLayer';

export class GameMap extends Hookable<IGameMapHooks> implements IGameMap {
    readonly layerList: Set<IResizableMapLayer> = new Set();
    /** 图层到图层别名映射 */
    readonly layerAliasMap: WeakMap<IMapLayer, string> = new WeakMap();
    /** 图层别名到图层的映射 */
    readonly aliasLayerMap: Map<symbol, IMapLayer> = new Map();

    /** 背景图块 */
    private backgroundTile: number = 0;

    /** 图层钩子映射 */
    private layerHookMap: Map<IMapLayer, IMapLayerHookController> = new Map();

    /** 坐标索引器 */
    readonly indexer: ILocationIndexer = new MapLocIndexer();

    active: boolean = false;
    eventLayer: IMapLayer | null = null;

    /** 楼层自身脏标记 */
    private selfDirty: boolean = false;

    constructor(
        public readonly state: IDataCommon,
        public readonly tileStore: ITileStore,
        public width: number,
        public height: number
    ) {
        super();
        this.indexer.setWidth(width);
    }

    addLayer(): IMapLayer {
        const array = new Uint32Array(this.width * this.height);
        const layer = new MapLayer(array, this.width, this.height, this);
        this.layerList.add(layer);
        this.forEachHook(hook => {
            hook.onUpdateLayer?.(this.layerList);
        });
        const controller = layer.addHook(new StateMapLayerHook(this, layer));
        this.layerHookMap.set(layer, controller);
        controller.load();
        return layer;
    }

    removeLayer(layer: IMapLayer): void {
        this.layerList.delete(layer as IResizableMapLayer);
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
        return this.layerList.has(layer as IResizableMapLayer);
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
        this.indexer.setWidth(width);
        for (const layer of this.layerList) {
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
            if (!this.layerList.has(layer as IResizableMapLayer)) {
                logger.warn(131);
                return;
            }
            this.eventLayer = layer;
        }
    }

    dirty(): boolean {
        if (this.selfDirty) return true;
        for (const layer of this.layerList) {
            if (layer.dirty()) return true;
        }
        return false;
    }

    markDirty(dirty: boolean): void {
        this.selfDirty = dirty;
    }

    compareWith(data: Map<number, Uint32Array>): void {
        for (const layer of this.layerList) {
            const refArray = data.get(layer.zIndex);
            if (refArray) {
                layer.compareWith(refArray);
            } else {
                layer.markDirty(true);
            }
        }
    }

    /**
     * 判断图层存档是否不含任何有效内容
     * @param save 图层存档
     */
    private isEmptyLayerSave(save: IMapLayerSave): boolean {
        if (save.fullMap) return false;
        if (save.rows && save.rows.size > 0) return false;
        if (save.staticBlocks && save.staticBlocks.size > 0) return false;
        if (save.dynamicBlocks && save.dynamicBlocks.size > 0) return false;
        if (save.pointEvents && save.pointEvents.size > 0) return false;
        return true;
    }

    saveState(compression: SaveCompression): IGameMapSave {
        const layers = new Map<number, IMapLayerSave>();
        for (const layer of this.layerList) {
            const save = layer.saveState(compression);
            if (this.isEmptyLayerSave(save)) continue;
            layers.set(layer.zIndex, save);
        }
        return {
            background: this.backgroundTile,
            layers
        };
    }

    loadState(save: IGameMapSave, compression: SaveCompression): void {
        this.setBackground(save.background);
        for (const layer of this.layerList) {
            const layerSave = save.layers.get(layer.zIndex);
            if (!layerSave) continue;
            layer.loadState(layerSave, compression);
        }
        this.markDirty(false);
    }

    protected createController(
        hook: Partial<IGameMapHooks>
    ): IHookController<IGameMapHooks> {
        return new HookController(this, hook);
    }
}

class StateMapLayerHook implements Partial<IMapLayerHooks> {
    constructor(
        readonly state: GameMap,
        readonly layer: IMapLayer
    ) {}

    onResize(width: number, height: number): void {
        this.state.forEachHook(hook => {
            hook.onResizeLayer?.(this.layer, width, height);
        });
    }
}
