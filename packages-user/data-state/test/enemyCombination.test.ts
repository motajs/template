// 测试顶层伤害组合：单特殊属性 / 单光环基线，以及多特殊属性与系统层光环效果组合
import { describe, expect, it, vi } from 'vitest';
import { FullRange, logger, type ITileLocator } from '@motajs/common';
import { type IEnemyAttr, type IHeroAttr } from '@user/data-common';
import {
    Enemy,
    type IEnemy,
    type IHeroAttribute,
    type IReadonlyHeroAttribute,
    type ISpecial
} from '@user/data-base';
import {
    EnemyContext,
    type IAuraView,
    type IEnemyCommonQueryEffect,
    type IEnemyFinalEffect,
    type IEnemySpecialQueryEffect,
    type IReadonlyEnemyHandler
} from '@user/data-system';
import { createCoreState, type CoreState } from '../src/core';
import { MainDamageCalculator } from '../src/enemy/calculator';
import { CommonAuraConverter, GuardAuraConverter } from '../src/enemy/aura';
import { MainEnemyFinalEffect } from '../src/enemy/final';
import { type IHaloValue, type IVampireValue } from '../src/enemy/special';

vi.hoisted(() => {
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

/**
 * 创建一个只包含测试所需行为的内联特殊属性，数值可克隆可读写
 * @param code 特殊属性代码
 * @param value 特殊属性数值
 */
function createSpecial<T>(code: number, value: T): ISpecial<T> {
    const special = {
        code,
        value,
        getValue: () => special.value,
        setValue: (next: T) => {
            special.value = next;
        },
        getSpecialName: () => `special-${code}`,
        getDescription: () => `special-${code}`,
        fromLegacyEnemy: () => {},
        clone: () => createSpecial<T>(code, structuredClone(special.value)),
        deepEqualsTo: (other: ISpecial<T>) => other.code === code,
        saveState: () => structuredClone(special.value),
        loadState: (state: T) => {
            special.value = state;
        }
    };
    return special as ISpecial<T>;
}

interface IEnemyOptions {
    /** 怪物 id */
    readonly id?: string;
    /** 怪物图块数字 */
    readonly code?: number;
    /** 覆盖的怪物属性 */
    readonly attrs?: Partial<IEnemyAttr>;
    /** 怪物携带的特殊属性列表 */
    readonly specials?: readonly ISpecial<any>[];
}

/**
 * 用真实 Enemy 模型构造一个可加入模板或上下文的怪物
 * @param options 怪物 id、code、属性与特殊属性
 */
function createEnemy(options: IEnemyOptions = {}): IEnemy<IEnemyAttr> {
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
    const enemy = new Enemy<IEnemyAttr>(
        options.id ?? 'combo-enemy',
        options.code ?? 1,
        attrs
    );
    for (const special of options.specials ?? []) {
        enemy.addSpecial(special);
    }
    return enemy;
}

/**
 * 创建一个只提供基础与最终属性读取的内联假勇士
 * @param overrides 覆盖的勇士属性
 */
function createHero(
    overrides: Partial<IHeroAttr> = {}
): IHeroAttribute<IHeroAttr> {
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
        ...overrides
    };
    const hero = {
        getBaseAttribute: (name: string) => (values as never)[name],
        getFinalAttribute: (name: string) => (values as never)[name],
        getModifiableClone: () => hero
    };
    return hero as unknown as IHeroAttribute<IHeroAttr>;
}

/**
 * 组装一个只读伤害信息对象，状态使用真实 CoreState
 * @param state 顶层状态对象
 * @param enemy 怪物对象
 * @param hero 勇士属性对象
 * @param locator 怪物定位符
 */
function createHandler(
    state: CoreState,
    enemy: IEnemy<IEnemyAttr>,
    hero: IReadonlyHeroAttribute<IHeroAttr>,
    locator: ITileLocator = { x: 0, y: 0 }
): IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr> {
    return {
        enemy,
        context: state.enemyContext,
        locator,
        hero,
        state
    } as IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>;
}

/**
 * 创建一个装配真实转换器与最终效果、绑定可控勇士的怪物上下文
 * @param state 顶层状态对象
 * @param hero 绑定的勇士属性对象
 */
function createContext(
    state: CoreState,
    hero: IReadonlyHeroAttribute<IHeroAttr> = createHero()
): EnemyContext<IEnemyAttr, IHeroAttr> {
    const context = new EnemyContext<IEnemyAttr, IHeroAttr>(state);
    context.resize(8, 8);
    context.bindHero(hero);
    context.registerAuraConverter(new CommonAuraConverter());
    context.registerAuraConverter(new GuardAuraConverter());
    context.registerFinalEffect(new MainEnemyFinalEffect());
    return context;
}

/**
 * 创建一个尽可能多流水线同时生效的目标怪全部顶层特殊属性
 * @param haloAtkBuff 光环提供的攻击加成百分比
 */
function createPipelineSpecials(haloAtkBuff: number): ISpecial<any>[] {
    return [
        createSpecial<void>(1, undefined),
        createSpecial<void>(2, undefined),
        createSpecial<void>(3, undefined),
        createSpecial<void>(4, undefined),
        createSpecial<number>(6, 2),
        createSpecial<number>(7, 100),
        createSpecial<number>(8, 50),
        createSpecial<IVampireValue>(11, { vampire: 10, add: true }),
        createSpecial<void>(17, undefined),
        createSpecial<number>(22, 7),
        createSpecial<IHaloValue>(25, {
            haloRange: 0,
            haloSquare: false,
            hpBuff: 0,
            atkBuff: haloAtkBuff,
            defBuff: 0
        })
    ];
}

describe('enemy combination stage 1 - component baselines', () => {
    // 验证单个魔攻特殊属性经真实模板与伤害计算器得到确定的伤害与回合数
    it('computes a single magic-attack special through the real prefab', () => {
        const state = createCoreState();
        state.enemyManager.addPrefab(
            createEnemy({ code: 1, specials: [createSpecial(2, undefined)] })
        );
        const enemy = state.enemyManager.createEnemy(1);
        if (!enemy) throw new Error('single special enemy was not created');

        const info = new MainDamageCalculator().calculate(
            createHandler(state, enemy, createHero())
        );

        expect(info).toEqual({ damage: 8, turn: 2 });
    });

    // 验证单个先攻特殊属性经真实模板与伤害计算器只额外附加一次每轮伤害
    it('computes a single first-strike special through the real prefab', () => {
        const state = createCoreState();
        state.enemyManager.addPrefab(
            createEnemy({ code: 1, specials: [createSpecial(1, undefined)] })
        );
        const enemy = state.enemyManager.createEnemy(1);
        if (!enemy) throw new Error('first-strike enemy was not created');

        const info = new MainDamageCalculator().calculate(
            createHandler(state, enemy, createHero())
        );

        expect(info).toEqual({ damage: 6, turn: 2 });
    });

    // 验证单个光环经真实上下文单次施加后只按目标自身基础属性加成，不叠加其它光环
    it('applies a single common aura through the real context', () => {
        const state = createCoreState();
        const context = createContext(state);
        const source = createEnemy({
            id: 'aura-source',
            code: 25,
            attrs: { atk: 20 },
            specials: [
                createSpecial<IHaloValue>(25, {
                    haloRange: 0,
                    haloSquare: false,
                    hpBuff: 0,
                    atkBuff: 50,
                    defBuff: 0
                })
            ]
        });
        const target = createEnemy({
            id: 'aura-target',
            code: 1,
            attrs: { atk: 8 }
        });
        context.setEnemyAt({ x: 0, y: 0 }, source);
        context.setEnemyAt({ x: 2, y: 2 }, target);

        context.buildup();

        const sourceView = context.getEnemyByLocator({ x: 0, y: 0 })!;
        const targetView = context.getEnemyByLocator({ x: 2, y: 2 })!;
        expect(sourceView.getComputedEnemy().getAttribute('atk')).toBe(30);
        expect(targetView.getComputedEnemy().getAttribute('atk')).toBe(12);
        expect(targetView.getComputedEnemy().getAttribute('guard').size).toBe(
            0
        );
    });

    // 验证单个支援光环经真实上下文施加后只把来源坐标加入相邻怪物的支援集合
    it('applies a single guard aura through the real context', () => {
        const state = createCoreState();
        const context = createContext(state);
        const source = createEnemy({
            id: 'guard-source',
            code: 26,
            specials: [createSpecial<void>(26, undefined)]
        });
        const target = createEnemy({ id: 'guard-target', code: 1 });
        context.setEnemyAt({ x: 1, y: 1 }, source);
        context.setEnemyAt({ x: 1, y: 2 }, target);

        context.buildup();

        const sourceView = context.getEnemyByLocator({ x: 1, y: 1 })!;
        const targetView = context.getEnemyByLocator({ x: 1, y: 2 })!;
        const guards = [...targetView.getComputedEnemy().getAttribute('guard')];
        expect(guards).toHaveLength(1);
        expect(guards[0]).toMatchObject({ x: 1, y: 1 });
        expect(sourceView.getComputedEnemy().getAttribute('guard').size).toBe(
            0
        );
    });
});

/**
 * 组装一个使用指定上下文（而非顶层默认上下文）的只读伤害信息对象
 * @param context 使用的怪物上下文
 * @param enemy 怪物对象
 * @param hero 勇士属性对象
 * @param locator 怪物定位符
 */
function createContextHandler(
    context: EnemyContext<IEnemyAttr, IHeroAttr>,
    enemy: IEnemy<IEnemyAttr>,
    hero: IReadonlyHeroAttribute<IHeroAttr>,
    locator: ITileLocator = { x: 0, y: 0 }
): IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr> {
    return {
        enemy,
        context,
        locator,
        hero,
        state: context.state
    } as IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>;
}

/**
 * 创建一个按优先级顺序记录自身施加、并给目标加攻击力的全局光环
 * @param priority 光环优先级
 * @param tag 记录到顺序数组的标记
 * @param order 记录施加顺序的数组
 */
function createOrderAura(
    priority: number,
    tag: string,
    order: string[]
): IAuraView<IEnemyAttr> {
    return {
        priority,
        range: new FullRange(),
        couldApplyBase: true,
        couldApplySpecial: false,
        getRangeParam: () => undefined,
        apply: handler => {
            order.push(tag);
            handler.enemy.addAttribute('atk', 1);
        },
        applySpecial: () => null
    };
}

/**
 * 创建一个只施加特殊属性（不修改基础属性）的全局光环
 * @param priority 光环优先级
 * @param code 要施加的特殊属性代码
 */
function createSpecialAura(
    priority: number,
    code: number
): IAuraView<IEnemyAttr> {
    return {
        priority,
        range: new FullRange(),
        couldApplyBase: false,
        couldApplySpecial: true,
        getRangeParam: () => undefined,
        apply: () => {},
        applySpecial: () => ({
            add: () => [createSpecial<void>(code, undefined)],
            delete: () => [],
            modify: () => false
        })
    };
}

describe('enemy combination stage 2 - multi-special and system pipelines', () => {
    // 验证多个顶层特殊属性同时存在时按真实计算器组合出确定的伤害与回合数
    it('combines multiple top-level specials into one damage result', () => {
        const state = createCoreState();
        state.enemyManager.addPrefab(
            createEnemy({
                id: 'combo-a',
                code: 1,
                specials: [
                    createSpecial(3, undefined),
                    createSpecial(4, undefined),
                    createSpecial(5, undefined),
                    createSpecial(22, 7)
                ]
            })
        );
        state.enemyManager.addPrefab(
            createEnemy({
                id: 'combo-b',
                code: 2,
                specials: [
                    createSpecial(2, undefined),
                    createSpecial<IVampireValue>(11, {
                        vampire: 10,
                        add: true
                    }),
                    createSpecial(7, 100),
                    createSpecial(8, 50)
                ]
            })
        );
        const solidCombo = state.enemyManager.createEnemy(1)!;
        const vampireCombo = state.enemyManager.createEnemy(2)!;
        const calculator = new MainDamageCalculator();

        const first = calculator.calculate(
            createHandler(state, solidCombo, createHero())
        );
        const second = calculator.calculate(
            createHandler(state, vampireCombo, createHero({ hp: 200 }))
        );

        expect(first).toEqual({ damage: 25, turn: 2 });
        expect(second).toEqual({ damage: 61, turn: 3 });
        expect(
            calculator.getCriticalLimit(
                createHandler(state, solidCombo, createHero()),
                'atk'
            )
        ).toBe(Infinity);
    });

    // 验证真实支援光环写入的支援坐标经计算器递归累加支援怪的回合与伤害
    it('recurses into a guard enemy written by the real guard aura', () => {
        const state = createCoreState();
        const hero = createHero();
        const context = createContext(state, hero);
        const guardSource = createEnemy({
            id: 'guard-source',
            code: 26,
            specials: [createSpecial<void>(26, undefined)]
        });
        const guardTarget = createEnemy({ id: 'guard-target', code: 1 });
        context.setEnemyAt({ x: 1, y: 0 }, guardSource);
        context.setEnemyAt({ x: 0, y: 0 }, guardTarget);
        context.buildup();

        const targetView = context.getEnemyByLocator({ x: 0, y: 0 })!;
        const target = targetView.getComputedEnemy();
        expect(target.getAttribute('guard').size).toBe(1);

        const info = new MainDamageCalculator().calculate(
            createContextHandler(context, target as IEnemy<IEnemyAttr>, hero, {
                x: 0,
                y: 0
            })
        );

        expect(info).toEqual({ damage: 12, turn: 4 });
    });

    // 验证支援坐标处没有怪物时告警 137 并跳过该支援，不改变基础伤害
    it('warns 137 when a guard locator has no enemy', () => {
        const state = createCoreState();
        const hero = createHero();
        const enemy = createEnemy({
            id: 'missing-guard',
            code: 1,
            attrs: { guard: new Set<ITileLocator>([{ x: 5, y: 5 }]) }
        });

        const result = logger.catch(() =>
            new MainDamageCalculator().calculate(
                createHandler(state, enemy, hero)
            )
        );

        expect(result.ret).toEqual({ damage: 3, turn: 2 });
        expect(result.info.map(item => item.code)).toContain(137);
    });

    // 验证光环基础效果先于常规查询效果执行，查询阶段能看到光环加成后的属性
    it('runs the aura base stage before the common query stage', () => {
        const state = createCoreState();
        const context = createContext(state);
        const enemy = createEnemy({
            id: 'query-target',
            code: 25,
            specials: [
                createSpecial<IHaloValue>(25, {
                    haloRange: 0,
                    haloSquare: false,
                    hpBuff: 0,
                    atkBuff: 50,
                    defBuff: 0
                })
            ]
        });
        context.setEnemyAt({ x: 0, y: 0 }, enemy);
        const observed: number[] = [];
        const effect: IEnemyCommonQueryEffect<IEnemyAttr, IHeroAttr> = {
            priority: 5,
            apply: (handler, _special, query) => {
                query();
                observed.push(handler.enemy.getAttribute('atk'));
                handler.enemy.addAttribute('atk', 1);
            }
        };
        context.registerCommonQueryEffect(25, effect);

        context.buildup();

        const view = context.getEnemyByLocator({ x: 0, y: 0 })!;
        expect(observed).toEqual([12]);
        expect(view.getComputedEnemy().getAttribute('atk')).toBe(13);
    });

    // 验证同优先级链上高优先级全局光环先于低优先级施加
    it('applies higher-priority global auras first', () => {
        const state = createCoreState();
        const context = createContext(state);
        const enemy = createEnemy({ id: 'priority-target', code: 1 });
        context.setEnemyAt({ x: 0, y: 0 }, enemy);
        const order: string[] = [];
        context.addAura(createOrderAura(40, 'p40', order));
        context.addAura(createOrderAura(30, 'p30', order));

        context.buildup();

        const view = context.getEnemyByLocator({ x: 0, y: 0 })!;
        expect(order).toEqual(['p40', 'p30']);
        expect(view.getComputedEnemy().getAttribute('atk')).toBe(10);
    });

    // 验证最终效果阶段按优先级降序执行，真实最终效果在自定义效果之后生效
    it('runs final effects in descending priority before the real effect', () => {
        const state = createCoreState();
        const context = createContext(state);
        const enemy = createEnemy({
            id: 'final-target',
            code: 3,
            specials: [createSpecial(3, undefined)]
        });
        context.setEnemyAt({ x: 0, y: 0 }, enemy);
        const order: string[] = [];
        const high: IEnemyFinalEffect<IEnemyAttr, IHeroAttr> = {
            priority: 10,
            apply: handler => {
                order.push('p10');
                handler.enemy.addAttribute('atk', 1);
            }
        };
        const low: IEnemyFinalEffect<IEnemyAttr, IHeroAttr> = {
            priority: 5,
            apply: handler => {
                order.push('p5');
                handler.enemy.addAttribute('atk', 1);
            }
        };
        context.registerFinalEffect(high);
        context.registerFinalEffect(low);

        context.buildup();

        const view = context.getEnemyByLocator({ x: 0, y: 0 })!;
        expect(order).toEqual(['p10', 'p5']);
        expect(view.getComputedEnemy().getAttribute('atk')).toBe(10);
        expect(view.getComputedEnemy().getAttribute('def')).toBe(19);
    });

    // 验证高优先级光环施加的特殊属性可被更低优先级的特殊查询效果观测
    it('feeds a special query effect from a higher-priority aura special', () => {
        const state = createCoreState();
        const context = createContext(state);
        const enemy = createEnemy({ id: 'special-target', code: 1 });
        context.setEnemyAt({ x: 0, y: 0 }, enemy);
        context.addAura(createSpecialAura(30, 99));
        let queried = false;
        const effect: IEnemySpecialQueryEffect<IEnemyAttr, IHeroAttr> = {
            priority: 20,
            for: () => ({
                shouldQuery: handler => handler.enemy.hasSpecial(99),
                add: () => [],
                delete: () => [],
                modify: () => {
                    queried = true;
                    return true;
                }
            })
        };
        context.registerSpecialQueryEffect(effect);

        context.buildup();

        const view = context.getEnemyByLocator({ x: 0, y: 0 })!;
        expect(queried).toBe(true);
        expect(view.getComputedEnemy().hasSpecial(99)).toBe(true);
    });

    // 验证属性流水线结果经缓存的伤害系统刷新，markDirty/deleteEnemy/with 行为正确
    it('links the aura pipeline result to the cached damage system', () => {
        const state = createCoreState();
        const enemy = createEnemy({ id: 'link-target', code: 1 });
        state.enemyManager.addPrefab(enemy);
        state.enemyContext.setEnemyAt({ x: 0, y: 0 }, enemy);
        state.enemyContext.buildup();

        const system = state.enemyContext.getDamageSystem()!;
        const view = state.enemyContext.getEnemyByLocator({ x: 0, y: 0 })!;
        const first = system.getDamageInfo(view);
        expect(system.getDamageInfo(view)).toBe(first);
        expect(first?.turn).toBe(0);

        system.markDirty(view);
        const afterDirty = system.getDamageInfo(view);
        expect(afterDirty).not.toBe(first);

        system.deleteEnemy(view);
        expect(system.getDamageInfo(view)).not.toBe(afterDirty);

        const hero = createHero({ atk: 20 });
        const scoped = system.with(hero);
        expect(scoped).not.toBe(system);
        const info = scoped.getDamageInfoByHandler(
            createHandler(state, createEnemy({ code: 7 }), hero)
        );
        expect(info?.damage).toBe(3);
        expect(info?.turn).toBe(2);
    });
});

describe('enemy combination stage 3 - maximum pipeline', () => {
    // 验证尽可能多流水线同时生效的单怪经真实伤害计算器得到唯一精确的 {damage,turn}
    it('computes one exact damage and turn for the maximum pipeline monster', () => {
        const state = createCoreState();
        const hero = createHero({ atk: 20, def: 5, hp: 100 });
        const context = createContext(state, hero);
        const target = createEnemy({
            id: 'pipeline-target',
            code: 1,
            specials: createPipelineSpecials(50)
        });
        const guardSource = createEnemy({
            id: 'pipeline-guard',
            code: 26,
            specials: [createSpecial<void>(26, undefined)]
        });
        // 常规查询效果：25 光环持有者额外获得 5 点生命
        context.registerCommonQueryEffect(25, {
            priority: 5,
            apply: handler => handler.enemy.addAttribute('hp', 5)
        });
        // 特殊查询效果：25 光环持有者获得惰性特殊属性 99，证明特殊查询阶段参与组合
        context.registerSpecialQueryEffect({
            priority: 20,
            for: () => ({
                shouldQuery: handler => handler.enemy.hasSpecial(25),
                add: () => [createSpecial<void>(99, undefined)],
                delete: () => [],
                modify: () => false
            })
        });
        // 自定义最终效果：25 光环持有者额外获得 6 点攻击
        context.registerFinalEffect({
            priority: 5,
            apply: handler => handler.enemy.addAttribute('atk', 6)
        });
        context.setEnemyAt({ x: 0, y: 0 }, target);
        context.setEnemyAt({ x: 1, y: 0 }, guardSource);

        context.buildup();

        const targetView = context.getEnemyByLocator({ x: 0, y: 0 })!;
        const computed = targetView.getComputedEnemy();
        // 流水线后属性：光环 atk +floor(8*50%)=+4 → 12；常规查询 hp +5 → 25；
        // 自定义 final atk +6 → 18；真实 final 坚固 def = max(5, 20-1) → 19；支援 guard = {1,0}
        expect(computed.getAttribute('atk')).toBe(18);
        expect(computed.getAttribute('def')).toBe(19);
        expect(computed.getAttribute('hp')).toBe(25);
        expect(computed.getAttribute('guard').size).toBe(1);
        expect(computed.hasSpecial(99)).toBe(true);

        // 伤害逐项推导（hero hp 100 / atk 20 / def 5 / mdef 0）：
        // 吸血 11：10% * 100 = 10 伤害，add 使怪物 hp 25+10=35
        // 魔攻 2：enemyPerDamage = atk 18；2连击 4 *2；多段 6 value 2 *2 → 72
        // 回合：ceil(35 / heroPerDamage 1) = 35
        // 支援递归（相邻支援怪同样吃到光环 atk +4 与自定义 final atk +6 → atk 18 / def 5 / hp 20）：
        //   turn ceil(20/15)=2、damage (2-1)*(18-5)=13 → turn 35+2=37、damage 10+13=23
        // 先攻 1：damage += 72 → 95；破甲 7 100% * hero def 5 = 5 → 100
        // 反击 8 50% * hero atk 20 = 10 → enemyPerDamage 82
        // 回合伤害：(37-1)*82 = 2952 → damage 3052；固伤 22 +7 → 3059；仇恨 17 +0
        const info = new MainDamageCalculator().calculate(
            createContextHandler(
                context,
                computed as IEnemy<IEnemyAttr>,
                hero,
                { x: 0, y: 0 }
            )
        );

        expect(info).toEqual({ damage: 3059, turn: 37 });
        expect(Object.keys(info).sort()).toEqual(['damage', 'turn']);
    });

    // 验证移除支援怪后同一组合得到不同的 {damage,turn}，证明支援流水线确实同时生效
    it('produces a different result once the support pipeline is removed', () => {
        const state = createCoreState();
        const hero = createHero({ atk: 20, def: 5, hp: 100 });
        const context = createContext(state, hero);
        const target = createEnemy({
            id: 'pipeline-target',
            code: 1,
            specials: createPipelineSpecials(50)
        });
        context.registerCommonQueryEffect(25, {
            priority: 5,
            apply: handler => handler.enemy.addAttribute('hp', 5)
        });
        context.registerSpecialQueryEffect({
            priority: 20,
            for: () => ({
                shouldQuery: handler => handler.enemy.hasSpecial(25),
                add: () => [createSpecial<void>(99, undefined)],
                delete: () => [],
                modify: () => false
            })
        });
        context.registerFinalEffect({
            priority: 5,
            apply: handler => handler.enemy.addAttribute('atk', 6)
        });
        context.setEnemyAt({ x: 0, y: 0 }, target);

        context.buildup();

        const targetView = context.getEnemyByLocator({ x: 0, y: 0 })!;
        const computed = targetView.getComputedEnemy();
        expect(computed.getAttribute('guard').size).toBe(0);

        // 无支援递归时：回合 ceil(35/1)=35，回合伤害 (35-1)*82=2788，
        // damage 10+72+5+2788+7=2882，故结果与最大组合不同
        const info = new MainDamageCalculator().calculate(
            createContextHandler(
                context,
                computed as IEnemy<IEnemyAttr>,
                hero,
                { x: 0, y: 0 }
            )
        );

        expect(info).toEqual({ damage: 2882, turn: 35 });
        expect(info).not.toEqual({ damage: 3059, turn: 37 });
    });
});
