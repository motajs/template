// 测试 DynamicTile 的创建告警、数字与原始数据、位置、朝向、转换和删除
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
import { DirectionMapper, logger } from '@motajs/common';
import { type IResizableMapLayer } from './types';
import { MapState } from './mapState';
import { DynamicTile } from './dynamicTile';

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

interface DynamicFixture {
    layer: IResizableMapLayer;
    roleFace: IRoleFaceBinder;
}

/** 构造一个含单图层的小地图，作为动态图块实例的宿主 */
function createFixture(blocks: number[] = [0, 0, 0, 0]): DynamicFixture {
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

describe('DynamicTile model', () => {
    // 验证构造时缺少图块原始数据会告警 143 且 raw 为空
    it('warns code 143 when the raw tile data is missing', () => {
        const { layer } = createFixture();

        const result = logger.catch(() => new DynamicTile(99, 0, 0, layer));

        expect(result.info.map(info => info.code)).toContain(143);
        expect(result.ret.num()).toBe(99);
        expect(result.ret.raw()).toBeNull();
    });

    // 验证 num 与 raw 跟随图块存储，set 到未知数字时告警 143
    it('reflects num and raw and warns 143 on an unknown set', () => {
        const { layer } = createFixture();
        const tile = layer.createDynamic(1, 0, 0);

        expect(tile.num()).toBe(1);
        expect(tile.raw()?.id).toBe('base');

        const result = logger.catch(() => tile.set(99));
        expect(result.info.map(info => info.code)).toContain(143);
        expect(tile.num()).toBe(99);
        expect(tile.raw()).toBeNull();

        tile.set(2);
        expect(tile.num()).toBe(2);
        expect(tile.raw()?.id).toBe('alternate');
        expect(tile.tileEvent().get()).toEqual(
            new Map([[20, 'alternate-event']])
        );
        expect(tile.tileEvent().dirty()).toBe(false);
    });

    // 验证 setPos 更新坐标并同步图层索引
    it('updates the position and the layer index through setPos', () => {
        const { layer } = createFixture();
        const tile = layer.createDynamic(1, 0, 0);

        tile.setPos(1, 1);

        expect(tile.x).toBe(1);
        expect(tile.y).toBe(1);
        expect([...layer.getDynamicTilesAt(1, 1)]).toContain(tile);
        expect([...layer.getDynamicTilesAt(0, 0)]).toEqual([]);
    });

    // 验证 getCurrentFaceDirection 依据朝向绑定返回 Unknown 或已绑定朝向
    it('reads the current face direction from the binder', () => {
        const { layer, roleFace } = createFixture();
        const tile = layer.createDynamic(1, 0, 0);

        expect(tile.getCurrentFaceDirection()).toBe(FaceDirection.Unknown);

        roleFace.malloc(1, FaceDirection.Down);
        expect(tile.getCurrentFaceDirection()).toBe(FaceDirection.Down);

        roleFace.bind(2, 1, FaceDirection.Right);
        tile.setFaceDirection(FaceDirection.Right);
        expect(tile.getCurrentFaceDirection()).toBe(FaceDirection.Right);
    });

    // 验证 toStatic 把动态图块写回静态图层并移出动态索引
    it('converts back to a static tile and removes it from the dynamic index', () => {
        const { layer } = createFixture();
        const tile = layer.createDynamic(1, 0, 0);

        const restored = tile.toStatic();

        expect(restored?.num()).toBe(1);
        expect(layer.getBlock(0, 0)).toBe(1);
        expect([...layer.getDynamicTilesAt(0, 0)]).toEqual([]);
    });

    // 验证 toStatic 覆盖已有静态图块时告警 129
    it('warns code 129 when toStatic overwrites an existing static tile', () => {
        const { layer } = createFixture([2, 0, 0, 0]);
        const tile = layer.createDynamic(1, 0, 0);

        const result = logger.catch(() => tile.toStatic());

        expect(result.info.map(info => info.code)).toContain(129);
        expect(result.ret?.num()).toBe(1);
    });

    // 验证 toStaticIfSafe 在目标点被占用时拒绝转换
    it('refuses toStaticIfSafe when the target cell is occupied', () => {
        const { layer } = createFixture([2, 0, 0, 0]);
        const tile = layer.createDynamic(1, 0, 0);

        expect(tile.toStaticIfSafe()).toBeNull();
        expect(layer.getBlock(0, 0)).toBe(2);
        expect([...layer.getDynamicTilesAt(0, 0)]).toContain(tile);
    });

    // 验证 step 返回控制器并在真实计时器下完成移动
    it('steps through the mover and resolves the controller', async () => {
        const { layer } = createFixture();
        const tile = layer.createDynamic(1, 0, 0);

        const controller = tile.step(FaceDirection.Right);
        expect(controller).not.toBeNull();
        expect(tile.mover.moving).toBe(true);

        await controller!.onEnd;

        expect(tile.x).toBe(1);
        expect(tile.y).toBe(0);
        expect([...layer.getDynamicTilesAt(1, 0)]).toContain(tile);
    });

    // 验证 delete 异步删除动态图块并清空动态索引
    it('deletes the dynamic tile and clears the index', async () => {
        const { layer } = createFixture();
        const tile = layer.createDynamic(1, 0, 0);

        await tile.delete();

        expect([...layer.getDynamicTilesAt(0, 0)]).toEqual([]);
        expect([...layer.iterateDynamicTiles()]).toEqual([]);
    });
});
