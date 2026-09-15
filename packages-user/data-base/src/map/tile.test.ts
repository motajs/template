// 测试 MapTileBase 经静态/动态图块呈现的图块数字、原始数据、默认事件和点位事件联动
import { afterAll, describe, expect, it, vi } from 'vitest';
import {
    type IDataCommon,
    type IRoleFaceBinder,
    type ITileRawData,
    Dir8FaceHandler,
    FaceDirection,
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

interface TileFixture {
    layer: IResizableMapLayer;
    roleFace: IRoleFaceBinder;
}

/** 构造一个含单图层的小地图，作为图块实例的宿主 */
function createFixture(blocks: number[] = [2, 1, 1, 2]): TileFixture {
    const tileStore = new TileStore();
    tileStore.addTile(createTileData(1, 'base', { 10: 'base-event' }));
    tileStore.addTile(
        createTileData(2, 'alternate', { 20: 'alternate-event' })
    );
    const roleFace = new RoleFaceBinder();
    const faceManager = new FaceManager();
    faceManager.register(FaceGroup.Dir8, new Dir8FaceHandler());
    const state: IDataCommon = {
        tileStore,
        itemStore: {},
        mapStore: {},
        eventStore: {},
        roleFace,
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
    return {
        layer: map.getLayerByAlias('event')! as IResizableMapLayer,
        roleFace
    };
}

describe('MapTileBase tile identity', () => {
    // 验证 num/raw/set 始终与图块存储中的数据保持一致
    it('reflects the tile store through num, raw and set', () => {
        const { layer } = createFixture();
        const tile = layer.getTile(0, 0)!;

        expect(tile.num()).toBe(2);
        expect(tile.raw()?.id).toBe('alternate');

        tile.set(1);
        expect(tile.num()).toBe(1);
        expect(tile.raw()?.id).toBe('base');
        expect(tile.raw()?.num).toBe(1);
    });

    // 验证 set 切换图块后恢复该图块默认事件并把事件视图标回纯基准
    it('restores the default events and marks the view pure after set', () => {
        const { layer } = createFixture();
        const tile = layer.getTile(0, 0)!;

        expect(tile.tileEvent().get()).toEqual(
            new Map([[20, 'alternate-event']])
        );
        expect(tile.tileEvent().dirty()).toBe(false);

        tile.set(1);
        expect(tile.tileEvent().get()).toEqual(new Map([[10, 'base-event']]));
        expect(tile.tileEvent().dirty()).toBe(false);
    });

    // 验证每个图块实例持有独立的图块事件视图
    it('keeps a tile event view per tile instance', () => {
        const { layer } = createFixture();
        const first = layer.getTile(0, 0)!;
        const second = layer.getTile(1, 0)!;

        first.tileEvent().set(30, 'first-only');

        expect(second.tileEvent().get()).toEqual(new Map([[10, 'base-event']]));
        expect(second.tileEvent().dirty()).toBe(false);
    });

    // 验证 pointEvent 返回该图块坐标的层点位视图，越图时返回 null
    it('delegates pointEvent to the layer view and returns null outside the map', () => {
        const { layer } = createFixture();
        const tile = layer.getTile(0, 0)!;

        expect(tile.pointEvent()).toBe(layer.event(0, 0));
        layer.event(0, 0)!.set(5, 'point-event');
        expect(tile.pointEvent()!.get()).toEqual(new Map([[5, 'point-event']]));

        const outside = new StaticTile(5, 5, layer);
        expect(outside.pointEvent()).toBeNull();
    });

    // 验证 setFaceDirection 经朝向绑定器映射并返回映射后的图块数字
    it('maps the face direction through the binder and returns the new num', () => {
        const { layer, roleFace } = createFixture([1, 1, 1, 1]);
        roleFace.malloc(1, FaceDirection.Down);
        roleFace.bind(2, 1, FaceDirection.Right);
        const tile = layer.getTile(0, 0)!;

        expect(tile.setFaceDirection(FaceDirection.Right)).toBe(2);
        expect(tile.num()).toBe(2);

        expect(tile.setFaceDirection(FaceDirection.Up)).toBe(2);
        expect(tile.num()).toBe(2);
    });
});

describe('MapTileBase on dynamic tiles', () => {
    // 验证动态图块的 num/raw/set 与设置后默认事件恢复和静态图块一致
    it('reflects num, raw and default events on a dynamic tile', () => {
        const { layer } = createFixture([0, 0, 0, 0]);
        const tile = layer.createDynamic(1, 0, 0);

        expect(tile.num()).toBe(1);
        expect(tile.raw()?.id).toBe('base');

        tile.set(2);
        expect(tile.num()).toBe(2);
        expect(tile.raw()?.id).toBe('alternate');
        expect(tile.tileEvent().get()).toEqual(
            new Map([[20, 'alternate-event']])
        );
        expect(tile.tileEvent().dirty()).toBe(false);
    });
});
