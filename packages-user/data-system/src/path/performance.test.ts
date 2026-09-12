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
    DirectionMapper: typeof import('@motajs/common').DirectionMapper;
    RoleFaceBinder: typeof import('@user/data-common').RoleFaceBinder;
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
        DirectionMapper: motaModule.DirectionMapper
    };
});

/** 性能地图尺寸矩阵，覆盖小图到大图的缩放趋势 */
const MAP_SIZES = [10, 30, 60, 100, 150];

/** 分段测量重复运行的次数 */
const RUNS = 5;

/** 真实地图分段测量重复运行的次数，13x13 图极小需更多样本稳定均值 */
const REAL_RUNS = 20;

/** 真实地图端点伪随机抽选的固定种子 */
const REALMAP_SEED = 20260909;

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

interface TestTileDef {
    /** 图块数字 */
    num: number;
    /** 图块 id 别名 */
    id: string;
    /** 离开该图块的通行掩码 */
    outPass: number;
    /** 进入该图块的通行掩码 */
    inPass: number;
}

/** 合成尺寸矩阵夹具的图块定义：数字 1 为开阔空地，数字 6 为墙体 */
const SYNTHETIC_TILE_DEFS: TestTileDef[] = [
    { num: 1, id: 'open', outPass: 15, inPass: 15 },
    { num: 6, id: 'wall', outPass: 0, inPass: 0 }
];

/** 真实地图夹具的图块定义：数字 1 为墙体，其余数字（0/2/3/4/5/6）均视为开阔空地 */
const REALMAP_TILE_DEFS: TestTileDef[] = [
    { num: 1, id: 'wall', outPass: 0, inPass: 0 },
    { num: 0, id: 'open0', outPass: 15, inPass: 15 },
    { num: 2, id: 'open2', outPass: 15, inPass: 15 },
    { num: 3, id: 'open3', outPass: 15, inPass: 15 },
    { num: 4, id: 'open4', outPass: 15, inPass: 15 },
    { num: 5, id: 'open5', outPass: 15, inPass: 15 },
    { num: 6, id: 'open6', outPass: 15, inPass: 15 }
];

/**
 * 创建绑定指定尺寸地图与移动对象的寻路系统夹具
 * @param rows 每行图块数字，行长为宽度乘高度
 * @param width 地图宽度
 * @param start 移动器起始位置，默认地图左上角
 * @param defs 图块定义，默认为合成矩阵的开阔/墙体语义
 */
function createPerformanceSystem(
    rows: number[],
    width: number,
    start: ITileLocator = { x: 0, y: 0 },
    defs: TestTileDef[] = SYNTHETIC_TILE_DEFS
) {
    const tileStore: ITileStore = new modules.TileStore() as never;
    for (const tile of defs) {
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
        directionMapper: new modules.DirectionMapper(),
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
    tile.setPos(start.x, start.y);
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
            return builder.build(start);
        }
    };
}

interface IRealMapEndpoints {
    /** 寻路起始位置 */
    start: ITileLocator;
    /** 寻路目标位置 */
    target: ITileLocator;
    /** 是否存在伪随机抽选的端点，需在输出中记录所选图块 */
    seeded: boolean;
}

/**
 * 解析真实地图的寻路端点：优先取按行序先后扫到的两个入口（数字 5），
 * 入口不足两个时以固定种子依次抽取非墙空地补足端点，保证结果可复现
 * @param map 真实地图的二维行
 * @param size 地图边长
 */
function resolveEndpoints(map: number[][], size: number): IRealMapEndpoints {
    const entrances: ITileLocator[] = [];
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (map[y]![x] === 5) entrances.push({ x, y });
        }
    }
    if (entrances.length >= 2) {
        return {
            start: entrances[0]!,
            target: entrances[1]!,
            seeded: false
        };
    }

    let seed = REALMAP_SEED;
    const next = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
    };
    const pick = (): ITileLocator => {
        while (true) {
            const index = Math.floor(next() * size * size);
            const x = index % size;
            const y = Math.floor(index / size);
            if (map[y]![x] !== 1) return { x, y };
        }
    };
    const start = entrances[0] ?? pick();
    let target = pick();
    while (target.x === start.x && target.y === start.y) {
        target = pick();
    }
    return { start, target, seeded: true };
}

/**
 * 将一组耗时的最小值与平均值格式化为 min/avg 形式，单位 ms
 * @param times 耗时列表，单位 ms
 */
function minAvg(times: number[]): string {
    const min = Math.min(...times);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    return `${min.toFixed(2)}/${avg.toFixed(2)}ms`;
}

