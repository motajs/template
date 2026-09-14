// 测试内置伤害计算器：基础伤害、无敌、魔攻、连击、多段、支援、先攻、破甲、反击、净化、吸血、负伤、固伤、仇恨与临界上界
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { type ITileLocator } from '@motajs/common';
import { type IEnemyAttr, type IHeroAttr } from '@user/data-common';
import {
    type IEnemyContext,
    type IEnemyView,
    type IReadonlyEnemyHandler
} from '@user/data-system';
import {
    type IEnemy,
    type IReadonlyHeroAttribute,
    type ISpecial,
    type IStateBase
} from '@user/data-base';

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

interface TestModules {
    MainDamageCalculator: typeof import('./calculator').MainDamageCalculator;
    logger: typeof import('@motajs/common').logger;
}

let modules: TestModules;

beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    const calculatorModule = await import('./calculator');
    const motaModule = await import('@motajs/common');
    modules = {
        MainDamageCalculator: calculatorModule.MainDamageCalculator,
        logger: motaModule.logger
    };
});

interface FakeEnemy {
    /** 可写怪物对象 */
    enemy: IEnemy<IEnemyAttr>;
    /** 当前怪物属性，供断言与后续修改 */
    attrs: IEnemyAttr;
}

interface FakeEnemyOptions {
    /** 覆盖的怪物属性 */
    attrs?: Partial<IEnemyAttr>;
    /** 怪物特殊属性表，键为代码，值为该特殊属性的数值 */
    specials?: Map<number, unknown>;
}

/**
 * 创建一个只实现计算器所需能力的内联假怪物，特殊属性以代码表驱动
 * @param options 怪物属性与特殊属性配置
 */
function createEnemy(options: FakeEnemyOptions = {}): FakeEnemy {
    const specials = options.specials ?? new Map<number, unknown>();
    const attrs: IEnemyAttr = {
        hp: 20,
        atk: 8,
        def: 5,
        money: 2,
        exp: 3,
        point: 1,
        guard: new Set(),
        ...options.attrs
    };
    const enemy = {
        id: 'test-enemy',
        code: 1,
        getSpecial: (code: number): ISpecial<any> | null =>
            specials.has(code)
                ? ({
                      code,
                      value: specials.get(code),
                      deepEqualsTo: () => false
                  } as ISpecial<any>)
                : null,
        hasSpecial: (code: number) => specials.has(code),
        iterateSpecials: () => [],
        getAttribute: (key: string) => (attrs as never)[key],
        cloneAttributes: () => structuredClone(attrs),
        clone: () => enemy,
        addSpecial: () => {},
        deleteSpecial: () => {},
        setAttribute: (key: string, value: unknown) => {
            (attrs as never)[key] = value;
        },
        addAttribute: (key: string, value: number) => {
            (attrs as never)[key] += value;
        },
        copyFrom: () => {},
        saveState: () => ({
            attrs: structuredClone(attrs),
            specials: new Map()
        }),
        loadState: () => {}
    } as IEnemy<IEnemyAttr>;
    return { enemy, attrs };
}

/**
 * 创建一个只提供基础与最终属性读取的内联假勇士
 * @param attrs 覆盖的勇士属性
 */
function createHero(
    attrs: Partial<IHeroAttr> = {}
): IReadonlyHeroAttribute<IHeroAttr> {
    const values: IHeroAttr = {
        name: 'hero',
        hp: 100,
        hpmax: 100,
        atk: 20,
        def: 5,
        mdef: 0,
        mana: 0,
        manamax: 0,
        money: 0,
        exp: 0,
        ...attrs
    };
    return {
        getBaseAttribute: (name: string) => (values as never)[name],
        getFinalAttribute: (name: string) => (values as never)[name]
    } as IReadonlyHeroAttribute<IHeroAttr>;
}

interface FakeStateOptions {
    /** 十字架数量，未配置表示背包中没有十字架 */
    cross?: number;
    /** flag 字段值表 */
    flags?: Record<string, unknown>;
}

/**
 * 创建一个只实现计算器所需状态读取的内联假状态对象
 * @param options 十字架数量与 flag 字段配置
 */
