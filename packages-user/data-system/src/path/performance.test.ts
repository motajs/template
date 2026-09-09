// 测试寻路性能：从有向图构建到最优路径发现的完整 find 流水线总耗时
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { type ITileLocator } from '@motajs/common';
import { FaceDirection } from '@user/data-common';
import {
    type IDataCommon,
    type IFaceHandler,
    type IObjectMovable,
    type IObjectMover,
    type ITileStore
} from '@user/data-common';
import {
    type IGameMap,
    type IPassCheckHandler,
    type IPassPredicate
} from '@user/data-base';
import { PathfindingGraphBuilder } from './graph';
import { type PathfindingSystem } from './system';

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
}

let modules: TestModules;

beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    const systemModule = await import('./system');
    const baseModule = await import('@user/data-base');
    const commonModule = await import('@user/data-common');
    modules = {
        PathfindingSystem: systemModule.PathfindingSystem,
        MapState: baseModule.MapState,
        TileStore: commonModule.TileStore,
        ObjectMover: commonModule.ObjectMover,
        FaceManager: commonModule.FaceManager,
        Dir8FaceHandler: commonModule.Dir8FaceHandler,
        RoleFaceBinder: commonModule.RoleFaceBinder
    };
});

/** 性能地图尺寸矩阵，覆盖小图到大图的缩放趋势 */
const MAP_SIZES = [10, 30, 60, 100, 150];

/** 分段测量重复运行的次数 */
const RUNS = 5;

interface MeasureResult<T> {
    /** 被测函数的返回值 */
    value: T;
    /** 本次测量的耗时，单位 ms */
    duration: number;
}

interface TestTile extends IObjectMovable {
    x: number;
    y: number;
    face: FaceDirection;
    mover: IObjectMover<TestTile>;
}

/**
 * 以 performance.mark/measure 测量一次函数调用的耗时，
 * 测量前后清理同名标记与测量项，避免性能条目累积
 * @param name 测量名称，同时用作标记前缀
 * @param fn 被测函数
 */
function measureCall<T>(name: string, fn: () => T): MeasureResult<T> {
    const startMark = `${name}:start`;
    const endMark = `${name}:end`;
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(name);
    performance.mark(startMark);
    const value = fn();
    performance.mark(endMark);
    performance.measure(name, startMark, endMark);
    const duration = performance
        .getEntriesByName(name, 'measure')
        .at(-1)!.duration;
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(name);
    return { value, duration };
}

/**
 * 汇总一组耗时数据的最小值与平均值
 * @param times 耗时列表，单位 ms
 */
function stat(times: number[]): string {
    const min = Math.min(...times);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    return `min=${min.toFixed(2)}ms avg=${avg.toFixed(2)}ms`;
}

/**
 * 各地图尺寸的宽松耗时上限，单位 ms，仅作 sanity 把关，随节点数放宽
 * @param size 地图边长
 */
function sanityLimit(size: number): number {
    return 500 + size * size;
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
        const currRaw = curr?.static?.raw();
        const nextRaw = next?.static?.raw();
        if (currRaw) {
            canLeave = !!(leaveMask & currRaw.pass.outPass);
        }
        if (nextRaw) {
            canEnter = !!(enterMask & nextRaw.pass.inPass);
        }
        return canLeave && canEnter;
    }

    shouldHit(): boolean {
        return false;
    }
}

/**
 * 以固定种子生成含约两成墙体的确定性地图数据，
 * 起点与终点强制为开阔图块
 * @param size 地图边长
 */
function generateRows(size: number): number[] {
    let seed = 20260909;
    const next = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
    };
    const rows: number[] = [];
    for (let i = 0; i < size * size; i++) {
        rows.push(next() < 0.2 ? 6 : 1);
    }
    rows[0] = 1;
    rows[size * size - 1] = 1;
    return rows;
}

/**
 * 创建绑定指定尺寸地图与移动对象的寻路系统夹具
 * @param rows 每行图块数字，行长为宽度乘高度
 * @param width 地图宽度
 */
