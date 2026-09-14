// 测试地图伤害：领域/阻击/激光/夹击/捕捉五种视图、转换器按特殊属性组装视图、合并器求和与额外信息并集
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { type ITileLocator } from '@motajs/common';
import { type IEnemyAttr, type IHeroAttr } from '@user/data-common';
import {
    type IDamageSystem,
    type IEnemyContext,
    type IEnemyView,
    type IMapDamageInfo,
    type IReadonlyEnemyHandler
} from '@user/data-system';
import {
    type IEnemy,
    type IReadonlyEnemy,
    type IReadonlyHeroAttribute,
    type ISpecial
} from '@user/data-base';
import { type IZoneValue } from './special';

const testGlobals = vi.hoisted(() => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    const core = { flags: { betweenAttackMax: false } };
    vi.stubGlobal('core', core);
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
    return { core };
});

interface TestModules {
    ZoneDamageView: typeof import('./mapDamage').ZoneDamageView;
    RepulseDamageView: typeof import('./mapDamage').RepulseDamageView;
    LaserDamageView: typeof import('./mapDamage').LaserDamageView;
    BetweenDamageView: typeof import('./mapDamage').BetweenDamageView;
    AmbushDamageView: typeof import('./mapDamage').AmbushDamageView;
    MainMapDamageConverter: typeof import('./mapDamage').MainMapDamageConverter;
    MainMapDamageReducer: typeof import('./mapDamage').MainMapDamageReducer;
    MapDamageType: typeof import('./types').MapDamageType;
    ManhattanRange: typeof import('@motajs/common').ManhattanRange;
    RectRange: typeof import('@motajs/common').RectRange;
    FaceGroup: typeof import('@user/data-common').FaceGroup;
}

let modules: TestModules;

beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    const mapDamageModule = await import('./mapDamage');
    const typesModule = await import('./types');
    const motaModule = await import('@motajs/common');
    const commonModule = await import('@user/data-common');
    modules = {
        ZoneDamageView: mapDamageModule.ZoneDamageView,
        RepulseDamageView: mapDamageModule.RepulseDamageView,
        LaserDamageView: mapDamageModule.LaserDamageView,
        BetweenDamageView: mapDamageModule.BetweenDamageView,
        AmbushDamageView: mapDamageModule.AmbushDamageView,
        MainMapDamageConverter: mapDamageModule.MainMapDamageConverter,
        MainMapDamageReducer: mapDamageModule.MainMapDamageReducer,
        MapDamageType: typesModule.MapDamageType,
        ManhattanRange: motaModule.ManhattanRange,
        RectRange: motaModule.RectRange,
        FaceGroup: commonModule.FaceGroup
    };
});

/**
 * 创建一个只携带代码与数值的内联假特殊属性
 * @param code 特殊属性代码
 * @param value 特殊属性数值
 */
function createSpecial<T>(code: number, value: T): ISpecial<T> {
    return { code, value } as never;
}

/**
 * 创建一个只实现地图伤害所需读取能力的内联假怪物
 * @param specials 怪物特殊属性表
 */
function createEnemy(
    specials: Map<number, unknown> = new Map()
): IReadonlyEnemy<IEnemyAttr> {
    return {
        id: 'test-enemy',
        code: 1,
        getSpecial: (code: number) =>
            specials.has(code) ? createSpecial(code, specials.get(code)) : null,
        hasSpecial: (code: number) => specials.has(code),
        iterateSpecials: () => [],
        getAttribute: () => 0,
        cloneAttributes: () => ({}) as IEnemyAttr,
        clone: () => createEnemy(specials)
    } as never;
}

/**
 * 创建一个只提供生命值读取的内联假勇士
 * @param hp 勇士最终生命值
 */
function createHero(hp: number = 100): IReadonlyHeroAttribute<IHeroAttr> {
    return {
        getBaseAttribute: () => hp,
        getFinalAttribute: () => hp
    } as never;
}

interface FakeContextOptions {
    /** 地图宽度 */
    width?: number;
    /** 地图高度 */
    height?: number;
    /** 按坐标存放的怪物视图 */
    enemies?: Map<string, IEnemyView<IEnemyAttr>>;
    /** 绑定的伤害系统 */
    damageSystem?: IDamageSystem<IEnemyAttr, IHeroAttr> | null;
}

/**
 * 创建一个只实现地图伤害所需能力的内联假怪物上下文
 * @param options 宽度、高度、怪物视图与伤害系统配置
 */