function createState(options: FakeStateOptions = {}): IStateBase {
    const flags = options.flags ?? {};
    return {
        hero: {
            items: {
                getItemState: (id: string) =>
                    id === 'cross' && options.cross !== undefined
                        ? { count: options.cross }
                        : null
            }
        },
        flags: {
            getFieldValueDefaults: (name: string, defaultValue: unknown) =>
                name in flags ? flags[name] : defaultValue
        }
    } as IStateBase;
}

/**
 * 创建一个只实现定位符查找的内联假地图上下文
 * @param resolve 按定位符查找怪物视图的回调
 */
function createContext(
    resolve?: (locator: ITileLocator) => IEnemyView<IEnemyAttr> | null
): IEnemyContext<IEnemyAttr, IHeroAttr> {
    return {
        width: 8,
        height: 8,
        getEnemyByLocator: (locator: ITileLocator) =>
            resolve ? resolve(locator) : null
    } as IEnemyContext<IEnemyAttr, IHeroAttr>;
}

/**
 * 将一个计算后怪物对象包装为只提供该对象读取的假视图
 * @param computed 计算后怪物对象
 */
function createView(
    computed: IEnemy<IEnemyAttr>
): IEnemyView<IEnemyAttr> {
    return {
        getComputedEnemy: () => computed
    } as IEnemyView<IEnemyAttr>;
}

interface HandlerOptions {
    /** 怪物对象 */
    enemy: IEnemy<IEnemyAttr>;
    /** 勇士属性 */
    hero?: IReadonlyHeroAttribute<IHeroAttr>;
    /** 状态对象 */
    state?: IStateBase;
    /** 地图上下文 */
    context?: IEnemyContext<IEnemyAttr, IHeroAttr>;
    /** 怪物定位符 */
    locator?: ITileLocator;
}

/**
 * 组装一个计算器所需的最小只读信息对象
 * @param options 信息对象各字段
 */
function createHandler(
    options: HandlerOptions
): IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr> {
    return {
        enemy: options.enemy,
        context: options.context ?? createContext(),
        locator: options.locator ?? { x: 0, y: 0 },
        hero: options.hero ?? createHero(),
        state: options.state ?? createState()
    } as IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>;
}

/**
 * 创建一个带特殊属性代码表的怪物属性配置
 * @param entries 特殊属性代码与数值对
 */
function specialsOf(entries: Array<[number, unknown]>): Map<number, unknown> {
    return new Map(entries);
}

/**
 * 创建一个计算器实例
 */
function createCalculator(): InstanceType<
    TestModules['MainDamageCalculator']
> {
    return new modules.MainDamageCalculator();
}

describe('MainDamageCalculator base and defeat branches', () => {
    // 验证无特殊属性时按攻防差计算每轮伤害与回合数
    it('computes damage and turns from the attack and defense difference', () => {
        const { enemy } = createEnemy();
        const calculator = createCalculator();

        const info = calculator.calculate(createHandler({ enemy }));

        expect(info).toEqual({ damage: 3, turn: 2 });
    });

    // 验证勇士无法破防时返回无敌伤害与 0 回合
    it('returns infinite damage when the hero cannot break the defense', () => {
        const { enemy } = createEnemy({ attrs: { def: 20 } });
        const calculator = createCalculator();

        const info = calculator.calculate(createHandler({ enemy }));

        expect(info).toEqual({ damage: Infinity, turn: 0 });
    });

    // 验证无敌怪物在没有十字架时不可战胜，持有十字架后恢复正常计算
    it('blocks 无敌 without a cross and allows it with one', () => {
        const { enemy } = createEnemy({ specials: specialsOf([[20, undefined]]) });
        const calculator = createCalculator();

        const blocked = calculator.calculate(createHandler({ enemy }));
        const allowed = calculator.calculate(
            createHandler({ enemy, state: createState({ cross: 1 }) })
        );

        expect(blocked).toEqual({ damage: Infinity, turn: 0 });
        expect(allowed).toEqual({ damage: 3, turn: 2 });
    });

    // 验证魔攻怪物的每轮伤害不减免勇士防御
    it('ignores hero defense for 魔攻', () => {
        const { enemy } = createEnemy({ specials: specialsOf([[2, undefined]]) });
        const calculator = createCalculator();

        const info = calculator.calculate(createHandler({ enemy }));

        expect(info).toEqual({ damage: 8, turn: 2 });
    });

    // 验证 2连击与 3连击分别把每轮伤害乘以 2 和 3
    it('multiplies enemy damage for 2连击 and 3连击', () => {
        const calculator = createCalculator();
        const double = createEnemy({ specials: specialsOf([[4, undefined]]) });
        const triple = createEnemy({ specials: specialsOf([[5, undefined]]) });

        expect(calculator.calculate(createHandler({ enemy: double.enemy }))).toEqual(
            { damage: 6, turn: 2 }
        );
        expect(calculator.calculate(createHandler({ enemy: triple.enemy }))).toEqual(
            { damage: 9, turn: 2 }
        );
    });

    // 验证多段伤害按特殊属性数值倍乘每轮伤害
    it('multiplies enemy damage by the 多段 value', () => {
        const { enemy } = createEnemy({ specials: specialsOf([[6, 4]]) });
        const calculator = createCalculator();

        const info = calculator.calculate(createHandler({ enemy }));

        expect(info).toEqual({ damage: 12, turn: 2 });
    });
});