function createPerformanceSystem(rows: number[], width: number) {
    const tileStore: ITileStore = new modules.TileStore() as never;
    const tileDefs = [
        { num: 1, id: 'open', outPass: 15, inPass: 15 },
        { num: 6, id: 'wall', outPass: 0, inPass: 0 }
    ];
    for (const tile of tileDefs) {
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
            eventPass: true
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
        floorId: 'PERF',
        width,
        map: { 0: rows },
        layerAlias: { 0: 'event' },
        events: { 0: {} }
    })!;
    const layer = map.getLayerByAlias('event')!;
    const predicate = new FixturePredicate(map, new modules.Dir8FaceHandler());

    class PerfMover
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
            return 0;
        }

        protected override async onStepEnd(): Promise<ITileLocator> {
            return { x: this.tile.x, y: this.tile.y };
        }

        protected override async onStepSettled(): Promise<void> {}
    }

    class PerfTile implements TestTile {
        x: number = 0;
        y: number = 0;
        face: FaceDirection = FaceDirection.Down;
        mover: IObjectMover<TestTile>;

        constructor() {
            this.mover = new PerfMover(this);
        }

        setPos(x: number, y: number): void {
            this.x = x;
            this.y = y;
        }

        getCurrentFaceDirection(): FaceDirection {
            return this.face;
        }
    }

    const tile = new PerfTile();
    const system: PathfindingSystem = new modules.PathfindingSystem(
        commonState as never
    );
    system.useMover(tile.mover);
    system.finder.useMapState(maps);
    system.finder.useMapLayer(layer);
    system.finder.usePassPredicate(predicate);
    return {
        system,
        buildGraph: (): ReturnType<PathfindingGraphBuilder['build']> => {
            const builder = new PathfindingGraphBuilder();
            builder.useMapState(maps);
            builder.useMapLayer(layer);
            builder.usePassPredicate(predicate);
            return builder.build({ x: 0, y: 0 });
        }
    };
}

describe('pathfinding performance', () => {
    // 验证各尺寸障碍地图上从建图到最优路径发现的完整寻路耗时均处于可用量级
    it('completes the full find pipeline across the map size matrix within the sanity bounds', () => {
        for (const size of MAP_SIZES) {
            const rows = generateRows(size);
            const fixture = createPerformanceSystem(rows, size);

            const { value: steps, duration: elapsed } = measureCall(
                'pathfinding-perf',
                () => fixture.system.getPath({ x: size - 1, y: size - 1 })
            );

            // 审查要求输出结构化性能数据供汇报使用
            // eslint-disable-next-line no-console
            console.log(
                `[pathfinding-perf] map=${size}x${size} ` +
                    `steps=${steps.length} elapsed=${elapsed.toFixed(2)}ms`
            );

            expect(steps.length).toBeGreaterThan(0);
            expect(elapsed).toBeLessThan(sanityLimit(size));
        }
    });

    // 验证各尺寸下分段测量图构建与搜索各自耗时，多轮运行以确认总耗时的主要来源
    it('measures graph build and search phases separately across the map size matrix', () => {
        for (const size of MAP_SIZES) {
            const rows = generateRows(size);
            const fixture = createPerformanceSystem(rows, size);
            const target: ITileLocator = { x: size - 1, y: size - 1 };

            const buildTimes: number[] = [];
            const findTimes: number[] = [];
            let steps = 0;

            for (let i = 0; i < RUNS; i++) {
                const build = measureCall('pathfinding-build', () =>
                    fixture.buildGraph()
                );
                buildTimes.push(build.duration);
                expect(build.value.nodes.size).toBeGreaterThan(0);

                const find = measureCall('pathfinding-find', () =>
                    fixture.system.getPath(target)
                );
                findTimes.push(find.duration);
                steps = find.value.length;
            }

            // 审查要求输出结构化分段性能数据供汇报使用
            // eslint-disable-next-line no-console
            console.log(
                `[pathfinding-segmented] map=${size}x${size} ` +
                    `steps=${steps} runs=${RUNS}\n` +
                    `  graph_build: ${stat(buildTimes)}\n` +
                    `  full_find(build+search): ${stat(findTimes)}\n` +
                    `  search_only(approx = find - build): ${stat(
                        findTimes.map((t, i) => t - buildTimes[i]!)
                    )}`
            );

            expect(steps).toBeGreaterThan(0);
        }
    });
});
