// 测试顶层伤害组合：单特殊属性 / 单光环基线，以及多特殊属性与系统层光环效果组合
import { describe, expect, it, vi } from 'vitest';
import { type ITileLocator } from '@motajs/common';
import { type IEnemyAttr, type IHeroAttr } from '@user/data-common';
import {
    Enemy,
    type IEnemy,
    type IReadonlyHeroAttribute,
    type ISpecial
} from '@user/data-base';
import { EnemyContext, type IReadonlyEnemyHandler } from '@user/data-system';
import { createCoreState, type CoreState } from '../src/core';
import { MainDamageCalculator } from '../src/enemy/calculator';
import { CommonAuraConverter, GuardAuraConverter } from '../src/enemy/aura';
import { MainEnemyFinalEffect } from '../src/enemy/final';
import { type IHaloValue } from '../src/enemy/special';

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
        ...overrides
    };
    const hero = {
        getBaseAttribute: (name: string) => (values as never)[name],
        getFinalAttribute: (name: string) => (values as never)[name],
        getModifiableClone: () => hero
    };
    return hero as unknown as IReadonlyHeroAttribute<IHeroAttr>;
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
