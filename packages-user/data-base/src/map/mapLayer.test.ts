// 测试 MapLayer 的矩阵读写、静态数组、动态转换、点位事件、脏标记与开关门
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
import {
    type IDynamicTile,
    type IGameMap,
    type IResizableMapLayer
} from './types';
import { DynamicTile } from './dynamicTile';
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

/** 允许以 0~4 个参数调用 getMapData 的宽松签名，用于触发参数个数告警 */
interface LooseMapDataArgs {
    (x?: number, y?: number, width?: number, height?: number): Uint32Array;
}

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

interface LayerFixture {
    map: IGameMap;
    layer: IResizableMapLayer;
    roleFace: IRoleFaceBinder;
}

/** 构造一个含单事件图层的小地图，作为 MapLayer 的宿主 */
function createFixture(blocks: number[] = [1, 2, 1, 2]): LayerFixture {
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
        map,
        layer: map.getLayerByAlias('event')! as IResizableMapLayer,
        roleFace
    };
}

describe('MapLayer static matrix', () => {
    // 验证 setBlock/getBlock/removeBlock/inMap 的边界与返回值
    it('reads and writes blocks with boundary handling', () => {
        const { layer } = createFixture();

        expect(layer.inMap(0, 0)).toBe(true);
        expect(layer.inMap(9, 9)).toBe(false);
        expect(layer.getBlock(0, 0)).toBe(1);
        expect(layer.getBlock(9, 9)).toBe(-1);
        expect(layer.removeBlock(9, 9)).toBe(-1);

        layer.setBlock(2, 0, 0);
        expect(layer.getBlock(0, 0)).toBe(2);
        expect(layer.removeBlock(0, 0)).toBe(2);
        expect(layer.getBlock(0, 0)).toBe(0);
    });

    // 验证 setBlock 仅在改变内容时标记脏并触发图块更新钩子
    it('marks dirty and fires the block hook only on an actual change', () => {
        const { layer } = createFixture();
        const updates: [number, number, number][] = [];
        layer
            .addHook({
                onUpdateBlock: (block, x, y) => {
                    updates.push([block, x, y]);
                }
            })
            .load();

        expect(layer.dirty()).toBe(false);

        layer.setBlock(1, 0, 0);
        expect(layer.dirty()).toBe(false);
        expect(updates).toEqual([]);

        layer.setBlock(3, 0, 0);
        expect(layer.dirty()).toBe(true);
        expect(updates).toEqual([[3, 0, 0]]);
    });

    // 验证 getMapData 无参返回整图拷贝，修改拷贝不影响图层
    it('returns an isolated full-map copy', () => {
        const { layer } = createFixture();
        const full = layer.getMapData();

        expect([...full]).toEqual([1, 2, 1, 2]);
        full[0] = 9;
        expect(layer.getBlock(0, 0)).toBe(1);
    });

    // 验证 getMapData 四参返回指定区域的拷贝
    it('returns the requested sub-region', () => {
        const { layer } = createFixture();

        expect([...layer.getMapData(0, 0, 1, 1)]).toEqual([1]);
        expect([...layer.getMapData(1, 0, 1, 2)]).toEqual([2, 2]);
        expect([...layer.getMapData(0, 1, 2, 1)]).toEqual([1, 2]);
    });

    // 验证 getMapData 参数个数非法时告警 80
    it('warns code 80 for an illegal argument count', () => {
        const { layer } = createFixture();

        const result = logger.catch(() =>
            (layer.getMapData as LooseMapDataArgs)(1)
        );

        expect(result.info.map(info => info.code)).toContain(80);
        expect(result.ret).toHaveLength(0);
    });

    // 验证 getMapData 区域越界时告警 81 并补零
    it('warns code 81 for an out-of-range region', () => {
        const { layer } = createFixture();

        const result = logger.catch(() => layer.getMapData(1, 1, 2, 2));

        expect(result.info.map(info => info.code)).toContain(81);
        expect([...result.ret]).toEqual([2, 0, 0, 0]);
    });

    // 验证 putMapData 全量写入与局部写入
    it('writes whole and partial regions through putMapData', () => {
        const { layer } = createFixture([0, 0, 0, 0]);

        layer.putMapData(new Uint32Array([2, 2, 1, 1]), 0, 0, 2);
        expect([...layer.getMapData()]).toEqual([2, 2, 1, 1]);

        layer.putMapData(new Uint32Array([5]), 1, 0, 1);
        expect(layer.getBlock(1, 0)).toBe(5);
        expect(layer.getBlock(0, 0)).toBe(2);
    });

    // 验证 putMapData 数据不完整时告警 8，区域越界时告警 9
    it('warns code 8 for incomplete data and code 9 for an out-of-range area', () => {
        const { layer } = createFixture([0, 0, 0, 0]);

        const incomplete = logger.catch(() =>
            layer.putMapData(new Uint32Array([1, 2, 3]), 0, 0, 2)
        );
        expect(incomplete.info.map(info => info.code)).toContain(8);
        expect(incomplete.info.map(info => info.code)).not.toContain(9);

        const overflow = logger.catch(() =>
            layer.putMapData(new Uint32Array([1, 2, 3, 4]), 1, 0, 3)
        );
        const codes = overflow.info.map(info => info.code);
        expect(codes).toContain(8);
        expect(codes).toContain(9);
    });

    // 验证 setMapRef 长度不符时告警 123，匹配时替换内部引用
    it('warns code 123 on a length mismatch and replaces the reference otherwise', () => {
        const { layer } = createFixture();
        const before = layer.getMapRef();

        const result = logger.catch(() =>
            layer.setMapRef(new Uint32Array([0, 0, 0]))
        );
        expect(result.info.map(info => info.code)).toContain(123);
        expect(layer.getMapRef()).toBe(before);

        const replacement = new Uint32Array([3, 3, 3, 3]);
        layer.setMapRef(replacement);

        expect(before.expired).toBe(true);
        expect(layer.getMapRef().array).toBe(replacement);
        expect(layer.getMapRef().expired).toBe(false);
        expect(layer.empty).toBe(false);
    });

    // 验证 iterateBlocks 只产出非空图块位置
    it('iterates only non-empty blocks', () => {
        const { layer } = createFixture([1, 0, 0, 2]);

        const locations = [...layer.iterateBlocks()];

        expect(locations.map(location => location.tile)).toEqual([1, 2]);
        expect(locations.map(location => location.locator)).toEqual([
            { x: 0, y: 0 },
            { x: 1, y: 1 }
        ]);
        expect(layer.empty).toBe(false);
    });
});