describe('MainDamageCalculator support and additive branches', () => {
    // 验证支援怪会递归累加其回合与伤害，且同一支援怪只被计算一次
    it('adds the guard turn and damage through recursion', () => {
        const guard = createEnemy();
        const { enemy } = createEnemy({
            attrs: { guard: new Set<ITileLocator>([{ x: 1, y: 0 }]) }
        });
        const calls: string[] = [];
        const context = createContext(locator => {
            calls.push(`${locator.x},${locator.y}`);
            return locator.x === 1 ? createView(guard.enemy) : null;
        });
        const calculator = createCalculator();

        const info = calculator.calculate(
            createHandler({ enemy, context })
        );

        expect(info).toEqual({ damage: 12, turn: 4 });
        expect(calls).toEqual(['1,0']);
    });

    // 验证同一计算器连续两次顶层计算互不影响，支援标记不会泄漏
    it('does not leak the in-guard flag across top-level calls', () => {
        const guard = createEnemy();
        const { enemy } = createEnemy({
            attrs: { guard: new Set<ITileLocator>([{ x: 1, y: 0 }]) }
        });
        const context = createContext(locator =>
            locator.x === 1 ? createView(guard.enemy) : null
        );
        const calculator = createCalculator();
        const handler = createHandler({ enemy, context });

        const first = calculator.calculate(handler);
        const second = calculator.calculate(handler);

        expect(first).toEqual({ damage: 12, turn: 4 });
        expect(second).toEqual(first);
    });

    // 验证支援怪不存在时告警 137 并跳过该支援
    it('warns 137 when a guard locator has no enemy', () => {
        const { enemy } = createEnemy({
            attrs: { guard: new Set<ITileLocator>([{ x: 2, y: 0 }]) }
        });
        const calculator = createCalculator();

        const result = modules.logger.catch(() =>
            calculator.calculate(createHandler({ enemy }))
        );

        expect(result.ret).toEqual({ damage: 3, turn: 2 });
        expect(result.info.map(item => item.code)).toContain(137);
    });

    // 验证先攻会额外附加一次每轮伤害
    it('adds one enemy hit for 先攻', () => {
        const { enemy } = createEnemy({ specials: specialsOf([[1, undefined]]) });
        const calculator = createCalculator();

        const info = calculator.calculate(createHandler({ enemy }));

        expect(info).toEqual({ damage: 6, turn: 2 });
    });

    // 验证破甲按比例附加勇士防御作为伤害
    it('adds a share of hero defense for 破甲', () => {
        const { enemy } = createEnemy({ specials: specialsOf([[7, 100]]) });
        const calculator = createCalculator();

        const info = calculator.calculate(createHandler({ enemy }));

        expect(info).toEqual({ damage: 8, turn: 2 });
    });

    // 验证伤害最终向下取整
    it('floors the final damage value', () => {
        const { enemy } = createEnemy({ specials: specialsOf([[7, 33]]) });
        const calculator = createCalculator();

        const info = calculator.calculate(createHandler({ enemy }));

        expect(info).toEqual({ damage: 4, turn: 2 });
    });

    // 验证反击按比例把勇士攻击附加到每轮伤害
    it('adds a share of hero attack for 反击', () => {
        const { enemy } = createEnemy({ specials: specialsOf([[8, 50]]) });
        const calculator = createCalculator();

        const info = calculator.calculate(createHandler({ enemy }));

        expect(info).toEqual({ damage: 13, turn: 2 });
    });

    // 验证净化按倍数附加勇士魔防，且随后的减伤仍扣除一次魔防
    it('adds hero mdef for 净化 and then subtracts it once', () => {
        const { enemy } = createEnemy({ specials: specialsOf([[9, 2]]) });
        const calculator = createCalculator();

        const info = calculator.calculate(
            createHandler({ enemy, hero: createHero({ mdef: 3 }) })
        );

        expect(info).toEqual({ damage: 6, turn: 2 });
    });
});

