import { logger } from '@motajs/common';
import { IDataCommon, SaveCompression } from '@user/data-common';
import { ITileStore } from '@user/data-common';
import {
    ILayerState,
    ILayerStateSave,
    IMapLayer,
    IMapLayerSave,
    IMapStore,
    IMapStoreSave,
    MapArea
} from './types';
import { LayerState } from './layerState';
import { uniq } from 'lodash-es';

export class MapStore implements IMapStore {
    /** 楼层 id 到状态对象的映射 */
    private readonly mapData: Map<string, LayerState> = new Map();

    /** 所有楼层 id 的有序数组 */
    readonly maps: string[] = [];

    /** 差分压缩参考基准，首次 compareWith 后设置，之后不再更新 */
    private refData: Map<string, Map<number, Uint32Array>> | null = null;

    /** 分区列表 */
    private areaList: Set<MapArea> = new Set();

    /** 上一次调用 notifyEnterFloor 传入的楼层 id */
    private lastFloorId: string | null = null;

    /** 自动分区激活器开关 */
    private autoActivitorEnabled: boolean = false;

    constructor(
        private readonly tileStore: ITileStore,
        public readonly state: IDataCommon
    ) {}

    //#region 楼层管理

    createLayerState(id: string, width: number, height: number): ILayerState {
        if (this.mapData.has(id)) {
            logger.warn(121, id);
        } else {
            this.maps.push(id);
        }
        const state = new LayerState(this.state, this.tileStore, width, height);
        // 若 refData 已存在，新楼层直接视为全脏
        if (this.refData !== null) {
            state.setDirty(true);
        }
        this.mapData.set(id, state);
        return state;
    }

    setMapList(maps: string[]): void {
        this.maps.length = 0;
        this.maps.push(...uniq(maps));
    }

    useManualOrder(sort: (arr: string[]) => string[]): void {
        const copy = this.maps.slice();
        const sorted = sort(copy);
        const oldSet = new Set(this.maps);
        const newSet = new Set(sorted);
        if (oldSet.size !== newSet.size || !newSet.isSubsetOf(oldSet)) {
            logger.warn(125);
            return;
        }
        this.maps.length = 0;
        this.maps.push(...uniq(sorted));
    }

    getLayerState(id: string): ILayerState | null {
        return this.mapData.get(id) ?? null;
    }

    getActiveMap(id: string): ILayerState | null {
        const state = this.mapData.get(id);
        if (!state || !state.active) return null;
        return state;
    }

    //#endregion

    //#region 分区管理

    setArea(areas: Set<MapArea>): void {
        this.areaList = areas;
    }

    activeArea(id: string): void {
        const idx = this.maps.indexOf(id);
        if (idx === -1) return;
        const area = this.findAreaByIndex(idx);
        if (!area) return;
        this.setAreaActive(area, true);
    }

    deactiveArea(id: string): void {
        const idx = this.maps.indexOf(id);
        if (idx === -1) return;
        const area = this.findAreaByIndex(idx);
        if (!area) return;
        this.setAreaActive(area, false);
    }

    useAutoActivitor(enable: boolean): void {
        this.autoActivitorEnabled = enable;
    }

    notifyEnterFloor(id: string): void {
        if (!this.autoActivitorEnabled) return;
        const idx = this.maps.indexOf(id);
        if (idx === -1) return;
        const area = this.findAreaByIndex(idx);
        if (!area) return;
        if (this.lastFloorId !== null) {
            this.deactiveArea(this.lastFloorId);
        }
        this.activeArea(id);
        this.lastFloorId = id;
    }

    /**
     * 根据 maps 下标查找其所属的分区
     * @param idx 楼层在 maps 中的下标
     */
    private findAreaByIndex(idx: number): MapArea | null {
        for (const area of this.areaList) {
            for (const interval of area) {
                if (idx >= interval.start && idx <= interval.end) {
                    return area;
                }
            }
        }
        return null;
    }

