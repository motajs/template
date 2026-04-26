import { logger } from '@motajs/common';
import { SaveCompression } from '../common';
import {
    ILayerState,
    ILayerStateSave,
    IMapLayer,
    IMapLayerSave,
    IMapStore,
    IMapStoreSave
} from './types';
import { LayerState } from './layerState';

export class MapStore implements IMapStore {
    /** 楼层 id 到状态对象的映射 */
    private readonly mapData: Map<string, LayerState> = new Map();

    /** 所有楼层 id 的只读集合视图 */
    readonly maps: Set<string> = new Set();

    /** 差分压缩参考基准，首次 compareWith 后设置，之后不再更新 */
    private refData: Map<string, Map<number, Uint32Array>> | null = null;

    //#region 楼层访问

    getLayerState(id: string): ILayerState | null {
        return this.mapData.get(id) ?? null;
    }

    getActiveMap(id: string): ILayerState | null {
        const state = this.mapData.get(id);
        if (!state || !state.active) return null;
        return state;
    }

    //#endregion

    //#region 楼层管理

    createLayerState(id: string): ILayerState {
        if (this.mapData.has(id)) {
            logger.warn(121, id);
        }
        const state = new LayerState();
        // 若 refData 已存在，新楼层直接视为全脏
        if (this.refData !== null) {
            state.setDirty(true);
        }
        this.mapData.set(id, state);
        this.maps.add(id);
        return state;
    }

    //#endregion

    //#region active 管理

    isMapActive(id: string): boolean {
        return this.mapData.get(id)?.active ?? false;
    }

    setMapActiveStatus(id: string, active: boolean): void {
        this.mapData.get(id)?.setActiveStatus(active);
    }

    *iterateActiveMaps(): Iterable<[string, ILayerState]> {
        for (const [id, state] of this.mapData) {
            if (state.active) yield [id, state];
        }
    }

    *iterateInactiveMaps(): Iterable<[string, ILayerState]> {
        for (const [id, state] of this.mapData) {
            if (!state.active) yield [id, state];
        }
    }

    iterateAllMaps(): Iterable<[string, ILayerState]> {
        return this.mapData;
    }

    //#endregion

    //#region 存档及压缩

    compareWith(ref: Map<string, Map<number, Uint32Array>>): void {
        if (this.refData !== null) return;
        this.refData = ref;

        for (const [id, state] of this.mapData) {
            const refFloor = ref.get(id);
            if (!refFloor) {
                state.setDirty(true);
                continue;
            }
            let dirty = false;
            for (const layer of state.layerList) {
                const refArray = refFloor.get(layer.zIndex);
                if (!refArray) {
                    dirty = true;
                    break;
                }
                const cur = layer.getMapRef().array;
                if (cur.length !== refArray.length) {
                    dirty = true;
                    break;
                }
                if (cur.some((v, i) => refArray[i] !== v)) {
                    dirty = true;
                    break;
                }
            }
            state.setDirty(dirty);
        }
    }

    private saveNoCompression(): IMapStoreSave {
        const floors = new Map<string, ILayerStateSave>();
        for (const [id, state] of this.mapData) {
            if (!state.active) continue;
            floors.set(id, this.saveLayerStateFull(state));
        }
        return { floors };
    }

    private saveLowCompression(): IMapStoreSave {
        const floors = new Map<string, ILayerStateSave>();
        for (const [id, state] of this.mapData) {
            if (!state.active) continue;
            // 非 dirty 或 dirty 但与参考基准完全一致 → 空 layers（读档时从参考基准恢复）
            if (
                !state.isDirty() ||
                (this.refData && this.isStateEqualToRef(id, state))
            ) {
                floors.set(id, {
                    background: state.getBackground(),
                    layers: new Map()
                });
            } else {
                floors.set(id, this.saveLayerStateFull(state));
            }
        }
        return { floors };
    }

    private saveHighCompression(): IMapStoreSave {
        const floors = new Map<string, ILayerStateSave>();
        for (const [id, state] of this.mapData) {
            if (!state.active) continue;
            if (!state.isDirty()) {
                floors.set(id, {
                    background: state.getBackground(),
                    layers: new Map()
                });
                continue;
            }
            const refFloor = this.refData?.get(id);
            const layersMap = new Map<number, IMapLayerSave>();
            for (const layer of state.layerList) {
                const refArray = refFloor?.get(layer.zIndex);
                const rows = this.diffRows(layer, refArray);
                if (rows.size === 0 && refArray) continue; // 与参考完全一致
                layersMap.set(layer.zIndex, {
                    width: layer.width,
                    height: layer.height,
                    rows
                });
            }
            floors.set(id, {
                background: state.getBackground(),
                layers: layersMap
            });
        }
        return { floors };
    }

    /**
     * NoCompression 读档：每个图层均有 fullMap，直接转移所有权，无需参考基准。
     */
    private loadNoCompression(state: IMapStoreSave): void {
        for (const [id, cur] of this.mapData) {
            cur.setActiveStatus(state.floors.has(id));
        }
        for (const [id, layerStateSave] of state.floors) {
            const cur = this.mapData.get(id);
            if (!cur) {
                logger.warn(122, id);
                continue;
            }
            cur.setBackground(layerStateSave.background);
            for (const layer of cur.layerList) {
                const layerSave = layerStateSave.layers.get(layer.zIndex);
                if (!layerSave?.fullMap) continue;
                layer.setMapRef(new Uint32Array(layerSave.fullMap));
            }
            cur.setDirty(false);
        }
    }

