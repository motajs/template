// 性能测量：怪物上下文全量构建（buildup）随怪物数量的耗时，只记录不断言
import { afterAll, beforeAll, describe, it, vi } from 'vitest';
import { type IRange } from '@motajs/common';
import { type IEnemy, type IStateBase, type ISpecial } from '@user/data-base';
import {
    type IAuraConverter,
    type IAuraView,
    type IEnemyAuraView,
    type IEnemyHandler,
    type IEnemySpecialModifier
} from './types';

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
    Map.prototype.getOrInsert ??= function <K, V>(
        this: Map<K, V>,
        key: K,
        defaultValue: V
    ): V {
        const existing = this.get(key);
        if (existing !== undefined) return existing;
        this.set(key, defaultValue);
        return defaultValue;
    };
});

interface TestEnemyAttr {
    /** 怪物生命值 */
    hp: number;
    /** 怪物攻击力 */
    atk: number;
    /** 怪物防御力 */
    def: number;
}

interface TestHeroAttr {
    /** 勇士生命值 */
    hp: number;
    /** 勇士攻击力 */
    atk: number;
    /** 勇士防御力 */
    def: number;
}

interface TestModules {
    EnemyContext: typeof import('./context').EnemyContext;
    Enemy: typeof import('@user/data-base').Enemy;
    HeroAttribute: typeof import('@user/data-base').HeroAttribute;
    FullRange: typeof import('@motajs/common').FullRange;
}

let modules: TestModules;

beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    const contextModule = await import('./context');
    const baseModule = await import('@user/data-base');
    const motaModule = await import('@motajs/common');
    modules = {
        EnemyContext: contextModule.EnemyContext,
        Enemy: baseModule.Enemy,
        HeroAttribute: baseModule.HeroAttribute,
        FullRange: motaModule.FullRange
    };
});

/** 预热次数，不计入采样 */
const WARMUP_RUNS = 3;
/** 采样次数，取排序后的下中位数 */
const SAMPLE_RUNS = 20;
/** 怪物上下文构建覆盖的怪物数量 */
const ENEMY_SCALES = [50, 200, 1000] as const;
/** 固定注册的全局光环数量 */
const GLOBAL_AURA_COUNT = 10;
/** 固定挂载到每个怪物上的 5 个特殊属性代码 */
const SPECIAL_CODES: readonly number[] = [20, 21, 22, 23, 24];

/** 单条性能记录，字段与控制台表格列一一对应 */
interface PerfRecord {
    /** 测量项名称 */
    case: string;
    /** 规模档位 */
    scale: string;
    /** 中位耗时，单位毫秒 */
    'median ms': number;
    /** 最小耗时，单位毫秒 */
    'min ms': number;
    /** 95 分位耗时，单位毫秒 */
    'p95 ms': number;
}

/** 本次运行累积的性能记录，由 afterAll 统一打印 */
const records: PerfRecord[] = [];

/**
 * 测量一次用例：先预热若干次，再采样后取中位数、最小值与 p95，
 * 计时经 performance.mark / performance.measure 成对标记完成，
 * 采样后按名清理标记与测量
 * @param caseName 测量项名称
 * @param scale 规模档位
 * @param run 单次被测量的操作
 */
function measureCase(
    caseName: string,
    scale: string,
    run: () => void
): PerfRecord {
    for (let i = 0; i < WARMUP_RUNS; i++) {
        run();
    }

    // 必须先打标记再测量：对不存在的标记做 measure 会抛错；
    // 标记还必须逐样本清理，否则同名标记会被解析成首次位置而得到累计耗时
    const startTag = 'perf:' + caseName + ':' + scale + ':start';
    const endTag = 'perf:' + caseName + ':' + scale + ':end';
    const measureName = 'perf:' + caseName + ':' + scale;
    const samples: number[] = [];
    for (let i = 0; i < SAMPLE_RUNS; i++) {
        globalThis.performance.mark(startTag);
        run();
        globalThis.performance.mark(endTag);
        const measure = globalThis.performance.measure(
            measureName,
            startTag,
            endTag
        );
        samples.push(measure.duration);
        globalThis.performance.clearMarks(startTag);
        globalThis.performance.clearMarks(endTag);
        globalThis.performance.clearMeasures(measureName);
    }

    samples.sort((left, right) => left - right);
    const record: PerfRecord = {
        case: caseName,
        scale,
        'median ms': Number(samples[SAMPLE_RUNS / 2].toFixed(3)),
        'min ms': Number(samples[0].toFixed(3)),
        'p95 ms': Number(samples[Math.ceil(SAMPLE_RUNS * 0.95) - 1].toFixed(3))
    };
    records.push(record);
    return record;
}

/**
 * 创建一个最小特殊属性对象，只用于驱动光环转换的代码匹配
 * @param code 特殊属性代码
 */
function createSpecial(code: number): ISpecial<any> {
    return { code, clone: () => createSpecial(code) } as never;
}