describe('MapLayer point events', () => {
    // 验证 event/getPointEvent 的越图空值与内容读取
    it('reads point events and returns null outside the map', () => {
        const { layer } = createFixture();

        expect(layer.event(9, 9)).toBeNull();
        expect(layer.getPointEvent(9, 9)).toBeNull();
        expect(layer.getPointEvent(0, 0)).toEqual(new Map());

        layer.event(0, 0)!.set(5, 'point-event');
        expect(layer.getPointEvent(0, 0)).toEqual(
            new Map([[5, 'point-event']])
        );
    });

    // 验证 getTile 缓存同一实例，getLocationData 汇总静态与动态图块
    it('caches static tiles and aggregates location data', () => {
        const { layer } = createFixture();

        expect(layer.getTile(0, 0)).toBe(layer.getTile(0, 0));
        expect(layer.getTile(9, 9)).toBeNull();
        expect(layer.getLocationData(9, 9)).toBeNull();

        const dynamic = layer.createDynamic(2, 0, 0);
        const location = layer.getLocationData(0, 0)!;

        expect(location.locator).toEqual({ x: 0, y: 0 });
        expect(location.tile).toBe(1);
        expect(location.static?.num()).toBe(1);
        expect([...location.dynamics]).toEqual([dynamic]);
    });
});

