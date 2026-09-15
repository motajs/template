// 测试光环转换器：光环范围与参数选择、属性加成结算、支援光环注册与守卫定位符添加
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { type ITileLocator } from '@motajs/common';
import { type IEnemyAttr, type IHeroAttr } from '@user/data-common';
import {
    type IEnemyContext,
    type IEnemyView,
    type IReadonlyEnemyHandler,
    type IEnemyHandler
} from '@user/data-system';
import {
    type IEnemy,
    type IReadonlyEnemy,
    type ISpecial
} from '@user/data-base';
import { type IHaloValue } from './special';

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
    CommonAura: typeof import('./aura').CommonAura;
    CommonAuraConverter: typeof import('./aura').CommonAuraConverter;
    GuardAura: typeof import('./aura').GuardAura;
    GuardAuraConverter: typeof import('./aura').GuardAuraConverter;
    FullRange: typeof import('@motajs/common').FullRange;
    RectRange: typeof import('@motajs/common').RectRange;
    ManhattanRange: typeof import('@motajs/common').ManhattanRange;
}

let modules: TestModules;

beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    const auraModule = await import('./aura');
    const motaModule = await import('@motajs/common');
    modules = {
        CommonAura: auraModule.CommonAura,
        CommonAuraConverter: auraModule.CommonAuraConverter,
        GuardAura: auraModule.GuardAura,
        GuardAuraConverter: auraModule.GuardAuraConverter,
        FullRange: motaModule.FullRange,
        RectRange: motaModule.RectRange,
        ManhattanRange: motaModule.ManhattanRange
    };
});

interface FakeEnemy {
    /** 可写怪物对象 */
    enemy: IEnemy<IEnemyAttr>;
    /** 当前怪物属性，供断言使用 */
    attrs: IEnemyAttr;
}

/**
 * 创建一个只实现光环所需能力的内联假怪物
 * @param attrs 覆盖的怪物属性
 */
function createEnemy(attrs: Partial<IEnemyAttr> = {}): FakeEnemy {
    const values: IEnemyAttr = {
        hp: 20,
        atk: 8,
        def: 5,
        money: 2,
        exp: 3,
        point: 1,
        guard: new Set(),
        ...attrs
    };
    const enemy = {
        id: 'test-enemy',
        code: 1,
        getSpecial: () => null,
        hasSpecial: () => false,
        iterateSpecials: () => [],
        getAttribute: (key: string) => (values as never)[key],
        cloneAttributes: () => structuredClone(values),
        clone: () => enemy,
        addSpecial: () => {},
        deleteSpecial: () => {},
        setAttribute: (key: string, value: unknown) => {
            // 假怪物按动态字符串键读写属性，固定形状的 IEnemyAttr 无法表达字符串索引
            (values as unknown as Record<string, unknown>)[key] = value;
        },
        addAttribute: (key: string, value: number) => {
            (values as unknown as Record<string, number>)[key] += value;
        },
        copyFrom: () => {},
        saveState: () => ({
            attrs: structuredClone(values),
            specials: new Map()
        }),
        loadState: () => {}
    } as never;
    return { enemy, attrs: values };
}

/**
 * 创建一个只携带代码与数值的内联假特殊属性
 * @param code 特殊属性代码
 * @param value 特殊属性数值
 */
function createSpecial<T>(code: number, value: T): ISpecial<T> {
    return { code, value } as never;
}

/**
 * 创建一个只实现视图反查的内联假怪物上下文
 * @param resolve 根据计算后怪物对象查找视图的回调
 */
function createContext(
    resolve?: (
        enemy: IReadonlyEnemy<IEnemyAttr>
    ) => IEnemyView<IEnemyAttr> | null
): IEnemyContext<IEnemyAttr, IHeroAttr> {
    return {
        width: 8,
        height: 8,
        getViewByComputed: (enemy: IReadonlyEnemy<IEnemyAttr>) =>
            resolve ? resolve(enemy) : null
    } as never;
}

/**
 * 创建一个只用于占据视图位置的内联假视图
 */
function createView(): IEnemyView<IEnemyAttr> {
    return {} as never;
}

/**
 * 组装一个光环转换所需的最小只读信息对象
 * @param enemy 怪物对象
 * @param locator 怪物定位符
 */
function createReadonlyHandler(
    enemy: IReadonlyEnemy<IEnemyAttr>,
    locator: ITileLocator
): IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr> {
    return { enemy, locator } as never;
}

/**
 * 组装一个光环结算所需的最小可写信息对象
 * @param enemy 可写怪物对象
 * @param locator 怪物定位符
 */
