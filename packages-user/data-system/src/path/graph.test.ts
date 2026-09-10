// 测试寻路有向图构建：BFS 可达过滤、邻域方向组、单向门、终端节点分类、损失预计算与边界守卫
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { FaceDirection } from '@user/data-common';
import {
    type IDataCommon,
    type IFaceHandler,
    type ITileStore
} from '@user/data-common';
import {
    type IGameMap,
    type IPassCheckHandler,
    type IPassPredicate
} from '@user/data-base';
import { InternalDirectionGroup } from '@motajs/common';

vi.hoisted(() => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
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

interface TestModules {
    PathfindingGraphBuilder: typeof import('./graph').PathfindingGraphBuilder;
    MapState: typeof import('@user/data-base').MapState;
    TileStore: typeof import('@user/data-common').TileStore;
    FaceManager: typeof import('@user/data-common').FaceManager;
    Dir8FaceHandler: typeof import('@user/data-common').Dir8FaceHandler;
    RoleFaceBinder: typeof import('@user/data-common').RoleFaceBinder;
    DirectionMapper: typeof import('@motajs/common').DirectionMapper;
    logger: typeof import('@motajs/common').logger;
}

let modules: TestModules;

beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    const graphModule = await import('./graph');
    const baseModule = await import('@user/data-base');
    const commonModule = await import('@user/data-common');
    const motaModule = await import('@motajs/common');
    modules = {
        PathfindingGraphBuilder: graphModule.PathfindingGraphBuilder,
        MapState: baseModule.MapState,
        TileStore: commonModule.TileStore,
        FaceManager: commonModule.FaceManager,
        Dir8FaceHandler: commonModule.Dir8FaceHandler,
        RoleFaceBinder: commonModule.RoleFaceBinder,
        DirectionMapper: motaModule.DirectionMapper,
        logger: motaModule.logger
    };
});

interface TestTileDefinition {
    /** 图块数字 */
    num: number;
    /** 图块字符串 id */
    id: string;
    /** 可以离开的方向 */
    outPass: number;
    /** 可以进入的方向 */
    inPass: number;
    /** 事件可通行性，`false` 表示撞击触发 */
    eventPass: boolean;
}

/** 开阔图块：四向可进可出 */
const OPEN_TILE: TestTileDefinition = {
    num: 1,
    id: 'open',
    outPass: 15,
    inPass: 15,
    eventPass: true
};

/** 单向门图块：仅可向右离开，不可从任何方向进入 */
const ONEWAY_TILE: TestTileDefinition = {
    num: 3,
    id: 'oneway',
    outPass: 0b0010,
    inPass: 0,
    eventPass: true
};

/** 汇入图块：仅可从左方向进入，不可离开 */
const SINK_TILE: TestTileDefinition = {
    num: 4,
    id: 'sink',
    outPass: 0,
    inPass: 0b1000,
    eventPass: true
};

/** 墙体图块：不可进入也不可离开 */
const WALL_TILE: TestTileDefinition = {
    num: 6,
    id: 'wall',
    outPass: 0,
    inPass: 0,
    eventPass: true
};

/** 撞击图块：四向可进可出但事件不通行，构成终端节点 */
const HIT_TILE: TestTileDefinition = {
    num: 5,
    id: 'hit',
    outPass: 15,
    inPass: 15,
    eventPass: false
};

const ALL_TILES: TestTileDefinition[] = [
    OPEN_TILE,
    WALL_TILE,
    ONEWAY_TILE,
    SINK_TILE,
    HIT_TILE
];

/**
 * 复刻 DefaultHeroMoveTopImpl 掩码语义的测试谓词：
 * 事件层恒参与判定，其余层仅当 onlyEvents 为真时参与
 */
class FixturePredicate implements IPassPredicate {
    /** 绑定的楼层地图对象 */
    private readonly map: IGameMap;
    /** 朝向管理对象，用于求相反方向 */
    private readonly face: IFaceHandler<FaceDirection>;

    constructor(map: IGameMap, face: IFaceHandler<FaceDirection>) {
        this.map = map;
        this.face = face;
    }

    /**
     * 将朝向转换为对应的通行性位掩码
     * @param dir 朝向
     */
    private passBit(dir: FaceDirection): number {
        switch (dir) {
            case FaceDirection.Up:
                return 0b0001;
            case FaceDirection.Right:
                return 0b0010;
            case FaceDirection.Down:
                return 0b0100;
            case FaceDirection.Left:
                return 0b1000;
            default:
                return 0;
        }
    }

