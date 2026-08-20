import { isNil, uniq } from 'lodash-es';
import { IDataCommon, IMapRawData, SaveCompression } from '@user/data-common';
import { ITileStore } from '@user/data-common';
import {
    IGameMap,
    IGameMapSave,
    IMapState,
    IMapStoreSave,
    MapArea
} from './types';
import { GameMap } from './gameMap';
import { logger } from '@motajs/common';

export class MapState implements IMapState {
    /** 楼层 id 到状态对象的映射 */
    private readonly mapData: Map<string, IGameMap> = new Map();

    /** 所有楼层 id 的有序数组 */
    readonly maps: string[] = [];

    /** 是否已经调用过 compareWith 设置参考基准 */
    private compared: boolean = false;

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

    fromRaw(raw: IMapRawData): IGameMap | null {
        let length = 0;
        const entries = Object.entries(raw.map);
        for (const [_, map] of Object.entries(raw.map)) {
            if (length > 0 && map.length !== length) {
                logger.error(60, map.length.toString(), length.toString());
                return null;
            } else {
                length = map.length;
            }
        }
        if (length % raw.width !== 0) {
            logger.error(61, length.toString(), raw.width.toString());
            return null;
        }

        // 设置楼层图块数据
        const height = length / raw.width;
        const state = this.createMap(raw.floorId, raw.width, height);
        for (const [zIndex, map] of entries) {
            const z = Number(zIndex);
            if (isNaN(z)) {
                logger.error(62, 'IMapRawData.map', String(zIndex));
                continue;
            }
            const layer = state.addLayer();
            const alias = raw.layerAlias[z];
            layer.setMapRef(new Uint32Array(map));
            layer.setZIndex(z);
            state.setLayerAlias(layer, alias);

            // 设置图块静态触发器
            const extra = raw.blockData[z];
            for (const [index, data] of Object.entries(extra)) {
                const indexNum = Number(index);
                if (isNaN(indexNum)) {
                    logger.error(62, 'IMapRawData.blockData', String(index));
                    continue;
                }
                if (!isNil(data.trigger)) {
                    const x = indexNum % raw.width;
                    const y = Math.floor(indexNum / raw.width);
                    const location = layer.getLocationData(x, y);
                    if (location) {
                        location.static.addTrigger(data.trigger);
                    }
                }
            }
        }

        return state;
    }

    createMap(id: string, width: number, height: number): IGameMap {
        if (this.mapData.has(id)) {
            logger.warn(121, id);
        } else {
            this.maps.push(id);
        }
        const state = new GameMap(this.state, this.tileStore, width, height);
        // 若已设置参考基准，新楼层直接视为全脏
        if (this.compared) {
            state.markDirty(true);
        }
        this.mapData.set(id, state);
        return state;
    }

    setMapList(maps: string[]): void {
        this.maps.length = 0;
        this.maps.push(...uniq(maps));
    }

    getMap(id: string): IGameMap | null {
        return this.mapData.get(id) ?? null;
    }

    getActiveMap(id: string): IGameMap | null {
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

    *iterateActiveMaps(): Iterable<[string, IGameMap]> {
        for (const [id, state] of this.mapData) {
            if (state.active) yield [id, state];
        }
    }

    *iterateInactiveMaps(): Iterable<[string, IGameMap]> {
        for (const [id, state] of this.mapData) {
            if (!state.active) yield [id, state];
        }
    }

    iterateAllMaps(): Iterable<[string, IGameMap]> {
        return this.mapData;
    }

    //#endregion

    //#region 存档对比

    compareWith(ref: Map<string, Map<number, Uint32Array>>): void {
        if (this.compared) return;
        this.compared = true;

        for (const [id, state] of this.mapData) {
            const refFloor = ref.get(id);
            if (!refFloor) {
                state.markDirty(true);
                continue;
            }
            state.compareWith(refFloor);
        }
    }

    //#region 存读档

    saveState(compression: SaveCompression): IMapStoreSave {
        const floors = new Map<string, IGameMapSave>();
        for (const [id, state] of this.mapData) {
            if (!state.active) continue;
            floors.set(id, state.saveState(compression));
        }
        return { floors };
    }

    loadState(state: IMapStoreSave, compression: SaveCompression): void {
        if (compression !== SaveCompression.NoCompression && !this.compared) {
            logger.error(55);
            return;
        }
        for (const [id, cur] of this.mapData) {
            cur.setActiveStatus(state.floors.has(id));
        }
        for (const [id, save] of state.floors) {
            const cur = this.mapData.get(id);
            if (!cur) {
                logger.warn(122, id);
                continue;
            }
            cur.loadState(save, compression);
        }
    }

    //#endregion
}