function createContext(
    options: FakeContextOptions = {}
): IEnemyContext<IEnemyAttr, IHeroAttr> {
    const width = options.width ?? 6;
    const height = options.height ?? 6;
    const enemies = options.enemies ?? new Map<string, IEnemyView<IEnemyAttr>>();
    return {
        width,
        height,
        indexer: {
            locToIndex: (x: number, y: number) => y * width + x,
            locaterToIndex: (locator: ITileLocator) =>
                locator.y * width + locator.x,
            indexToLocator: (index: number) => ({
                x: index % width,
                y: Math.floor(index / width)
            })
        },
        getEnemyByLoc: (x: number, y: number) =>
            enemies.get(`${x},${y}`) ?? null,
        getDamageSystem: () => options.damageSystem ?? null
    } as never;
}

/**
 * 将一个计算后怪物对象包装为只提供该对象读取的假视图
 * @param computed 计算后怪物对象
 */
function createView(
    computed: IReadonlyEnemy<IEnemyAttr>
): IEnemyView<IEnemyAttr> {
    return { getComputedEnemy: () => computed } as never;
}

/**
 * 创建一个按固定方向表返回移动描述的假朝向处理器
 * @param dirs 朝向与坐标增量对
 */
function createFace(
    dirs: Array<[number, { x: number; y: number }]>
): { mapMovement: () => Array<[number, { x: number; y: number }]> } {
    return { mapMovement: () => dirs };
}

/**
 * 构造一条地图伤害信息
 * @param damage 伤害值
 * @param type 伤害类型
 * @param extra 额外信息
 */
function createInfo(
    damage: number,
    type: number,
    extra: Partial<IMapDamageInfo['extra']> = {}
): IMapDamageInfo {
    return {
        damage,
        type,
        extra: {
            catch: extra.catch ?? new Set(),
            repulse: extra.repulse ?? new Set()
        }
    };
}

describe('ZoneDamageView', () => {
    // 验证十字领域使用曼哈顿范围参数并输出领域伤害
    it('builds a manhattan range and zone damage for a cross zone', () => {
        const special = createSpecial<IZoneValue>(15, {
            zone: 7,
            zoneSquare: false,
            range: 1
        });
        const view = new modules.ZoneDamageView(createContext(), { x: 2, y: 3 }, special);

        expect(view.getRange()).toBeInstanceOf(modules.ManhattanRange);
        expect(view.getRangeParam()).toEqual({ cx: 2, cy: 3, radius: 1 });
        expect(view.getDamageWithoutCheck({ x: 0, y: 0 })).toEqual(
            createInfo(7, modules.MapDamageType.Zone)
        );
    });

    // 验证九宫格领域使用矩形范围参数并输出领域伤害
    it('builds a rect range and zone damage for a square zone', () => {
        const special = createSpecial<IZoneValue>(15, {
            zone: 4,
            zoneSquare: true,
            range: 2
        });
        const view = new modules.ZoneDamageView(createContext(), { x: 2, y: 3 }, special);

        expect(view.getRange()).toBeInstanceOf(modules.RectRange);
        expect(view.getRangeParam()).toEqual({ x: 0, y: 1, w: 5, h: 5 });
        expect(view.getDamageWithoutCheck({ x: 0, y: 0 })).toEqual(
            createInfo(4, modules.MapDamageType.Zone)
        );
    });

    // 验证领域范围判定命中范围内的坐标并忽略范围外坐标
    it('checks coordinates against the zone range', () => {
        const special = createSpecial<IZoneValue>(15, {
            zone: 7,
            zoneSquare: false,
            range: 1
        });
        const view = new modules.ZoneDamageView(createContext(), { x: 2, y: 3 }, special);

        expect(view.getDamageAt({ x: 2, y: 4 })).toEqual(
            createInfo(7, modules.MapDamageType.Zone)
        );
        expect(view.getDamageAt({ x: 5, y: 5 })).toBeNull();
    });
});

describe('RepulseDamageView', () => {
    // 验证阻击范围半径为 1 且在来源点返回空
    it('uses a radius one range and returns null at the source', () => {
        const special = createSpecial(18, 4);
        const source: ITileLocator = { x: 2, y: 3 };
        const view = new modules.RepulseDamageView(createContext(), source, special);

        expect(view.getRangeParam()).toEqual({ cx: 2, cy: 3, radius: 1 });
        expect(view.getDamageWithoutCheck(source)).toBeNull();
    });

    // 验证阻击在相邻点输出伤害并把来源定位符放入额外信息
    it('returns repulse damage carrying the source locator', () => {
        const special = createSpecial(18, 4);
        const source: ITileLocator = { x: 2, y: 3 };
        const view = new modules.RepulseDamageView(createContext(), source, special);

        const info = view.getDamageWithoutCheck({ x: 3, y: 3 });

        expect(info?.damage).toBe(4);
        expect(info?.type).toBe(modules.MapDamageType.Repulse);
        expect(info?.extra.repulse.has(source)).toBe(true);
    });

    // 验证阻击范围判定忽略范围外的坐标
    it('ignores coordinates outside the repulse range', () => {
        const special = createSpecial(18, 4);
        const view = new modules.RepulseDamageView(
            createContext(),
            { x: 2, y: 3 },
            special
        );

        expect(view.getDamageAt({ x: 5, y: 5 })).toBeNull();
    });
});

