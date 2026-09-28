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
    SaveCompression,
    shouldReplay
} from '@user/data-common';
import { MapLayer } from './mapLayer';

export class GameMap extends Hookable<IGameMapHooks> implements IGameMap {
    readonly layerList: Set<IResizableMapLayer> = new Set();
    readonly tileStore: ITileStore;

    /** 图层别名到图层的映射 */
    readonly aliasLayerMap: Map<string, IMapLayer> = new Map();

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
        public readonly floorId: string,
        public width: number,
        public height: number
    ) {
        super();
        this.tileStore = state.tileStore;
        this.indexer.setWidth(width);
    }

    @shouldReplay('Adding game map layer should be replayed.')
    addLayer(alias: string): IMapLayer {
        const array = new Uint32Array(this.width * this.height);
        const layer = new MapLayer(array, this.width, this.height, this, alias);
        this.layerList.add(layer);
        this.forEachHook(hook => {
            hook.onUpdateLayer?.(this.layerList);
        });
        const controller = layer.addHook(new StateMapLayerHook(this, layer));
        this.layerHookMap.set(layer, controller);
        controller.load();
        this.aliasLayerMap.set(alias, layer);
        return layer;
    }

    @shouldReplay('Removing game map layer should be replayed.')
    removeLayer(layer: IMapLayer): void {
        this.layerList.delete(layer as IResizableMapLayer);
        this.aliasLayerMap.delete(layer.alias);
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

    @shouldReplay('Resizing game map layer should be replayed.')
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

    @shouldReplay("Setting game map's event layer should be replayed.")
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
            if (!this.isEmptyLayerSave(save)) {
                layers.set(layer.zIndex, save);
            }
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
