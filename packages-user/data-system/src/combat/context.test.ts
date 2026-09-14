// 测试怪物上下文：注册与查询、未知查找、删除、resize、范围遍历与各类效果注册表增删
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { type IEnemy, type IStateBase } from '@user/data-base';
import {
    type IAuraConverter,
    type IEnemyCommonQueryEffect,
    type IEnemyFinalEffect,
    type IEnemySpecialQueryEffect
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
}

let modules: TestModules;

beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    const contextModule = await import('./context');
    const baseModule = await import('@user/data-base');
    modules = {
        EnemyContext: contextModule.EnemyContext,
        Enemy: baseModule.Enemy,
        HeroAttribute: baseModule.HeroAttribute
    };
});

interface FakeSpecial {
    /** 特殊属性代码 */
    readonly code: number;

    /**
     * 深拷贝此特殊属性
     */
    clone(): FakeSpecial;
}

/**
 * 创建一个最小特殊属性对象，只用于驱动注册表的匹配路径
 * @param code 特殊属性代码
 */
function createSpecial(code: number): FakeSpecial {
    return { code, clone: () => createSpecial(code) };
}

/**
 * 创建一个怪物对象
 * @param id 怪物 id
 * @param code 怪物图块数字
 */
function createEnemy(id: string, code: number): IEnemy<TestEnemyAttr> {
    return new modules.Enemy<TestEnemyAttr>(id, code, {
        hp: 10,
        atk: 2,
        def: 0
    });
}

interface ContextFixture {
    /** 被测怪物上下文 */
    context: InstanceType<TestModules['EnemyContext']>;
    /** 可修改勇士属性 */
    hero: InstanceType<TestModules['HeroAttribute']>;
}

/**
 * 创建怪物上下文测试夹具，尺寸默认按 4x3 初始化
 * @param width 上下文宽度
 * @param height 上下文高度
 */
function createContext(width: number = 4, height: number = 3): ContextFixture {
    const state = {} as IStateBase;
    const context = new modules.EnemyContext<TestEnemyAttr, TestHeroAttr>(
        state
    );
    context.resize(width, height);
    const hero = new modules.HeroAttribute<TestHeroAttr>({
        hp: 100,
        atk: 0,
        def: 0
    });
    return { context, hero };
}

describe('EnemyContext registry', () => {
    // 验证注册怪物后可按定位符、坐标与计算后怪物反查
    it('registers an enemy and resolves it from locator, point and computed', () => {
        const fixture = createContext();
        const enemy = createEnemy('e1', 1);

        fixture.context.setEnemyAt({ x: 1, y: 0 }, enemy);
        const view = fixture.context.getEnemyByLocator({ x: 1, y: 0 });

        expect(view).not.toBeNull();
        expect(fixture.context.getEnemyByLoc(1, 0)).toBe(view);
        expect(fixture.context.getEnemyLocatorByView(view!)).toEqual({
            x: 1,
            y: 0
        });
        expect(fixture.context.getEnemyLocator(enemy)).toEqual({ x: 1, y: 0 });
        expect(fixture.context.getViewByComputed(view!.getComputedEnemy())).toBe(
            view
        );
    });

    // 验证未知定位符、未知坐标与未知怪物对象均返回 null
    it('returns null for unknown lookups', () => {
        const fixture = createContext();
        const other = createEnemy('other', 2);

        expect(fixture.context.getEnemyByLocator({ x: 3, y: 2 })).toBeNull();
        expect(fixture.context.getEnemyByLoc(3, 2)).toBeNull();
        expect(fixture.context.getViewByComputed(other)).toBeNull();
        expect(fixture.context.getEnemyLocator(other)).toBeNull();
    });

    // 验证同一坐标重复注册会替换原有怪物及其映射
    it('replaces the enemy registered at the same point', () => {
        const fixture = createContext();
        const first = createEnemy('first', 1);
        const second = createEnemy('second', 2);

        fixture.context.setEnemyAt({ x: 0, y: 0 }, first);
        fixture.context.setEnemyAt({ x: 0, y: 0 }, second);

        expect(fixture.context.getEnemyLocator(first)).toBeNull();
        expect(fixture.context.getEnemyLocator(second)).toEqual({ x: 0, y: 0 });
    });

    // 验证删除怪物会同时移除视图与定位符映射
    it('removes view and locator mappings when deleting an enemy', () => {
        const fixture = createContext();
        const enemy = createEnemy('e1', 1);
        fixture.context.setEnemyAt({ x: 1, y: 0 }, enemy);
        const view = fixture.context.getEnemyByLocator({ x: 1, y: 0 })!;
        const computed = view.getComputedEnemy();

        fixture.context.deleteEnemy({ x: 1, y: 0 });

        expect(fixture.context.getEnemyByLocator({ x: 1, y: 0 })).toBeNull();
        expect(fixture.context.getEnemyLocatorByView(view)).toBeNull();
        expect(fixture.context.getEnemyLocator(enemy)).toBeNull();
        expect(fixture.context.getViewByComputed(computed)).toBeNull();
    });

    // 验证 resize 会清空怪物并更新尺寸与索引宽度
    it('resizes by clearing enemies and updating dimensions', () => {
        const fixture = createContext(4, 3);
        fixture.context.setEnemyAt({ x: 1, y: 0 }, createEnemy('e1', 1));

        fixture.context.resize(5, 2);

        expect(fixture.context.width).toBe(5);
        expect(fixture.context.height).toBe(2);
        expect(fixture.context.indexer.locToIndex(3, 1)).toBe(8);
        expect(fixture.context.getEnemyByLocator({ x: 1, y: 0 })).toBeNull();
    });

    // 验证 scanRange 与 iterateEnemy 会遍历全部已注册怪物
    it('scans and iterates all registered enemies', () => {
        const fixture = createContext();
        fixture.context.setEnemyAt({ x: 0, y: 0 }, createEnemy('first', 1));
        fixture.context.setEnemyAt({ x: 2, y: 1 }, createEnemy('second', 2));
        const range = {
            bindHost: () => {},
            autoDetect: (list: Set<number>) => [...list]
        };

        const scanned = [...fixture.context.scanRange(range as never, 0)];
        const iterated = [...fixture.context.iterateEnemy()];

        expect(scanned).toHaveLength(2);
        expect(iterated).toHaveLength(2);
        expect(iterated.map(([locator]) => locator)).toEqual([
            { x: 0, y: 0 },
            { x: 2, y: 1 }
        ]);
    });

    // 验证绑定与解绑勇士对象会同步更新查询结果
    it('binds and clears the bound hero', () => {
        const fixture = createContext();

        fixture.context.bindHero(fixture.hero);
        expect(fixture.context.getBindedHero()).toBe(fixture.hero);

        fixture.context.bindHero(null);
        expect(fixture.context.getBindedHero()).toBeNull();
    });
});