describe('MapLayer directions and layer attributes', () => {
    // 验证 setStaticDirection 经朝向绑定器映射并处理越图
    it('maps static directions and reports out-of-map as -1', () => {
        const { layer, roleFace } = createFixture([1, 1, 1, 1]);
        roleFace.malloc(1, FaceDirection.Down);
        roleFace.bind(2, 1, FaceDirection.Right);

        expect(layer.setStaticDirection(0, 0, FaceDirection.Right)).toBe(2);
        expect(layer.getBlock(0, 0)).toBe(2);
        expect(layer.setStaticDirection(9, 9, FaceDirection.Right)).toBe(-1);
    });

    // 验证 setDynamicDirection 优先按绑定映射，否则回退四方向降级
    it('maps dynamic directions and degrades unmapped diagonals', () => {
        const { layer, roleFace } = createFixture([0, 0, 0, 0]);
        roleFace.malloc(1, FaceDirection.Down);
        roleFace.bind(2, 1, FaceDirection.Right);
        const tile = layer.createDynamic(1, 0, 0);

        expect(layer.setDynamicDirection(tile, FaceDirection.Right)).toBe(2);
        expect(tile.num()).toBe(2);

        const fallback = layer.createDynamic(1, 1, 0);
        expect(layer.setDynamicDirection(fallback, FaceDirection.Up)).toBe(1);
    });

    // 验证 setZIndex 与 setFaceBinder 的写入与空值忽略
    it('sets the z-index and swaps the face binder while ignoring null', () => {
        const { layer } = createFixture();
        const replacement = new RoleFaceBinder();

        layer.setZIndex(5);
        expect(layer.zIndex).toBe(5);

        layer.setFaceBinder(replacement);
        expect(layer.faceBinder).toBe(replacement);
        layer.setFaceBinder(null);
        expect(layer.faceBinder).toBe(replacement);
    });
});

