// 测试地图伤害：无来源伤害增删、有来源转换与合并、告警码 102/103/104、分离伤害合并、deleteEnemy 与 markEnemyDirty、CR-02 空视图集/范围收缩、IN-01 删除后点残留
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
    type IRange,
    type ITileLocator,
    type IRangeHost
} from '@motajs/common';
import { type IEnemy, type IStateBase } from '@user/data-base';
import {
    IMapDamage,
    type IEnemyContext,
    type IEnemyView,
    type IMapDamageConverter,
    type IMapDamageInfo,
    type IMapDamageReducer,
    type IMapDamageView
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
    MapDamage: typeof import('./mapDamage').MapDamage;
    MapLocIndexer: typeof import('@user/data-common').MapLocIndexer;
    HeroAttribute: typeof import('@user/data-base').HeroAttribute;
    Enemy: typeof import('@user/data-base').Enemy;
    logger: typeof import('@motajs/common').logger;
}

let modules: TestModules;

beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    const mapDamageModule = await import('./mapDamage');
    const commonModule = await import('@user/data-common');
    const motaModule = await import('@motajs/common');
    const baseModule = await import('@user/data-base');
    modules = {
        MapDamage: mapDamageModule.MapDamage,
        MapLocIndexer: commonModule.MapLocIndexer,
        HeroAttribute: baseModule.HeroAttribute,
        Enemy: baseModule.Enemy,
        logger: motaModule.logger
    };
});

/**
 * 构造一条地图伤害信息
 * @param damage 伤害值
 */
function createInfo(damage: number): IMapDamageInfo {
    return {
        damage,
        type: 0,
        extra: { catch: new Set(), repulse: new Set() }
    };
}

interface IFakeRange {
    /**
     * 绑定宿主对象
     * @param host 宿主对象
     */
    bindHost(host: IRangeHost): void;

    /**
     * 迭代范围内的坐标索引
     * @param param 范围参数
     */
    iterateLoc(param: number): Iterable<number>;
}

/**
 * 只覆盖固定坐标索引集合的测试范围，用于驱动有来源伤害转换
 */
class FakeRange implements IFakeRange {
    /** 该范围覆盖的坐标索引 */
    readonly indexes: number[];

    constructor(indexes: number[]) {
        this.indexes = indexes;
    }

    bindHost(_host: IRangeHost): void {}

    *iterateLoc(): Iterable<number> {
        yield* this.indexes;
    }
}

/**
 * 固定返回一条地图伤害的测试视图
 */
class FakeView implements IMapDamageView<number> {
    /** 该视图产生的伤害值 */
    readonly value: number;
    /** 该视图影响的范围 */
    readonly range: FakeRange;

    constructor(value: number, indexes: number[]) {
        this.value = value;
        this.range = new FakeRange(indexes);
    }

    getRange(): IRange<number> {
        return this.range as never;
    }

    getRangeParam(): number {
        return 0;
    }

    getDamageAt(_locator: ITileLocator): Readonly<IMapDamageInfo> | null {
        return createInfo(this.value);
    }

    getDamageWithoutCheck(
        _locator: ITileLocator
    ): Readonly<IMapDamageInfo> | null {
        return createInfo(this.value);
    }
}

/**
 * 固定输出伤害视图列表的测试转换器
 */
class FakeConverter implements IMapDamageConverter<
    TestEnemyAttr,
    TestHeroAttr
> {
    /** 转换输出的伤害视图 */
    readonly views: IMapDamageView<number>[];
    /** convert 调用次数 */
    calls: number = 0;

    constructor(views: IMapDamageView<number>[]) {
        this.views = views;
    }

    convert(): IMapDamageView<number>[] {
        this.calls++;
        return this.views;
    }
}

/**
 * 求和式测试合并器，并记录调用次数
 */
class FakeReducer implements IMapDamageReducer {
    /** reduce 调用次数 */
    calls: number = 0;

    reduce(info: Iterable<Readonly<IMapDamageInfo>>): Readonly<IMapDamageInfo> {
        this.calls++;
        let damage = 0;
        for (const item of info) {
            damage += item.damage;
        }
        return createInfo(damage);
    }
}

/**
 * 构造一条带伤害类型与额外标记的地图伤害信息
 * @param damage 伤害值
 * @param type 伤害类型
 * @param catchLocs 捕捉标记集合
 * @param repulseLocs 阻击标记集合
 */
