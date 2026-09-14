// 测试 GameMap 的图层生命周期、别名、背景、事件层、脏标记与尺寸变化
import { afterAll, describe, expect, it, vi } from 'vitest';
import {
    type IDataCommon,
    type ITileRawData,
    Dir8FaceHandler,
    FaceGroup,
    FaceManager,
    RoleFaceBinder,
    TileStore,
    TileType
} from '@user/data-common';
import { DirectionMapper, logger } from '@motajs/common';
import { type IMapLayer } from './types';
import { GameMap } from './gameMap';

vi.hoisted(() => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    Map.prototype.getOrInsert ??= function <K, V>(
        this: Map<K, V>,
        key: K,
        value: V
    ): V {
        const existing = this.get(key);
        if (existing !== undefined) return existing;
        this.set(key, value);
        return value;
    };
    Map.prototype.getOrInsertComputed ??= function <K, V>(
        this: Map<K, V>,
        key: K,
        callback: (key: K) => V
    ): V {
        const existing = this.get(key);
        if (existing !== undefined) return existing;
        const value = callback(key);
        this.set(key, value);
        return value;
    };
});

afterAll(() => {
    vi.unstubAllGlobals();
});

/**
 * 构造一条最小图块原始数据
 * @param num 图块数字
 * @param id 图块字符串 id
 * @param events 默认事件映射
 */
function createTileData(
    num: number,
    id: string,
    events: Record<number, string> = {}
): ITileRawData {
    return {
        num,
        id,
        events,
        type: TileType.Terrain,
        pass: { onlyEvents: false, outPass: 15, inPass: 15 },
        eventPass: true
    };
}

interface GameMapFixture {
    map: GameMap;
    tileStore: TileStore;
}

/** 构造一个空的 GameMap 及其底层公共层对象 */
function createFixture(): GameMapFixture {
    const tileStore = new TileStore();
    tileStore.addTile(createTileData(1, 'base', { 10: 'base-event' }));
    const faceManager = new FaceManager();
    faceManager.register(FaceGroup.Dir8, new Dir8FaceHandler());
    const state: IDataCommon = {
        tileStore,
        itemStore: {},
        mapStore: {},
        eventStore: {},
        roleFace: new RoleFaceBinder(),
        faceManager,
        directionMapper: new DirectionMapper(),
        saveSystem: {}
    } as never;
    return {
        map: new GameMap(state, tileStore, 'F1', 2, 2),
        tileStore
    };
}

describe('GameMap layer lifecycle', () => {
    // 验证 addLayer/removeLayer/hasLayer 与图层列表钩子
    it('adds and removes layers and notifies the layer list hook', () => {
        const { map } = createFixture();
        const sizes: number[] = [];
        map.addHook({
            onUpdateLayer: list => {
                sizes.push(list.size);
            }
        }).load();

        const layer = map.addLayer();
        expect(map.hasLayer(layer)).toBe(true);
        expect(sizes).toEqual([1]);

        map.removeLayer(layer);
        expect(map.hasLayer(layer)).toBe(false);
        expect(sizes).toEqual([1, 0]);
    });

    // 验证别名设置、查询与重复别名告警 84
    it('binds aliases and warns 84 on a duplicate alias', () => {
        const { map } = createFixture();
        const first = map.addLayer();
        const second = map.addLayer();

        map.setLayerAlias(first, 'event');
        expect(map.getLayerByAlias('event')).toBe(first);
        expect(map.getLayerAlias(first)).toBe('event');

        const result = logger.catch(() => map.setLayerAlias(second, 'event'));

        expect(result.info.map(info => info.code)).toContain(84);
        expect(map.getLayerByAlias('event')).toBe(first);
        expect(map.getLayerAlias(second)).toBeUndefined();
    });

    // 验证移除带别名的图层会一并清除别名映射
    it('drops the alias mapping when the layer is removed', () => {
        const { map } = createFixture();
        const layer = map.addLayer();
        map.setLayerAlias(layer, 'event');

        map.removeLayer(layer);

        expect(map.getLayerByAlias('event')).toBeNull();
        expect(map.getLayerAlias(layer)).toBeUndefined();
    });
});

describe('GameMap settings', () => {
    // 验证背景设置、读取与背景变化钩子
    it('stores the background and notifies the background hook', () => {
        const { map } = createFixture();
        const backgrounds: number[] = [];
        map.addHook({
            onChangeBackground: tile => {
                backgrounds.push(tile);
            }
        }).load();

        expect(map.getBackground()).toBe(0);
        map.setBackground(7);

        expect(map.getBackground()).toBe(7);
        expect(backgrounds).toEqual([7]);
    });

    // 验证激活状态切换
    it('toggles the active flag', () => {
        const { map } = createFixture();

        expect(map.active).toBe(false);
        map.setActiveStatus(true);
        expect(map.active).toBe(true);
    });

    // 验证事件层只接受本楼层的图层，越权告警 131，空值清空
    it('accepts own layers, warns 131 for a foreign layer and clears on null', () => {
        const { map, tileStore } = createFixture();
        const layer = map.addLayer();
        const foreign = new GameMap(
            map.state,
            tileStore,
            'other',
            2,
            2
        ).addLayer();

        const result = logger.catch(() => map.setEventLayer(foreign));
        expect(result.info.map(info => info.code)).toContain(131);
        expect(map.eventLayer).toBeNull();

        map.setEventLayer(layer);
        expect(map.eventLayer).toBe(layer);

        map.setEventLayer(null);
        expect(map.eventLayer).toBeNull();
    });
});

describe('GameMap dirty state and resizing', () => {
    // 验证自身脏标记与图层脏标记的合并判定
    it('reports dirty from itself or any layer', () => {
        const { map } = createFixture();
        const layer = map.addLayer();

        expect(map.dirty()).toBe(false);

        map.markDirty(true);
        expect(map.dirty()).toBe(true);
        map.markDirty(false);
        expect(map.dirty()).toBe(false);

        layer.setBlock(1, 0, 0);
        expect(map.dirty()).toBe(true);
    });

    // 验证 resizeLayer 按 keepBlock 保留或清空图块并触发尺寸钩子
    it('resizes layers keeping or clearing blocks and notifies hooks', () => {
        const { map } = createFixture();
        const layer = map.addLayer();
        layer.setBlock(1, 0, 0);
        const resizes: [number, number][] = [];
        map.addHook({
            onResizeLayer: (_layer: IMapLayer, width, height) => {
                resizes.push([width, height]);
            }
        }).load();

        map.resizeLayer(3, 2, true);
        expect(map.width).toBe(3);
        expect(map.height).toBe(2);
        expect(layer.getBlock(0, 0)).toBe(1);
        expect(resizes).toEqual([[3, 2]]);

        map.resizeLayer(1, 1, false);
        expect(layer.getBlock(0, 0)).toBe(0);
        expect(resizes).toEqual([
            [3, 2],
            [1, 1]
        ]);
    });

    // 验证 compareWith 对缺失参考的图层标脏，对匹配参考的图层保持干净
    it('marks layers dirty for a missing reference and compares matching ones', () => {
        const { map } = createFixture();
        const layer = map.addLayer();
        layer.setZIndex(0);

        map.compareWith(new Map());
        expect(layer.dirty()).toBe(true);

        const compared = createFixture().map;
        const comparedLayer = compared.addLayer();
        comparedLayer.setZIndex(0);
        compared.compareWith(new Map([[0, new Uint32Array(4)]]));
        expect(comparedLayer.dirty()).toBe(false);
    });
});
