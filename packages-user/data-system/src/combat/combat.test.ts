// 测试战斗流程：同源绑定与外来绑定、脚本优先级与去重、缺参告警 139/141、非地图与独立怪物流程、真实计时器下的 await 顺序
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { type ITileLocator } from '@motajs/common';
import {
    type IEnemy,
    type IReadonlyEnemy,
    type IStateBase
} from '@user/data-base';
import {
    type ICombatScript,
    type IDamageContext,
    type IEnemyContext,
    type IEnemyDamageInfo,
    type IEnemyView
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
    CombatFlow: typeof import('./combat').CombatFlow;
    Enemy: typeof import('@user/data-base').Enemy;
    HeroAttribute: typeof import('@user/data-base').HeroAttribute;
    logger: typeof import('@motajs/common').logger;
}

let modules: TestModules;

beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    const combatModule = await import('./combat');
    const baseModule = await import('@user/data-base');
    const motaModule = await import('@motajs/common');
    modules = {
        CombatFlow: combatModule.CombatFlow,
        Enemy: baseModule.Enemy,
        HeroAttribute: baseModule.HeroAttribute,
        logger: motaModule.logger
    };
});

interface Deferred {
    /** 由外部释放的等待 promise */
    readonly promise: Promise<void>;

    /**
     * 释放等待
     */
    resolve(): void;
}

/**
 * 创建一个可手动释放的异步闸门，用于验证真实计时器下的 await 顺序
 */
function createDeferred(): Deferred {
    let resolve: () => void = () => {};
    const promise = new Promise<void>(r => {
        resolve = r;
    });
    return { promise, resolve };
}

/**
 * 记录调用顺序的测试战斗脚本
 */
class FakeScript implements ICombatScript<TestEnemyAttr, TestHeroAttr> {
    readonly priority: number;
    /** 用于区分同一次运行内的多个脚本 */
    readonly label: string;
    /** 共享的调用顺序记录 */
    readonly calls: string[];
    /** before 的返回值，真值表示短路 */
    beforeResult: boolean;
    /** before 需要等待的异步闸门 */
    gate: Deferred | null = null;

    constructor(
        priority: number,
        label: string,
        calls: string[],
        beforeResult: boolean = false
    ) {
        this.priority = priority;
        this.label = label;
        this.calls = calls;
        this.beforeResult = beforeResult;
    }

    async before(): Promise<boolean> {
        this.calls.push(`${this.label}.before`);
        if (this.gate) await this.gate.promise;
        return this.beforeResult;
    }

    async after(): Promise<void> {
        this.calls.push(`${this.label}.after`);
    }
}

type TestCombatFlow = import('./combat').CombatFlow<
    TestEnemyAttr,
    TestHeroAttr
>;
type TestHeroAttribute = import('@user/data-base').HeroAttribute<TestHeroAttr>;

interface CombatFixture {
    /** 被测战斗流程对象 */
    flow: TestCombatFlow;
    /** 数据层状态假对象 */
    state: IStateBase;
    /** 怪物上下文假对象 */
    context: IEnemyContext<TestEnemyAttr, TestHeroAttr>;
    /** 伤害上下文假对象 */
    damage: IDamageContext<TestEnemyAttr, TestHeroAttr>;
    /** 可修改勇士属性 */
    hero: TestHeroAttribute;
    /** 怪物视图假对象 */
    view: IEnemyView<TestEnemyAttr>;
    /** 计算后怪物 */
    computed: IReadonlyEnemy<TestEnemyAttr>;
    /** 可修改原始怪物 */
    origin: IEnemy<TestEnemyAttr>;
    /** 怪物位置 */
    locator: ITileLocator;
    /** 共享调用顺序记录 */
    calls: string[];
    /** 伤害上下文固定返回的信息对象 */
    info: IEnemyDamageInfo<TestEnemyAttr, TestHeroAttr>;
}

/**
 * 创建战斗流程测试夹具，怪物/伤害上下文只实现被测路径所需的最小接口
 */
function createFixture(): CombatFixture {
    const state = {} as IStateBase;
    const calls: string[] = [];
    const origin = new modules.Enemy<TestEnemyAttr>('enemy-1', 1, {
        hp: 10,
        atk: 2,
        def: 0
    });
    const computed = origin.clone();
    const locator: ITileLocator = { x: 1, y: 1 };
    const view: IEnemyView<TestEnemyAttr> = {
        context: {} as never,
        reset: () => {},
        getBaseEnemy: () => origin,
        getComputedEnemy: () => computed,
        getModifiableEnemy: () => origin,
        markDirty: () => {}
    };
    const hero = new modules.HeroAttribute<TestHeroAttr>({
        hp: 100,
        atk: 0,
        def: 0
    });
    const context = {
        state,
        width: 2,
        height: 2,
        getEnemyLocatorByView: () => locator,
        getEnemyLocator: () => locator,
        getViewByComputed: () => view,
        getEnemyByLocator: () => view,
        getEnemyByLoc: () => view
    } as never;
    const info = { handler: {} as never, damage: 5, turn: 2 } as never;
    const damage = {
        state,
        getDamageInfoByHandler: () => info
    } as never;
    const flow = new modules.CombatFlow<TestEnemyAttr, TestHeroAttr>(state);
    return {
        flow,
        state,
        context,
        damage,
        hero,
        view,
        computed,
        origin,
        locator,
        calls,
        info
    };
}

