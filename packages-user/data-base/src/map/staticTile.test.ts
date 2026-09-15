// 测试 StaticTile 的图块数字、原始数据、设置、默认事件与转换为动态图块
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
import { DirectionMapper } from '@motajs/common';
import { type IResizableMapLayer } from './types';
import { MapState } from './mapState';
import { StaticTile } from './staticTile';

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

/** 构造一个含单图层的小地图，作为静态图块实例的宿主 */
function createFixture(blocks: number[] = [1, 2, 1, 2]): IResizableMapLayer {
    const tileStore = new TileStore();
    tileStore.addTile(createTileData(1, 'base', { 10: 'base-event' }));
    tileStore.addTile(
        createTileData(2, 'alternate', { 20: 'alternate-event' })
    );
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
        events: { 0: {} }
    })!;
    return map.getLayerByAlias('event')! as IResizableMapLayer;
}

describe('StaticTile model', () => {
    // 验证 num 与 raw 跟随图层图块与图块存储，未知数字返回空原始数据
    it('reports num and raw from the layer and the tile store', () => {
        const layer = createFixture();
        const tile = layer.getTile(0, 0)!;

        expect(tile.num()).toBe(1);
        expect(tile.raw()?.id).toBe('base');
        expect(tile.raw()?.num).toBe(1);

        tile.set(2);
        expect(tile.num()).toBe(2);
        expect(tile.raw()?.id).toBe('alternate');

        tile.set(99);
        expect(tile.num()).toBe(99);
        expect(tile.raw()).toBeNull();
    });

    // 验证 set 写入图层并恢复新图块默认事件、标记为纯基准
    it('writes the layer and restores default events on set', () => {
        const layer = createFixture();
        const tile = layer.getTile(0, 0)!;

        tile.set(2);

        expect(layer.getBlock(0, 0)).toBe(2);
        expect(tile.tileEvent().get()).toEqual(
            new Map([[20, 'alternate-event']])
        );
        expect(tile.tileEvent().dirty()).toBe(false);
    });

    // 验证 shouldSave 仅在事件视图偏离默认基准时为真
    it('only reports shouldSave when the tile events deviate', () => {
        const layer = createFixture();
        const tile = layer.getTile(0, 0)!;

        expect(tile.shouldSave()).toBe(false);

        tile.tileEvent().set(30, 'runtime-event');
        expect(tile.shouldSave()).toBe(true);

        tile.tileEvent().delete(30);
        expect(tile.shouldSave()).toBe(false);
    });

    // 验证 toDynamic 清空静态图块并生成继承默认事件的动态图块
    it('converts to a dynamic tile and clears the static block', () => {
        const layer = createFixture();
        const tile = layer.getTile(0, 0)!;

        const dynamic = tile.toDynamic();

        expect(tile.num()).toBe(0);
        expect(layer.getBlock(0, 0)).toBe(0);
        expect(dynamic.num()).toBe(1);
        expect(dynamic.tileEvent().get()).toEqual(
            new Map([[10, 'base-event']])
        );
    });

    // 验证直接构造越图静态图块时 num 为 -1 且 raw 为空
    it('reports an out-of-map tile as num -1 with no raw data', () => {
        const layer = createFixture();
        const outside = new StaticTile(9, 9, layer);

        expect(outside.num()).toBe(-1);
        expect(outside.raw()).toBeNull();
    });
});