function createTypedInfo(
    damage: number,
    type: number,
    catchLocs: ITileLocator[] = [],
    repulseLocs: ITileLocator[] = []
): IMapDamageInfo {
    return {
        damage,
        type,
        extra: {
            catch: new Set(catchLocs),
            repulse: new Set(repulseLocs)
        }
    };
}

/**
 * 按「伤害求和、类型取最大、额外标记并集」语义合并的测试合并器
 */
class SemanticReducer implements IMapDamageReducer {
    /** reduce 调用次数 */
    calls: number = 0;

    reduce(info: Iterable<Readonly<IMapDamageInfo>>): Readonly<IMapDamageInfo> {
        this.calls++;
        let damage = 0;
        let type = 0;
        const catchLocs: ITileLocator[] = [];
        const repulseLocs: ITileLocator[] = [];
        for (const item of info) {
            damage += item.damage;
            if (item.type > type) type = item.type;
            item.extra.catch.forEach(loc => catchLocs.push(loc));
            item.extra.repulse.forEach(loc => repulseLocs.push(loc));
        }
        return createTypedInfo(damage, type, catchLocs, repulseLocs);
    }
}

/**
 * 固定返回一条带类型与额外标记地图伤害的测试视图
 */
class FakeTypedView implements IMapDamageView<number> {
    /** 该视图产生的伤害信息 */
    readonly info: IMapDamageInfo;
    /** 该视图影响的范围 */
    readonly range: FakeRange;

    constructor(info: IMapDamageInfo, indexes: number[]) {
        this.info = info;
        this.range = new FakeRange(indexes);
    }

    getRange(): IRange<number> {
        return this.range as never;
    }

    getRangeParam(): number {
        return 0;
    }

    getDamageAt(): Readonly<IMapDamageInfo> {
        return this.info;
    }

    getDamageWithoutCheck(): Readonly<IMapDamageInfo> {
        return this.info;
    }
}

interface MapDamageFixture {
    /** 被测地图伤害对象 */
    damage: IMapDamage<TestEnemyAttr, TestHeroAttr>;
    /** 怪物上下文假对象 */
    context: IEnemyContext<TestEnemyAttr, TestHeroAttr>;
    /** 测试转换器 */
    converter: FakeConverter;
    /** 测试合并器 */
    reducer: FakeReducer;
    /** 已注册的怪物视图 */
    view: IEnemyView<TestEnemyAttr>;
    /** 转换出的伤害视图 */
    damageView: FakeView;
    /** 已注册怪物的位置 */
    locator: ITileLocator;
    /** 可修改原始怪物 */
    origin: IEnemy<TestEnemyAttr>;
}

/**
 * 创建地图伤害测试夹具，怪物上下文只实现被测路径所需的最小接口
 */
function createFixture(): MapDamageFixture {
    const state = {} as IStateBase;
    const indexer = new modules.MapLocIndexer();
    indexer.setWidth(4);
    const hero = new modules.HeroAttribute<TestHeroAttr>({
        hp: 100,
        atk: 0,
        def: 0
    });
    const origin = new modules.Enemy<TestEnemyAttr>('enemy-1', 1, {
        hp: 10,
        atk: 2,
        def: 0
    });
    const locator: ITileLocator = { x: 1, y: 0 };
    const enemies = new Map<IEnemyView<TestEnemyAttr>, ITileLocator>();
    const view: IEnemyView<TestEnemyAttr> = {
        context: {} as never,
        reset: () => {},
        getBaseEnemy: () => origin,
        getComputedEnemy: () => origin,
        getModifiableEnemy: () => origin,
        markDirty: () => {}
    };
    enemies.set(view, locator);
    const damageView = new FakeView(7, [
        indexer.locToIndex(locator.x, locator.y)
    ]);
    const context = {
        state,
        indexer,
        width: 4,
        height: 3,
        getBindedHero: () => hero,
        getEnemyLocatorByView: (target: IEnemyView<TestEnemyAttr>) =>
            enemies.get(target) ?? null,
        getEnemyLocator: (target: IEnemy<TestEnemyAttr>) =>
            target === origin ? locator : null,
        getViewByComputed: () => view,
        *iterateEnemy(): Iterable<[ITileLocator, IEnemyView<TestEnemyAttr>]> {
            for (const [target, targetLocator] of enemies) {
                yield [targetLocator, target];
            }
        }
    } as never;
    const damage = new modules.MapDamage<TestEnemyAttr, TestHeroAttr>(context);
    return {
        damage,
        context,
        converter: new FakeConverter([damageView]),
        reducer: new FakeReducer(),
        view,
        damageView,
        locator,
        origin
    };
}