describe('EnemyContext effect registries', () => {
    // 验证注册的最终效果会在构建时执行，注销后不再执行
    it('runs registered final effects until they are unregistered', () => {
        const fixture = createContext();
        fixture.context.bindHero(fixture.hero);
        fixture.context.setEnemyAt({ x: 0, y: 0 }, createEnemy('e1', 1));
        const applied: number[] = [];
        const effect: IEnemyFinalEffect<TestEnemyAttr, TestHeroAttr> = {
            priority: 1,
            apply: () => {
                applied.push(1);
            }
        };

        fixture.context.registerFinalEffect(effect);
        fixture.context.buildup();
        expect(applied).toHaveLength(1);

        fixture.context.unregisterFinalEffect(effect);
        fixture.context.buildup();
        expect(applied).toHaveLength(1);
    });

    // 验证注册的常规查询效果会按特殊属性代码执行，注销后不再执行
    it('runs common query effects for matching specials until unregistered', () => {
        const fixture = createContext();
        fixture.context.bindHero(fixture.hero);
        const enemy = createEnemy('e1', 1);
        enemy.addSpecial(createSpecial(20) as never);
        fixture.context.setEnemyAt({ x: 0, y: 0 }, enemy);
        const queried: number[] = [];
        const effect: IEnemyCommonQueryEffect<TestEnemyAttr, TestHeroAttr> = {
            priority: 1,
            apply: () => {
                queried.push(1);
            }
        };

        fixture.context.registerCommonQueryEffect(20, effect);
        fixture.context.buildup();
        expect(queried).toHaveLength(1);

        fixture.context.unregisterCommonQueryEffect(20, effect);
        fixture.context.buildup();
        expect(queried).toHaveLength(1);
    });

    // 验证注册的特殊查询效果会在构建时构造修饰器，注销后不再构造
    it('builds special query modifiers until unregistered', () => {
        const fixture = createContext();
        fixture.context.bindHero(fixture.hero);
        fixture.context.setEnemyAt({ x: 0, y: 0 }, createEnemy('e1', 1));
        const forCalls: number[] = [];
        const modifier = {
            add: () => [],
            delete: () => [],
            modify: () => false,
            shouldQuery: () => false
        };
        const effect: IEnemySpecialQueryEffect<TestEnemyAttr, TestHeroAttr> = {
            priority: 5,
            for: () => {
                forCalls.push(1);
                return modifier;
            }
        };

        fixture.context.registerSpecialQueryEffect(effect);
        fixture.context.buildup();
        expect(forCalls).toHaveLength(1);

        fixture.context.unregisterSpecialQueryEffect(effect);
        fixture.context.buildup();
        expect(forCalls).toHaveLength(1);
    });

    // 验证注册的光环转换器会参与特殊属性转换，注销后不再参与
    it('consults aura converters until they are unregistered', () => {
        const fixture = createContext();
        fixture.context.bindHero(fixture.hero);
        const enemy = createEnemy('e1', 1);
        enemy.addSpecial(createSpecial(20) as never);
        fixture.context.setEnemyAt({ x: 0, y: 0 }, enemy);
        const consulted: number[] = [];
        const converter: IAuraConverter<TestEnemyAttr, TestHeroAttr> = {
            shouldConvert: () => {
                consulted.push(1);
                return false;
            },
            convert: () => null as never
        };

        fixture.context.registerAuraConverter(converter);
        fixture.context.buildup();
        expect(consulted).toHaveLength(1);

        fixture.context.unregisterAuraConverter(converter);
        fixture.context.buildup();
        expect(consulted).toHaveLength(1);
    });
});