function createWritableHandler(
    enemy: IEnemy<IEnemyAttr>,
    locator: ITileLocator
): IEnemyHandler<IEnemyAttr, IHeroAttr> {
    return { enemy, locator } as never;
}

/**
 * 构造一个完整的光环数值
 * @param overrides 覆盖的光环字段
 */
function createHalo(overrides: Partial<IHaloValue> = {}): IHaloValue {
    return {
        haloRange: 0,
        haloSquare: false,
        hpBuff: 0,
        atkBuff: 0,
        defBuff: 0,
        ...overrides
    };
}

describe('CommonAuraConverter', () => {
    // 验证只有代码 25 的特殊属性会被光环转换器接管
    it('converts only special code 25', () => {
        const converter = new modules.CommonAuraConverter();
        const halo = createSpecial(25, createHalo());
        const guard = createSpecial(26, undefined);

        expect(converter.shouldConvert(halo)).toBe(true);
        expect(converter.shouldConvert(guard)).toBe(false);
    });

    // 验证转换结果为携带怪物、特殊属性与定位符的光环视图
    it('converts a code 25 special into a common aura', () => {
        const converter = new modules.CommonAuraConverter();
        const { enemy } = createEnemy();
        const locator: ITileLocator = { x: 3, y: 4 };
        const special = createSpecial(25, createHalo());

        const aura = converter.convert(
            special,
            createReadonlyHandler(enemy, locator)
        );

        expect(aura).toBeInstanceOf(modules.CommonAura);
        expect(aura.enemy).toBe(enemy);
        expect(aura.locator).toBe(locator);
        expect(aura.special).toBe(special);
    });
});

describe('CommonAura range', () => {
    // 验证光环范围不大于 0 时使用全图范围且无范围参数
    it('uses the full range when the halo range is not positive', () => {
        const { enemy } = createEnemy();
        const aura = new modules.CommonAura(
            enemy,
            createSpecial(25, createHalo({ haloRange: 0 })),
            { x: 3, y: 4 }
        );

        expect(aura.range).toBeInstanceOf(modules.FullRange);
        expect(aura.getRangeParam()).toBeUndefined();
    });

    // 验证九宫格光环使用以定位符为中心的矩形范围参数
    it('uses a centered rect for a square halo', () => {
        const { enemy } = createEnemy();
        const aura = new modules.CommonAura(
            enemy,
            createSpecial(25, createHalo({ haloRange: 2, haloSquare: true })),
            { x: 3, y: 4 }
        );

        expect(aura.range).toBeInstanceOf(modules.RectRange);
        expect(aura.getRangeParam()).toEqual({ x: 1, y: 2, w: 5, h: 5 });
    });

    // 验证十字光环使用以定位符为中心的曼哈顿范围参数
    it('uses a manhattan range for a cross halo', () => {
        const { enemy } = createEnemy();
        const aura = new modules.CommonAura(
            enemy,
            createSpecial(25, createHalo({ haloRange: 2, haloSquare: false })),
            { x: 3, y: 4 }
        );

        expect(aura.range).toBeInstanceOf(modules.ManhattanRange);
        expect(aura.getRangeParam()).toEqual({ cx: 3, cy: 4, radius: 2 });
    });
});

describe('CommonAura apply', () => {
    // 验证生命、攻击与防御加成按基础属性比例取整后加到目标怪物上
    it('adds floored attribute buffs to the target enemy', () => {
        const base = createEnemy({ hp: 100, atk: 50, def: 30 });
        const target = createEnemy({ hp: 20, atk: 8, def: 5 });
        const aura = new modules.CommonAura(
            base.enemy,
            createSpecial(
                25,
                createHalo({ hpBuff: 10, atkBuff: 50, defBuff: 20 })
            ),
            { x: 0, y: 0 }
        );

        aura.apply(
            createWritableHandler(target.enemy, { x: 1, y: 0 }),
            base.enemy
        );

        expect(target.attrs.hp).toBe(30);
        expect(target.attrs.atk).toBe(33);
        expect(target.attrs.def).toBe(11);
    });

    // 验证加成为 0 时不修改目标怪物的任何属性
    it('leaves the target untouched when every buff is zero', () => {
        const base = createEnemy({ hp: 100, atk: 50, def: 30 });
        const target = createEnemy({ hp: 20, atk: 8, def: 5 });
        const aura = new modules.CommonAura(
            base.enemy,
            createSpecial(25, createHalo()),
            { x: 0, y: 0 }
        );

        aura.apply(
            createWritableHandler(target.enemy, { x: 1, y: 0 }),
            base.enemy
        );

        expect(target.attrs).toMatchObject({ hp: 20, atk: 8, def: 5 });
    });

    // 验证光环的优先级与修饰能力声明，且不产生特殊属性修饰器
    it('reports its priority, capabilities and no special modifier', () => {
        const { enemy } = createEnemy();
        const aura = new modules.CommonAura(
            enemy,
            createSpecial(25, createHalo()),
            { x: 0, y: 0 }
        );

        expect(aura.priority).toBe(25);
        expect(aura.couldApplyBase).toBe(true);
        expect(aura.couldApplySpecial).toBe(false);
        expect(aura.applySpecial()).toBeNull();
    });
});