describe('MainDamageCalculator vampire and bypass branches', () => {
    // 验证吸血按勇士生命上限比例附加伤害，不回复自身时不改变怪物血量
    it('adds vampire damage without healing the enemy by default', () => {
        const { enemy } = createEnemy({
            specials: specialsOf([[11, { vampire: 10, add: false }]])
        });
        const calculator = createCalculator();

        const info = calculator.calculate(
            createHandler({ enemy, hero: createHero({ hp: 200 }) })
        );

        expect(info).toEqual({ damage: 23, turn: 2 });
    });

    // 验证开启回复后吸血数值加到怪物血量上并延长回合数
    it('adds vampire damage to the enemy health when add is true', () => {
        const { enemy } = createEnemy({
            specials: specialsOf([[11, { vampire: 10, add: true }]])
        });
        const calculator = createCalculator();

        const info = calculator.calculate(
            createHandler({ enemy, hero: createHero({ hp: 200 }) })
        );

        expect(info).toEqual({ damage: 26, turn: 3 });
    });

    // 验证未开启负伤时负伤害被夹到 0
    it('clamps negative damage to zero when negative damage is disabled', () => {
        const { enemy } = createEnemy({ attrs: { atk: 0 } });
        const calculator = createCalculator();

        const info = calculator.calculate(
            createHandler({ enemy, hero: createHero({ mdef: 5 }) })
        );

        expect(info).toEqual({ damage: 0, turn: 2 });
    });

    // 验证开启负伤后负伤害被保留
    it('keeps negative damage when negative damage is enabled', () => {
        const { enemy } = createEnemy({ attrs: { atk: 0 } });
        const calculator = createCalculator();

        const info = calculator.calculate(
            createHandler({
                enemy,
                hero: createHero({ mdef: 5 }),
                state: createState({ flags: { enableNegativeDamage: true } })
            })
        );

        expect(info).toEqual({ damage: -5, turn: 2 });
    });

    // 验证固伤在扣除魔防之后附加，不受魔防影响
    it('adds 固伤 after the mdef subtraction', () => {
        const { enemy } = createEnemy({ specials: specialsOf([[22, 7]]) });
        const calculator = createCalculator();

        const info = calculator.calculate(
            createHandler({ enemy, hero: createHero({ mdef: 2 }) })
        );

        expect(info).toEqual({ damage: 8, turn: 2 });
    });

    // 验证仇恨按 flag 字段值附加伤害且不受魔防影响
    it('adds the hatred flag value for 仇恨', () => {
        const { enemy } = createEnemy({ specials: specialsOf([[17, undefined]]) });
        const calculator = createCalculator();

        const info = calculator.calculate(
            createHandler({
                enemy,
                hero: createHero({ mdef: 2 }),
                state: createState({ flags: { hatred: 5 } })
            })
        );

        expect(info).toEqual({ damage: 6, turn: 2 });
    });
});

describe('MainDamageCalculator critical limit', () => {
    // 验证攻击临界上界为怪物防御加生命，坚固怪物则为无穷
    it('returns def plus hp for atk, and Infinity for 坚固', () => {
        const normal = createEnemy();
        const solid = createEnemy({ specials: specialsOf([[3, undefined]]) });
        const calculator = createCalculator();

        expect(
            calculator.getCriticalLimit(
                createHandler({ enemy: normal.enemy }),
                'atk'
            )
        ).toBe(25);
        expect(
            calculator.getCriticalLimit(
                createHandler({ enemy: solid.enemy }),
                'atk'
            )
        ).toBe(Infinity);
    });

    // 验证非攻击属性直接返回勇士对应最终属性
    it('returns the hero final attribute for other attributes', () => {
        const { enemy } = createEnemy();
        const calculator = createCalculator();

        const limit = calculator.getCriticalLimit(
            createHandler({ enemy, hero: createHero({ def: 7 }) }),
            'def'
        );

        expect(limit).toBe(7);
    });
});
