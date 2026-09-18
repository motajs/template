// 测试 DynamicTileMover 的异步移动生命周期、位移写回与非法移动码告警 126
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import {
    type IDataCommon,
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
import { DynamicTileMover } from './mover';

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

afterEach(() => {
    vi.restoreAllMocks();
});

afterAll(() => {
    vi.unstubAllGlobals();
});

/**
 * 构造一条最小图块原始数据
 * @param num 图块数字
 * @param id 图块字符串 id
 */
function createTileData(num: number, id: string): ITileRawData {
    return {
        num,
        id,
        events: {},
        type: TileType.Terrain,
        pass: { onlyEvents: false, outPass: 15, inPass: 15 },
        eventPass: true
    };
}

interface MoverFixture {
    layer: IResizableMapLayer;
    tile: DynamicTile;
}

/** 构造一个绑定动态图块的移动器宿主 */
function createMoverFixture(): MoverFixture {
    const tileStore = new TileStore();
    tileStore.addTile(createTileData(1, 'base'));
    tileStore.addTile(createTileData(2, 'alternate'));
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
        width: 3,
        map: { 0: [0, 0, 0, 0, 0, 0] },
        layerAlias: { 0: 'event' },
        events: { 0: {} }
    })!;
    const layer = map.getLayerByAlias('event')! as IResizableMapLayer;
    const tile = layer.createDynamic(1, 0, 0) as DynamicTile;
    return { layer, tile };
}

/** 强制返回非成功移动码的移动器，用于覆盖非法移动码分支 */
class NonSuccessMover extends DynamicTileMover {
    protected onStepStart(): Promise<number> {
        return Promise.resolve(1);
    }
}

describe('DynamicTileMover movement', () => {
    // 验证成功步进写回坐标并同步图层索引
    it('moves the tile and updates the layer index on a successful step', async () => {
        const { layer, tile } = createMoverFixture();
        const mover = tile.mover;

        mover.step(FaceDirection.Right);
        const controller = mover.start();

        expect(controller).not.toBeNull();
        expect(mover.moving).toBe(true);
        await controller!.onEnd;

        expect(tile.x).toBe(1);
        expect(tile.y).toBe(0);
        expect(mover.moving).toBe(false);
        expect([...layer.getDynamicTilesAt(1, 0)]).toContain(tile);
        expect([...layer.getDynamicTilesAt(0, 0)]).toEqual([]);
    });

    // 验证连续步数与斜向移动的位移累计
    it('accumulates the requested step count and diagonal movement', async () => {
        const { tile } = createMoverFixture();

        tile.mover.step(FaceDirection.Right, 2);
        await tile.mover.start()!.onEnd;
        expect(tile.x).toBe(2);
        expect(tile.y).toBe(0);

        tile.mover.step(FaceDirection.LeftUp);
        await tile.mover.start()!.onEnd;
        expect(tile.x).toBe(1);
        expect(tile.y).toBe(-1);
    });

    // 验证非成功移动码告警 126 且图块停在原地
    it('warns code 126 for an unexpected move code and keeps the position', async () => {
        const { tile } = createMoverFixture();
        const warn = vi.spyOn(logger, 'warn');
        const mover = new NonSuccessMover(tile);

        mover.step(FaceDirection.Right);
        await mover.start()!.onEnd;

        expect(warn.mock.calls.some(call => call[0] === 126)).toBe(true);
        expect(tile.x).toBe(0);
        expect(tile.y).toBe(0);
    });

    // 验证移动开始、单步与结束钩子按生命周期顺序触发
    it('fires the movement lifecycle hooks in order', async () => {
        const { tile } = createMoverFixture();
        const calls: string[] = [];
        tile.mover
            .addHook({
                onMoveStart: async () => {
                    calls.push('moveStart');
                },
                onStepStart: async () => {
                    calls.push('stepStart');
                },
                onStepEnd: async () => {
                    calls.push('stepEnd');
                },
                onMoveEnd: async () => {
                    calls.push('moveEnd');
                }
            })
            .load();

        tile.mover.step(FaceDirection.Down);
        await tile.mover.start()!.onEnd;

        expect(calls).toEqual(['moveStart', 'stepStart', 'stepEnd', 'moveEnd']);
    });

    // 验证重复 start 在移动进行中返回 null
    it('rejects a second start while already moving', async () => {
        const { tile } = createMoverFixture();

        tile.mover.step(FaceDirection.Right);
        const first = tile.mover.start();
        expect(first).not.toBeNull();
        expect(tile.mover.start()).toBeNull();

        await first!.onEnd;
    });

    // 验证移动器默认朝向来自图块且当前朝向随绑定更新
    it('reads the initial face direction from the tile', () => {
        const { layer, tile } = createMoverFixture();
        const mover = new DynamicTileMover(tile);

        expect(mover.faceDirection).toBe(FaceDirection.Unknown);

        layer.state.roleFace.malloc(1, FaceDirection.Down);
        const bound = new DynamicTileMover(tile);
        expect(bound.faceDirection).toBe(FaceDirection.Down);
    });
});