/**
 * 创建一个未注册到夹具中的怪物视图，用于验证未知定位符路径
 */
function createUnknownView(
    fixture: MapDamageFixture
): IEnemyView<TestEnemyAttr> {
    return {
        context: {} as never,
        reset: () => {},
        getBaseEnemy: () => fixture.origin,
        getComputedEnemy: () => fixture.origin,
        getModifiableEnemy: () => fixture.origin,
        markDirty: () => {}
    };
}

describe('MapDamage sourceless damage', () => {
    // 验证添加与删除无来源地图伤害会同步更新分离伤害列表
    it('adds and deletes sourceless damage at a point', () => {
        const fixture = createFixture();
        fixture.damage.useReducer(fixture.reducer);
        const info = createInfo(5);

        fixture.damage.addMapDamage({ x: 0, y: 0 }, info);
        expect([
            ...fixture.damage.getSeparatedDamage({ x: 0, y: 0 })
        ]).toContain(info);

        fixture.damage.deleteMapDamage({ x: 0, y: 0 }, info);
        expect([
            ...fixture.damage.getSeparatedDamage({ x: 0, y: 0 })
        ]).toHaveLength(0);
    });

    // 验证删除不存在的无来源伤害是安全操作
    it('ignores deleting sourceless damage that was never added', () => {
        const fixture = createFixture();
        fixture.damage.useReducer(fixture.reducer);

        fixture.damage.deleteMapDamage({ x: 3, y: 2 }, createInfo(5));

        expect([
            ...fixture.damage.getSeparatedDamage({ x: 3, y: 2 })
        ]).toHaveLength(0);
    });
});

