// 测试怪物上下文：阶段 1 覆盖全部公开方法、单光环三范围、单效果与生命周期；阶段 2 覆盖光环流水线、嵌套/优先级、四阶段顺序、刷新路径与警告码
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { type IRange } from '@motajs/common';
import {
    type IEnemy,
    type IReadonlyEnemy,
    type IReadonlyHeroAttribute,
    type IStateBase,
    type ISpecial
} from '@user/data-base';
import {
    type IAuraConverter,
    type IAuraView,
    type IEnemyAuraView,
    type IEnemyCommonQueryEffect,
    type IEnemyFinalEffect,
    type IEnemyHandler,
    type IEnemySpecialModifier,
    type IEnemySpecialQueryEffect,
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
    EnemyContext: typeof import('./context').EnemyContext;
    Enemy: typeof import('@user/data-base').Enemy;
    HeroAttribute: typeof import('@user/data-base').HeroAttribute;
    RectRange: typeof import('@motajs/common').RectRange;
    ManhattanRange: typeof import('@motajs/common').ManhattanRange;
    FullRange: typeof import('@motajs/common').FullRange;
    logger: typeof import('@motajs/common').logger;
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
        RectRange: motaModule.RectRange,
        ManhattanRange: motaModule.ManhattanRange,
        FullRange: motaModule.FullRange,
        logger: motaModule.logger
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
 * 创建一个最小特殊属性对象，只用于驱动注册表与流水线的特殊属性路径
 * @param code 特殊属性代码
 */
function createSpecial(code: number): FakeSpecial {
    return { code, clone: () => createSpecial(code) };
}

/**
 * 创建一个最小怪物对象
 * @param id 怪物 id
 * @param attrs 需要覆盖的基础属性
 */
function createEnemy(
    id: string,
    attrs: Partial<TestEnemyAttr> = {}
): IEnemy<TestEnemyAttr> {
    return new modules.Enemy<TestEnemyAttr>(id, 1, {
        hp: 10,
        atk: 2,
        def: 0,
        ...attrs
    });
}

type TestEnemyContext = import('./context').EnemyContext<
    TestEnemyAttr,
    TestHeroAttr
>;
type TestHeroAttribute = import('@user/data-base').HeroAttribute<TestHeroAttr>;

interface ContextFixture {
    /** 被测怪物上下文 */
    context: TestEnemyContext;
    /** 可修改勇士属性 */
    hero: TestHeroAttribute;
    /** 数据层状态假对象 */
    state: IStateBase;
}

/**
 * 创建怪物上下文测试夹具，尺寸默认按 4x3 初始化
 * @param width 上下文宽度
 * @param height 上下文高度
 */
function createContextFixture(
    width: number = 4,
    height: number = 3
): ContextFixture {
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
    return { context, hero, state };
}

type FakeApplyHandler = (
    handler: IEnemyHandler<TestEnemyAttr, TestHeroAttr>,
    base: IReadonlyEnemy<TestEnemyAttr>
) => void;

type FakeApplySpecialHandler = (
    handler: IEnemyHandler<TestEnemyAttr, TestHeroAttr>,
    base: IReadonlyEnemy<TestEnemyAttr>
) => IEnemySpecialModifier<TestEnemyAttr> | null;

interface FakeAuraOptions {
    /** 光环优先级 */
    readonly priority: number;
    /** 光环影响范围 */
    readonly range: IRange<any>;
    /** 范围扫描参数 */
    readonly param: any;
    /** 是否可以修改基础属性 */
    readonly couldApplyBase?: boolean;
    /** 是否可以修改特殊属性 */
    readonly couldApplySpecial?: boolean;
    /** 施加基础属性效果 */
    readonly onApply?: FakeApplyHandler;
    /** 产生特殊属性修饰器 */
    readonly onApplySpecial?: FakeApplySpecialHandler;
}

/**
 * 测试用光环视图，只实现 IAuraView 表面，效果由外部回调决定
 */
class FakeAura implements IAuraView<TestEnemyAttr, any> {
    readonly priority: number;
    readonly range: IRange<any>;
    readonly couldApplyBase: boolean;
    readonly couldApplySpecial: boolean;
    private readonly param: any;
    private readonly applyHandler: FakeApplyHandler | null;
    private readonly applySpecialHandler: FakeApplySpecialHandler | null;

    /**
     * @param options 光环配置
     */
    constructor(options: FakeAuraOptions) {
        this.priority = options.priority;
        this.range = options.range;
        this.param = options.param;
        this.couldApplyBase = options.couldApplyBase ?? true;
        this.couldApplySpecial = options.couldApplySpecial ?? false;
        this.applyHandler = options.onApply ?? null;
        this.applySpecialHandler = options.onApplySpecial ?? null;
    }

    getRangeParam(): any {
        return this.param;
    }

    apply(
        handler: IEnemyHandler<TestEnemyAttr, TestHeroAttr>,
        base: IReadonlyEnemy<TestEnemyAttr>
    ): void {
        this.applyHandler?.(handler, base);
    }

    applySpecial(
        handler: IEnemyHandler<TestEnemyAttr, TestHeroAttr>,
        base: IReadonlyEnemy<TestEnemyAttr>
    ): IEnemySpecialModifier<TestEnemyAttr> | null {
        return this.applySpecialHandler?.(handler, base) ?? null;
    }
}

type FakeAuraFactory = (code: number) => IAuraView<TestEnemyAttr> | null;

/**
 * 测试用光环转换器，命中指定代码集合时按工厂函数产出光环
 */
class FakeConverter implements IAuraConverter<TestEnemyAttr, TestHeroAttr> {
    /** 会被此转换器命中的特殊属性代码 */
    readonly codes: number[];
    /** shouldConvert 的调用记录 */
    readonly shouldConvertCalls: number[] = [];
    /** convert 的调用记录 */
    readonly convertCalls: number[] = [];
    private readonly factory: FakeAuraFactory | null;

    /**
     * @param codes 会被命中的特殊属性代码
     * @param factory 光环工厂，缺省表示转换被跳过
     */
    constructor(codes: number[], factory: FakeAuraFactory | null = null) {
        this.codes = codes;
        this.factory = factory;
    }

    shouldConvert(special: ISpecial<any>): boolean {
        this.shouldConvertCalls.push(special.code);
        return this.codes.includes(special.code);
    }

    convert(special: ISpecial<any>): IEnemyAuraView<TestEnemyAttr, any, any> {
        this.convertCalls.push(special.code);
        if (!this.factory) {
            // 接口约定 convert 必返回光环视图，但测试需覆盖“无工厂则跳过转换”的 null 分支
            return null as unknown as IEnemyAuraView<TestEnemyAttr, any, any>;
        }
        // FakeAura 为最小测试替身，不携带 enemy/special/locator，无法完整满足 IEnemyAuraView
        return this.factory(special.code) as unknown as IEnemyAuraView<
            TestEnemyAttr,
            any,
            any
        >;
    }
}

interface FakeDamageSystemCalls {
    /** 最近一次绑定的勇士属性 */
    hero: IReadonlyHeroAttribute<TestHeroAttr> | null;
    /** markDirty 收到的怪物视图 */
    marked: IEnemyView<TestEnemyAttr>[];
    /** deleteEnemy 收到的怪物视图 */
    deleted: IEnemyView<TestEnemyAttr>[];
    /** markAllDirty 调用次数 */
    markAllDirtyCount: number;
}

/**
 * 创建一个只记录调用的伤害系统假对象
 */
function createFakeDamageSystem(): {
    system: never;
    calls: FakeDamageSystemCalls;
} {
    const calls: FakeDamageSystemCalls = {
        hero: null,
        marked: [],
        deleted: [],
        markAllDirtyCount: 0
    };
    const system = {
        bindHeroStatus: (hero: IReadonlyHeroAttribute<TestHeroAttr> | null) => {
            calls.hero = hero;
        },
        markDirty: (view: IEnemyView<TestEnemyAttr>) => {
            calls.marked.push(view);
        },
        deleteEnemy: (view: IEnemyView<TestEnemyAttr>) => {
            calls.deleted.push(view);
        },
        markAllDirty: () => {
            calls.markAllDirtyCount++;
        }
    };
    return { system: system as never, calls };
}

interface FakeMapDamageCalls {
    /** refreshAll 调用次数 */
    refreshAllCount: number;
    /** markEnemyDirty 收到的怪物视图 */
    marked: IEnemyView<TestEnemyAttr>[];
    /** deleteEnemy 收到的怪物视图 */
    deleted: IEnemyView<TestEnemyAttr>[];
}

/**
 * 创建一个只记录调用的地图伤害假对象
 */
function createFakeMapDamage(): {
    damage: never;
    calls: FakeMapDamageCalls;
} {
    const calls: FakeMapDamageCalls = {
        refreshAllCount: 0,
        marked: [],
        deleted: []
    };
    const damage = {
        refreshAll: () => {
            calls.refreshAllCount++;
        },
        markEnemyDirty: (view: IEnemyView<TestEnemyAttr>) => {
            calls.marked.push(view);
        },
        deleteEnemy: (view: IEnemyView<TestEnemyAttr>) => {
            calls.deleted.push(view);
        }
    };
    return { damage: damage as never, calls };
}

describe('EnemyContext registry and lookups', () => {
    // 验证注册怪物后可按定位符、坐标与计算后怪物反查
    it('registers an enemy and resolves it from locator, point and computed', () => {
        const fixture = createContextFixture();
        const enemy = createEnemy('e1');

        fixture.context.setEnemyAt({ x: 1, y: 0 }, enemy);
        const view = fixture.context.getEnemyByLocator({ x: 1, y: 0 });

        expect(view).not.toBeNull();
        expect(fixture.context.getEnemyByLoc(1, 0)).toBe(view);
        expect(fixture.context.getEnemyLocatorByView(view!)).toEqual({
            x: 1,
            y: 0
        });
        expect(fixture.context.getEnemyLocator(enemy)).toEqual({ x: 1, y: 0 });
        expect(
            fixture.context.getViewByComputed(view!.getComputedEnemy())
        ).toBe(view);
    });

    // 验证未知定位符、未知坐标与未知怪物对象均返回 null
    it('returns null for unknown lookups', () => {
        const fixture = createContextFixture();
        const other = createEnemy('other');

        expect(fixture.context.getEnemyByLocator({ x: 3, y: 2 })).toBeNull();
        expect(fixture.context.getEnemyByLoc(3, 2)).toBeNull();
        expect(fixture.context.getViewByComputed(other)).toBeNull();
        expect(fixture.context.getEnemyLocator(other)).toBeNull();
    });

    // 验证同一坐标重复注册会替换原有怪物及其全部映射
    it('replaces the enemy registered at the same point', () => {
        const fixture = createContextFixture();
        const first = createEnemy('first');
        const second = createEnemy('second');

        fixture.context.setEnemyAt({ x: 0, y: 0 }, first);
        fixture.context.setEnemyAt({ x: 0, y: 0 }, second);

        expect(fixture.context.getEnemyLocator(first)).toBeNull();
        expect(fixture.context.getEnemyLocator(second)).toEqual({ x: 0, y: 0 });
    });

    // 验证删除怪物会同时移除视图与定位符映射
    it('removes view and locator mappings when deleting an enemy', () => {
        const fixture = createContextFixture();
        const enemy = createEnemy('e1');
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
        const fixture = createContextFixture(4, 3);
        fixture.context.setEnemyAt({ x: 1, y: 0 }, createEnemy('e1'));

        fixture.context.resize(5, 2);

        expect(fixture.context.width).toBe(5);
        expect(fixture.context.height).toBe(2);
        expect(fixture.context.indexer.locToIndex(3, 1)).toBe(8);
        expect(fixture.context.getEnemyByLocator({ x: 1, y: 0 })).toBeNull();
    });

    // 验证 iterateEnemy 会遍历全部已注册怪物及其定位符
    it('iterates all registered enemies', () => {
        const fixture = createContextFixture();
        fixture.context.setEnemyAt({ x: 0, y: 0 }, createEnemy('first'));
        fixture.context.setEnemyAt({ x: 2, y: 1 }, createEnemy('second'));

        const iterated = [...fixture.context.iterateEnemy()];

        expect(iterated).toHaveLength(2);
        expect(iterated.map(([locator]) => locator)).toEqual([
            { x: 0, y: 0 },
            { x: 2, y: 1 }
        ]);
    });

    // 验证 scanRange 使用真实矩形范围时只返回范围内的怪物
    it('scans enemies inside the given range only', () => {
        const fixture = createContextFixture();
        fixture.context.setEnemyAt({ x: 0, y: 0 }, createEnemy('inside'));
        fixture.context.setEnemyAt({ x: 3, y: 2 }, createEnemy('outside'));

        const scanned = [
            ...fixture.context.scanRange(new modules.RectRange(), {
                x: 0,
                y: 0,
                w: 2,
                h: 1
            })
        ];

        expect(scanned.map(([locator]) => locator)).toEqual([{ x: 0, y: 0 }]);
    });

    // 验证绑定与解绑勇士对象会同步更新查询结果
    it('binds and clears the bound hero', () => {
        const fixture = createContextFixture();

        fixture.context.bindHero(fixture.hero);
        expect(fixture.context.getBindedHero()).toBe(fixture.hero);

        fixture.context.bindHero(null);
        expect(fixture.context.getBindedHero()).toBeNull();
    });
});

describe('EnemyContext converters and effect registrations', () => {
    // 验证注册的光环转换器会参与特殊属性转换，注销后不再参与
    it('consults aura converters until they are unregistered', () => {
        const fixture = createContextFixture();
        fixture.context.bindHero(fixture.hero);
        const enemy = createEnemy('e1');
        enemy.addSpecial(createSpecial(20) as never);
        fixture.context.setEnemyAt({ x: 0, y: 0 }, enemy);
        const converter = new FakeConverter([20]);

        fixture.context.registerAuraConverter(converter);
        fixture.context.buildup();
        expect(converter.shouldConvertCalls).toHaveLength(1);

        fixture.context.unregisterAuraConverter(converter);
        fixture.context.buildup();
        expect(converter.shouldConvertCalls).toHaveLength(1);
    });

    // 验证禁用光环转换器后不再参与转换，重新启用后恢复参与
    it('skips a converter while it is disabled', () => {
        const fixture = createContextFixture();
        fixture.context.bindHero(fixture.hero);
        const enemy = createEnemy('e1');
        enemy.addSpecial(createSpecial(20) as never);
        fixture.context.setEnemyAt({ x: 0, y: 0 }, enemy);
        const converter = new FakeConverter([20]);

        fixture.context.registerAuraConverter(converter);
        fixture.context.setAuraConverterEnabled(converter, false);
        fixture.context.buildup();
        expect(converter.shouldConvertCalls).toHaveLength(0);

        fixture.context.setAuraConverterEnabled(converter, true);
        fixture.context.buildup();
        expect(converter.shouldConvertCalls).toHaveLength(1);
    });

    // 验证注册的常规查询效果会按特殊属性代码执行，注销后不再执行
    it('runs common query effects for matching specials until unregistered', () => {
        const fixture = createContextFixture();
        fixture.context.bindHero(fixture.hero);
        const enemy = createEnemy('e1');
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
        const fixture = createContextFixture();
        fixture.context.bindHero(fixture.hero);
        fixture.context.setEnemyAt({ x: 0, y: 0 }, createEnemy('e1'));
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

    // 验证注册的最终效果会在构建时执行，注销后不再执行
    it('runs registered final effects until they are unregistered', () => {
        const fixture = createContextFixture();
        fixture.context.bindHero(fixture.hero);
        fixture.context.setEnemyAt({ x: 0, y: 0 }, createEnemy('e1'));
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
});

describe('EnemyContext single aura ranges', () => {
    // 验证 Full 范围（覆盖全图）的光环会加成范围内全部怪物
    it('applies a full-range aura to every enemy', () => {
        const fixture = createContextFixture();
        fixture.context.bindHero(fixture.hero);
        fixture.context.registerAuraConverter(new FakeConverter([]));
        fixture.context.setEnemyAt({ x: 0, y: 0 }, createEnemy('first'));
        fixture.context.setEnemyAt({ x: 3, y: 2 }, createEnemy('second'));
        fixture.context.addAura(
            new FakeAura({
                priority: 1,
                range: new modules.FullRange(),
                param: undefined,
                onApply: handler => handler.enemy.addAttribute('atk', 3)
            })
        );

        fixture.context.buildup();

        expect(
            fixture.context
                .getEnemyByLoc(0, 0)!
                .getComputedEnemy()
                .getAttribute('atk')
        ).toBe(5);
        expect(
            fixture.context
                .getEnemyByLoc(3, 2)!
                .getComputedEnemy()
                .getAttribute('atk')
        ).toBe(5);
    });

    // 验证 Rect 范围的光环只加成矩形内怪物，范围外怪物属性不变
    it('applies a rect-range aura inside the rectangle only', () => {
        const fixture = createContextFixture();
        fixture.context.bindHero(fixture.hero);
        fixture.context.registerAuraConverter(new FakeConverter([]));
        fixture.context.setEnemyAt({ x: 0, y: 0 }, createEnemy('inside'));
        fixture.context.setEnemyAt({ x: 2, y: 0 }, createEnemy('outside'));
        fixture.context.addAura(
            new FakeAura({
                priority: 1,
                range: new modules.RectRange(),
                param: { x: 0, y: 0, w: 2, h: 1 },
                onApply: handler => handler.enemy.addAttribute('atk', 5)
            })
        );

        fixture.context.buildup();

        expect(
            fixture.context
                .getEnemyByLoc(0, 0)!
                .getComputedEnemy()
                .getAttribute('atk')
        ).toBe(7);
        expect(
            fixture.context
                .getEnemyByLoc(2, 0)!
                .getComputedEnemy()
                .getAttribute('atk')
        ).toBe(2);
    });

    // 验证 Manhattan 范围的光环只加成曼哈顿距离内怪物，范围外怪物属性不变
    it('applies a manhattan-range aura inside the radius only', () => {
        const fixture = createContextFixture();
        fixture.context.bindHero(fixture.hero);
        fixture.context.registerAuraConverter(new FakeConverter([]));
        fixture.context.setEnemyAt({ x: 0, y: 0 }, createEnemy('inside'));
        fixture.context.setEnemyAt({ x: 2, y: 2 }, createEnemy('outside'));
        fixture.context.addAura(
            new FakeAura({
                priority: 1,
                range: new modules.ManhattanRange(),
                param: { cx: 0, cy: 0, radius: 1 },
                onApply: handler => handler.enemy.addAttribute('atk', 5)
            })
        );

        fixture.context.buildup();

        expect(
            fixture.context
                .getEnemyByLoc(0, 0)!
                .getComputedEnemy()
                .getAttribute('atk')
        ).toBe(7);
        expect(
            fixture.context
                .getEnemyByLoc(2, 2)!
                .getComputedEnemy()
                .getAttribute('atk')
        ).toBe(2);
    });

    // 验证单个光环的特殊属性效果只施加一次，并把特殊属性加到计算中怪物身上
    it('applies a single aura special effect once', () => {
        const fixture = createContextFixture();
        fixture.context.bindHero(fixture.hero);
        fixture.context.registerAuraConverter(new FakeConverter([]));
        fixture.context.setEnemyAt({ x: 0, y: 0 }, createEnemy('e1'));
        fixture.context.addAura(
            new FakeAura({
                priority: 1,
                range: new modules.FullRange(),
                param: undefined,
                couldApplyBase: false,
                couldApplySpecial: true,
                onApplySpecial: () => ({
                    add: () => [createSpecial(30) as never],
                    delete: () => [],
                    modify: () => false
                })
            })
        );

        fixture.context.buildup();

        expect(
            fixture.context
                .getEnemyByLoc(0, 0)!
                .getComputedEnemy()
                .hasSpecial(30)
        ).toBe(true);
    });
});

describe('EnemyContext attachments and dirty marking', () => {
    // 验证绑定地图伤害后会立即刷新，并能通过 getMapDamage 取回
    it('attaches map damage and refreshes it', () => {
        const fixture = createContextFixture();
        const fake = createFakeMapDamage();

        fixture.context.attachMapDamage(fake.damage);
        expect(fixture.context.getMapDamage()).toBe(fake.damage);
        expect(fake.calls.refreshAllCount).toBe(1);

        fixture.context.attachMapDamage(null);
        expect(fixture.context.getMapDamage()).toBeNull();
    });

    // 验证绑定伤害系统会同步勇士状态，并能通过 getDamageSystem 取回
    it('attaches a damage system and syncs the hero status', () => {
        const fixture = createContextFixture();
        const fake = createFakeDamageSystem();
        fixture.context.bindHero(fixture.hero);

        fixture.context.attachDamageSystem(fake.system);
        expect(fixture.context.getDamageSystem()).toBe(fake.system);
        expect(fake.calls.hero).toBe(fixture.hero);

        fixture.context.attachDamageSystem(null);
        expect(fixture.context.getDamageSystem()).toBeNull();
    });

    // 验证绑定勇士后会把勇士状态同步给已附加的伤害系统并刷新地图伤害
    it('propagates the hero binding to attached collaborators', () => {
        const fixture = createContextFixture();
        const fakeDamage = createFakeDamageSystem();
        const fakeMapDamage = createFakeMapDamage();
        fixture.context.attachDamageSystem(fakeDamage.system);
        fixture.context.attachMapDamage(fakeMapDamage.damage);
        const refreshBefore = fakeMapDamage.calls.refreshAllCount;

        fixture.context.bindHero(fixture.hero);

        expect(fakeDamage.calls.hero).toBe(fixture.hero);
        expect(fakeMapDamage.calls.refreshAllCount).toBe(refreshBefore + 1);
    });

    // 验证 markDirty 只对已注册怪物生效并同步标记伤害系统
    it('marks a registered enemy dirty only', () => {
        const fixture = createContextFixture();
        const fake = createFakeDamageSystem();
        fixture.context.attachDamageSystem(fake.system);
        fixture.context.setEnemyAt({ x: 0, y: 0 }, createEnemy('e1'));
        const view = fixture.context.getEnemyByLoc(0, 0)!;
        fake.calls.marked.length = 0;
        const unknown: IEnemyView<TestEnemyAttr> = {
            context: {} as never,
            reset: () => {},
            getBaseEnemy: () => createEnemy('unknown'),
            getComputedEnemy: () => createEnemy('unknown'),
            getModifiableEnemy: () => createEnemy('unknown'),
            markDirty: () => {}
        };

        fixture.context.markDirty(view);
        fixture.context.markDirty(unknown);

        expect(fake.calls.marked).toEqual([view]);
    });
});

describe('EnemyContext lifecycle', () => {
    // 验证 clear 会清空怪物映射与全局光环集合
    it('clears enemies and global auras', () => {
        const fixture = createContextFixture();
        fixture.context.bindHero(fixture.hero);
        fixture.context.registerAuraConverter(new FakeConverter([]));
        fixture.context.addAura(
            new FakeAura({
                priority: 1,
                range: new modules.FullRange(),
                param: undefined,
                onApply: handler => handler.enemy.addAttribute('atk', 9)
            })
        );
        fixture.context.setEnemyAt({ x: 0, y: 0 }, createEnemy('e1'));
        fixture.context.buildup();

        expect(
            fixture.context
                .getEnemyByLoc(0, 0)!
                .getComputedEnemy()
                .getAttribute('atk')
        ).toBe(11);

        fixture.context.clear();

        expect([...fixture.context.iterateEnemy()]).toHaveLength(0);
        expect(fixture.context.getEnemyByLocator({ x: 0, y: 0 })).toBeNull();

        fixture.context.setEnemyAt({ x: 1, y: 1 }, createEnemy('e2'));
        fixture.context.buildup();
        expect(
            fixture.context
                .getEnemyByLoc(1, 1)!
                .getComputedEnemy()
                .getAttribute('atk')
        ).toBe(2);
    });

    // 验证 destroy 会解绑附件、清空注册表与勇士绑定
    it('destroys attachments, registrations and the hero binding', () => {
        const fixture = createContextFixture();
        const fakeDamage = createFakeDamageSystem();
        const fakeMapDamage = createFakeMapDamage();
        fixture.context.attachDamageSystem(fakeDamage.system);
        fixture.context.attachMapDamage(fakeMapDamage.damage);
        fixture.context.bindHero(fixture.hero);
        fixture.context.registerAuraConverter(new FakeConverter([20]));
        fixture.context.registerCommonQueryEffect(20, {
            priority: 1,
            apply: () => {}
        });
        fixture.context.registerSpecialQueryEffect({
            priority: 1,
            for: () => ({
                add: () => [],
                delete: () => [],
                modify: () => false,
                shouldQuery: () => false
            })
        });
        const applied: number[] = [];
        fixture.context.registerFinalEffect({
            priority: 1,
            apply: () => {
                applied.push(1);
            }
        });

        fixture.context.destroy();

        expect(fixture.context.getMapDamage()).toBeNull();
        expect(fixture.context.getDamageSystem()).toBeNull();
        expect(fixture.context.getBindedHero()).toBeNull();

        fixture.context.bindHero(fixture.hero);
        fixture.context.setEnemyAt({ x: 0, y: 0 }, createEnemy('e1'));
        fixture.context.buildup();
        expect(applied).toHaveLength(0);
    });
});

describe('EnemyContext aura pipeline', () => {
    // 验证全量构建会把怪物特殊属性经转换器变成光环并施加基础属性效果
    it('converts an enemy special into an aura during a full buildup', () => {
        const fixture = createContextFixture();
        fixture.context.bindHero(fixture.hero);
        const enemy = createEnemy('e1');
        enemy.addSpecial(createSpecial(20) as never);
        fixture.context.setEnemyAt({ x: 0, y: 0 }, enemy);
        const aura = new FakeAura({
            priority: 1,
            range: new modules.FullRange(),
            param: undefined,
            onApply: handler => handler.enemy.addAttribute('atk', 4)
        });
        const converter = new FakeConverter([20], () => aura);
        fixture.context.registerAuraConverter(converter);

        fixture.context.buildup();

        const view = fixture.context.getEnemyByLoc(0, 0)!;
        expect(converter.shouldConvertCalls).toEqual([20]);
        expect(converter.convertCalls).toEqual([20]);
        expect(view.getComputedEnemy().getAttribute('atk')).toBe(6);
    });

    // 验证两层嵌套：光环施加的特殊属性经第二转换器产生新光环并再次施加效果
    it('propagates a two-layer nested aura', () => {
        const fixture = createContextFixture();
        fixture.context.bindHero(fixture.hero);
        const enemy = createEnemy('e1');
        enemy.addSpecial(createSpecial(20) as never);
        fixture.context.setEnemyAt({ x: 0, y: 0 }, enemy);
        const outerAura = new FakeAura({
            priority: 10,
            range: new modules.FullRange(),
            param: undefined,
            couldApplyBase: false,
            couldApplySpecial: true,
            onApplySpecial: () => ({
                add: () => [createSpecial(21) as never],
                delete: () => [],
                modify: () => false
            })
        });
        const innerAura = new FakeAura({
            priority: 5,
            range: new modules.FullRange(),
            param: undefined,
            onApply: handler => handler.enemy.addAttribute('atk', 7)
        });
        const converter = new FakeConverter([20, 21], code =>
            code === 20 ? outerAura : innerAura
        );
        fixture.context.registerAuraConverter(converter);

        fixture.context.buildup();

        const computed = fixture.context
            .getEnemyByLoc(0, 0)!
            .getComputedEnemy();
        expect(converter.convertCalls).toContain(21);
        expect(computed.hasSpecial(21)).toBe(true);
        expect(computed.getAttribute('atk')).toBe(9);
    });

    // 验证多怪跨施加的嵌套光环：m1 产生 A1 只命中 m2，m2 生成 A2 反向影响全部怪的最终属性
    it('propagates a cross-enemy nested aura with observable range boundaries', () => {
        const fixture = createContextFixture(5, 3);
        fixture.context.bindHero(fixture.hero);
        const m1 = createEnemy('m1');
        m1.addSpecial(createSpecial(20) as never);
        const m2 = createEnemy('m2', { atk: 4 });
        const m3 = createEnemy('m3', { atk: 6 });
        fixture.context.setEnemyAt({ x: 0, y: 0 }, m1);
        fixture.context.setEnemyAt({ x: 1, y: 0 }, m2);
        fixture.context.setEnemyAt({ x: 4, y: 0 }, m3);
        const a1 = new FakeAura({
            priority: 10,
            range: new modules.RectRange(),
            param: { x: 1, y: 0, w: 1, h: 1 },
            couldApplyBase: true,
            couldApplySpecial: true,
            onApply: handler => handler.enemy.addAttribute('atk', 100),
            onApplySpecial: () => ({
                add: () => [createSpecial(21) as never],
                delete: () => [],
                modify: () => false
            })
        });
        const a2 = new FakeAura({
            priority: 5,
            range: new modules.FullRange(),
            param: undefined,
            onApply: handler => handler.enemy.addAttribute('atk', 3)
        });
        const converter = new FakeConverter([20, 21], code =>
            code === 20 ? a1 : a2
        );
        fixture.context.registerAuraConverter(converter);

        fixture.context.buildup();

        expect(converter.convertCalls).toContain(20);
        expect(converter.convertCalls).toContain(21);
        const v1 = fixture.context.getEnemyByLoc(0, 0)!.getComputedEnemy();
        const v2 = fixture.context.getEnemyByLoc(1, 0)!.getComputedEnemy();
        const v3 = fixture.context.getEnemyByLoc(4, 0)!.getComputedEnemy();
        expect(v2.hasSpecial(21)).toBe(true);
        expect(v1.hasSpecial(21)).toBe(false);
        expect(v3.hasSpecial(21)).toBe(false);
        expect(v1.getAttribute('atk')).toBe(5);
        expect(v2.getAttribute('atk')).toBe(107);
        expect(v3.getAttribute('atk')).toBe(9);
    });

    // 验证新增光环优先级高于当前阶段时告警 99 且不参与后续效果
    it('warns 99 and skips a higher-priority nested aura', () => {
        const fixture = createContextFixture();
        fixture.context.bindHero(fixture.hero);
        const enemy = createEnemy('e1');
        enemy.addSpecial(createSpecial(20) as never);
        fixture.context.setEnemyAt({ x: 0, y: 0 }, enemy);
        const outerAura = new FakeAura({
            priority: 10,
            range: new modules.FullRange(),
            param: undefined,
            couldApplyBase: false,
            couldApplySpecial: true,
            onApplySpecial: () => ({
                add: () => [createSpecial(21) as never],
                delete: () => [],
                modify: () => false
            })
        });
        const blockedAura = new FakeAura({
            priority: 50,
            range: new modules.FullRange(),
            param: undefined,
            onApply: handler => handler.enemy.addAttribute('atk', 100)
        });
        const converter = new FakeConverter([20, 21], code =>
            code === 20 ? outerAura : blockedAura
        );
        fixture.context.registerAuraConverter(converter);

        const result = modules.logger.catch(() => fixture.context.buildup());

        expect(result.info.map(v => v.code)).toContain(99);
        expect(
            fixture.context
                .getEnemyByLoc(0, 0)!
                .getComputedEnemy()
                .getAttribute('atk')
        ).toBe(2);
    });

    // 验证删除同级已生效光环时走 delete 分支告警 98
    it('warns 98 when deleting an aura of the current priority', () => {
        const fixture = createContextFixture();
        fixture.context.bindHero(fixture.hero);
        const enemy = createEnemy('e1');
        enemy.addSpecial(createSpecial(20) as never);
        fixture.context.setEnemyAt({ x: 0, y: 0 }, enemy);
        fixture.context.registerAuraConverter(
            new FakeConverter(
                [20],
                () =>
                    new FakeAura({
                        priority: 10,
                        range: new modules.FullRange(),
                        param: undefined,
                        couldApplyBase: false
                    })
            )
        );
        fixture.context.registerSpecialQueryEffect({
            priority: 10,
            for: () => ({
                add: () => [],
                delete: handler => [...handler.enemy.iterateSpecials()],
                modify: () => false,
                shouldQuery: () => true
            })
        });

        const result = modules.logger.catch(() => fixture.context.buildup());

        expect(result.info.map(v => v.code)).toContain(98);
    });

    // 验证修改同级已生效光环时走 modify 分支告警 98
    it('warns 98 when modifying an aura of the current priority', () => {
        const fixture = createContextFixture();
        fixture.context.bindHero(fixture.hero);
        const enemy = createEnemy('e1');
        enemy.addSpecial(createSpecial(20) as never);
        fixture.context.setEnemyAt({ x: 0, y: 0 }, enemy);
        fixture.context.registerAuraConverter(
            new FakeConverter(
                [20],
                () =>
                    new FakeAura({
                        priority: 10,
                        range: new modules.FullRange(),
                        param: undefined,
                        couldApplyBase: false
                    })
            )
        );
        fixture.context.registerSpecialQueryEffect({
            priority: 10,
            for: () => ({
                add: () => [],
                delete: () => [],
                modify: () => true,
                shouldQuery: () => true
            })
        });

        const result = modules.logger.catch(() => fixture.context.buildup());

        expect(result.info.map(v => v.code)).toContain(98);
    });
});

describe('EnemyContext effect stage ordering', () => {
    // 验证四个效果阶段按 specials -> base -> query -> final 顺序执行且存在阶段间可见性
    it('runs the four buildup stages in order with forward visibility', () => {
        const fixture = createContextFixture();
        fixture.context.bindHero(fixture.hero);
        const enemy = createEnemy('e1');
        enemy.addSpecial(createSpecial(20) as never);
        fixture.context.setEnemyAt({ x: 0, y: 0 }, enemy);
        const order: string[] = [];
        const seen = {
            queryAtk: -1,
            queryDef: -1,
            queryHp: -1,
            finalAtk: -1,
            finalDef: -1
        };
        const aura = new FakeAura({
            priority: 1,
            range: new modules.FullRange(),
            param: undefined,
            couldApplySpecial: true,
            onApply: handler => {
                order.push('base');
                handler.enemy.addAttribute('atk', 5);
            },
            onApplySpecial: () => {
                order.push('special');
                return { add: () => [], delete: () => [], modify: () => false };
            }
        });
        fixture.context.registerAuraConverter(
            new FakeConverter([20], () => aura)
        );
        fixture.context.registerCommonQueryEffect(20, {
            priority: 1,
            apply: handler => {
                order.push('query');
                seen.queryAtk = handler.enemy.getAttribute('atk');
                seen.queryDef = handler.enemy.getAttribute('def');
                seen.queryHp = handler.enemy.getAttribute('hp');
                handler.enemy.addAttribute('def', 1);
            }
        });
        fixture.context.registerFinalEffect({
            priority: 1,
            apply: handler => {
                order.push('final');
                seen.finalAtk = handler.enemy.getAttribute('atk');
                seen.finalDef = handler.enemy.getAttribute('def');
                handler.enemy.addAttribute('hp', 1);
            }
        });

        fixture.context.buildup();

        expect(order).toEqual(['special', 'base', 'query', 'final']);
        expect(seen.queryAtk).toBe(7);
        expect(seen.queryDef).toBe(0);
        expect(seen.queryHp).toBe(10);
        expect(seen.finalAtk).toBe(7);
        expect(seen.finalDef).toBe(1);
    });

    // 验证四类效果（光环基础 + 常规查询 + 特殊查询 + final）同时生效，四阶段顺序与最终属性均被断言
    it('applies all four effect kinds together and asserts the final attributes', () => {
        const fixture = createContextFixture();
        fixture.context.bindHero(fixture.hero);
        const enemy = createEnemy('e1');
        enemy.addSpecial(createSpecial(20) as never);
        fixture.context.setEnemyAt({ x: 0, y: 0 }, enemy);
        const order: string[] = [];
        const aura = new FakeAura({
            priority: 1,
            range: new modules.FullRange(),
            param: undefined,
            couldApplyBase: true,
            couldApplySpecial: true,
            onApply: handler => {
                order.push('base');
                handler.enemy.addAttribute('atk', 5);
            },
            onApplySpecial: () => {
                order.push('special');
                return {
                    add: () => [createSpecial(21) as never],
                    delete: () => [],
                    modify: () => false
                };
            }
        });
        fixture.context.registerAuraConverter(
            new FakeConverter([20], () => aura)
        );
        fixture.context.registerCommonQueryEffect(20, {
            priority: 1,
            apply: handler => {
                order.push('query');
                handler.enemy.addAttribute('def', 2);
            }
        });
        fixture.context.registerSpecialQueryEffect({
            priority: 1,
            for: () => ({
                shouldQuery: handler => handler.enemy.hasSpecial(21),
                add: () => [],
                delete: () => [],
                modify: () => {
                    order.push('special-query');
                    return true;
                }
            })
        });
        fixture.context.registerFinalEffect({
            priority: 1,
            apply: handler => {
                order.push('final');
                handler.enemy.addAttribute('hp', 4);
            }
        });

        fixture.context.buildup();

        const computed = fixture.context
            .getEnemyByLoc(0, 0)!
            .getComputedEnemy();
        expect(order[0]).toBe('special');
        expect(order.indexOf('special')).toBeLessThan(order.indexOf('base'));
        expect(order.indexOf('base')).toBeLessThan(order.indexOf('query'));
        expect(order.indexOf('query')).toBeLessThan(order.indexOf('final'));
        expect(computed.getAttribute('atk')).toBe(7);
        expect(computed.getAttribute('def')).toBe(2);
        expect(computed.getAttribute('hp')).toBe(14);
        expect(computed.hasSpecial(21)).toBe(true);
    });

    // 验证更高优先级的光环与最终效果会更先执行
    it('runs higher-priority auras and effects first', () => {
        const fixture = createContextFixture();
        fixture.context.bindHero(fixture.hero);
        fixture.context.registerAuraConverter(new FakeConverter([]));
        fixture.context.setEnemyAt({ x: 0, y: 0 }, createEnemy('e1'));
        const order: string[] = [];
        fixture.context.addAura(
            new FakeAura({
                priority: 1,
                range: new modules.FullRange(),
                param: undefined,
                onApply: () => {
                    order.push('aura-low');
                }
            })
        );
        fixture.context.addAura(
            new FakeAura({
                priority: 5,
                range: new modules.FullRange(),
                param: undefined,
                onApply: () => {
                    order.push('aura-high');
                }
            })
        );
        fixture.context.registerFinalEffect({
            priority: 1,
            apply: () => {
                order.push('final-low');
            }
        });
        fixture.context.registerFinalEffect({
            priority: 5,
            apply: () => {
                order.push('final-high');
            }
        });

        fixture.context.buildup();

        expect(order).toEqual([
            'aura-high',
            'aura-low',
            'final-high',
            'final-low'
        ]);
    });
});

describe('EnemyContext refresh paths and DEV warnings', () => {
    // 验证全量构建后可通过 markDirty + requestRefresh 走局部刷新路径
    it('refreshes a single enemy locally when it is marked dirty', () => {
        const fixture = createContextFixture();
        fixture.context.bindHero(fixture.hero);
        fixture.context.registerAuraConverter(new FakeConverter([]));
        let applyCount = 0;
        fixture.context.addAura(
            new FakeAura({
                priority: 1,
                range: new modules.FullRange(),
                param: undefined,
                onApply: handler => {
                    applyCount++;
                    handler.enemy.addAttribute('atk', 3);
                }
            })
        );
        fixture.context.setEnemyAt({ x: 0, y: 0 }, createEnemy('e1'));
        fixture.context.buildup();
        const view = fixture.context.getEnemyByLoc(0, 0)!;

        expect(applyCount).toBe(1);
        expect(view.getComputedEnemy().getAttribute('atk')).toBe(5);

        fixture.context.markDirty(view);
        fixture.context.requestRefresh(view);

        expect(applyCount).toBe(2);
        expect(view.getComputedEnemy().getAttribute('atk')).toBe(5);
    });

    // 验证局部刷新期间存在需要整链重算的怪物时回退为全量构建
    it('falls back to a full buildup when the enemy needs total refresh', () => {
        const fixture = createContextFixture();
        fixture.context.bindHero(fixture.hero);
        const enemy = createEnemy('e1');
        enemy.addSpecial(createSpecial(20) as never);
        fixture.context.setEnemyAt({ x: 0, y: 0 }, enemy);
        let specialCalls = 0;
        const aura = new FakeAura({
            priority: 1,
            range: new modules.FullRange(),
            param: undefined,
            couldApplyBase: false,
            couldApplySpecial: true,
            onApplySpecial: () => {
                specialCalls++;
                return { add: () => [], delete: () => [], modify: () => false };
            }
        });
        const converter = new FakeConverter([20], () => aura);
        fixture.context.registerAuraConverter(converter);
        fixture.context.buildup();
        const view = fixture.context.getEnemyByLoc(0, 0)!;

        expect(specialCalls).toBe(1);
        expect(converter.convertCalls).toHaveLength(1);

        fixture.context.markDirty(view);
        fixture.context.requestRefresh(view);

        expect(specialCalls).toBe(2);
        expect(converter.convertCalls).toHaveLength(2);
    });

    // 验证两个转换器同时命中同一特殊属性时告警 97 并跳过转换
    it('warns 97 when multiple converters match the same special', () => {
        const fixture = createContextFixture();
        fixture.context.bindHero(fixture.hero);
        const enemy = createEnemy('e1');
        enemy.addSpecial(createSpecial(20) as never);
        fixture.context.setEnemyAt({ x: 0, y: 0 }, enemy);
        const createAura = () =>
            new FakeAura({
                priority: 1,
                range: new modules.FullRange(),
                param: undefined,
                onApply: handler => handler.enemy.addAttribute('atk', 50)
            });
        fixture.context.registerAuraConverter(
            new FakeConverter([20], createAura)
        );
        fixture.context.registerAuraConverter(
            new FakeConverter([20], createAura)
        );

        const result = modules.logger.catch(() => fixture.context.buildup());

        expect(result.info.map(v => v.code)).toContain(97);
        expect(
            fixture.context
                .getEnemyByLoc(0, 0)!
                .getComputedEnemy()
                .getAttribute('atk')
        ).toBe(2);
    });

    // 验证 add 与 delete 同时非空时告警 100，整链与局部刷新各一次
    it('warns 100 when both add and delete are non-empty', () => {
        const fixture = createContextFixture();
        fixture.context.bindHero(fixture.hero);
        fixture.context.setEnemyAt({ x: 0, y: 0 }, createEnemy('e1'));
        const modifier = {
            add: () => [createSpecial(30) as never],
            delete: () => [createSpecial(31) as never],
            modify: () => false,
            shouldQuery: () => true
        };
        fixture.context.registerSpecialQueryEffect({
            priority: 1,
            for: () => modifier
        });

        const buildupResult = modules.logger.catch(() =>
            fixture.context.buildup()
        );
        expect(buildupResult.info.map(v => v.code)).toContain(100);

        const view = fixture.context.getEnemyByLoc(0, 0)!;
        fixture.context.markDirty(view);
        const refreshResult = modules.logger.catch(() =>
            fixture.context.requestRefresh(view)
        );

        expect(refreshResult.info.map(v => v.code)).toContain(100);
    });

    // 验证局部刷新期间删除可转换特殊属性时告警 101
    it('warns 101 when a local refresh removes a converted special', () => {
        const fixture = createContextFixture();
        fixture.context.bindHero(fixture.hero);
        fixture.context.setEnemyAt({ x: 0, y: 0 }, createEnemy('e1'));
        fixture.context.registerAuraConverter(
            new FakeConverter(
                [40],
                () =>
                    new FakeAura({
                        priority: 1,
                        range: new modules.FullRange(),
                        param: undefined
                    })
            )
        );
        fixture.context.registerSpecialQueryEffect({
            priority: 1,
            for: () => ({
                add: () => [],
                delete: () => [createSpecial(40) as never],
                modify: () => false,
                shouldQuery: () => true
            })
        });
        fixture.context.buildup();
        const view = fixture.context.getEnemyByLoc(0, 0)!;
        fixture.context.markDirty(view);

        const result = modules.logger.catch(() =>
            fixture.context.requestRefresh(view)
        );

        expect(result.info.map(v => v.code)).toContain(101);
    });

    // 验证局部刷新期间新增可转换特殊属性时告警 101
    it('warns 101 when a local refresh adds a converted special', () => {
        const fixture = createContextFixture();
        fixture.context.bindHero(fixture.hero);
        fixture.context.setEnemyAt({ x: 0, y: 0 }, createEnemy('e1'));
        fixture.context.registerAuraConverter(
            new FakeConverter(
                [40],
                () =>
                    new FakeAura({
                        priority: 50,
                        range: new modules.FullRange(),
                        param: undefined
                    })
            )
        );
        fixture.context.registerSpecialQueryEffect({
            priority: 1,
            for: () => ({
                add: () => [createSpecial(40) as never],
                delete: () => [],
                modify: () => false,
                shouldQuery: () => true
            })
        });
        modules.logger.catch(() => fixture.context.buildup());
        const view = fixture.context.getEnemyByLoc(0, 0)!;
        fixture.context.markDirty(view);

        const result = modules.logger.catch(() =>
            fixture.context.requestRefresh(view)
        );

        expect(result.info.map(v => v.code)).toContain(101);
    });

    // 验证未绑定勇士时构建告警 110 且不刷新
    it('warns 110 and skips buildup without a bound hero', () => {
        const fixture = createContextFixture();
        fixture.context.setEnemyAt({ x: 0, y: 0 }, createEnemy('e1'));

        const result = modules.logger.catch(() => fixture.context.buildup());

        expect(result.info.map(v => v.code)).toContain(110);

        fixture.context.bindHero(fixture.hero);
        fixture.context.buildup();
        expect(
            fixture.context
                .getEnemyByLoc(0, 0)!
                .getComputedEnemy()
                .getAttribute('atk')
        ).toBe(2);
    });
});