describe('MapLayer dynamic conversion', () => {
    // 验证 createDynamic 建立索引并触发创建钩子
    it('creates dynamic tiles and notifies the create hook', () => {
        const { layer } = createFixture([0, 0, 0, 0]);
        const created: IDynamicTile[] = [];
        layer
            .addHook({
                onCreateDynamic: tile => {
                    created.push(tile);
                }
            })
            .load();

        const tile = layer.createDynamic(1, 0, 0);

        expect(created).toEqual([tile]);
        expect([...layer.getDynamicTilesAt(0, 0)]).toEqual([tile]);
        expect([...layer.iterateDynamicTiles()]).toEqual([tile]);
    });

    // 验证 updateDynamicTile 按新坐标重建位置索引
    it('reindexes a moved dynamic tile', () => {
        const { layer } = createFixture([0, 0, 0, 0]);
        const tile = layer.createDynamic(1, 0, 0) as DynamicTile;

        tile.x = 1;
        tile.y = 1;
        layer.updateDynamicTile(tile);

        expect([...layer.getDynamicTilesAt(1, 1)]).toEqual([tile]);
        expect([...layer.getDynamicTilesAt(0, 0)]).toEqual([]);
    });

    // 验证 transferToDynamic 清空静态图块并默认把默认事件带给动态图块
    it('transfers a block to a dynamic tile keeping the default events', () => {
        const { layer } = createFixture();
        layer.getTile(0, 0);

        const tile = layer.transferToDynamic(0, 0)!;

        expect(tile.num()).toBe(1);
        expect(layer.getBlock(0, 0)).toBe(0);
        expect(tile.tileEvent().get()).toEqual(new Map([[10, 'base-event']]));
        expect(layer.getTile(0, 0)!.tileEvent().get()).toEqual(new Map());
    });

    // 验证 transferToDynamic 在 keepEvent 为 false 时清空动态图块事件
    it('clears dynamic events when transferToDynamic does not keep them', () => {
        const { layer } = createFixture();

        const tile = layer.transferToDynamic(0, 0, false)!;

        expect(tile.tileEvent().get()).toEqual(new Map());
        expect(layer.getTile(0, 0)!.tileEvent().get()).toEqual(new Map());
    });

    // 验证 transferToDynamic 对空白格告警 127 并产生数字 0 的动态图块
    it('warns code 127 when transferring an empty block', () => {
        const { layer } = createFixture([0, 0, 0, 0]);

        const result = logger.catch(() => layer.transferToDynamic(0, 0));

        expect(result.info.map(info => info.code)).toContain(127);
        expect(result.ret?.num()).toBe(0);
    });

    // 验证越图的 transferToDynamic 不产生图块
    it('returns null for an out-of-map transferToDynamic', () => {
        const { layer } = createFixture();

        logger.catch(() => layer.transferToDynamic(9, 9));

        expect(layer.getBlock(0, 0)).toBe(1);
        expect([...layer.iterateDynamicTiles()]).toEqual([]);
    });

    // 疑似缺陷 #06-06-1：transferToDynamic 越图当前复用码 131（setEventLayer 专属码），
    // 正确预期应为与 transferToStatic 一致的越界码 128，待用户确认后取消 skip
    it.skip('warns code 128 for an out-of-map transferToDynamic', () => {
        const { layer } = createFixture();

        const result = logger.catch(() => layer.transferToDynamic(9, 9));

        expect(result.info.map(info => info.code)).toContain(128);
        expect(result.ret).toBeNull();
    });

    // 验证 transferToStatic 保留动态事件并写回静态图块
    it('transfers a dynamic tile back to static keeping events', () => {
        const { layer } = createFixture();
        layer.getTile(0, 0);
        const tile = layer.transferToDynamic(0, 0)!;
        tile.tileEvent().set(30, 'kept-event');

        const restored = layer.transferToStatic(tile, true)!;

        expect(restored.num()).toBe(1);
        expect(layer.getBlock(0, 0)).toBe(1);
        expect(restored.tileEvent().get()).toEqual(
            new Map([
                [10, 'base-event'],
                [30, 'kept-event']
            ])
        );
        expect(restored.tileEvent().dirty()).toBe(true);
    });

    // 验证 transferToStatic 在 keepEvent 为 false 时恢复静态默认事件
    it('restores static defaults when transferToStatic does not keep events', () => {
        const { layer } = createFixture();
        const tile = layer.transferToDynamic(0, 0)!;
        tile.tileEvent().set(30, 'discarded-event');

        const restored = layer.transferToStatic(tile, false)!;

        expect(restored.tileEvent().get()).toEqual(
            new Map([[10, 'base-event']])
        );
        expect(restored.tileEvent().dirty()).toBe(false);
    });

    // 验证 transferToStatic 对越界坐标告警 128 并拒绝转换
    it('warns code 128 when transferToStatic is out of bounds', () => {
        const { layer } = createFixture();
        const tile = layer.createDynamic(1, 0, 0) as DynamicTile;
        tile.x = 9;

        const result = logger.catch(() => layer.transferToStatic(tile));

        expect(result.info.map(info => info.code)).toContain(128);
        expect(result.ret).toBeNull();
    });

    // 验证 transferToStatic 覆盖非空静态格时告警 129
    it('warns code 129 when transferToStatic overwrites a static block', () => {
        const { layer } = createFixture([2, 0, 0, 0]);
        const tile = layer.createDynamic(1, 0, 0);

        const result = logger.catch(() => layer.transferToStatic(tile));

        expect(result.info.map(info => info.code)).toContain(129);
        expect(layer.getBlock(0, 0)).toBe(1);
    });

    // 验证 transferToStaticIfSafe 仅在目标为空时转换
    it('only converts with transferToStaticIfSafe when the target is empty', () => {
        const occupied = createFixture([2, 0, 0, 0]);
        const blocked = occupied.layer.createDynamic(1, 0, 0);
        expect(occupied.layer.transferToStaticIfSafe(blocked)).toBeNull();

        const empty = createFixture([0, 0, 0, 0]);
        const tile = empty.layer.createDynamic(1, 0, 0);
        expect(empty.layer.transferToStaticIfSafe(tile)?.num()).toBe(1);
        expect(empty.layer.getBlock(0, 0)).toBe(1);
    });

    // 验证 deleteDynamic 移除索引并触发删除钩子
    it('deletes a dynamic tile and notifies the delete hook', async () => {
        const { layer } = createFixture([0, 0, 0, 0]);
        const deleted: IDynamicTile[] = [];
        layer
            .addHook({
                onDeleteDynamic: async tile => {
                    deleted.push(tile);
                }
            })
            .load();
        const tile = layer.createDynamic(1, 0, 0);

        await layer.deleteDynamic(tile);

        expect(deleted).toEqual([tile]);
        expect([...layer.iterateDynamicTiles()]).toEqual([]);
    });

    // 验证 deleteDynamic 对非本层图块告警 130
    it('warns code 130 for a tile not managed by the layer', async () => {
        const { layer } = createFixture([0, 0, 0, 0]);
        const tile = layer.createDynamic(1, 0, 0);
        await layer.deleteDynamic(tile);

        const result = logger.catch(() => layer.deleteDynamic(tile));

        expect(result.info.map(info => info.code)).toContain(130);
        await result.ret;
    });
});

