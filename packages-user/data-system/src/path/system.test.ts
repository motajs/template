// 测试寻路系统：最小损失搜索、自定义损失、仅取路径、控制器契约与回退策略
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { type ITileLocator } from '@motajs/common';
import { FaceDirection } from '@user/data-common';
import {
    type IDataCommon,
    type IFaceHandler,
    type IObjectMovable,
    type IObjectMover,
    type ITileStore,
    ObjectMoveStep,
    ObjectMoveType
} from '@user/data-common';
import {
    type IGameMap,
    type IMapLayer,
    type IPassCheckHandler,
    type IPassPredicate
} from '@user/data-base';
import { type PathfindingSystem } from './system';
import { type IPathfindingStep, type PathCostFunction } from './types';

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
    PathfindingSystem: typeof import('./system').PathfindingSystem;
    MapState: typeof import('@user/data-base').MapState;
    TileStore: typeof import('@user/data-common').TileStore;
    ObjectMover: typeof import('@user/data-common').ObjectMover;
    FaceManager: typeof import('@user/data-common').FaceManager;
    Dir8FaceHandler: typeof import('@user/data-common').Dir8FaceHandler;
    RoleFaceBinder: typeof import('@user/data-common').RoleFaceBinder;
    logger: typeof import('@motajs/common').logger;
}

let modules: TestModules;

beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    const systemModule = await import('./system');
    const baseModule = await import('@user/data-base');
    const commonModule = await import('@user/data-common');
    const motaModule = await import('@motajs/common');
    modules = {
        PathfindingSystem: systemModule.PathfindingSystem,
        MapState: baseModule.MapState,
        TileStore: commonModule.TileStore,
        ObjectMover: commonModule.ObjectMover,
        FaceManager: commonModule.FaceManager,
        Dir8FaceHandler: commonModule.Dir8FaceHandler,
        RoleFaceBinder: commonModule.RoleFaceBinder,
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

const ALL_TILES: TestTileDefinition[] = [OPEN_TILE, WALL_TILE, HIT_TILE];

interface TestTile extends IObjectMovable {
    /** 当前横坐标 */
    x: number;
    /** 当前纵坐标 */
    y: number;
    /** 绑定的移动器 */
    mover: IObjectMover<TestTile>;
    /** setPos 调用记录 */
    readonly setPosCalls: { x: number; y: number }[];
}

/**
 * 复刻 DefaultHeroMoveTopImpl 掩码语义的测试谓词：
 * 事件层恒参与判定，四角朝向直接放行
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
        const curr = event.getLocationData(currLoc.x, currLoc.y);
        const next = event.getLocationData(nextLoc.x, nextLoc.y);
        const currRaw = curr?.static.raw();
        const nextRaw = next?.static.raw();
        if (currRaw) {
            canLeave = !!(leaveMask & currRaw.pass.outPass);
        }
        if (nextRaw) {
            canEnter = !!(enterMask & nextRaw.pass.inPass);
        }
        return canLeave && canEnter;
    }

    shouldHit(handler: IPassCheckHandler): boolean {
        const event = this.map.eventLayer;
        if (!event) return false;
        const { nextLoc } = handler;
        const next = event.getLocationData(nextLoc.x, nextLoc.y);
        const nextRaw = next?.static.raw();
        if (!nextRaw) return false;
        return !nextRaw.eventPass;
    }
}

interface SystemFixture {
    /** 楼层地图对象 */
    map: IGameMap;
    /** 事件层图层对象 */
    layer: IMapLayer;
    /** 被测寻路系统 */
    system: PathfindingSystem;
    /** 绑定的测试移动对象 */
    tile: TestTile;
}

/**
 * 创建测试用移动对象，移动器由工厂注入
 */
function createTestTile(): TestTile {
    class TestMover
        extends modules.ObjectMover<TestTile>
        implements IObjectMover<TestTile>
    {
        readonly tile: TestTile;

        constructor(tile: TestTile) {
            super(new modules.Dir8FaceHandler(), FaceDirection.Down);
            this.tile = tile;
        }

        protected override async onMoveStart(): Promise<void> {}

        protected override async onMoveEnd(): Promise<void> {}

        protected override async onStepStart(): Promise<number> {
            // 移动代码对基类不透明，固定传 0 即可
            return 0;
        }

        protected override async onStepEnd(
            _code: number,
            step: Readonly<ObjectMoveStep>,
            tile: TestTile
        ): Promise<ITileLocator> {
            if (step.type === ObjectMoveType.Teleport) {
                return { x: step.x, y: step.y };
            }
            if (step.type === ObjectMoveType.Dir) {
                switch (step.move) {
                    case FaceDirection.Right:
                        return { x: tile.x + 1, y: tile.y };
                    case FaceDirection.Left:
                        return { x: tile.x - 1, y: tile.y };
                    case FaceDirection.Up:
                        return { x: tile.x, y: tile.y - 1 };
                    case FaceDirection.Down:
                        return { x: tile.x, y: tile.y + 1 };
                    default:
                        return { x: tile.x, y: tile.y };
                }
            }
            return { x: tile.x, y: tile.y };
        }

        protected override async onStepSettled(): Promise<void> {}
    }

    class TestTileImpl implements TestTile {
        x: number = 0;
        y: number = 0;
        face: FaceDirection = FaceDirection.Down;
        mover: IObjectMover<TestTile>;
        readonly setPosCalls: { x: number; y: number }[] = [];

        constructor() {
            this.mover = new TestMover(this);
        }

        setPos(x: number, y: number): void {
            this.x = x;
            this.y = y;
            this.setPosCalls.push({ x, y });
        }

        getCurrentFaceDirection(): FaceDirection {
            return this.face;
        }
    }

    return new TestTileImpl();
}

