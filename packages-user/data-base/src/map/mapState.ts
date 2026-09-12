import { uniq } from 'lodash-es';
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

    /**
     * 判断原始数据中的值是否为可枚举的对象容器
     * @param value 待判断的运行时值
     */
    private isRecord(value: unknown): value is Record<string, unknown> {
        return !!value && typeof value === 'object' && !Array.isArray(value);
    }

    /**
     * 判断字符串键是否能无歧义地转换为有限数字
     * @param key 原始对象键
     */
    private isNumericKey(key: string): boolean {
        return key.trim() !== '' && Number.isFinite(Number(key));
    }

    /**
     * 在创建地图前验证外部原始地图及事件结构
     * @param raw 待验证的楼层原始数据
     */
    private validateRaw(raw: IMapRawData): boolean {
        const rawMap: unknown = raw.map;
        const rawEvents: unknown = raw.events;
        const rawAliases: unknown = raw.layerAlias;
        if (!this.isRecord(rawMap)) {
            logger.error(63, 'map', raw.floorId);
            return false;
        }
        if (!this.isRecord(rawEvents)) {
            logger.error(63, 'events', raw.floorId);
            return false;
        }
        if (!this.isRecord(rawAliases)) {
            logger.error(63, 'layerAlias', raw.floorId);
            return false;
        }
        if (!Number.isInteger(raw.width) || raw.width <= 0) {
            logger.error(64, 'width', raw.floorId);
            return false;
        }

        let length = 0;
        for (const [zIndex, map] of Object.entries(rawMap)) {
            if (!this.isNumericKey(zIndex)) {
                logger.error(
                    62,
                    'layer',
                    raw.floorId,
                    'IMapRawData.map',
                    zIndex
                );
                return false;
            }
            if (!Array.isArray(map)) {
                logger.error(64, 'map layer', raw.floorId);
                return false;
            }
            if (
                !map.every(
                    value =>
                        typeof value === 'number' &&
                        Number.isFinite(value) &&
                        Number.isInteger(value) &&
                        value >= 0
                )
            ) {
                logger.error(64, 'map value', raw.floorId);
                return false;
            }
            if (length > 0 && map.length !== length) {
                logger.error(
                    60,
                    map.length.toString(),
                    length.toString(),
                    raw.floorId
                );
                return false;
            }
            length = map.length;

            const alias = rawAliases[zIndex];
            if (typeof alias !== 'string') {
                logger.error(64, 'layer alias', raw.floorId);
                return false;
            }
            const events = rawEvents[zIndex];
            if (!this.isRecord(events)) {
                logger.error(63, `events layer ${zIndex}`, raw.floorId);
                return false;
            }
            for (const [index, tileEvents] of Object.entries(events)) {
                if (!this.isNumericKey(index)) {
                    logger.error(
                        62,
                        'event',
                        raw.floorId,
                        'IMapRawData.events',
                        index
                    );
                    return false;
                }
                const indexNum = Number(index);
                if (
                    !Number.isInteger(indexNum) ||
                    indexNum < 0 ||
                    indexNum >= length
                ) {
                    logger.error(64, 'event position', raw.floorId);
                    return false;
                }
                if (!this.isRecord(tileEvents)) {
                    logger.error(63, `events position ${index}`, raw.floorId);
                    return false;
                }
                for (const [priority, id] of Object.entries(tileEvents)) {
                    if (!this.isNumericKey(priority)) {
                        logger.error(
                            62,
                            'event',
                            raw.floorId,
                            'IMapRawData.events',
                            priority
                        );
                        return false;
                    }
                    if (typeof id !== 'string') {
                        logger.error(64, 'event id', raw.floorId);
                        return false;
                    }
                }
            }
        }
        if (length % raw.width !== 0) {
            logger.error(
                61,
                length.toString(),
                raw.width.toString(),
                raw.floorId
            );
            return false;
        }
        for (const zIndex of Object.keys(rawEvents)) {
            if (!this.isNumericKey(zIndex) || !Object.hasOwn(rawMap, zIndex)) {
                logger.error(64, 'event layer', raw.floorId);
                return false;
            }
        }
        return true;
    }

    //#region 楼层管理

    fromRaw(raw: IMapRawData): IGameMap | null {
        if (!this.validateRaw(raw)) return null;
        let length = 0;
        const entries = Object.entries(raw.map);
        for (const [_, map] of Object.entries(raw.map)) {
            if (length > 0 && map.length !== length) {
                logger.error(
                    60,
                    map.length.toString(),
                    length.toString(),
                    raw.floorId
                );
                return null;
            } else {
                length = map.length;
            }
        }
        if (length % raw.width !== 0) {
            logger.error(
                61,
                length.toString(),
                raw.width.toString(),
                raw.floorId
            );
            return null;
        }

        // 设置楼层图块数据
        const height = length / raw.width;
        const state = this.createMap(raw.floorId, raw.width, height);
        for (const [zIndex, map] of entries) {
            const z = Number(zIndex);
            const layer = state.addLayer();
            const alias = raw.layerAlias[z];
            layer.setMapRef(new Uint32Array(map));
            layer.setZIndex(z);
            state.setLayerAlias(layer, alias);

            // 设置坐标点事件
            const events = raw.events[z];
            for (const [index, tileEvents] of Object.entries(events)) {
                const indexNum = Number(index);
                const x = indexNum % raw.width;
                const y = Math.floor(indexNum / raw.width);
                const eventView = layer.event(x, y)!;
                for (const [priority, id] of Object.entries(tileEvents)) {
                    const priorityNum = Number(priority);
                    eventView.set(priorityNum, id);
                }
                eventView.markPure();
            }
            if (alias === 'event') {
                state.setEventLayer(layer);
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