    canPass(handler: IPassCheckHandler): boolean {
        const event = this.map.eventLayer;
        if (!event) return false;
        const { currLoc, nextLoc, direction } = handler;

        // 四角朝向直接判定为可通行，与 moverImpl 语义一致
        if (
            direction === FaceDirection.LeftDown ||
            direction === FaceDirection.LeftUp ||
            direction === FaceDirection.RightDown ||
            direction === FaceDirection.RightUp
        ) {
            return true;
        }

        const opposite = this.face.opposite(direction);
        const leaveMask = this.passBit(direction);
        const enterMask = this.passBit(opposite);

        let canLeave = true;
        let canEnter = true;

        // 判断事件层
        const curr = event.getLocationData(currLoc.x, currLoc.y);
        const next = event.getLocationData(nextLoc.x, nextLoc.y);
        const currRaw = curr?.static?.raw();
        const nextRaw = next?.static?.raw();
        if (currRaw) {
            canLeave = !!(leaveMask & currRaw.pass.outPass);
        }
        if (nextRaw) {
            canEnter = !!(enterMask & nextRaw.pass.inPass);
        }
        if (!canLeave || !canEnter) return false;

        // 判断其他层，仅 onlyEvents 图块参与判定
        for (const layer of this.map.layerList) {
            if (layer === event) continue;
            const other = layer.getLocationData(currLoc.x, currLoc.y);
            const otherNext = layer.getLocationData(nextLoc.x, nextLoc.y);
            const otherRaw = other?.static?.raw();
            const otherNextRaw = otherNext?.static?.raw();
            if (otherRaw?.pass.onlyEvents) {
                canLeave = !!(leaveMask & otherRaw.pass.outPass);
            }
            if (otherNextRaw?.pass.onlyEvents) {
                canEnter = !!(enterMask & otherNextRaw.pass.inPass);
            }
            if (!canLeave || !canEnter) return false;
        }
        return true;
    }

    shouldHit(handler: IPassCheckHandler): boolean {
        const event = this.map.eventLayer;
        if (!event) return false;
        const { nextLoc } = handler;
        const next = event.getLocationData(nextLoc.x, nextLoc.y);
        const nextRaw = next?.static?.raw();
        if (!nextRaw) return false;
        return !nextRaw.eventPass;
    }
}

/**
 * 创建测试地图与有向图构建器
 * @param rows 每行图块数字，行长为宽度乘高度
 * @param width 地图宽度
 * @param predicate 注入的通行性谓词，传入 `null` 表示不注入
 */
function createFixture(
    rows: number[],
    width: number,
    predicate: IPassPredicate | null
) {
    const tileStore: ITileStore = new modules.TileStore() as never;
    for (const tile of ALL_TILES) {
        tileStore.addTile({
            num: tile.num,
            id: tile.id,
            events: {},
            type: 0,
            pass: {
                onlyEvents: false,
                outPass: tile.outPass,
                inPass: tile.inPass
            },
            eventPass: tile.eventPass
        });
    }
    const faceManager = new modules.FaceManager();
    faceManager.register(1, new modules.Dir8FaceHandler());
    const commonState: IDataCommon = {
        tileStore,
        itemStore: {},
        mapStore: {},
        eventStore: {},
        roleFace: new modules.RoleFaceBinder(),
        faceManager,
        directionMapper: new modules.DirectionMapper(),
        saveSystem: {}
    } as never;
    const maps = new modules.MapState(tileStore, commonState);
    const map = maps.fromRaw({
        floorId: 'F1',
        width,
        map: { 0: rows },
        layerAlias: { 0: 'event' },
        events: { 0: {} }
    });
    const layer = map!.getLayerByAlias('event')!;
    const builder = new modules.PathfindingGraphBuilder();
    builder.useMapState(maps);
    builder.useMapLayer(layer);
    if (predicate) {
        builder.usePassPredicate(predicate);
    }
    return { maps, map: map!, layer, builder };
}