/**
 * 创建绑定地图与移动对象的寻路系统夹具，
 * 通行性谓词与损失函数由测试按需注入
 * @param rows 每行图块数字，行长为宽度乘高度
 * @param width 地图宽度
 */
function createSystem(rows: number[], width: number): SystemFixture {
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
        saveSystem: {}
    } as never;
    const maps = new modules.MapState(tileStore, commonState);
    const map = maps.fromRaw({
        floorId: 'F1',
        width,
        map: { 0: rows },
        layerAlias: { 0: 'event' },
        events: { 0: {} }
    })!;
    const layer = map.getLayerByAlias('event')!;
    const system = new modules.PathfindingSystem(commonState as never);
    const tile = createTestTile();
    system.useMover(tile.mover);
    system.finder.useMapState(maps);
    system.finder.useMapLayer(layer);
    return { map, layer, system, tile };
}

/**
 * 向夹具注入复刻掩码语义的测试谓词
 * @param fixture 寻路系统测试夹具
 */
function injectPredicate(fixture: SystemFixture): void {
    const predicate = new FixturePredicate(
        fixture.map,
        new modules.Dir8FaceHandler()
    );
    fixture.system.finder.usePassPredicate(predicate);
}

describe('pathfinding system', () => {
    // 验证默认每格损失 1 时返回格数最少的步骤序列，每步含方向与起终点
    it('returns the shortest step sequence with default unit cost', () => {
        const fixture = createSystem([1, 1, 1, 1, 1, 1, 1, 1, 1], 3);
        injectPredicate(fixture);

        const steps = fixture.system.finder.find(
            { x: 0, y: 0 },
            { x: 2, y: 0 }
        );

        expect(steps).toEqual([
            {
                dir: FaceDirection.Right,
                from: { x: 0, y: 0 },
                to: { x: 1, y: 0 }
            },
            {
                dir: FaceDirection.Right,
                from: { x: 1, y: 0 },
                to: { x: 2, y: 0 }
            }
        ]);
    });

    // 验证注入自定义损失后选择损失更小的岔路而非步数最少的直路
    it('reroutes through the cheaper fork with a custom cost function', () => {
        const fixture = createSystem([1, 1, 1, 1, 1, 1, 1, 1, 1], 3);
        injectPredicate(fixture);
        const cost: PathCostFunction = block =>
            block.locator.x === 1 && block.locator.y === 1 ? 10 : 1;
        fixture.system.finder.useCostFunction(cost);

        const steps = fixture.system.finder.find(
            { x: 0, y: 1 },
            { x: 2, y: 1 }
        );

        expect(steps).toHaveLength(4);
        for (const step of steps) {
            expect(step.to).not.toEqual({ x: 1, y: 1 });
        }
    });

    // 验证损失函数返回 NaN 时告警新码 174 并按默认损失 1 处理
    it('warns the cost guard code and falls back to unit cost on NaN', () => {
        const fixture = createSystem([1, 1, 1, 1, 1, 1, 1, 1, 1], 3);
        injectPredicate(fixture);
        const cost: PathCostFunction = block =>
            block.locator.x === 1 && block.locator.y === 1 ? Number.NaN : 1;
        fixture.system.finder.useCostFunction(cost);

        const result = modules.logger.catch(() =>
            fixture.system.finder.find({ x: 0, y: 1 }, { x: 2, y: 1 })
        );

        expect(result.info.map(info => info.code)).toContain(174);
        expect(result.ret).toHaveLength(2);
    });

    // 验证不可达目标返回空数组且不移动对象
    it('returns an empty path and never moves for unreachable targets', () => {
        const fixture = createSystem([1, 6, 1, 1, 6, 1, 1, 6, 1], 3);
        injectPredicate(fixture);
        fixture.tile.x = 0;
        fixture.tile.y = 0;

        const steps = fixture.system.finder.find(
            { x: 0, y: 0 },
            { x: 2, y: 1 }
        );
        const path = fixture.system.getPath({ x: 2, y: 1 });

        expect(steps).toEqual([]);
        expect(path).toEqual([]);
        expect(fixture.tile.x).toBe(0);
        expect(fixture.tile.y).toBe(0);
        expect(fixture.tile.setPosCalls).toEqual([]);
    });

    // 验终端节点不可作为中间节点穿越但可作为路径终点
    it('never passes through terminal nodes but may end on them', () => {
        const fixture = createSystem([1, 5, 1, 1, 1, 1, 1, 1, 1], 3);
        injectPredicate(fixture);

        const detour = fixture.system.finder.find(
            { x: 0, y: 0 },
            { x: 2, y: 0 }
        );
        expect(detour).toHaveLength(4);
        for (const step of detour) {
            expect(step.to).not.toEqual({ x: 1, y: 0 });
        }

        const direct = fixture.system.finder.find(
            { x: 0, y: 0 },
            { x: 1, y: 0 }
        );
        expect(direct).toEqual([
            {
                dir: FaceDirection.Right,
                from: { x: 0, y: 0 },
                to: { x: 1, y: 0 }
            }
        ]);
    });

    // 验证 moveTo 有路径时返回含控制器与路径的包装并真实到达目标
    it('moves step by step to the target and wraps the controller', async () => {
        const fixture = createSystem([1, 1, 1, 1, 1, 1, 1, 1, 1], 3);
        injectPredicate(fixture);

        const result = fixture.system.moveTo({ x: 2, y: 0 });

        expect(result).not.toBeNull();
        expect(result!.path).toHaveLength(2);
        await result!.controller.onEnd;
        expect(fixture.tile.x).toBe(2);
        expect(fixture.tile.y).toBe(0);
    });

    // 验证未绑定移动器或无路径时 moveTo 返回 null 而非异常
    it('returns null from moveTo when mover is unbound or unreachable', () => {
        const fixture = createSystem([1, 6, 1, 1, 6, 1, 1, 6, 1], 3);
        injectPredicate(fixture);
        fixture.system.useMover(null);

        expect(fixture.system.moveTo({ x: 2, y: 1 })).toBeNull();

        fixture.system.useMover(fixture.tile.mover);
        expect(fixture.system.moveTo({ x: 2, y: 1 })).toBeNull();
    });

    // 验证已有移动进行中时再次寻路返回 null
    it('returns null on a new move while another move is in progress', () => {
        const fixture = createSystem([1, 1, 1, 1, 1, 1, 1, 1, 1], 3);
        injectPredicate(fixture);

        const first = fixture.system.moveTo({ x: 2, y: 0 });
        const second = fixture.system.moveTo({ x: 2, y: 0 });

        expect(first).not.toBeNull();
        expect(second).toBeNull();
        return first!.controller.onEnd;
    });

    // 验证未注入回退策略时瞬移请求默认回退为逐步寻路
    it('falls back to step-by-step movement when policy is null', async () => {
        const fixture = createSystem([1, 1, 1], 3);
        injectPredicate(fixture);

        const result = fixture.system.teleportTo({ x: 2, y: 0 });

        expect(result).not.toBeNull();
        await result!.controller.onEnd;
        expect(fixture.tile.setPosCalls).toEqual([
            { x: 1, y: 0 },
            { x: 2, y: 0 }
        ]);
        expect(fixture.tile.x).toBe(2);
    });

    // 验证回退策略以路径步骤序列为入参被调用并生效于移动方式决策
    it('consults the fallback policy with the path steps and honors it', async () => {
        const fixture = createSystem([1, 1, 1], 3);
        injectPredicate(fixture);
        let received: readonly IPathfindingStep[] | null = null;
        fixture.system.useFallbackPolicy(path => {
            received = path;
            return true;
        });

        const stepped = fixture.system.teleportTo({ x: 2, y: 0 });

        expect(received).not.toBeNull();
        expect(received).toHaveLength(2);
        await stepped!.controller.onEnd;
        expect(fixture.tile.setPosCalls).toEqual([
            { x: 1, y: 0 },
            { x: 2, y: 0 }
        ]);

        const teleportFixture = createSystem([1, 1, 1], 3);
        injectPredicate(teleportFixture);
        teleportFixture.system.useFallbackPolicy(() => false);

        const teleported = teleportFixture.system.teleportTo({ x: 2, y: 0 });

        expect(teleported).not.toBeNull();
        await teleported!.controller.onEnd;
        expect(teleportFixture.tile.setPosCalls).toEqual([{ x: 2, y: 0 }]);
        expect(teleportFixture.tile.x).toBe(2);
    });

    // 验证未绑定地图状态或移动对象时告警新码 173 并返回空结果
    it('warns the guard code and returns empty results when unbound', () => {
        const system = new modules.PathfindingSystem({} as never);

        const findResult = modules.logger.catch(() =>
            system.finder.find({ x: 0, y: 0 }, { x: 1, y: 0 })
        );
        const pathResult = modules.logger.catch(() =>
            system.getPath({ x: 1, y: 0 })
        );

        expect(findResult.ret).toEqual([]);
        expect(findResult.info.map(info => info.code)).toContain(173);
        expect(pathResult.ret).toEqual([]);
        expect(pathResult.info.map(info => info.code)).toContain(173);
    });

    // 验证打断入口可安全调用并停止进行中的移动
    it('interrupts the ongoing pathfinding move safely', async () => {
        const fixture = createSystem([1, 1, 1], 3);
        injectPredicate(fixture);

        const result = fixture.system.moveTo({ x: 2, y: 0 });
        expect(result).not.toBeNull();
        await fixture.system.interrupt();
        await result!.controller.onEnd;
        expect(result!.controller.done).toBe(true);
    });
});
