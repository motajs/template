// 测试地图系统存读档：tile/MapLayer/GameMap/MapState 同实例往返、压缩档与码 55/122/124
import { afterAll, describe, expect, it, vi } from 'vitest';
import {
    type IDataCommon,
    Dir8FaceHandler,
    FaceGroup,
    FaceManager,
    RoleFaceBinder,
    SaveCompression,
    TileStore,
    TileType
} from '@user/data-common';
import { DirectionMapper, logger } from '@motajs/common';
import { type IGameMap, type IResizableMapLayer } from './types';
import { MapState } from './mapState';

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

/** 存读档测试覆盖的三档压缩级别 */
const SAVE_COMPRESSIONS = [
    SaveCompression.NoCompression,
    SaveCompression.LowCompression,
    SaveCompression.HighCompression
] as const;

interface MapFixture {
    mapState: MapState;
    map: IGameMap;
    layer: IResizableMapLayer;
}

/** 构造一个含事件层的最小地图状态与楼层，可传入点事件与初始图块 */
function createMapFixture(
    pointEvents: Record<number, Record<number, string>> = {},
    blocks: number[] = [1, 1, 1, 1]
): MapFixture {
    const tileStore = new TileStore();
    tileStore.addTile({
        num: 1,
        id: 'base',
        events: { 10: 'base-event' },
        type: TileType.Terrain,
        pass: { onlyEvents: false, outPass: 15, inPass: 15 },
        eventPass: true
    });
    tileStore.addTile({
        num: 2,
        id: 'alternate',
        events: { 20: 'alternate-event' },
        type: TileType.Terrain,
        pass: { onlyEvents: false, outPass: 15, inPass: 15 },
        eventPass: true
    });
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
    const mapState = new MapState(tileStore, state);
    const map = mapState.fromRaw({
        floorId: 'F1',
        width: 2,
        map: { 0: blocks },
        layerAlias: { 0: 'event' },
        events: { 0: pointEvents }
    });
    return {
        mapState,
        map: map!,
        layer: map!.getLayerByAlias('event')! as IResizableMapLayer
    };
}

/** 用当前图层矩阵作为参考基准，使 Low/High 压缩档具备可恢复基准 */
function setLayerReference(layer: IResizableMapLayer): void {
    layer.compareWith(new Uint32Array(layer.getMapData()));
}

describe('StaticTile save and load round trips', () => {
    // 验证静态图块覆盖事件在三个压缩档下同实例恢复且保存返回分离的事件映射
    it('restores covered events across all compressions', () => {
        for (const compression of SAVE_COMPRESSIONS) {
            const { layer } = createMapFixture();
            const tile = layer.getTile(0, 0)!;
            tile.tileEvent().set(30, 'override-event');

            const saved = tile.saveState(compression);
            const snapshot = new Map(saved.events!);
            tile.tileEvent().set(30, 'changed-after-save');

            expect(saved.events).toEqual(snapshot);

            tile.loadState(saved, compression);

            expect(tile.tileEvent().get()).toEqual(
                new Map([
                    [10, 'base-event'],
                    [30, 'override-event']
                ])
            );
        }
    });
});

describe('DynamicTile save and load round trips', () => {
    // 验证动态图块覆盖事件在三个压缩档下同实例恢复，存档记录当前图块数字
    it('restores covered events across all compressions', () => {
        for (const compression of SAVE_COMPRESSIONS) {
            const { layer } = createMapFixture();
            const tile = layer.createDynamic(1, 1, 0);
            tile.tileEvent().set(30, 'override-event');

            const saved = tile.saveState(compression);
            tile.tileEvent().set(30, 'changed-after-save');
            tile.loadState(saved, compression);

            expect(saved.num).toBe(1);
            expect(tile.num()).toBe(1);
            expect(tile.tileEvent().get()).toEqual(
                new Map([
                    [10, 'base-event'],
                    [30, 'override-event']
                ])
            );
        }
    });

    // 验证 loadState 恢复存档中的图块数字（#06-09-3 已修复）
    it('restores the tile num on the same instance', () => {
        const { layer } = createMapFixture();
        const tile = layer.createDynamic(1, 1, 0);

        const saved = tile.saveState(SaveCompression.NoCompression);
        tile.set(2);
        tile.loadState(saved, SaveCompression.NoCompression);

        expect(tile.num()).toBe(1);
    });
});