describe('pathfinding graph building', () => {
    // 验证未注入谓词时无可通行边，BFS 仅包含起始位置自身且无损失告警
    it('includes only the start node when no predicate is injected', () => {
        const { map, builder } = createFixture(
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            3,
            null
        );
        builder.useMapLayer(map.getLayerByAlias('event'));
        const graph = builder.build({ x: 1, y: 1 });

        expect(graph.width).toBe(3);
        expect(graph.height).toBe(3);
        expect(graph.nodes.size).toBe(1);
        const start = graph.nodes.get(1 * 3 + 1)!;
        expect(start.edges).toHaveLength(0);
        expect(start.terminal).toBe(false);
        expect(start.cost).toBe(1);
    });

    // 验证注入谓词后中心节点邻域方向数与 DirectionMapper 四正交组一致为 4
    it('resolves four orthogonal neighbor edges for the center node', () => {
        const { map, builder } = createFixture(
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            3,
            null
        );
        const mapper = new modules.DirectionMapper();
        const expected = [...mapper.map(InternalDirectionGroup.Dir4)];
        const predicate = new FixturePredicate(
            map,
            new modules.Dir8FaceHandler()
        );
        builder.usePassPredicate(predicate);
        const graph = builder.build({ x: 1, y: 1 });

        const center = graph.nodes.get(1 * 3 + 1)!;
        expect(center.edges).toHaveLength(expected.length);
        expect(center.edges).toHaveLength(4);
        const dirs = new Set(center.edges.map(edge => edge.dir));
        expect(dirs).toEqual(
            new Set([
                FaceDirection.Up,
                FaceDirection.Down,
                FaceDirection.Left,
                FaceDirection.Right
            ])
        );
    });

    // 验证 useDirGroup 注入八方向组后中心节点拥有 8 条邻域边
    it('expands neighbor edges to eight when Dir8 group is injected', () => {
        const { map, builder } = createFixture(
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            3,
            null
        );
        const predicate = new FixturePredicate(
            map,
            new modules.Dir8FaceHandler()
        );
        builder.usePassPredicate(predicate);
        builder.useDirGroup(InternalDirectionGroup.Dir8);
        const graph = builder.build({ x: 1, y: 1 });

        const center = graph.nodes.get(1 * 3 + 1)!;
        expect(center.edges).toHaveLength(8);
    });

    // 验证单向门图边方向性：A→B 可行而 B→A 不可行
    it('keeps one-way gates directional from A to B only', () => {
        const { map, builder } = createFixture([3, 4], 2, null);
        const predicate = new FixturePredicate(
            map,
            new modules.Dir8FaceHandler()
        );
        builder.usePassPredicate(predicate);
        const graph = builder.build({ x: 0, y: 0 });

        const source = graph.nodes.get(0)!;
        const sink = graph.nodes.get(1)!;
        expect(source.edges).toEqual([{ dir: FaceDirection.Right, to: 1 }]);
        expect(sink.edges).toHaveLength(0);
        expect(sink.terminal).toBe(false);
    });

    // 验证 canPass 为真但 shouldHit 为真的图块被分类为仅可作路径终点的终端节点
    it('marks can-pass but should-hit blocks as terminal nodes', () => {
        const { map, builder } = createFixture([1, 5, 1], 3, null);
        const predicate = new FixturePredicate(
            map,
            new modules.Dir8FaceHandler()
        );
        builder.usePassPredicate(predicate);
        const graph = builder.build({ x: 0, y: 0 });

        const hit = graph.nodes.get(1)!;
        expect(hit.terminal).toBe(true);
        // 终端节点仍保留入边，可作为路径终点
        expect(graph.nodes.get(0)!.edges).toEqual([
            { dir: FaceDirection.Right, to: 1 }
        ]);
        expect(graph.nodes.get(0)!.terminal).toBe(false);
        expect(graph.nodes.get(2)!.terminal).toBe(false);
    });

    // 验证图层未绑定时构建入口告警新码 173 并返回空图而非异常
    it('warns the registered code and returns an empty graph without layer', () => {
        const builder = new modules.PathfindingGraphBuilder();
        builder.useMapLayer(null);

        const result = modules.logger.catch(() =>
            builder.build({ x: 0, y: 0 })
        );

        expect(result.ret.nodes.size).toBe(0);
        expect(result.info.map(info => info.code)).toContain(173);
    });

    // 验证起始位置越界时构建入口同样告警新码 173 并返回空图
    it('warns the registered code and returns an empty graph when start is out of map', () => {
        const { builder } = createFixture([1, 1, 1, 1, 1, 1, 1, 1, 1], 3, null);

        const result = modules.logger.catch(() =>
            builder.build({ x: 3, y: 0 })
        );

        expect(result.ret.nodes.size).toBe(0);
        expect(result.ret.width).toBe(0);
        expect(result.info.map(info => info.code)).toContain(173);
    });

    // 验证墙体隔断区域不进入有向图：图仅包含从起始位置沿可通行边可达的节点
    it('excludes walled-off regions from the graph', () => {
        const { map, builder } = createFixture(
            [1, 6, 1, 1, 6, 1, 1, 6, 1],
            3,
            null
        );
        builder.usePassPredicate(
            new FixturePredicate(map, new modules.Dir8FaceHandler())
        );
        const graph = builder.build({ x: 0, y: 0 });

        expect(graph.nodes.size).toBe(3);
        expect(graph.nodes.has(0)).toBe(true);
        expect(graph.nodes.has(3)).toBe(true);
        expect(graph.nodes.has(6)).toBe(true);
        expect(graph.nodes.has(2)).toBe(false);
        expect(graph.nodes.has(5)).toBe(false);
        expect(graph.nodes.has(8)).toBe(false);
    });

    // 验证节点损失在构建时预计算：自定义损失函数的取值直接出现在 node.cost 上
    it('precomputes node costs from the injected cost function at build time', () => {
        const { map, builder } = createFixture(
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            3,
            null
        );
        builder.usePassPredicate(
            new FixturePredicate(map, new modules.Dir8FaceHandler())
        );
        builder.useCostFunction(block =>
            block.locator.x === 1 && block.locator.y === 1 ? 7 : 3
        );
        const graph = builder.build({ x: 1, y: 1 });

        expect(graph.nodes.get(1 * 3 + 1)!.cost).toBe(7);
        expect(graph.nodes.get(0)!.cost).toBe(3);
        expect(graph.nodes.get(2 * 3 + 2)!.cost).toBe(3);
    });

    // 验证 Infinity 是合法损失值：构建时不告警，损失值原样保留在节点上
    it('allows Infinity as a legitimate node cost without warning', () => {
        const { map, builder } = createFixture(
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            3,
            null
        );
        builder.usePassPredicate(
            new FixturePredicate(map, new modules.Dir8FaceHandler())
        );
        builder.useCostFunction(block =>
            block.locator.x === 1 && block.locator.y === 1
                ? Number.POSITIVE_INFINITY
                : 1
        );

        const result = modules.logger.catch(() =>
            builder.build({ x: 0, y: 0 })
        );

        expect(result.info.map(info => info.code)).not.toContain(174);
        expect(result.ret.nodes.get(1 * 3 + 1)!.cost).toBe(
            Number.POSITIVE_INFINITY
        );
    });

    // 验证 NaN 损失在构建时告警新码 174 且每个非法节点仅告警一次，并回退为损失 1
    it('warns once per invalid node per build and falls back to unit cost on NaN', () => {
        const { map, builder } = createFixture(
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            3,
            null
        );
        builder.usePassPredicate(
            new FixturePredicate(map, new modules.Dir8FaceHandler())
        );
        builder.useCostFunction(block =>
            block.locator.x === 1 && block.locator.y === 1 ? Number.NaN : 1
        );

        const result = modules.logger.catch(() =>
            builder.build({ x: 0, y: 0 })
        );

        expect(result.info.filter(info => info.code === 174)).toHaveLength(1);
        expect(result.ret.nodes.get(1 * 3 + 1)!.cost).toBe(1);
    });

    // 验证负数损失同样在构建时告警新码 174 并回退为损失 1
    it('warns and falls back to unit cost on negative node cost', () => {
        const { map, builder } = createFixture(
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            3,
            null
        );
        builder.usePassPredicate(
            new FixturePredicate(map, new modules.Dir8FaceHandler())
        );
        builder.useCostFunction(block =>
            block.locator.x === 1 && block.locator.y === 1 ? -2 : 1
        );

        const result = modules.logger.catch(() =>
            builder.build({ x: 0, y: 0 })
        );

        expect(result.info.filter(info => info.code === 174)).toHaveLength(1);
        expect(result.ret.nodes.get(1 * 3 + 1)!.cost).toBe(1);
    });
});