describe('GuardAuraConverter', () => {
    // 验证只有代码 26 的特殊属性会被支援光环转换器接管
    it('converts only special code 26', () => {
        const converter = new modules.GuardAuraConverter();

        expect(converter.shouldConvert(createSpecial(26, undefined))).toBe(
            true
        );
        expect(converter.shouldConvert(createSpecial(25, undefined))).toBe(
            false
        );
    });

    // 验证转换结果为携带上下文、怪物、特殊属性与定位符的支援光环视图
    it('converts a code 26 special into a guard aura', () => {
        const converter = new modules.GuardAuraConverter();
        const { enemy } = createEnemy();
        const locator: ITileLocator = { x: 3, y: 4 };
        const special = createSpecial(26, undefined);

        const aura = converter.convert(
            special,
            createReadonlyHandler(enemy, locator),
            createContext(() => createView())
        );

        expect(aura).toBeInstanceOf(modules.GuardAura);
        expect(aura.enemy).toBe(enemy);
        expect(aura.locator).toBe(locator);
        expect(aura.special).toBe(special);
    });
});

describe('GuardAura', () => {
    // 验证支援光环的范围参数为以定位符为中心的 3x3 矩形
    it('uses a 3x3 rect centered on the locator', () => {
        const { enemy } = createEnemy();
        const aura = new modules.GuardAura(
            createContext(() => createView()),
            enemy,
            createSpecial(26, undefined),
            { x: 3, y: 4 }
        );

        expect(aura.getRangeParam()).toEqual({ x: 2, y: 3, w: 3, h: 3 });
    });

    // 验证支援光环把来源定位符添加到周围怪物的支援集合
    it('adds the source locator to a different target enemy guard set', () => {
        const source = createEnemy();
        const target = createEnemy();
        const sourceLocator: ITileLocator = { x: 1, y: 1 };
        const context = createContext(() => createView());
        const aura = new modules.GuardAura(
            context,
            source.enemy,
            createSpecial(26, undefined),
            sourceLocator
        );

        aura.apply(createWritableHandler(target.enemy, { x: 2, y: 1 }));

        expect(
            (target.attrs.guard as Set<ITileLocator>).has(sourceLocator)
        ).toBe(true);
    });

    // 验证支援光环不会把来源定位符添加到自身
    it('does not add the source locator to the source itself', () => {
        const source = createEnemy();
        const sourceLocator: ITileLocator = { x: 1, y: 1 };
        const aura = new modules.GuardAura(
            createContext(() => createView()),
            source.enemy,
            createSpecial(26, undefined),
            sourceLocator
        );

        aura.apply(createWritableHandler(source.enemy, sourceLocator));

        expect(source.attrs.guard.size).toBe(0);
    });

    // 验证来源视图不存在时不添加任何支援定位符
    it('does nothing when the source view is missing', () => {
        const source = createEnemy();
        const target = createEnemy();
        const aura = new modules.GuardAura(
            createContext(() => null),
            source.enemy,
            createSpecial(26, undefined),
            { x: 1, y: 1 }
        );

        aura.apply(createWritableHandler(target.enemy, { x: 2, y: 1 }));

        expect(target.attrs.guard.size).toBe(0);
    });

    // 验证支援光环的优先级与修饰能力声明，且不产生特殊属性修饰器
    it('reports its priority, capabilities and no special modifier', () => {
        const { enemy } = createEnemy();
        const aura = new modules.GuardAura(
            createContext(() => createView()),
            enemy,
            createSpecial(26, undefined),
            { x: 1, y: 1 }
        );

        expect(aura.priority).toBe(26);
        expect(aura.couldApplyBase).toBe(true);
        expect(aura.couldApplySpecial).toBe(false);
        expect(aura.range).toBeInstanceOf(modules.RectRange);
        expect(aura.applySpecial()).toBeNull();
    });
});
