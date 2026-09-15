// 测试战斗伤害上下文与伤害系统：结果展开、handler 身份、告警码 106/107、缓存与 with、临界生成、属性到伤害联动（D-26）
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { type ITileLocator } from '@motajs/common';
import {
    type IEnemy,
    type IReadonlyEnemy,
    type IStateBase
} from '@user/data-base';
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
    DamageSystem: typeof import('./damage').DamageSystem;
    EnemyContext: typeof import('./context').EnemyContext;
    HeroAttribute: typeof import('@user/data-base').HeroAttribute;
    Enemy: typeof import('@user/data-base').Enemy;
    MapLocIndexer: typeof import('@user/data-common').MapLocIndexer;
    FullRange: typeof import('@motajs/common').FullRange;
    logger: typeof import('@motajs/common').logger;
}

let modules: TestModules;

beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    const damageModule = await import('./damage');
    const contextModule = await import('./context');
    const baseModule = await import('@user/data-base');
    const commonModule = await import('@user/data-common');
    const motaModule = await import('@motajs/common');
    modules = {
        DamageContext: damageModule.DamageContext,
        DamageSystem: damageModule.DamageSystem,
        EnemyContext: contextModule.EnemyContext,
        HeroAttribute: baseModule.HeroAttribute,
        Enemy: baseModule.Enemy,
        MapLocIndexer: commonModule.MapLocIndexer,
        FullRange: motaModule.FullRange,
        logger: motaModule.logger
    };
});

/**
 * 固定伤害计算器：每点攻击减免固定伤害，用于验证结果展开与临界生成
 */
class FakeCalculator implements IDamageCalculator<TestEnemyAttr, TestHeroAttr> {
    /** 每点攻击减免的伤害值 */
    readonly damagePerAtk: number;
    /** calculate 调用次数 */
    calls: number = 0;

    constructor(damagePerAtk: number = 10) {
        this.damagePerAtk = damagePerAtk;
    }