describe('LaserDamageView', () => {
    // 验证激光范围参数取自朝向处理器的移动方向并输出激光伤害
    it('uses the face handler movements as the ray directions', () => {
        const dirs: Array<[number, { x: number; y: number }]> = [
            [0, { x: 0, y: 0 }],
            [1, { x: 1, y: 0 }]
        ];
        const special = createSpecial(24, 9);
        const view = new modules.LaserDamageView(
            createContext(),
            { x: 2, y: 3 },
            special,
            createFace(dirs) as never
        );

        expect(view.getRangeParam()).toEqual({
            cx: 2,
            cy: 3,
            dir: [{ x: 0, y: 0 }, { x: 1, y: 0 }]
        });
        expect(view.getDamageWithoutCheck({ x: 5, y: 3 })).toEqual(
            createInfo(9, modules.MapDamageType.Layer)
        );
    });
});

describe('BetweenDamageView', () => {
    // 验证夹击只在向下的相邻格命中并要求镜像位置存在同类怪物
    it('returns half hero hp for a qualifying adjacent pair', () => {
        const source = createEnemy();
        const mirror = createEnemy(new Map([[16, undefined]]));
        const context = createContext({
            enemies: new Map([['3,1', createView(mirror)]])
        });
        const view = new modules.BetweenDamageView(
            context,
            source,
            { x: 1, y: 1 },
            createHero(100)
        );

        expect(view.getDamageWithoutCheck({ x: 2, y: 1 })).toEqual(
            createInfo(50, modules.MapDamageType.Between)
        );
    });

    // 验证向左与向上方向的相邻格不构成夹击
    it('ignores the left and upper adjacent locators', () => {
        const source = createEnemy();
        const mirror = createEnemy(new Map([[16, undefined]]));
        const context = createContext({
            enemies: new Map([
                ['1,1', createView(mirror)],
                ['-1,1', createView(mirror)]
            ])
        });
        const view = new modules.BetweenDamageView(
            context,
            source,
            { x: 1, y: 1 },
            createHero(100)
        );

        expect(view.getDamageWithoutCheck({ x: 0, y: 1 })).toBeNull();
        expect(view.getDamageWithoutCheck({ x: 1, y: 0 })).toBeNull();
    });

    // 验证斜向相邻格与非相邻格都不构成夹击
    it('ignores diagonal and non-adjacent locators', () => {
        const source = createEnemy();
        const mirror = createEnemy(new Map([[16, undefined]]));
        const context = createContext({
            enemies: new Map([['3,2', createView(mirror)]])
        });
        const view = new modules.BetweenDamageView(
            context,
            source,
            { x: 1, y: 1 },
            createHero(100)
        );

        expect(view.getDamageWithoutCheck({ x: 2, y: 2 })).toBeNull();
        expect(view.getDamageWithoutCheck({ x: 4, y: 1 })).toBeNull();
    });

    // 验证镜像位置没有怪物时不构成夹击
    it('returns null when the mirrored locator has no enemy', () => {
        const source = createEnemy();
        const view = new modules.BetweenDamageView(
            createContext(),
            source,
            { x: 1, y: 1 },
            createHero(100)
        );

        expect(view.getDamageWithoutCheck({ x: 2, y: 1 })).toBeNull();
    });

    // 验证镜像怪物没有夹击属性时不构成夹击
    it('returns null when the mirrored enemy lacks special 16', () => {
        const source = createEnemy();
        const mirror = createEnemy();
        const context = createContext({
            enemies: new Map([['3,1', createView(mirror)]])
        });
        const view = new modules.BetweenDamageView(
            context,
            source,
            { x: 1, y: 1 },
            createHero(100)
        );

        expect(view.getDamageWithoutCheck({ x: 2, y: 1 })).toBeNull();
    });

    // 验证存在伤害系统时夹击取半血与双方伤害的最小值
    it('takes the minimum of half hp and both damage infos', () => {
        const source = createEnemy();
        const mirror = createEnemy(new Map([[16, undefined]]));
        const half = createHero(100);
        const damageSystem = {
            getDamageInfoByComputed: (enemy: IReadonlyEnemy<IEnemyAttr>) => ({
                damage: enemy === source ? 30 : 40,
                turn: 1
            })
        } as never;
        const context = createContext({
            enemies: new Map([['3,1', createView(mirror)]]),
            damageSystem
        });
        const view = new modules.BetweenDamageView(
            context,
            source,
            { x: 1, y: 1 },
            half
        );

        testGlobals.core.flags.betweenAttackMax = true;
        const info = view.getDamageWithoutCheck({ x: 2, y: 1 });
        testGlobals.core.flags.betweenAttackMax = false;

        expect(info).toEqual(createInfo(30, modules.MapDamageType.Between));
    });

    // 验证缺少伤害系统时夹击回退为半血
    it('falls back to half hp when the damage system is missing', () => {
        const source = createEnemy();
        const mirror = createEnemy(new Map([[16, undefined]]));
        const context = createContext({
            enemies: new Map([['3,1', createView(mirror)]])
        });
        const view = new modules.BetweenDamageView(
            context,
            source,
            { x: 1, y: 1 },
            createHero(100)
        );

        testGlobals.core.flags.betweenAttackMax = true;
        const info = view.getDamageWithoutCheck({ x: 2, y: 1 });
        testGlobals.core.flags.betweenAttackMax = false;

        expect(info).toEqual(createInfo(50, modules.MapDamageType.Between));
    });
});