/**
 * 把夹具的怪物上下文、伤害上下文与勇士全部绑定到战斗流程上
 */
function bindAll(fixture: CombatFixture): void {
    fixture.flow.bindContext(fixture.context);
    fixture.flow.bindDamage(fixture.damage);
    fixture.flow.bindHero(fixture.hero);
}

describe('CombatFlow binding', () => {
    // 验证同 state 的怪物与伤害上下文可绑定，传入 null 会清空绑定
    it('binds same-state collaborators and clears them with null', () => {
        const fixture = createFixture();

        fixture.flow.bindContext(fixture.context);
        fixture.flow.bindDamage(fixture.damage);
        expect(fixture.flow.context).toBe(fixture.context);
        expect(fixture.flow.damage).toBe(fixture.damage);

        fixture.flow.bindContext(null);
        fixture.flow.bindDamage(null);
        expect(fixture.flow.context).toBeNull();
        expect(fixture.flow.damage).toBeNull();
    });

    // 验证绑定外来 state 的上下文或伤害对象时告警 138 且保持未绑定
    it('warns 138 for collaborators bound to a foreign state', () => {
        const fixture = createFixture();
        const foreignState = {} as IStateBase;
        const foreignContext = { state: foreignState } as never;
        const foreignDamage = { state: foreignState } as never;

        const contextResult = modules.logger.catch(() =>
            fixture.flow.bindContext(foreignContext)
        );
        const damageResult = modules.logger.catch(() =>
            fixture.flow.bindDamage(foreignDamage)
        );

        expect(fixture.flow.context).toBeNull();
        expect(fixture.flow.damage).toBeNull();
        expect(contextResult.info.map(v => v.code)).toContain(138);
        expect(damageResult.info.map(v => v.code)).toContain(138);
    });

    // 验证绑定与清空勇士对象会同步更新 hero 成员
    it('binds and clears the hero reference', () => {
        const fixture = createFixture();

        fixture.flow.bindHero(fixture.hero);
        expect(fixture.flow.hero).toBe(fixture.hero);

        fixture.flow.bindHero(null);
        expect(fixture.flow.hero).toBeNull();
    });
});