    /**
     * 批量设置一个分区内所有楼层的激活状态
     * @param area 目标分区
     * @param active 要设置的激活状态
     */
    private setAreaActive(area: MapArea, active: boolean): void {
        for (const interval of area) {
            for (let i = interval.start; i <= interval.end; i++) {
                const floorId = this.maps[i];
                if (floorId !== undefined) {
                    this.setMapActiveStatus(floorId, active);
                }
            }
        }
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

    //#region 存档工具

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

    /**
     * 提取楼层内所有图层的静态触发器覆盖映射
     * @param state 目标楼层状态
     */
    private getTriggerMap(state: ILayerState) {
        const triggers = new Map<number, Map<number, number>>();
        for (const layer of state.layerList) {
            const map = layer.getTriggerRef();
            if (map.size > 0) {
                triggers.set(layer.zIndex, new Map(map));
            }
        }
        return triggers;
    }

    /**
     * 构造仅包含背景和静态触发器的空楼层存档
     * @param state 目标楼层状态
     */
    private emptySave(state: ILayerState): ILayerStateSave {
        return {
            background: state.getBackground(),
            layers: new Map(),
            triggers: this.getTriggerMap(state)
        };
    }

    /**
     * 将单个图层序列化为完整地图存档
     * @param layer 目标图层
     */
    private fullLayer(layer: IMapLayer): IMapLayerSave {
        return {
            width: layer.width,
            height: layer.height,
            fullMap: new Uint32Array(layer.getMapRef().array)
        };
    }

    /**
     * 将楼层所有图层全量序列化（NoCompression / LowCompression 用）
     * @param state 目标楼层状态
     */
    private saveLayerStateFull(state: LayerState): ILayerStateSave {
        const background = state.getBackground();
        const layers = new Map<number, IMapLayerSave>();
        const triggers = new Map<number, Map<number, number>>();
        for (const layer of state.layerList) {
            const arr = layer.getMapRef().array;
            layers.set(layer.zIndex, {
                width: layer.width,
                height: layer.height,
                fullMap: new Uint32Array(arr)
            });
            triggers.set(layer.zIndex, new Map(layer.getTriggerRef()));
        }
        return { background, layers, triggers };
    }

    /**
     * 仅返回与参考基准不同的行（HighCompression 用）
     * @param layer 目标图层
     * @param refArray 该图层对应的参考地图数据
     */
    private diffRows(
        layer: IMapLayer,
        refArray: Uint32Array
    ): Map<number, Uint32Array> {
        const rows = new Map<number, Uint32Array>();
        const arr = layer.getMapRef().array;

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

        return rows;
    }

    /**
     * 判断楼层所有图层是否与参考基准完全一致（LowCompression 去误判用）
     * @param id 楼层 id
     * @param state 目标楼层状态
     */
    private isStateEqualToRef(id: string, state: LayerState): boolean {
        const refFloor = this.refData?.get(id);
        if (!refFloor) return false;
        for (const layer of state.layerList) {
            const refArray = refFloor.get(layer.zIndex);
            if (!refArray) return false;
            const cur = layer.getMapRef().array;
            if (cur.length !== refArray.length) return false;
            if (cur.some((v, i) => v !== refArray[i])) return false;
        }
        return true;
    }

    //#endregion

    //#region 存档

    /**
     * 以无压缩方式序列化所有激活楼层
     */
    private saveNoCompression(): IMapStoreSave {
        const floors = new Map<string, ILayerStateSave>();
        for (const [id, state] of this.mapData) {
            if (!state.active) continue;
            floors.set(id, this.saveLayerStateFull(state));
        }
        return { floors };
    }

    /**
     * 以低压缩方式序列化所有激活楼层
     */
    private saveLowCompression(): IMapStoreSave {
        const floors = new Map<string, ILayerStateSave>();
        if (this.refData) {
            // 包含参考标准时需要对比
            for (const [id, state] of this.mapData) {
                if (!state.active) continue;
                if (state.isDirty() && this.isStateEqualToRef(id, state)) {
                    floors.set(id, this.saveLayerStateFull(state));
                } else {
                    floors.set(id, this.emptySave(state));
                }
            }
        } else {
            // 不包含参考标准时仅看 dirty 标记
            for (const [id, state] of this.mapData) {
                if (!state.active) continue;
                if (state.isDirty()) {
                    floors.set(id, this.saveLayerStateFull(state));
                } else {
                    floors.set(id, this.emptySave(state));
                }
            }
        }
        return { floors };
    }

    /**
     * 以高压缩方式序列化所有激活楼层
     */
    private saveHighCompression(): IMapStoreSave {
        const floors = new Map<string, ILayerStateSave>();
        // 没有参考标准，直接退回低压缩级别
        if (!this.refData) return this.saveLowCompression();

        for (const [id, state] of this.mapData) {
            if (!state.active) continue;
            if (state.isDirty()) {
                const refFloor = this.refData.get(id);
                const layersMap = new Map<number, IMapLayerSave>();
                // 对每一个地图的每一行进行遍历，然后仅存储有差别的行
                for (const layer of state.layerList) {
                    const refArray = refFloor?.get(layer.zIndex);
                    if (refArray) {
                        const rows = this.diffRows(layer, refArray);
                        if (rows.size === 0) continue;
                        layersMap.set(layer.zIndex, {
                            width: layer.width,
                            height: layer.height,
                            rows
                        });
                    } else {
                        layersMap.set(layer.zIndex, this.fullLayer(layer));
                    }
                }
                floors.set(id, {
                    background: state.getBackground(),
                    layers: layersMap,
                    triggers: this.getTriggerMap(state)
                });
            } else {
                floors.set(id, this.emptySave(state));
            }
        }

        return { floors };
    }

    /**
     * 加载指定图层的触发器
     * @param save 楼层存档数据
     * @param layer 目标图层
     */
    private loadTriggers(save: ILayerStateSave, layer: IMapLayer) {
        const triggers = save.triggers.get(layer.zIndex);
        layer.clearTrigger();
        if (triggers) {
            layer.setTriggerRef(new Map(triggers));
        }
    }

    /**
     * NoCompression 读档：每个图层均有 fullMap，直接转移所有权，无需参考基准。
     * @param state 整体地图存档数据
     */
    private loadNoCompression(state: IMapStoreSave): void {
        for (const [id, cur] of this.mapData) {
            cur.setActiveStatus(state.floors.has(id));
        }
        for (const [id, save] of state.floors) {
            const cur = this.mapData.get(id);
            if (!cur) {
                logger.warn(122, id);
                continue;
            }
            cur.setBackground(save.background);
            for (const layer of cur.layerList) {
                // 地图
                const layerSave = save.layers.get(layer.zIndex);
                if (layerSave?.fullMap) {
                    layer.setMapRef(new Uint32Array(layerSave.fullMap));
                }
                // 触发器
                this.loadTriggers(save, layer);
            }
            // 需要额外进行判断是否与参考地图相同
            if (this.isStateEqualToRef(id, cur)) {
                cur.setDirty(false);
            } else {
                cur.setDirty(true);
            }
        }
    }

    /**
     * LowCompression 读档：
     * - layers 有数据（dirty 楼层）→ fullMap 直接转移所有权
     * - layers 为空（非 dirty 楼层）→ 从参考基准恢复
     * @param state 整体地图存档数据
     */
    private loadLowCompression(state: IMapStoreSave): void {
        if (!this.refData) {
            logger.error(55);
            return;
        }
        for (const [id, cur] of this.mapData) {
            cur.setActiveStatus(state.floors.has(id));
        }
        for (const [id, save] of state.floors) {
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
            cur.setBackground(save.background);
            let shouldDirty = false;
            for (const layer of cur.layerList) {
                // 地图
                const layerSave = save.layers.get(layer.zIndex);
                if (layerSave?.fullMap) {
                    layer.setMapRef(new Uint32Array(layerSave.fullMap));
                    shouldDirty = true;
                } else {
                    const refArray = refFloor.get(layer.zIndex);
                    if (!refArray) {
                        logger.warn(124, id);
                        return;
                    }
                    layer.setMapRef(new Uint32Array(refArray));
                }
                // 触发器
                this.loadTriggers(save, layer);
            }
            cur.setDirty(shouldDirty);
        }
    }

    /**
     * HighCompression 读档：
     * - layers 有数据（dirty 楼层）→ 以参考基准为底，叠加差分行
     * - layers 为空（非 dirty 楼层）或图层无变化（rows 缺失）→ 从参考基准恢复
     * @param state 整体地图存档数据
     */
    private loadHighCompression(state: IMapStoreSave): void {
        if (!this.refData) {
            logger.error(55);
            return;
        }
        for (const [id, cur] of this.mapData) {
            cur.setActiveStatus(state.floors.has(id));
        }
        for (const [id, save] of state.floors) {
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
            cur.setBackground(save.background);
            let shouldDirty = false;
            for (const layer of cur.layerList) {
                const refArray = refFloor.get(layer.zIndex);
                if (!refArray) {
                    logger.warn(124, id);
                    continue;
                }
                // 地图
                const layerSave = save.layers.get(layer.zIndex);
                if (!layerSave?.rows || layerSave.rows.size === 0) {
                    // 图层无变化或非 dirty 楼层，从参考基准恢复
                    layer.setMapRef(new Uint32Array(refArray));
                } else {
                    // 以参考基准为底，叠加差分行
                    shouldDirty = true;
                    const buf = new Uint32Array(refArray);
                    for (const [rowIdx, rowData] of layerSave.rows) {
                        buf.set(rowData, rowIdx * layer.width);
                    }
                    layer.setMapRef(buf);
                }
                // 触发器
                this.loadTriggers(save, layer);
            }
            cur.setDirty(shouldDirty);
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

    //#endregion
}