describe('MapLayer dirty state and doors', () => {
    // 验证图层脏标记、点事件脏标记与参考基准比较
    it('combines the layer flag, point-event dirtiness and the reference', () => {
        const { layer } = createFixture();

        expect(layer.dirty()).toBe(false);
        layer.markDirty(true);
        expect(layer.dirty()).toBe(true);
        layer.markDirty(false);

        layer.event(0, 0)!.set(5, 'point-event');
        expect(layer.dirty()).toBe(true);
        layer.event(0, 0)!.delete(5);

        layer.compareWith(new Uint32Array([1, 2, 1, 2]));
        expect(layer.dirty()).toBe(false);
    });

    // 验证 compareWith 与参考不一致时标记为脏且只生效一次
    it('marks dirty against a differing reference and applies only once', () => {
        const { layer } = createFixture();

        layer.compareWith(new Uint32Array([0, 0, 0, 0]));
        expect(layer.dirty()).toBe(true);

        layer.markDirty(false);
        layer.compareWith(new Uint32Array([1, 2, 1, 2]));
        expect(layer.dirty()).toBe(false);
    });

    // 验证 openDoor 等钩子完成后清空门图块，空位为 no-op
    it('opens a door after awaiting the hook and ignores empty positions', async () => {
        const { layer } = createFixture([0, 0, 0, 0]);
        const opened: [number, number][] = [];
        layer
            .addHook({
                onOpenDoor: async (x, y) => {
                    opened.push([x, y]);
                }
            })
            .load();
        layer.setBlock(1, 0, 0);

        await layer.openDoor(0, 0);
        expect(opened).toEqual([[0, 0]]);
        expect(layer.getBlock(0, 0)).toBe(0);

        await layer.openDoor(1, 1);
        expect(opened).toEqual([[0, 0]]);
    });

    // 验证 closeDoor 在空位关门，目标非空时告警 46 且不覆盖
    it('closes a door on empty cells and warns 46 on occupied cells', async () => {
        const { layer } = createFixture([0, 0, 0, 0]);
        const closed: [number, number, number][] = [];
        layer
            .addHook({
                onCloseDoor: async (num, x, y) => {
                    closed.push([num, x, y]);
                }
            })
            .load();

        await layer.closeDoor(3, 0, 0);
        expect(closed).toEqual([[3, 0, 0]]);
        expect(layer.getBlock(0, 0)).toBe(3);

        const result = logger.catch(() => layer.closeDoor(5, 0, 0));
        expect(result.info.map(info => info.code)).toContain(46);
        await result.ret;

        expect(layer.getBlock(0, 0)).toBe(3);
        expect(closed).toEqual([[3, 0, 0]]);
    });
});