describe('MapDamage sourced conversion and reduction', () => {
    // 验证转换出的有来源伤害可被分离查询与合并查询获取
    it('converts sourced damage and reduces it through the reducer', () => {
        const fixture = createFixture();
        fixture.damage.useReducer(fixture.reducer);
        fixture.damage.useConverter(fixture.converter);

        const separated = [
            ...fixture.damage.getSeparatedDamage(fixture.locator)
        ];
        const reduced = fixture.damage.getReducedDamage(fixture.locator);

        expect(separated).toHaveLength(1);
        expect(separated[0].damage).toBe(7);
        expect(reduced?.damage).toBe(7);
        expect(fixture.reducer.calls).toBe(1);
    });

    // 验证同一坐标上无来源与有来源伤害会被合并查询同时返回
    it('unions sourceless and sourced damage at the same point', () => {
        const fixture = createFixture();
        fixture.damage.useReducer(fixture.reducer);
        fixture.damage.useConverter(fixture.converter);
        fixture.damage.addMapDamage(fixture.locator, createInfo(3));

        expect([
            ...fixture.damage.getSeparatedDamage(fixture.locator)
        ]).toHaveLength(2);

        const reduced = fixture.damage.getReducedDamage(fixture.locator);
        expect(reduced?.damage).toBe(10);
    });

    // 验证合并结果命中缓存，markDirty 后按新数据重新合并
    it('caches the reduced damage until the point is marked dirty', () => {
        const fixture = createFixture();
        fixture.damage.useReducer(fixture.reducer);
        fixture.damage.addMapDamage({ x: 0, y: 0 }, createInfo(3));

        const first = fixture.damage.getReducedDamage({ x: 0, y: 0 });
        const second = fixture.damage.getReducedDamage({ x: 0, y: 0 });

        expect(second).toBe(first);
        expect(fixture.reducer.calls).toBe(1);

        fixture.damage.markDirty({ x: 0, y: 0 });
        const third = fixture.damage.getReducedDamage({ x: 0, y: 0 });

        expect(third).not.toBe(first);
        expect(third?.damage).toBe(3);
        expect(fixture.reducer.calls).toBe(2);
    });

    // 验证没有任何分离伤害时合并查询返回 null
    it('returns null when a point has no separated damage', () => {
        const fixture = createFixture();
        fixture.damage.useReducer(fixture.reducer);

        expect(fixture.damage.getReducedDamage({ x: 3, y: 2 })).toBeNull();
    });

    // 验证未设置转换器时全量刷新告警 102 并直接返回
    it('warns 102 when the converter is missing during a full refresh', () => {
        const fixture = createFixture();

        const result = modules.logger.catch(() => fixture.damage.refreshAll());

        expect(result.info.map(v => v.code)).toContain(102);
    });

    // 验证未设置合并器时合并查询告警 103 并返回 null
    it('warns 103 when the reducer is missing', () => {
        const fixture = createFixture();

        const result = modules.logger.catch(() =>
            fixture.damage.getReducedDamage({ x: 0, y: 0 })
        );

        expect(result.ret).toBeNull();
        expect(result.info.map(v => v.code)).toContain(103);
    });

    // 验证既无伤害来源又无定位符时标记怪物脏会告警 104
    it('warns 104 when marking an unregistered enemy dirty', () => {
        const fixture = createFixture();

        const result = modules.logger.catch(() =>
            fixture.damage.markEnemyDirty(createUnknownView(fixture))
        );

        expect(result.info.map(v => v.code)).toContain(104);
    });

    // 验证已注册怪物的 markEnemyDirty 会按其视图重新转换有来源伤害
    it('refreshes sourced damage when a registered enemy is marked dirty', () => {
        const fixture = createFixture();
        fixture.damage.useReducer(fixture.reducer);
        fixture.damage.useConverter(fixture.converter);
        expect(fixture.converter.calls).toBe(1);

        fixture.damage.markEnemyDirty(fixture.view);

        expect(fixture.converter.calls).toBe(2);
        expect(
            [...fixture.damage.getSeparatedDamage(fixture.locator)][0].damage
        ).toBe(7);
    });

    // 验证删除未注册怪物不产生任何有来源伤害变化
    it('ignores deleting an enemy without sourced damage', () => {
        const fixture = createFixture();
        fixture.damage.useReducer(fixture.reducer);
        fixture.damage.useConverter(fixture.converter);
        const before = [...fixture.damage.getSeparatedDamage(fixture.locator)]
            .length;

        fixture.damage.deleteEnemy(createUnknownView(fixture));

        expect([
            ...fixture.damage.getSeparatedDamage(fixture.locator)
        ]).toHaveLength(before);
    });

    // 验证 deleteEnemy 会移除该怪物带来的有来源地图伤害
    it('removes enemy-sourced damage when the enemy is deleted', () => {
        const fixture = createFixture();
        fixture.damage.useReducer(fixture.reducer);
        fixture.damage.useConverter(fixture.converter);
        expect([
            ...fixture.damage.getSeparatedDamage(fixture.locator)
        ]).toHaveLength(1);

        fixture.damage.deleteEnemy(fixture.view);

        expect([
            ...fixture.damage.getSeparatedDamage(fixture.locator)
        ]).toHaveLength(0);
    });

    // 验证伤害来源消失后旧坐标不再返回幽灵伤害（CR-02 视图集变空）
    it('drops ghost damage when the enemy view set becomes empty', () => {
        const fixture = createFixture();
        fixture.damage.useReducer(fixture.reducer);
        fixture.damage.useConverter(fixture.converter);
        expect(fixture.damage.getReducedDamage(fixture.locator)?.damage).toBe(
            7
        );

        fixture.converter.views.length = 0;
        fixture.damage.markEnemyDirty(fixture.view);

        expect(fixture.damage.getReducedDamage(fixture.locator)).toBeNull();
        expect([
            ...fixture.damage.getSeparatedDamage(fixture.locator)
        ]).toHaveLength(0);
    });

    // 验证伤害范围收缩后跌出范围的坐标不再保留旧缓存（CR-02 范围收缩）
    it('drops stale damage on indexes that fall out of a shrunken range', () => {
        const fixture = createFixture();
        const indexA = fixture.context.indexer.locToIndex(
            fixture.locator.x,
            fixture.locator.y
        );
        const indexB = fixture.context.indexer.locToIndex(2, 1);
        const locatorB: ITileLocator = { x: 2, y: 1 };
        const view = new FakeView(7, [indexA, indexB]);
        fixture.damage.useReducer(fixture.reducer);
        fixture.damage.useConverter(new FakeConverter([view]));
        expect(fixture.damage.getReducedDamage(fixture.locator)?.damage).toBe(
            7
        );
        expect(fixture.damage.getReducedDamage(locatorB)?.damage).toBe(7);

        view.range.indexes.length = 1;
        fixture.damage.markEnemyDirty(fixture.view);

        expect(fixture.damage.getReducedDamage(locatorB)).toBeNull();
        expect([...fixture.damage.getSeparatedDamage(locatorB)]).toHaveLength(
            0
        );
        expect(fixture.damage.getReducedDamage(fixture.locator)?.damage).toBe(
            7
        );
    });

    // 验证视图集变空后仍登记空集，此后标记怪物脏走局部刷新而非整表刷新
    it('keeps refreshing locally after an empty view set is registered', () => {
        const fixture = createFixture();
        fixture.damage.useReducer(fixture.reducer);
        fixture.damage.useConverter(fixture.converter);
        fixture.converter.views.length = 0;
        fixture.damage.markEnemyDirty(fixture.view);
        const iterateSpy = vi.spyOn(fixture.context, 'iterateEnemy');
        const calls = fixture.converter.calls;

        fixture.damage.markEnemyDirty(fixture.view);

        expect(iterateSpy).not.toHaveBeenCalled();
        expect(fixture.converter.calls).toBe(calls + 1);
    });

    // 验证 refreshAll 同样登记空视图集，此后标记怪物脏不退回整表刷新
    it('registers an empty view set through refreshAll as well', () => {
        const fixture = createFixture();
        fixture.damage.useReducer(fixture.reducer);
        fixture.damage.useConverter(fixture.converter);
        fixture.converter.views.length = 0;
        fixture.damage.refreshAll();
        const iterateSpy = vi.spyOn(fixture.context, 'iterateEnemy');
        const calls = fixture.converter.calls;

        fixture.damage.markEnemyDirty(fixture.view);

        expect(iterateSpy).not.toHaveBeenCalled();
        expect(fixture.converter.calls).toBe(calls + 1);
    });
});