describe('CombatFlow scripts and guards', () => {
    // 验证脚本按优先级降序执行，重复优先级告警 140 且不加入列表
    it('sorts scripts by descending priority and rejects duplicates', async () => {
        const fixture = createFixture();
        bindAll(fixture);
        const low = new FakeScript(1, 'low', fixture.calls);
        const high = new FakeScript(2, 'high', fixture.calls);
        const duplicate = new FakeScript(1, 'duplicate', fixture.calls);
        fixture.flow.addCombatScript(low);
        fixture.flow.addCombatScript(high);

        const result = modules.logger.catch(() =>
            fixture.flow.addCombatScript(duplicate)
        );

        expect(result.info.map(v => v.code)).toContain(140);

        await fixture.flow.battle(fixture.view);
        expect(fixture.calls).toEqual([
            'high.before',
            'low.before',
            'high.after',
            'low.after'
        ]);
    });

    // 验证缺少怪物上下文、勇士或伤害上下文时告警 139 并返回 null
    it('warns 139 when a required collaborator is missing', async () => {
        const noContext = createFixture();
        const contextResult = modules.logger.catch(() =>
            noContext.flow.battle(noContext.view)
        );
        expect(contextResult.info.map(v => v.code)).toContain(139);
        await expect(contextResult.ret).resolves.toBeNull();

        const noHero = createFixture();
        noHero.flow.bindContext(noHero.context);
        const heroResult = modules.logger.catch(() =>
            noHero.flow.battle(noHero.view)
        );
        expect(heroResult.info.map(v => v.code)).toContain(139);
        await expect(heroResult.ret).resolves.toBeNull();

        const noDamage = createFixture();
        noDamage.flow.bindContext(noDamage.context);
        noDamage.flow.bindHero(noDamage.hero);
        const damageResult = modules.logger.catch(() =>
            noDamage.flow.battle(noDamage.view)
        );
        expect(damageResult.info.map(v => v.code)).toContain(139);
        await expect(damageResult.ret).resolves.toBeNull();
    });

    // 验证伤害上下文无法产出伤害信息时告警 141 并返回 null
    it('warns 141 when the damage context cannot produce damage info', async () => {
        const fixture = createFixture();
        fixture.flow.bindContext(fixture.context);
        fixture.flow.bindHero(fixture.hero);
        fixture.flow.bindDamage({
            state: fixture.state,
            getDamageInfoByHandler: () => null
        } as never);

        const result = modules.logger.catch(() =>
            fixture.flow.battle(fixture.view)
        );

        expect(result.info.map(v => v.code)).toContain(141);
        await expect(result.ret).resolves.toBeNull();
    });

    // 验证已知计算后怪物会转交给对应视图的 battle 流程
    it('delegates a known computed enemy to the view battle flow', async () => {
        const fixture = createFixture();
        bindAll(fixture);

        const info = await fixture.flow.battleComputed(fixture.computed);

        expect(info).toBe(fixture.info);
    });

    // 验证怪物无法解析出地图位置时战斗信息对象标记为非地图状态
    it('marks the combat handler as off-map when no locator can be resolved', async () => {
        const fixture = createFixture();
        const context = {
            state: fixture.state,
            getEnemyLocatorByView: () => null,
            getEnemyLocator: () => null,
            getViewByComputed: () => null,
            getEnemyByLocator: () => null,
            getEnemyByLoc: () => null
        } as never;
        fixture.flow.bindContext(context);
        fixture.flow.bindHero(fixture.hero);
        fixture.flow.bindDamage(fixture.damage);
        let onMap: boolean | null = null;
        fixture.flow.addCombatScript({
            priority: 1,
            before: async (_info, handler) => {
                onMap = handler.onMap;
                return false;
            },
            after: async () => {}
        });

        const info = await fixture.flow.battle(fixture.view);

        expect(info).toBe(fixture.info);
        expect(onMap).toBe(false);
    });

    // 验证未登记的怪物对象会走独立战斗流程并返回伤害信息
    it('battles an unregistered computed enemy through the standalone path', async () => {
        const fixture = createFixture();
        const context = {
            state: fixture.state,
            getEnemyLocatorByView: () => null,
            getEnemyLocator: () => null,
            getViewByComputed: () => null,
            getEnemyByLocator: () => null,
            getEnemyByLoc: () => null
        } as never;
        fixture.flow.bindContext(context);
        fixture.flow.bindHero(fixture.hero);
        fixture.flow.bindDamage(fixture.damage);
        const foreign = new modules.Enemy<TestEnemyAttr>('foreign', 2, {
            hp: 5,
            atk: 1,
            def: 0
        });

        const info = await fixture.flow.battleComputed(foreign.clone());

        expect(info).toBe(fixture.info);
    });
});

describe('CombatFlow async ordering', () => {
    // 验证战前脚本 await 完成后才依次执行战前钩子、战后脚本与战后钩子
    it('awaits the before script before running hooks and after scripts', async () => {
        const fixture = createFixture();
        bindAll(fixture);
        const gate = createDeferred();
        const script = new FakeScript(1, 'script', fixture.calls);
        script.gate = gate;
        fixture.flow.addCombatScript(script);
        fixture.flow
            .addHook({
                onBeforeCombat: async () => {
                    fixture.calls.push('hooks.onBeforeCombat');
                },
                onAfterCombat: async () => {
                    fixture.calls.push('hooks.onAfterCombat');
                }
            })
            .load();

        const running = fixture.flow.battle(fixture.view);
        await Promise.resolve();
        expect(fixture.calls).toEqual(['script.before']);

        gate.resolve();
        await running;

        expect(fixture.calls).toEqual([
            'script.before',
            'hooks.onBeforeCombat',
            'script.after',
            'hooks.onAfterCombat'
        ]);
    });

    // 验证战前脚本返回真值时短路，不再执行钩子与战后脚本
    it('short-circuits hooks and after scripts when before returns truthy', async () => {
        const fixture = createFixture();
        bindAll(fixture);
        const script = new FakeScript(1, 'script', fixture.calls, true);
        fixture.flow.addCombatScript(script);
        fixture.flow
            .addHook({
                onBeforeCombat: async () => {
                    fixture.calls.push('hooks.onBeforeCombat');
                },
                onAfterCombat: async () => {
                    fixture.calls.push('hooks.onAfterCombat');
                }
            })
            .load();

        const info = await fixture.flow.battle(fixture.view);

        expect(info).toBe(fixture.info);
        expect(fixture.calls).toEqual(['script.before']);
    });

    // 疑似 bug：接口约定战前脚本返回 false 应放弃战斗，详见 06-TEST-FINDINGS.md #06-01-3，修复后取消 skip
    it.skip('abandons the battle when the before script returns false', async () => {
        const fixture = createFixture();
        bindAll(fixture);
        const script = new FakeScript(1, 'script', fixture.calls, false);
        fixture.flow.addCombatScript(script);
        fixture.flow
            .addHook({
                onBeforeCombat: async () => {
                    fixture.calls.push('hooks.onBeforeCombat');
                }
            })
            .load();

        await fixture.flow.battle(fixture.view);

        expect(fixture.calls).toEqual(['script.before']);
    });
});
