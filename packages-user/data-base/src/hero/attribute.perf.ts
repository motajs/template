// 性能测量：勇士属性修饰器重算随修饰器数量的耗时，只记录不断言
import { afterAll, describe, it, vi } from 'vitest';
import { BaseHeroModifier, HeroAttribute } from './attribute';
import { type IHeroModifier } from './types';

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

interface PerfHeroAttr {
    /** 生命值 */
    hp: number;
    /** 攻击力 */
    atk: number;
    /** 防御力 */
    def: number;
    /** 魔防 */
    mdef: number;
    /** 金币 */
    money: number;
    /** 经验 */
    exp: number;
    /** 点数 */
    point: number;
    /** 分数 */
    score: number;
    /** 魔力 */
    mana: number;
    /** 速度 */
    speed: number;
}

/** 固定 10 个数值属性的名称与顺序，修饰器按此顺序均匀分布 */
const ATTR_NAMES: readonly (keyof PerfHeroAttr)[] = [
    'hp',
    'atk',
    'def',
    'mdef',
    'money',
    'exp',
    'point',
    'score',
    'mana',
    'speed'
];

/** 10 个数值属性的固定基础值，保证每个 case 的起点一致 */
const BASE_VALUES: PerfHeroAttr = {
    hp: 100,
    atk: 10,
    def: 5,
    mdef: 5,
    money: 100,
    exp: 50,
    point: 10,
    score: 0,
    mana: 50,
    speed: 10
};

/** 预热次数，不计入采样 */
const WARMUP_RUNS = 3;
/** 采样次数，取排序后的下中位数 */
const SAMPLE_RUNS = 20;
/** 属性计算覆盖的修饰器数量 */
const MODIFIER_SCALES = [10, 100, 1000] as const;
/** 单次采样内重复的重算轮数 */
const RECALC_ROUNDS = 1000;

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
 * 测试用数值修饰器，按优先级对数值属性做加法
 */
class PerfModifier extends BaseHeroModifier<number, number> {
    readonly type: string = '@perf/value';
    readonly priority: number;

    /**
     * @param value 修饰器数值
     * @param priority 修饰器优先级
     */
    constructor(value: number, priority: number = 0) {
        super(value);
        this.priority = priority;
    }

    modify(value: number): number {
        return value + this.value;
    }

    clone(): IHeroModifier<number, number> {
        return new PerfModifier(this.value, this.priority);
    }
}

interface AttributeFixture {
    /** 被测勇士属性对象 */
    attribute: HeroAttribute<PerfHeroAttr>;
    /** 已挂载的全部修饰器，按挂载顺序排列，采样时按轮次取用 */
    modifiers: PerfModifier[];
}

/**
 * 创建属性计算夹具：每个属性都是独立新实例，并按顺序均匀分布到 10 个属性上
 * @param count 挂载的修饰器数量
 */
function createAttributeFixture(count: number): AttributeFixture {
    const attribute = new HeroAttribute<PerfHeroAttr>({ ...BASE_VALUES });
    const modifiers: PerfModifier[] = [];
    for (let i = 0; i < count; i++) {
        const modifier = new PerfModifier(i);
        attribute.addModifier(ATTR_NAMES[i % ATTR_NAMES.length], modifier);
        modifiers.push(modifier);
    }
    return { attribute, modifiers };
}

afterAll(() => {
    console.table(records);
    vi.unstubAllGlobals();
});

describe('勇士属性计算性能', () => {
    // 覆盖 10 个修饰器分布到 10 个属性时，1000 轮重算并读取全部最终属性的耗时
    it('measures 10 modifiers across 10 attributes', () => {
        const fixture = createAttributeFixture(MODIFIER_SCALES[0]);

        measureCase('勇士属性计算', String(MODIFIER_SCALES[0]), () => {
            for (let i = 0; i < RECALC_ROUNDS; i++) {
                fixture.attribute.markModifierDirty(
                    fixture.modifiers[i % fixture.modifiers.length]
                );
                for (const name of ATTR_NAMES) {
                    fixture.attribute.getFinalAttribute(name);
                }
            }
        });
    });

    // 覆盖 100 个修饰器分布到 10 个属性时，1000 轮重算并读取全部最终属性的耗时
    it('measures 100 modifiers across 10 attributes', () => {
        const fixture = createAttributeFixture(MODIFIER_SCALES[1]);

        measureCase('勇士属性计算', String(MODIFIER_SCALES[1]), () => {
            for (let i = 0; i < RECALC_ROUNDS; i++) {
                fixture.attribute.markModifierDirty(
                    fixture.modifiers[i % fixture.modifiers.length]
                );
                for (const name of ATTR_NAMES) {
                    fixture.attribute.getFinalAttribute(name);
                }
            }
        });
    });

    // 覆盖 1000 个修饰器分布到 10 个属性时，1000 轮重算并读取全部最终属性的耗时
    it('measures 1000 modifiers across 10 attributes', () => {
        const fixture = createAttributeFixture(MODIFIER_SCALES[2]);

        measureCase('勇士属性计算', String(MODIFIER_SCALES[2]), () => {
            for (let i = 0; i < RECALC_ROUNDS; i++) {
                fixture.attribute.markModifierDirty(
                    fixture.modifiers[i % fixture.modifiers.length]
                );
                for (const name of ATTR_NAMES) {
                    fixture.attribute.getFinalAttribute(name);
                }
            }
        });
    });
});