describe('MapDamage multi-source stacking', () => {
    // 验证同一点上两条有来源伤害会分别保留并求和合并
    it('stacks two sourced damages at the same point', () => {
        const fixture = createFixture();
        const index = fixture.context.indexer.locToIndex(
            fixture.locator.x,
            fixture.locator.y
        );
        fixture.damage.useReducer(new SemanticReducer());
        fixture.damage.useConverter(
            new FakeConverter([
                new FakeView(7, [index]),
                new FakeView(4, [index])
            ])
        );

        const separated = [
            ...fixture.damage.getSeparatedDamage(fixture.locator)
        ];
        const reduced = fixture.damage.getReducedDamage(fixture.locator);

        expect(separated).toHaveLength(2);
        expect(reduced!.damage).toBe(11);
        expect(reduced!.type).toBe(0);
    });

    // 验证同一点上两条无来源伤害会分别保留并求和合并
    it('stacks two sourceless damages at the same point', () => {
        const fixture = createFixture();
        fixture.damage.useReducer(new SemanticReducer());
        fixture.damage.useConverter(new FakeConverter([]));
        fixture.damage.addMapDamage(fixture.locator, createTypedInfo(3, 1));
        fixture.damage.addMapDamage(fixture.locator, createTypedInfo(5, 2));

        const separated = [
            ...fixture.damage.getSeparatedDamage(fixture.locator)
        ];
        const reduced = fixture.damage.getReducedDamage(fixture.locator);

        expect(separated).toHaveLength(2);
        expect(reduced!.damage).toBe(8);
        expect(reduced!.type).toBe(2);
    });

    // 验证多来源（有来源与无来源混合）叠加后伤害求和、类型取最大、额外标记取并集
    it('merges mixed sourced and sourceless damages into one reduced result', () => {
        const fixture = createFixture();
        const index = fixture.context.indexer.locToIndex(
            fixture.locator.x,
            fixture.locator.y
        );
        const catchA: ITileLocator = { x: 0, y: 1 };
        const repulseB: ITileLocator = { x: 0, y: 2 };
        const catchC: ITileLocator = { x: 0, y: 3 };
        const repulseD: ITileLocator = { x: 0, y: 4 };
        fixture.damage.useReducer(new SemanticReducer());
        fixture.damage.useConverter(
            new FakeConverter([
                new FakeTypedView(createTypedInfo(7, 0, [catchA]), [index]),
                new FakeTypedView(createTypedInfo(4, 2, [], [repulseB]), [
                    index
                ])
            ])
        );
        fixture.damage.addMapDamage(
            fixture.locator,
            createTypedInfo(3, 1, [catchC])
        );
        fixture.damage.addMapDamage(
            fixture.locator,
            createTypedInfo(2, 1, [], [repulseD])
        );

        const separated = [
            ...fixture.damage.getSeparatedDamage(fixture.locator)
        ];
        const reduced = fixture.damage.getReducedDamage(fixture.locator);

        expect(separated).toHaveLength(4);
        expect(reduced!.damage).toBe(16);
        expect(reduced!.type).toBe(2);
        expect([...reduced!.extra.catch]).toEqual([catchA, catchC]);
        expect([...reduced!.extra.repulse]).toEqual([repulseB, repulseD]);
    });
});