    /**
     * LowCompression 读档：
     * - layers 有数据（dirty 楼层）→ fullMap 直接转移所有权
     * - layers 为空（非 dirty 楼层）→ 从参考基准恢复
     */
    private loadLowCompression(state: IMapStoreSave): void {
        if (!this.refData) {
            logger.error(55);
            return;
        }
        for (const [id, cur] of this.mapData) {
            cur.setActiveStatus(state.floors.has(id));
        }
        for (const [id, layerStateSave] of state.floors) {
            const cur = this.mapData.get(id);
            const refFloor = this.refData.get(id);
            if (!cur) {
                logger.warn(122, id);
                continue;
            }
            if (!refFloor) {
                logger.warn(124, id);
                continue;
            }
            cur.setBackground(layerStateSave.background);
            for (const layer of cur.layerList) {
                const layerSave = layerStateSave.layers.get(layer.zIndex);
                if (layerSave?.fullMap) {
                    layer.setMapRef(layerSave.fullMap);
                } else {
                    const refArray = refFloor?.get(layer.zIndex);
                    if (!refArray) {
                        logger.warn(124, id);
                        return;
                    }
                    layer.setMapRef(new Uint32Array(refArray));
                }
            }
            cur.setDirty(false);
        }
    }

    /**
     * HighCompression 读档：
     * - layers 有数据（dirty 楼层）→ 以参考基准为底，叠加差分行
     * - layers 为空（非 dirty 楼层）或图层无变化（rows 缺失）→ 从参考基准恢复
     */
    private loadHighCompression(state: IMapStoreSave): void {
        if (!this.refData) {
            logger.error(55);
            return;
        }
        for (const [id, cur] of this.mapData) {
            cur.setActiveStatus(state.floors.has(id));
        }
        for (const [id, layerStateSave] of state.floors) {
            const cur = this.mapData.get(id);
            const refFloor = this.refData.get(id);
            if (!cur) {
                logger.warn(122, id);
                continue;
            }
            if (!refFloor) {
                logger.warn(124, id);
                continue;
            }
            cur.setBackground(layerStateSave.background);
            let isMapDirty = true;
            for (const layer of cur.layerList) {
                const refArray = refFloor.get(layer.zIndex);
                if (!refArray) {
                    logger.warn(124, id);
                    continue;
                }
                const layerSave = layerStateSave.layers.get(layer.zIndex);
                if (!layerSave?.rows || layerSave.rows.size === 0) {
                    // 图层无变化或非 dirty 楼层，从参考基准恢复
                    layer.setMapRef(new Uint32Array(refArray));
                } else {
                    // 以参考基准为底，叠加差分行
                    isMapDirty = false;
                    const size = layer.width * layer.height;
                    const buf = new Uint32Array(size);
                    if (refArray) buf.set(refArray.subarray(0, size));
                    for (const [rowIdx, rowData] of layerSave.rows) {
                        buf.set(
                            rowData.subarray(0, layer.width),
                            rowIdx * layer.width
                        );
                    }
                    layer.setMapRef(buf);
                }
            }
            cur.setDirty(isMapDirty);
        }
    }

    saveState(compression: SaveCompression): IMapStoreSave {
        if (compression === SaveCompression.HighCompression) {
            return this.saveHighCompression();
        } else if (compression === SaveCompression.LowCompression) {
            return this.saveLowCompression();
        } else {
            return this.saveNoCompression();
        }
    }

    loadState(state: IMapStoreSave, compression: SaveCompression): void {
        if (compression === SaveCompression.HighCompression) {
            this.loadHighCompression(state);
        } else if (compression === SaveCompression.LowCompression) {
            this.loadLowCompression(state);
        } else {
            this.loadNoCompression(state);
        }
    }

    //#region 内部方法

    /**
     * 将楼层所有图层全量序列化（NoCompression / LowCompression 用）
     */
    private saveLayerStateFull(state: LayerState): ILayerStateSave {
        const layersMap = new Map<number, IMapLayerSave>();
        for (const layer of state.layerList) {
            const arr = layer.getMapRef().array;
            layersMap.set(layer.zIndex, {
                width: layer.width,
                height: layer.height,
                fullMap: new Uint32Array(arr)
            });
        }
        return { background: state.getBackground(), layers: layersMap };
    }

    /**
     * 仅返回与参考基准不同的行（HighCompression 用）
     */
    private diffRows(
        layer: IMapLayer,
        refArray?: Uint32Array
    ): Map<number, Uint32Array> {
        const rows = new Map<number, Uint32Array>();
        const arr = layer.getMapRef().array;
        if (refArray) {
            for (let row = 0; row < layer.height; row++) {
                const start = row * layer.width;
                const end = start + layer.width;
                const slice = arr.subarray(start, end);
                const refSlice = refArray.subarray(start, end);
                const same = refSlice.every((v, i) => slice[i] === v);
                if (!same) {
                    rows.set(row, new Uint32Array(slice));
                }
            }
        } else {
            for (let row = 0; row < layer.height; row++) {
                const start = row * layer.width;
                const end = start + layer.width;
                rows.set(row, new Uint32Array(arr.subarray(start, end)));
            }
        }
        return rows;
    }

    /**
     * 判断楼层所有图层是否与参考基准完全一致（LowCompression 去误判用）
     */
    private isStateEqualToRef(id: string, state: LayerState): boolean {
        const refFloor = this.refData?.get(id);
        if (!refFloor) return false;
        for (const layer of state.layerList) {
            const refArray = refFloor.get(layer.zIndex);
            if (!refArray) return false;
            const cur = layer.getMapRef().array;
            if (cur.length !== refArray.length) return false;
            for (let i = 0; i < cur.length; i++) {
                if (cur[i] !== refArray[i]) return false;
            }
        }
        return true;
    }

    //#endregion
}