/** 用户提供的六张 13x13 真实游戏地图：1 为墙体，5 为入口，其余数字均为空地 */
const REAL_MAPS: number[][][] = [
    // 地图 1：无入口，需伪随机抽取空地端点
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 4, 2, 0, 3, 1, 5, 2, 0, 3, 3, 3, 1],
        [1, 3, 1, 3, 0, 2, 4, 1, 4, 1, 1, 2, 1],
        [1, 1, 1, 1, 4, 1, 1, 1, 3, 0, 4, 0, 1],
        [1, 0, 4, 3, 0, 4, 3, 0, 4, 1, 1, 3, 1],
        [1, 4, 1, 1, 1, 1, 4, 1, 0, 3, 1, 1, 1],
        [1, 0, 3, 1, 3, 1, 3, 1, 1, 4, 1, 3, 1],
        [1, 3, 0, 4, 0, 4, 0, 3, 1, 0, 2, 0, 1],
        [1, 1, 4, 1, 1, 1, 2, 1, 1, 2, 1, 4, 1],
        [1, 3, 0, 4, 3, 4, 0, 0, 4, 0, 4, 0, 1],
        [1, 4, 1, 1, 1, 1, 2, 1, 1, 1, 1, 4, 1],
        [1, 3, 1, 3, 3, 3, 0, 0, 3, 3, 1, 3, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    // 地图 2：入口 (12,11) 与 (1,12)
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1],
        [1, 0, 4, 0, 2, 0, 2, 0, 2, 0, 4, 0, 1],
        [1, 1, 1, 4, 1, 4, 1, 4, 1, 4, 1, 1, 1],
        [1, 3, 0, 0, 2, 0, 2, 0, 4, 0, 0, 3, 1],
        [1, 0, 3, 0, 1, 4, 1, 4, 1, 1, 2, 1, 1],
        [1, 3, 0, 4, 1, 0, 4, 0, 0, 4, 0, 3, 1],
        [1, 1, 1, 0, 1, 3, 0, 1, 4, 1, 1, 1, 1],
        [1, 3, 1, 4, 1, 1, 0, 2, 0, 3, 1, 3, 1],
        [1, 0, 4, 0, 4, 0, 4, 1, 3, 0, 4, 0, 1],
        [1, 1, 0, 1, 0, 1, 0, 4, 0, 0, 1, 1, 1],
        [1, 3, 0, 1, 3, 1, 3, 0, 1, 4, 0, 3, 5],
        [1, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    // 地图 3：入口 (10,6) 与 (2,10)
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 3, 1, 3, 1, 1, 1, 1, 3, 1, 0, 3, 1],
        [1, 2, 1, 2, 1, 1, 1, 1, 2, 1, 3, 3, 1],
        [1, 3, 0, 3, 4, 3, 4, 0, 3, 4, 3, 3, 1],
        [1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 3, 1, 0, 0, 4, 3, 1, 3, 0, 3, 1],
        [1, 1, 4, 1, 4, 1, 3, 1, 1, 0, 5, 0, 1],
        [1, 3, 3, 1, 3, 4, 0, 3, 2, 4, 0, 4, 1],
        [1, 2, 1, 1, 2, 1, 1, 4, 1, 1, 1, 2, 1],
        [1, 3, 0, 4, 3, 1, 1, 3, 1, 3, 1, 3, 1],
        [1, 0, 5, 1, 0, 1, 1, 0, 4, 0, 1, 0, 1],
        [1, 3, 1, 1, 3, 4, 3, 0, 1, 4, 2, 3, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    // 地图 4：入口 (6,1) 与 (6,11)
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 3, 2, 4, 0, 5, 0, 0, 4, 0, 3, 1],
        [1, 3, 1, 1, 2, 1, 0, 1, 2, 1, 3, 0, 1],
        [1, 0, 3, 1, 3, 4, 0, 4, 3, 1, 2, 1, 1],
        [1, 1, 4, 1, 2, 1, 3, 1, 2, 1, 0, 0, 1],
        [1, 0, 3, 4, 0, 0, 2, 0, 3, 1, 3, 3, 1],
        [1, 3, 0, 2, 0, 3, 1, 3, 0, 4, 0, 0, 1],
        [1, 0, 1, 0, 4, 1, 1, 1, 4, 1, 1, 1, 1],
        [1, 4, 1, 4, 3, 0, 1, 0, 3, 1, 0, 3, 1],
        [1, 0, 1, 3, 1, 3, 2, 3, 0, 1, 3, 0, 1],
        [1, 0, 1, 0, 1, 4, 0, 4, 1, 1, 1, 4, 1],
        [1, 3, 1, 3, 1, 3, 5, 3, 4, 0, 3, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    // 地图 5：入口 (11,1) 与 (0,7)
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 3, 0, 0, 4, 0, 1, 5, 1],
        [1, 1, 3, 3, 1, 0, 3, 1, 1, 3, 1, 0, 1],
        [1, 1, 3, 1, 1, 1, 2, 1, 0, 0, 4, 0, 1],
        [1, 1, 2, 1, 1, 3, 4, 1, 2, 1, 1, 1, 1],
        [1, 1, 4, 3, 1, 0, 3, 2, 0, 1, 0, 3, 1],
        [1, 1, 0, 1, 1, 1, 1, 1, 3, 2, 4, 3, 1],
        [5, 0, 4, 0, 3, 0, 0, 4, 0, 1, 0, 0, 1],
        [1, 4, 1, 4, 1, 1, 1, 1, 4, 1, 2, 1, 1],
        [1, 3, 1, 3, 1, 3, 0, 1, 0, 1, 2, 1, 1],
        [1, 3, 1, 0, 2, 0, 3, 4, 0, 4, 0, 3, 1],
        [1, 3, 2, 0, 1, 0, 0, 1, 3, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    // 地图 6：入口 (0,1) 与 (6,12)，注意 (10,9) 的 6 按语义为空地
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [5, 2, 0, 3, 0, 4, 0, 4, 3, 3, 3, 0, 1],
        [1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 4, 1],
        [1, 3, 3, 0, 4, 1, 0, 1, 3, 3, 4, 0, 1],
        [1, 0, 1, 1, 2, 1, 4, 1, 1, 1, 1, 4, 1],
        [1, 4, 1, 3, 3, 1, 0, 1, 4, 0, 3, 0, 1],
        [1, 2, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 2, 4, 2, 0, 0, 0, 0, 1],
        [1, 1, 2, 1, 1, 1, 2, 1, 1, 4, 0, 4, 1],
        [1, 3, 4, 3, 1, 3, 0, 3, 1, 1, 6, 1, 1],
        [1, 1, 2, 1, 1, 0, 1, 0, 1, 0, 3, 0, 1],
        [1, 3, 4, 3, 1, 3, 0, 3, 1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1]
    ]
];

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

    // 验证用户提供的六张 13x13 真实游戏地图上入口到入口的分段寻路耗时与可达性
    it('measures graph build and search phases on the six real 13x13 game maps', () => {
        for (let i = 0; i < REAL_MAPS.length; i++) {
            const map = REAL_MAPS[i]!;
            const endpoints = resolveEndpoints(map, 13);
            const fixture = createPerformanceSystem(
                map.flat(),
                13,
                endpoints.start,
                REALMAP_TILE_DEFS
            );

            // 伪随机抽选的端点需单独记录所选图块，保证运行结果可复现审查
            if (endpoints.seeded) {
                // eslint-disable-next-line no-console
                console.log(
                    `[pathfinding-realmap] map=${i + 1} seed-picked ` +
                        `start=(${endpoints.start.x},${endpoints.start.y}) ` +
                        `target=(${endpoints.target.x},${endpoints.target.y})`
                );
            }

            const buildTimes: number[] = [];
            const findTimes: number[] = [];
            let steps = 0;

            for (let run = 0; run < REAL_RUNS; run++) {
                const build = measureCall('pathfinding-realmap-build', () =>
                    fixture.buildGraph()
                );
                buildTimes.push(build.duration);

                const find = measureCall('pathfinding-realmap-find', () =>
                    fixture.system.getPath(endpoints.target)
                );
                findTimes.push(find.duration);
                steps = find.value.length;
            }

            const searchAvg =
                findTimes.reduce(
                    (sum, t, idx) => sum + (t - buildTimes[idx]!),
                    0
                ) / REAL_RUNS;

            // 审查要求输出结构化真实地图性能数据供汇报使用
            // eslint-disable-next-line no-console
            console.log(
                `[pathfinding-realmap] map=${i + 1} 13x13 ` +
                    `start=(${endpoints.start.x},${endpoints.start.y}) ` +
                    `target=(${endpoints.target.x},${endpoints.target.y}) ` +
                    `steps=${steps} build=${minAvg(buildTimes)} ` +
                    `find=${minAvg(findTimes)} search=${searchAvg.toFixed(2)}ms ` +
                    `unreachable=${steps === 0 ? 'yes' : 'no'}`
            );

            // 真实地图不保证可达，仅对小图的耗时作宽松把关，不可达属有效数据
            expect(Math.max(...findTimes)).toBeLessThan(500);
        }
    });
});