describe('AmbushDamageView', () => {
    // 验证捕捉视图输出 0 点未知伤害并把定位符放入捕捉信息
    it('returns zero unknown damage carrying the locator', () => {
        const locator: ITileLocator = { x: 2, y: 3 };
        const view = new modules.AmbushDamageView(createContext(), locator);

        const info = view.getDamageWithoutCheck(locator);

        expect(info?.damage).toBe(0);
        expect(info?.type).toBe(modules.MapDamageType.Unknown);
        expect(info?.extra.catch.has(locator)).toBe(true);
        expect(info?.extra.repulse.size).toBe(0);
    });
});

describe('MainMapDamageConverter', () => {
    // 验证转换器按领域、夹击、阻击、激光、捕捉的顺序为每个特殊属性各建一个视图
    it('builds one view per present special in a stable order', () => {
        const specials = new Map<number, unknown>([
            [15, { zone: 3, zoneSquare: false, range: 1 }],
            [16, undefined],
            [18, 4],
            [24, 9],
            [27, undefined]
        ]);
        const enemy = createEnemy(specials);
        const faceCalls: number[] = [];
        const face = createFace([[1, { x: 1, y: 0 }]]);
        const handler = {
            enemy,
            locator: { x: 2, y: 3 },
            hero: createHero(),
            state: {
                faceManager: {
                    get: (group: number) => {
                        faceCalls.push(group);
                        return face;
                    }
                }
            }
        } as never;
        const converter = new modules.MainMapDamageConverter();

        const views = converter.convert(handler, createContext());

        expect(views).toHaveLength(5);
        expect(views[0]).toBeInstanceOf(modules.ZoneDamageView);
        expect(views[1]).toBeInstanceOf(modules.BetweenDamageView);
        expect(views[2]).toBeInstanceOf(modules.RepulseDamageView);
        expect(views[3]).toBeInstanceOf(modules.LaserDamageView);
        expect(views[4]).toBeInstanceOf(modules.AmbushDamageView);
        expect(faceCalls).toEqual([modules.FaceGroup.Dir4]);
    });

    // 验证没有相关特殊属性时不产生任何视图
    it('builds no view when no map damage special is present', () => {
        const handler = {
            enemy: createEnemy(),
            locator: { x: 2, y: 3 },
            hero: createHero(),
            state: { faceManager: { get: () => null } }
        } as never;
        const converter = new modules.MainMapDamageConverter();

        expect(converter.convert(handler, createContext())).toEqual([]);
    });
});

describe('MainMapDamageReducer', () => {
    // 验证合并器求和、取最大伤害项的类型并合并捕捉与阻击定位符
    it('sums damage, picks the max type and unions the extras', () => {
        const repulse: ITileLocator = { x: 1, y: 0 };
        const caught: ITileLocator = { x: 0, y: 1 };
        const reducer = new modules.MainMapDamageReducer();

        const info = reducer.reduce(
            [
                createInfo(3, modules.MapDamageType.Zone),
                createInfo(5, modules.MapDamageType.Repulse, {
                    repulse: new Set([repulse])
                }),
                createInfo(5, modules.MapDamageType.Between, {
                    catch: new Set([caught])
                })
            ],
            { x: 0, y: 0 }
        );

        expect(info.damage).toBe(13);
        expect(info.type).toBe(modules.MapDamageType.Repulse);
        expect([...info.extra.repulse]).toEqual([repulse]);
        expect([...info.extra.catch]).toEqual([caught]);
    });

    // 验证空输入返回 0 点未知伤害与空的额外信息
    it('returns zero unknown damage for an empty input', () => {
        const reducer = new modules.MainMapDamageReducer();

        const info = reducer.reduce([], { x: 0, y: 0 });

        expect(info.damage).toBe(0);
        expect(info.type).toBe(modules.MapDamageType.Unknown);
        expect(info.extra.catch.size).toBe(0);
        expect(info.extra.repulse.size).toBe(0);
    });
});
