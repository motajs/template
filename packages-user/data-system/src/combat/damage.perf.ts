// 性能测量：临界计算（calculateCritical）完整枚举随重复次数的耗时，只记录不断言
import { afterAll, beforeAll, describe, it, vi } from 'vitest';
import { type ITileLocator } from '@motajs/common';
import { type IReadonlyEnemy, type IStateBase } from '@user/data-base';
import {
    type CriticalableHeroStatus,
    type IDamageCalculator,
    type IEnemyContext,
    type IEnemyDamageInfoBase,
    type IEnemyView,
    type IReadonlyEnemyHandler
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
    DamageContext: typeof import('./damage').DamageContext;
    HeroAttribute: typeof import('@user/data-base').HeroAttribute;
    Enemy: typeof import('@user/data-base').Enemy;
    MapLocIndexer: typeof import('@user/data-common').MapLocIndexer;
}

let modules: TestModules;

beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    const damageModule = await import('./damage');
    const baseModule = await import('@user/data-base');
    const commonModule = await import('@user/data-common');
    modules = {
        DamageContext: damageModule.DamageContext,
        HeroAttribute: baseModule.HeroAttribute,
        Enemy: baseModule.Enemy,
        MapLocIndexer: commonModule.MapLocIndexer
    };
});

/** 预热次数，不计入采样 */
const WARMUP_RUNS = 3;
/** 采样次数，取排序后的下中位数 */
const SAMPLE_RUNS = 20;
/** 临界计算覆盖的重复枚举次数 */
const CRITICAL_SCALES = [1000, 10000, 50000] as const;

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
 * 测量一次用例：先预热若干次，再采样后取中位数、最小值与 p95
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

    const samples: number[] = [];
    for (let i = 0; i < SAMPLE_RUNS; i++) {
        const start = globalThis.performance.now();
        run();
        samples.push(globalThis.performance.now() - start);
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
 * 固定伤害计算器：伤害区间由 100 按每点攻击 10 递减到 0，临界上界固定为 10
 */
class PerfCalculator implements IDamageCalculator<TestEnemyAttr, TestHeroAttr> {
    calculate(
        handler: IReadonlyEnemyHandler<TestEnemyAttr, TestHeroAttr>
    ): IEnemyDamageInfoBase {
        const atk = handler.hero.getBaseAttribute('atk');
        return {
            damage: Math.max(0, 100 - atk * 10),
            turn: 2
        };
    }

    getCriticalLimit(
        _handler: IReadonlyEnemyHandler<TestEnemyAttr, TestHeroAttr>,
        _attribute: CriticalableHeroStatus<TestHeroAttr>
    ): number {
        return 10;
    }
}

type TestHeroAttribute = import('@user/data-base').HeroAttribute<TestHeroAttr>;

interface CriticalFixture {
    /** 怪物上下文假对象 */
    context: IEnemyContext<TestEnemyAttr, TestHeroAttr>;
    /** 固定伤害计算器 */
    calculator: PerfCalculator;
    /** 勇士属性对象，攻击力固定为 0 */
    hero: TestHeroAttribute;
    /** 怪物视图假对象 */
    view: IEnemyView<TestEnemyAttr>;
}

/**
 * 创建临界计算测量夹具，怪物上下文只实现被测路径所需的最小接口
 */
function createCriticalFixture(): CriticalFixture {
    const indexer = new modules.MapLocIndexer();
    indexer.setWidth(4);
    const hero = new modules.HeroAttribute<TestHeroAttr>({
        hp: 100,
        atk: 0,
        def: 0
    });
    const origin = new modules.Enemy<TestEnemyAttr>('perf-enemy', 1, {
        hp: 30,
        atk: 8,
        def: 2
    });
    const computed = origin.clone();
    const locators = new Map<IEnemyView<TestEnemyAttr>, ITileLocator>();
    const computedViews = new Map<
        IReadonlyEnemy<TestEnemyAttr>,
        IEnemyView<TestEnemyAttr>
    >();
    const view: IEnemyView<TestEnemyAttr> = {
        context: {} as never,
        reset: () => {},
        getBaseEnemy: () => origin,
        getComputedEnemy: () => computed,
        getModifiableEnemy: () => origin,
        markDirty: () => {}
    };
    locators.set(view, { x: 2, y: 3 });
    computedViews.set(computed, view);
    const context = {
        state: {} as IStateBase,
        indexer,
        getBindedHero: () => hero,
        getEnemyLocatorByView: (target: IEnemyView<TestEnemyAttr>) =>
            locators.get(target) ?? null,
        getViewByComputed: (target: IReadonlyEnemy<TestEnemyAttr>) =>
            computedViews.get(target) ?? null
    } as never;
    return {
        context,
        calculator: new PerfCalculator(),
        hero,
        view
    };
}

afterAll(() => {
    console.table(records);
});

describe('临界计算性能', () => {
    // 覆盖 1000 次完整临界枚举的重复耗时
    it('measures 1000 critical enumerations', () => {
        const fixture = createCriticalFixture();
        const damageContext = new modules.DamageContext(
            fixture.context,
            fixture.calculator,
            fixture.hero
        );
        const count = CRITICAL_SCALES[0];

        measureCase('临界计算', String(count), () => {
            for (let i = 0; i < count; i++) {
                for (const _ of damageContext.calculateCritical(
                    fixture.view,
                    'atk'
                )) {
                    // 必须完整消费生成器，否则测不到临界枚举的真实开销
                }
            }
        });
    });

    // 覆盖 10000 次完整临界枚举的重复耗时
    it('measures 10000 critical enumerations', () => {
        const fixture = createCriticalFixture();
        const damageContext = new modules.DamageContext(
            fixture.context,
            fixture.calculator,
            fixture.hero
        );
        const count = CRITICAL_SCALES[1];

        measureCase('临界计算', String(count), () => {
            for (let i = 0; i < count; i++) {
                for (const _ of damageContext.calculateCritical(
                    fixture.view,
                    'atk'
                )) {
                    // 必须完整消费生成器，否则测不到临界枚举的真实开销
                }
            }
        });
    });

    // 覆盖 50000 次完整临界枚举的重复耗时
    it('measures 50000 critical enumerations', () => {
        const fixture = createCriticalFixture();
        const damageContext = new modules.DamageContext(
            fixture.context,
            fixture.calculator,
            fixture.hero
        );
        const count = CRITICAL_SCALES[2];

        measureCase('临界计算', String(count), () => {
            for (let i = 0; i < count; i++) {
                for (const _ of damageContext.calculateCritical(
                    fixture.view,
                    'atk'
                )) {
                    // 必须完整消费生成器，否则测不到临界枚举的真实开销
                }
            }
        });
    });
});
