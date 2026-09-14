// 测试怪物上下文：阶段 1（构件级）覆盖全部公开方法、单光环三范围、单效果与生命周期
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { type IRange } from '@motajs/common';
import {
    type IEnemy,
    type IReadonlyEnemy,
    type IStateBase,
    type ISpecial
} from '@user/data-base';
import {
    type IAuraConverter,
    type IAuraView,
    type IEnemyCommonQueryEffect,
    type IEnemyFinalEffect,
    type IEnemyHandler,
    type IEnemySpecialModifier,
    type IEnemySpecialQueryEffect,
    type IEnemyView,
    type IReadonlyHeroAttribute
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

interface ContextFixture {
    /** 被测怪物上下文 */
    context: InstanceType<TestModules['EnemyContext']>;
    /** 可修改勇士属性 */
    hero: InstanceType<TestModules['HeroAttribute']>;
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
    const context = new modules.EnemyContext<TestEnemyAttr, TestHeroAttr>(state);
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

    convert(special: ISpecial<any>): IAuraView<TestEnemyAttr> | null {
        this.convertCalls.push(special.code);
        return this.factory ? this.factory(special.code) : null;
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
        expect(fixture.context.getViewByComputed(view!.getComputedEnemy())).toBe(
            view
        );
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
            fixture.context.getEnemyByLoc(0, 0)!.getComputedEnemy().hasSpecial(30)
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