    calculate(
        handler: IReadonlyEnemyHandler<TestEnemyAttr, TestHeroAttr>
    ): IEnemyDamageInfoBase {
        this.calls++;
        const atk = handler.hero.getBaseAttribute('atk');
        return {
            damage: Math.max(0, 100 - atk * this.damagePerAtk),
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
type TestEnemyContext = import('./context').EnemyContext<
    TestEnemyAttr,
    TestHeroAttr
>;

interface DamageFixture {
    /** 怪物上下文假对象 */
    context: IEnemyContext<TestEnemyAttr, TestHeroAttr>;
    /** 固定伤害计算器 */
    calculator: FakeCalculator;
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
}

/**
 * 创建伤害测试夹具，怪物上下文只实现被测路径所需的最小接口
 */
function createFixture(): DamageFixture {
    const state = {} as IStateBase;
    const indexer = new modules.MapLocIndexer();
    indexer.setWidth(4);
    const hero = new modules.HeroAttribute<TestHeroAttr>({
        hp: 100,
        atk: 0,
        def: 0
    });
    const origin = new modules.Enemy<TestEnemyAttr>('enemy-1', 1, {
        hp: 30,
        atk: 8,
        def: 2
    });
    const computed = origin.clone();
    const locator: ITileLocator = { x: 2, y: 3 };
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
    locators.set(view, locator);
    computedViews.set(computed, view);
    const context = {
        state,
        indexer,
        getBindedHero: () => hero,
        getEnemyLocatorByView: (target: IEnemyView<TestEnemyAttr>) =>
            locators.get(target) ?? null,
        getViewByComputed: (target: IReadonlyEnemy<TestEnemyAttr>) =>
            computedViews.get(target) ?? null
    } as never;
    return {
        context,
        calculator: new FakeCalculator(),
        hero,
        view,
        computed,
        origin,
        locator
    };
}

/**
 * 创建一个未注册到夹具中的怪物视图，用于验证未知定位符路径
 */
function createUnknownView(fixture: DamageFixture): IEnemyView<TestEnemyAttr> {
    return {
        context: {} as never,
        reset: () => {},
        getBaseEnemy: () => fixture.origin,
        getComputedEnemy: () => fixture.computed,
        getModifiableEnemy: () => fixture.origin,
        markDirty: () => {}
    };
}

/**
 * 创建一个绑定给定夹具的只读信息对象
 */
function createHandler(
    fixture: DamageFixture
): IReadonlyEnemyHandler<TestEnemyAttr, TestHeroAttr> {
    return {
        enemy: fixture.computed,
        context: fixture.context,
        locator: fixture.locator,
        hero: fixture.hero,
        state: fixture.context.state
    };
}

/**
 * 创建一个最小特殊属性对象，用于驱动真实怪物上下文的光环转换
 * @param code 特殊属性代码
 */
function createSpecial(code: number): never {
    return { code, clone: () => createSpecial(code) } as never;
}

/**
 * 创建一个按怪物攻击力线性换算伤害的计算器，用于验证属性到伤害的联动
 */
class EnemyAttributeCalculator implements IDamageCalculator<
    TestEnemyAttr,
    TestHeroAttr
> {
    /** calculate 调用次数 */
    calls: number = 0;
    /** 每点怪物攻击力换算的伤害 */
    readonly damagePerAtk: number;

    /**
     * @param damagePerAtk 每点怪物攻击力换算的伤害
     */
    constructor(damagePerAtk: number = 2) {
        this.damagePerAtk = damagePerAtk;
    }

    calculate(
        handler: IReadonlyEnemyHandler<TestEnemyAttr, TestHeroAttr>
    ): IEnemyDamageInfoBase {
        this.calls++;
        return {
            damage: handler.enemy.getAttribute('atk') * this.damagePerAtk,
            turn: 1
        };
    }

    getCriticalLimit(): number {
        return 100;
    }
}

/**
 * 创建一个按怪物攻击力换算伤害的测试计算器
 * @param damagePerAtk 每点怪物攻击力换算的伤害
 */
function createCalculator(damagePerAtk: number = 2): EnemyAttributeCalculator {
    return new EnemyAttributeCalculator(damagePerAtk);
}

interface FakeConverterShape {
    /**
     * 判断特殊属性是否应被转换
     * @param special 特殊属性
     */
    shouldConvert(special: { code: number }): boolean;

    /**
     * 将特殊属性转换为光环视图
     */
    convert(): unknown;
}

/**
 * 创建一个可驱动光环流水线的真实怪物上下文
 * @param converter 赋予上下文的测试用光环转换器
 */
function createEnemyContext(converter: FakeConverterShape): TestEnemyContext {
    const context = new modules.EnemyContext<TestEnemyAttr, TestHeroAttr>(
        {} as IStateBase
    );
    context.resize(3, 3);
    context.registerAuraConverter(converter as never);
    return context;
}

describe('DamageContext behaviour', () => {
    // 验证已绑定计算器与勇士时按视图返回计算器结果，并携带正确身份的 handler
    it('returns calculator output with an identity handler for a view', () => {
        const fixture = createFixture();
        const context = new modules.DamageContext(
            fixture.context,
            fixture.calculator,
            fixture.hero
        );

        const info = context.getDamageInfo(fixture.view);

        expect(info?.damage).toBe(100);
        expect(info?.turn).toBe(2);
        expect(info?.handler.enemy).toBe(fixture.computed);
        expect(info?.handler.hero).toBe(fixture.hero);
        expect(info?.handler.locator).toBe(fixture.locator);
        expect(info?.handler.state).toBe(fixture.context.state);
    });

    // 验证按计算后怪物反查视图并返回相同的伤害信息
    it('resolves a computed enemy back to its view', () => {
        const fixture = createFixture();
        const context = new modules.DamageContext(
            fixture.context,
            fixture.calculator,
            fixture.hero
        );

        const info = context.getDamageInfoByComputed(fixture.computed);

        expect(info?.damage).toBe(100);
        expect(info?.handler.enemy).toBe(fixture.computed);
    });

    // 验证直接传入 handler 时原样返回该 handler 与计算器结果
    it('returns the raw calculator result for a supplied handler', () => {
        const fixture = createFixture();
        const context = new modules.DamageContext(
            fixture.context,
            fixture.calculator,
            fixture.hero
        );
        const handler = createHandler(fixture);

        const info = context.getDamageInfoByHandler(handler);

        expect(info?.handler).toBe(handler);
        expect(info?.damage).toBe(100);
        expect(info?.turn).toBe(2);
    });

    // 验证未绑定勇士时告警 107 并返回 null
    it('warns 107 when hero status is missing', () => {
        const fixture = createFixture();
        const context = new modules.DamageContext(
            fixture.context,
            fixture.calculator,
            null
        );

        const result = modules.logger.catch(() =>
            context.getDamageInfo(fixture.view)
        );

        expect(result.ret).toBeNull();
        expect(result.info.map(v => v.code)).toContain(107);
    });

    // 验证未绑定计算器时告警 106 并返回 null（视图、计算后怪物与 handler 三条路径）
    it('warns 106 when the calculator is missing', () => {
        const fixture = createFixture();
        const context = new modules.DamageContext(
            fixture.context,
            null,
            fixture.hero
        );

        const byView = modules.logger.catch(() =>
            context.getDamageInfo(fixture.view)
        );
        const byComputed = modules.logger.catch(() =>
            context.getDamageInfoByComputed(fixture.computed)
        );
        const byHandler = modules.logger.catch(() =>
            context.getDamageInfoByHandler(createHandler(fixture))
        );

        expect(byView.ret).toBeNull();
        expect(byView.info.map(v => v.code)).toContain(106);
        expect(byComputed.ret).toBeNull();
        expect(byComputed.info.map(v => v.code)).toContain(106);
        expect(byHandler.ret).toBeNull();
        expect(byHandler.info.map(v => v.code)).toContain(106);
    });

    // 验证视图查不到定位符时按 null 返回且不产生告警
    it('returns null without warning for a view without a locator', () => {
        const fixture = createFixture();
        const context = new modules.DamageContext(
            fixture.context,
            fixture.calculator,
            fixture.hero
        );

        const result = modules.logger.catch(() =>
            context.getDamageInfo(createUnknownView(fixture))
        );

        expect(result.ret).toBeNull();
        expect(result.info).toHaveLength(0);
    });
});

describe('DamageSystem caching', () => {
    // 验证连续两次取伤害命中同一缓存对象，markDirty 之后重新计算
    it('caches the damage info until the enemy is marked dirty', () => {
        const fixture = createFixture();
        const system = new modules.DamageSystem(fixture.context);
        system.useCalculator(fixture.calculator);
        system.bindHeroStatus(fixture.hero);

        const first = system.getDamageInfo(fixture.view);
        const second = system.getDamageInfo(fixture.view);

        expect(second).toBe(first);
        expect(fixture.calculator.calls).toBe(1);

        system.markDirty(fixture.view);
        const third = system.getDamageInfo(fixture.view);

        expect(third).not.toBe(first);
        expect(third?.damage).toBe(first?.damage);
        expect(fixture.calculator.calls).toBe(2);
    });

    // 验证 markAllDirty、useCalculator、bindHeroStatus 与 deleteEnemy 都会让缓存失效
    it('invalidates the cache on system mutations', () => {
        const fixture = createFixture();
        const system = new modules.DamageSystem(fixture.context);
        system.useCalculator(fixture.calculator);
        system.bindHeroStatus(fixture.hero);

        const first = system.getDamageInfo(fixture.view);

        system.markAllDirty();
        const second = system.getDamageInfo(fixture.view);
        expect(second).not.toBe(first);

        system.useCalculator(fixture.calculator);
        const third = system.getDamageInfo(fixture.view);
        expect(third).not.toBe(second);

        system.bindHeroStatus(fixture.hero);
        const fourth = system.getDamageInfo(fixture.view);
        expect(fourth).not.toBe(third);

        system.deleteEnemy(fixture.view);
        const fifth = system.getDamageInfo(fixture.view);
        expect(fifth).not.toBe(fourth);
    });

    // 验证按计算后怪物查询同样命中缓存
    it('caches the damage info resolved from a computed enemy', () => {
        const fixture = createFixture();
        const system = new modules.DamageSystem(fixture.context);
        system.useCalculator(fixture.calculator);
        system.bindHeroStatus(fixture.hero);

        const first = system.getDamageInfoByComputed(fixture.computed);
        const second = system.getDamageInfoByComputed(fixture.computed);

        expect(second).toBe(first);
    });

    // 验证 with(hero) 返回共享计算器、使用传入勇士的独立伤害上下文
    it('builds an isolated damage context sharing the calculator', () => {
        const fixture = createFixture();
        const system = new modules.DamageSystem(fixture.context);
        system.useCalculator(fixture.calculator);
        system.bindHeroStatus(fixture.hero);
        const otherHero = new modules.HeroAttribute<TestHeroAttr>({
            hp: 50,
            atk: 4,
            def: 1
        });

        const scoped = system.with(otherHero);
        const info = scoped.getDamageInfo(fixture.view);

        expect(system.getCalculator()).toBe(fixture.calculator);
        expect(scoped).not.toBe(system);
        expect(info?.handler.hero).toBe(otherHero);
        expect(info?.damage).toBe(60);
    });
});

describe('DamageContext critical generation', () => {
    // 验证从当前属性出发产出下一临界点及其增量与基准伤害
    it('yields the next critical point with its deltas', () => {
        const fixture = createFixture();
        const context = new modules.DamageContext(
            fixture.context,
            fixture.calculator,
            fixture.hero
        );

        const first = context
            .calculateCritical(fixture.view, 'atk')
            .next().value!;

        expect(first.baseValue).toBe(0);
        expect(first.nextValue).toBe(1);
        expect(first.nextDiff).toBe(1);
        expect(first.baseInfo.damage).toBe(100);
    });

    // 验证属性已达到临界上界时不产出任何临界点
    it('yields nothing when the attribute already reaches the limit', () => {
        const fixture = createFixture();
        fixture.hero.set('atk', 10);
        const context = new modules.DamageContext(
            fixture.context,
            fixture.calculator,
            fixture.hero
        );

        const results = [...context.calculateCritical(fixture.view, 'atk')];

        expect(results).toEqual([]);
    });

    // 验证缺少勇士、缺少计算器或缺少定位符时安全返回且告警对应错误码
    it('returns safely when hero, calculator or locator is missing', () => {
        const fixture = createFixture();
        const noHero = new modules.DamageContext(
            fixture.context,
            fixture.calculator,
            null
        );
        const noCalculator = new modules.DamageContext(
            fixture.context,
            null,
            fixture.hero
        );
        const withLocator = new modules.DamageContext(
            fixture.context,
            fixture.calculator,
            fixture.hero
        );

        const heroResult = modules.logger.catch(() => [
            ...noHero.calculateCritical(fixture.view, 'atk')
        ]);
        const calculatorResult = modules.logger.catch(() => [
            ...noCalculator.calculateCritical(fixture.view, 'atk')
        ]);
        const locatorResult = modules.logger.catch(() => [
            ...withLocator.calculateCritical(createUnknownView(fixture), 'atk')
        ]);

        expect(heroResult.ret).toEqual([]);
        expect(heroResult.info.map(v => v.code)).toContain(107);
        expect(calculatorResult.ret).toEqual([]);
        expect(calculatorResult.info.map(v => v.code)).toContain(106);
        expect(locatorResult.ret).toEqual([]);
        expect(locatorResult.info).toHaveLength(0);
    });

    // 验证产出的 info 与 nextValue 同源，即临界点伤害信息对应该属性值
    it('reports the damage info matching the yielded critical value', () => {
        const fixture = createFixture();
        const context = new modules.DamageContext(
            fixture.context,
            fixture.calculator,
            fixture.hero
        );

        const first = context
            .calculateCritical(fixture.view, 'atk')
            .next().value!;

        expect(first.nextValue).toBe(1);
        expect(first.info.damage).toBe(90);
        expect(first.damageDiff).toBe(-10);
    });
});

describe('DamageSystem attribute linkage', () => {
    // 验证 getCalculator 在未设置时返回 null，设置后返回同一计算器
    it('exposes the current calculator through getCalculator', () => {
        const fixture = createFixture();
        const system = new modules.DamageSystem(fixture.context);

        expect(system.getCalculator()).toBeNull();

        const calculator = createCalculator(3);
        system.useCalculator(calculator);

        expect(system.getCalculator()).toBe(calculator);
    });

    // 验证光环改属性后伤害系统按新属性重算，且全量构建会失效缓存（D-26）
    it('reflects aura-modified attributes and invalidates the cache on buildup', () => {
        const context = createEnemyContext({
            shouldConvert: special => special.code === 20,
            convert: () => ({
                priority: 1,
                range: new modules.FullRange(),
                couldApplyBase: true,
                couldApplySpecial: false,
                getRangeParam: () => undefined,
                apply: (handler: { enemy: IEnemy<TestEnemyAttr> }) =>
                    handler.enemy.addAttribute('atk', 5),
                applySpecial: () => null
            })
        });
        const hero = new modules.HeroAttribute<TestHeroAttr>({
            hp: 100,
            atk: 0,
            def: 0
        });
        context.bindHero(hero);
        const enemy = new modules.Enemy<TestEnemyAttr>('e1', 1, {
            hp: 10,
            atk: 2,
            def: 0
        });
        enemy.addSpecial(createSpecial(20));
        context.setEnemyAt({ x: 0, y: 0 }, enemy);
        const calculator = createCalculator(2);
        const system = new modules.DamageSystem(context);
        system.useCalculator(calculator);
        context.attachDamageSystem(system);

        context.buildup();

        const view = context.getEnemyByLoc(0, 0)!;
        const first = system.getDamageInfo(view);

        expect(first?.damage).toBe(14);
        expect(calculator.calls).toBe(1);

        expect(system.getDamageInfo(view)).toBe(first);
        expect(calculator.calls).toBe(1);

        // setEnemyAt 换入更高攻击的怪物并重新构建，伤害随新属性重算
        const stronger = new modules.Enemy<TestEnemyAttr>('e2', 1, {
            hp: 10,
            atk: 20,
            def: 0
        });
        stronger.addSpecial(createSpecial(20));
        context.setEnemyAt({ x: 0, y: 0 }, stronger);
        context.buildup();
        const newView = context.getEnemyByLoc(0, 0)!;
        const second = system.getDamageInfo(newView);

        expect(second).not.toBe(first);
        expect(second?.damage).toBe(50);
        expect(calculator.calls).toBe(2);

        // clear 会清空伤害缓存，因此再次取用不再命中旧缓存而返回 null
        context.clear();
        expect(system.getDamageInfo(newView)).toBeNull();
    });

    // 验证重复全量构建从原始怪物重算而非在原计算值上累加
    it('recomputes a repeat buildup from the base enemy without compounding', () => {
        const context = createEnemyContext({
            shouldConvert: special => special.code === 20,
            convert: () => ({
                priority: 1,
                range: new modules.FullRange(),
                couldApplyBase: true,
                couldApplySpecial: false,
                getRangeParam: () => undefined,
                apply: (handler: { enemy: IEnemy<TestEnemyAttr> }) =>
                    handler.enemy.addAttribute('atk', 5),
                applySpecial: () => null
            })
        });
        context.bindHero(
            new modules.HeroAttribute<TestHeroAttr>({ hp: 100, atk: 0, def: 0 })
        );
        const enemy = new modules.Enemy<TestEnemyAttr>('e1', 1, {
            hp: 10,
            atk: 2,
            def: 0
        });
        enemy.addSpecial(createSpecial(20));
        context.setEnemyAt({ x: 0, y: 0 }, enemy);
        context.buildup();
        context.addAura({
            priority: 2,
            range: new modules.FullRange(),
            couldApplyBase: true,
            couldApplySpecial: false,
            getRangeParam: () => undefined,
            apply: (handler: { enemy: IEnemy<TestEnemyAttr> }) =>
                handler.enemy.addAttribute('atk', 10),
            applySpecial: () => null
        } as never);

        context.buildup();

        expect(
            context.getEnemyByLoc(0, 0)!.getComputedEnemy().getAttribute('atk')
        ).toBe(17);
    });
});