/**
 * 创建一个最小怪物对象，属性固定为合成值
 * @param id 怪物 id
 */
function createEnemy(id: string): IEnemy<TestEnemyAttr> {
    return new modules.Enemy<TestEnemyAttr>(id, 1, {
        hp: 10,
        atk: 2,
        def: 0
    });
}

/**
 * 测试用光环视图：只修改怪物攻击力，且不参与特殊属性效果的生成
 */
class PerfAura implements IAuraView<TestEnemyAttr, any> {
    /** 此光环是否可能修改基础属性 */
    readonly couldApplyBase: boolean = true;
    /** 此光环是否可能修改特殊属性，固定为否以避免触发特殊属性效果链路 */
    readonly couldApplySpecial: boolean = false;

    constructor(
        readonly priority: number,
        readonly range: IRange<any>
    ) {}

    getRangeParam(): any {
        return undefined;
    }

    apply(handler: IEnemyHandler<TestEnemyAttr, TestHeroAttr>): void {
        handler.enemy.addAttribute('atk', 1);
    }

    applySpecial(): IEnemySpecialModifier<TestEnemyAttr> | null {
        return null;
    }
}

/**
 * 测试用光环转换器：按代码一对一命中并缓存光环实例，
 * 使光环拓扑固定为全局光环 + 特殊属性代码数量，与怪物数量无关
 */
class PerfConverter implements IAuraConverter<TestEnemyAttr, TestHeroAttr> {
    /** 特殊属性代码 -> 已缓存的光环实例 */
    private readonly cache: Map<number, PerfAura> = new Map();

    shouldConvert(special: ISpecial<any>): boolean {
        return SPECIAL_CODES.includes(special.code);
    }

    convert(special: ISpecial<any>): IEnemyAuraView<TestEnemyAttr, any, any> {
        const aura = this.cache.getOrInsertComputed(
            special.code,
            () => new PerfAura(special.code, new modules.FullRange())
        );
        return aura as never;
    }
}

type TestEnemyContext = import('./context').EnemyContext<
    TestEnemyAttr,
    TestHeroAttr
>;
type TestHeroAttribute = import('@user/data-base').HeroAttribute<TestHeroAttr>;

interface ContextFixture {
    /** 被测怪物上下文 */
    context: TestEnemyContext;
    /** 可修改勇士属性，用于触发全量构建 */
    hero: TestHeroAttribute;
}

/**
 * 创建怪物上下文构建夹具：固定 10 个全局光环 + 5 个特殊属性代码，
 * 并按计数在方形网格内放置怪物
 * @param count 放置的怪物数量
 */
function createContextFixture(count: number): ContextFixture {
    const side = Math.ceil(Math.sqrt(count));
    const context = new modules.EnemyContext<TestEnemyAttr, TestHeroAttr>(
        {} as IStateBase
    );
    context.resize(side, side);
    const hero = new modules.HeroAttribute<TestHeroAttr>({
        hp: 100,
        atk: 0,
        def: 0
    });
    context.bindHero(hero);
    context.registerAuraConverter(new PerfConverter());
    for (let i = 0; i < GLOBAL_AURA_COUNT; i++) {
        // 全局光环优先级互不相同，避免拓扑随怪物数量变化
        context.addAura(new PerfAura(i + 1, new modules.FullRange()));
    }
    for (let i = 0; i < count; i++) {
        const enemy = createEnemy('perf-' + i);
        enemy.addSpecial(
            createSpecial(SPECIAL_CODES[i % SPECIAL_CODES.length])
        );
        context.setEnemyAt({ x: i % side, y: Math.floor(i / side) }, enemy);
    }
    return { context, hero };
}

afterAll(() => {
    console.table(records);
});

describe('怪物上下文构建性能', () => {
    // 覆盖 50 个怪物时单次全量构建的耗时
    it('measures a buildup over 50 enemies', () => {
        const fixture = createContextFixture(ENEMY_SCALES[0]);

        measureCase('怪物上下文构建', String(ENEMY_SCALES[0]), () => {
            fixture.context.bindHero(fixture.hero);
            fixture.context.buildup();
        });
    });

    // 覆盖 200 个怪物时单次全量构建的耗时
    it('measures a buildup over 200 enemies', () => {
        const fixture = createContextFixture(ENEMY_SCALES[1]);

        measureCase('怪物上下文构建', String(ENEMY_SCALES[1]), () => {
            fixture.context.bindHero(fixture.hero);
            fixture.context.buildup();
        });
    });

    // 覆盖 1000 个怪物时单次全量构建的耗时
    it('measures a buildup over 1000 enemies', () => {
        const fixture = createContextFixture(ENEMY_SCALES[2]);

        measureCase('怪物上下文构建', String(ENEMY_SCALES[2]), () => {
            fixture.context.bindHero(fixture.hero);
            fixture.context.buildup();
        });
    });
});