describe('MapLayer save and load round trips', () => {
    // 验证矩阵与点事件在三个压缩档下同实例恢复
    it('restores the matrix and point events across all compressions', () => {
        for (const compression of SAVE_COMPRESSIONS) {
            const { layer } = createMapFixture({ 1: { 5: 'raw-point' } });
            setLayerReference(layer);
            const point = layer.event(1, 0)!;
            point.set(7, 'saved-point');
            layer.setBlock(9, 0, 0);

            const saved = layer.saveState(compression);
            point.set(7, 'changed-after-save');
            layer.setBlock(0, 0, 0);
            layer.loadState(saved, compression);

            expect(layer.getBlock(0, 0)).toBe(9);
            expect(point.get()).toEqual(
                new Map([
                    [5, 'raw-point'],
                    [7, 'saved-point']
                ])
            );
        }
    });

    // 验证缺少参考基准的压缩档经 logger.catch 观测到警告码 124
    it('warns code 124 when the compression reference is missing', () => {
        const dirty = createMapFixture();
        const lowSave = dirty.layer.saveState(SaveCompression.LowCompression);

        const lowResult = logger.catch(() =>
            dirty.layer.loadState(lowSave, SaveCompression.LowCompression)
        );

        const highSave = dirty.layer.saveState(SaveCompression.HighCompression);
        const highResult = logger.catch(() =>
            dirty.layer.loadState(highSave, SaveCompression.HighCompression)
        );

        expect(lowResult.info.map(info => info.code)).toContain(124);
        expect(highResult.info.map(info => info.code)).toContain(124);
    });
});

describe('GameMap save and load round trips', () => {
    // 验证背景与图层矩阵在三个压缩档下同实例恢复
    it('restores background and layer matrices across all compressions', () => {
        for (const compression of SAVE_COMPRESSIONS) {
            const { map, layer } = createMapFixture();
            setLayerReference(layer);
            map.setBackground(7);
            layer.setBlock(9, 0, 0);

            const saved = map.saveState(compression);
            map.setBackground(0);
            layer.setBlock(0, 0, 0);
            map.loadState(saved, compression);

            expect(map.getBackground()).toBe(7);
            expect(layer.getBlock(0, 0)).toBe(9);
        }
    });
});

describe('MapState save and load round trips', () => {
    // 验证激活楼层矩阵在三个压缩档下同实例恢复
    it('restores active floor matrices across all compressions', () => {
        for (const compression of SAVE_COMPRESSIONS) {
            const { mapState, map, layer } = createMapFixture();
            map.setActiveStatus(true);
            mapState.compareWith(
                new Map([
                    ['F1', new Map([[0, new Uint32Array(layer.getMapData())]])]
                ])
            );
            layer.setBlock(9, 0, 0);

            const saved = mapState.saveState(compression);
            layer.setBlock(0, 0, 0);
            mapState.loadState(saved, compression);

            expect(mapState.isMapActive('F1')).toBe(true);
            expect(layer.getBlock(0, 0)).toBe(9);
        }
    });

    // 验证非无压缩读档且未比较基准时经 logger.catch 观测到错误码 55
    it('warns code 55 when loading a compressed MapState without a reference', () => {
        const { mapState } = createMapFixture();

        const result = logger.catch(() =>
            mapState.loadState(
                { floors: new Map() },
                SaveCompression.LowCompression
            )
        );

        expect(result.info.map(info => info.code)).toContain(55);
    });

    // 验证存档中缺失楼层时经 logger.catch 观测到警告码 122
    it('warns code 122 when a floor is missing during loadState', () => {
        const { mapState, map } = createMapFixture();

        const result = logger.catch(() =>
            mapState.loadState(
                {
                    floors: new Map([
                        [
                            'missing',
                            map.saveState(SaveCompression.NoCompression)
                        ]
                    ])
                },
                SaveCompression.NoCompression
            )
        );

        expect(result.info.map(info => info.code)).toContain(122);
    });
});
