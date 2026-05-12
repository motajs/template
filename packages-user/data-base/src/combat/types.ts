import { ITileLocator, IRange } from '@motajs/common';
import { IEnemy, IReadonlyEnemy, ISpecial } from '../enemy';
import { IReadonlyHeroAttribute, IHeroAttribute } from '../hero';
import { ILocationHelper } from '../common/indexer';
import { IStateBase } from '../types';

//#region 辅助接口

export interface IEnemyHandler<TEnemy, THero> {
    /** 怪物属性信息 */
    readonly enemy: IEnemy<TEnemy>;
    /** 怪物定位符 */
    readonly locator: ITileLocator;
    /** 勇士属性信息 */
    readonly hero: IReadonlyHeroAttribute<THero>;
    /** 当前全局状态对象 */
    readonly data: IStateBase<TEnemy, THero>;
}

export interface IReadonlyEnemyHandler<TEnemy, THero> {
    /** 怪物属性信息 */
    readonly enemy: IReadonlyEnemy<TEnemy>;
    /** 怪物定位符 */
    readonly locator: ITileLocator;
    /** 勇士属性信息 */
    readonly hero: IReadonlyHeroAttribute<THero>;
    /** 当前全局状态对象 */
    readonly data: IStateBase<TEnemy, THero>;
}

//#endregion

//#region 怪物对象

export interface IEnemyView<TEnemy> {
    /** 怪物视图所属的上下文 */
    readonly context: IEnemyContext<TEnemy, unknown>;

    /**
     * 重置此怪物视图的状态，将计算后怪物对象恢复至初始状态
     */
    reset(): void;

    /**
     * 获取基本怪物对象
     */
    getBaseEnemy(): IReadonlyEnemy<TEnemy>;

    /**
     * 获取计算后的怪物对象，返回的怪物对象同引用
     */
    getComputedEnemy(): IReadonlyEnemy<TEnemy>;

    /**
     * 获取可修改的怪物对象。如果修改此方法获取的怪物对象，那么怪物的真实信息是不会刷新的，
     * 需要手动调用 markDirty 方法来刷新。
     */
    getModifiableEnemy(): IEnemy<TEnemy>;

    /**
     * 将此怪物标记为脏，需要更新
     */
    markDirty(): void;
}

//#endregion

//#region 光环与查询

export interface IEnemySpecialModifier<TEnemy> {
    /**
     * 获取要添加到指定怪物身上的特殊属性
     * @param handler 信息对象
     */
    add(handler: IReadonlyEnemyHandler<TEnemy, unknown>): ISpecial<any>[];

    /**
     * 获取制定怪物身上要删除的特殊属性
     * @param handler 信息对象
     */
    delete(handler: IReadonlyEnemyHandler<TEnemy, unknown>): ISpecial<any>[];

    /**
     * 修改一个怪物的特殊属性，如果真正进行了修改则返回 true，否则返回 false
     * @param handler 信息对象
     * @param special 要修改的怪物特殊属性
     */
    modify(
        handler: IEnemyHandler<TEnemy, unknown>,
        special: ISpecial<any>
    ): boolean;
}

export interface IAuraView<TEnemy, TRange = any> {
    /** 此光环视图的优先级 */
    readonly priority: number;
    /** 此光环视图的影响范围 */
    readonly range: IRange<TRange>;

    /** 这个光环视图是否有可能修改怪物的基本属性 */
    readonly couldApplyBase: boolean;
    /** 这个光环视图是否有可能修改怪物的特殊属性 */
    readonly couldApplySpecial: boolean;

    /**
     * 获取范围扫描参数
     */
    getRangeParam(): TRange;

    /**
     * 对指定怪物对象施加修饰器
     * @param handler 信息对象
     * @param baseEnemy 原始怪物对象，即未进行任何修改的怪物对象
     */
    apply(
        handler: IEnemyHandler<TEnemy, unknown>,
        baseEnemy: IReadonlyEnemy<TEnemy>
    ): void;

    /**
     * 对指定怪物对象添加特殊属性修饰器
     * @param handler 信息对象
     * @param baseEnemy 原始怪物对象，即未进行任何修改的怪物对象
     */
    applySpecial(
        handler: IEnemyHandler<TEnemy, unknown>,
        baseEnemy: IReadonlyEnemy<TEnemy>
    ): IEnemySpecialModifier<TEnemy> | null;
}

export interface IEnemyAuraView<TEnemy, TRange, TSpecial> extends IAuraView<
    TEnemy,
    TRange
> {
    /** 此光环视图所属的怪物 */
    readonly enemy: IReadonlyEnemy<TEnemy>;
    /** 此光环视图所属的特殊属性 */
    readonly special: ISpecial<TSpecial>;
    /** 此光环视图所属怪物的定位符 */
    readonly locator: ITileLocator;
}

export interface IAuraConverter<TEnemy, THero> {
    /**
     * 判断一个特殊属性是否应该被当前光环转换器执行转换
     * @param special 要转换的特殊属性
     * @param handler 信息对象
     */
    shouldConvert(
        special: ISpecial<any>,
        handler: IReadonlyEnemyHandler<TEnemy, THero>
    ): boolean;

    /**
     * 将一个特殊属性转换为光环视图
     */
    convert(
        special: ISpecial<any>,
        handler: IReadonlyEnemyHandler<TEnemy, THero>,
        context: IEnemyContext<TEnemy, THero>
    ): IEnemyAuraView<TEnemy, any, any>;
}

export interface IEnemySpecialQueryModifier<
    TEnemy,
    THero
> extends IEnemySpecialModifier<TEnemy> {
    /**
     * 判断一个怪物是否应该查询外部状态
     */
    shouldQuery(handler: IReadonlyEnemyHandler<TEnemy, THero>): boolean;
}

export interface IEnemySpecialQueryEffect<TEnemy, THero> {
    /** 效果优先级，与光环属性共用 */
    readonly priority: number;

    /**
     * 根据传入的怪物上下文，获取对应的怪物特殊属性修饰器
     */
    for(
        ctx: IEnemyContext<TEnemy, THero>
    ): IEnemySpecialQueryModifier<TEnemy, THero>;
}

export interface IEnemyCommonQueryEffect<TEnemy, THero> {
    /** 优先级，越高的越先执行 */
    readonly priority: number;

    /**
     * 对怪物的某个特殊属性施加常规查询效果
     */
    apply(
        handler: IEnemyHandler<TEnemy, THero>,
        special: ISpecial<any>,
        query: () => IEnemyContext<TEnemy, THero>
    ): void;
}

export interface IEnemyFinalEffect<TEnemy, THero> {
    /** 效果优先级，越高会越先被执行 */
    readonly priority: number;

    /**
     * 向怪物施加最终修饰效果
     */
    apply(handler: IEnemyHandler<TEnemy, THero>): void;
}

//#endregion

//#region 地图伤害

export interface IMapDamageInfoExtra {
    /** 捕捉怪物信息 */
    catch: Set<ITileLocator>;
    /** 阻击怪物信息 */
    repulse: Set<ITileLocator>;
}

export interface IMapDamageInfo {
    /** 伤害值 */
    damage: number;
    /** 伤害类型 */
    type: number;
    /** 地图伤害额外信息 */
    extra: IMapDamageInfoExtra;
}

export interface IMapDamageView<T = any> {
    /**
     * 获取地图伤害影响范围
     */
    getRange(): IRange<T>;

    /**
     * 获取范围参数
     */
    getRangeParam(): T;

    /**
     * 获取指定位置的地图伤害，会对坐标进行判断
     * @param locator 伤害位置
     */
    getDamageAt(locator: ITileLocator): Readonly<IMapDamageInfo> | null;

    /**
     * 获取指定位置的地图伤害，不会对坐标进行判断
     * @param locator 伤害位置
     */
    getDamageWithoutCheck(
        locator: ITileLocator
    ): Readonly<IMapDamageInfo> | null;
}

export interface IMapDamageConverter<TEnemy, THero> {
    /**
     * 转换地图伤害视图
     */
    convert(
        handler: IReadonlyEnemyHandler<TEnemy, THero>,
        context: IEnemyContext<TEnemy, THero>
    ): IMapDamageView<any>[];
}

export interface IMapDamageReducer {
    /**
     * 对伤害信息进行合并
     */
    reduce(
        info: Iterable<Readonly<IMapDamageInfo>>,
        locator: ITileLocator
    ): Readonly<IMapDamageInfo>;
}

export interface IMapDamage<TEnemy, THero> {
    /** 当前绑定的怪物上下文 */
    readonly context: IEnemyContext<TEnemy, THero>;
    /** 地图伤害系统绑定的全局状态对象 */
    readonly dataState: IStateBase<TEnemy, THero>;

    /**
     * 设置地图伤害转换器，并基于当前上下文重建所有地图伤害视图
     * @param converter 地图伤害转换器
     */
    useConverter(converter: IMapDamageConverter<TEnemy, THero>): void;

    /**
     * 设置地图伤害合并器
     * @param reducer 地图伤害合并器
     */
    useReducer(reducer: IMapDamageReducer): void;

    /**
     * 在指定位置添加一条无来源地图伤害
     * @param locator 地图定位符
     * @param info 地图伤害信息
     */
    addMapDamage(locator: ITileLocator, info: IMapDamageInfo): void;

    /**
     * 在指定位置删除一条无来源地图伤害
     * @param locator 地图定位符
     * @param info 地图伤害信息
     */
    deleteMapDamage(locator: ITileLocator, info: IMapDamageInfo): void;

    /**
     * 将指定位置标记为脏，后续访问时会重新计算该点的有来源伤害
     * @param locator 地图定位符
     */
    markDirty(locator: ITileLocator): void;

    /**
     * 将指定怪物对应的地图伤害标记为脏并刷新
     * @param view 怪物视图
     */
    markEnemyDirty(view: IEnemyView<TEnemy>): void;

    /**
     * 基于当前上下文重新刷新全部有来源地图伤害
     */
    refreshAll(): void;

    /**
     * 删除指定怪物带来的全部地图伤害来源
     * @param view 怪物视图
     */
    deleteEnemy(view: IEnemyView<TEnemy>): void;

    /**
     * 获取指定位置合并后的地图伤害
     * @param locator 地图定位符
     */
    getReducedDamage(locator: ITileLocator): Readonly<IMapDamageInfo> | null;

    /**
     * 获取指定位置未合并的地图伤害列表
     * @param locator 地图定位符
     */
    getSeparatedDamage(
        locator: ITileLocator
    ): Iterable<Readonly<IMapDamageInfo>>;
}

//#endregion

//#region 伤害系统

export interface IEnemyDamageInfo {
    /** 战斗伤害值 */
    readonly damage: number;
    /** 战斗回合数 */
    readonly turn: number;
}

export interface IEnemyCritical {
    /** 此临界点中指定勇士属性的值 */
    readonly nextValue: number;
    /** 当前勇士指定属性的值 */
    readonly baseValue: number;
    /** 此临界点中指定勇士数值的值与当前值的差，即 `nextValue - baseValue` */
    readonly nextDiff: number;
    /** 当前状态下怪物的伤害信息 */
    readonly baseInfo: IEnemyDamageInfo;
    /** 此临界点下怪物的伤害信息 */
    readonly info: IEnemyDamageInfo;
    /** 此临界点的伤害值与当前伤害值的差 */
    readonly damageDiff: number;
}

export type CriticalableHeroStatus<THero> = keyof {
    [P in keyof THero as THero[P] extends number ? P : never]: number;
};

export interface IDamageCalculator<TEnemy, THero> {
    /**
     * 计算战斗伤害信息
     * @param handler 信息对象
     */
    calculate(handler: IReadonlyEnemyHandler<TEnemy, THero>): IEnemyDamageInfo;

    /**
     * 获取临界计算的上界
     * @param handler 信息对象
     * @param attribute 勇士的临界属性
     */
    getCriticalLimit(
        handler: IReadonlyEnemyHandler<TEnemy, THero>,
        attribute: CriticalableHeroStatus<THero>
    ): number;
}

export interface IDamageContext<TEnemy, THero> {
    /** 伤害上下文所属的全局状态对象 */
    readonly dataState: IStateBase<TEnemy, THero>;

    /**
     * 获取战斗伤害信息
     * @param enemy 怪物视图
     */
    getDamageInfo(enemy: IEnemyView<TEnemy>): IEnemyDamageInfo | null;

    /**
     * 根据怪物对象获取战斗伤害信息
     * @param enemy 怪物对象
     */
    getDamageInfoByComputed(
        enemy: IReadonlyEnemy<TEnemy>
    ): IEnemyDamageInfo | null;

    /**
     * 计算怪物在指定勇士属性下的临界
     * @param enemy 怪物视图
     * @param attribute 计算临界的目标勇士属性，比如计算攻击临界、自定义属性的临界等等
     * @param precision 临界计算精度，表示会进行多少次二分计算，一般填写 `12-16` 之间的数即可，默认是 12
     */
    calculateCritical(
        enemy: IEnemyView<TEnemy>,
        attribute: CriticalableHeroStatus<THero>,
        precision?: number
    ): Generator<IEnemyCritical, void, void>;
}

export interface IDamageSystem<TEnemy, THero> extends IDamageContext<
    TEnemy,
    THero
> {
    /** 伤害系统所属的上下文 */
    readonly context: IEnemyContext<TEnemy, THero>;

    /**
     * 设置当前伤害计算系统使用的伤害计算器
     * @param calculator 伤害计算器
     */
    useCalculator(calculator: IDamageCalculator<TEnemy, THero>): void;

    /**
     * 获取当前使用的伤害计算器
     */
    getCalculator(): IDamageCalculator<TEnemy, THero> | null;

    /**
     * 绑定勇士信息
     * @param hero 勇士信息
     */
    bindHeroStatus(hero: IReadonlyHeroAttribute<THero> | null): void;

    /**
     * 将指定的怪物标记为脏
     * @param enemy 怪物视图
     */
    markDirty(enemy: IEnemyView<TEnemy>): void;

    /**
     * 删除指定的怪物
     * @param enemy 怪物视图
     */
    deleteEnemy(enemy: IEnemyView<TEnemy>): void;

    /**
     * 将所有怪物标记为脏
     */
    markAllDirty(): void;

    /**
     * 修改勇士属性，然后返回修改后勇士属性所组成的计算对象，不影响当前伤害系统的状态
     * @param modify 勇士修改函数
     */
    with(hero: IHeroAttribute<THero>): IDamageContext<TEnemy, THero>;
}

//#endregion

//#region 上下文

export interface IEnemyContext<TEnemy, THero> {
    /** 怪物上下文宽度 */
    readonly width: number;
    /** 怪物上下文高度 */
    readonly height: number;
    /** 此上下文使用的索引对象 */
    readonly indexer: ILocationHelper;
    /** 当前怪物上下文绑定的全局状态对象 */
    readonly dataState: IStateBase<TEnemy, THero>;

    /**
     * 调整上下文尺寸，并清空当前上下文中的所有怪物与状态
     * @param width 地图宽度
     * @param height 地图高度
     */
    resize(width: number, height: number): void;

    /**
     * 注册一个光环转换器
     * @param converter 光环转换器
     */
    registerAuraConverter(converter: IAuraConverter<TEnemy, THero>): void;

    /**
     * 注销一个光环转换器
     * @param converter 光环转换器
     */
    unregisterAuraConverter(converter: IAuraConverter<TEnemy, THero>): void;

    /**
     * 设置光环转换器的启用状态
     * @param converter 光环转换器
     * @param enabled 是否启用
     */
    setAuraConverterEnabled(
        converter: IAuraConverter<TEnemy, THero>,
        enabled: boolean
    ): void;

    /**
     * 注册一个特殊属性查询效果
     * @param effect 特殊属性查询效果
     */
    registerSpecialQueryEffect(
        effect: IEnemySpecialQueryEffect<TEnemy, THero>
    ): void;

    /**
     * 注销一个特殊属性查询效果
     * @param effect 特殊属性查询效果
     */
    unregisterSpecialQueryEffect(
        effect: IEnemySpecialQueryEffect<TEnemy, THero>
    ): void;

    /**
     * 为指定特殊属性代码注册常规查询效果
     * @param code 特殊属性代码
     * @param effect 常规查询效果
     */
    registerCommonQueryEffect(
        code: number,
        effect: IEnemyCommonQueryEffect<TEnemy, THero>
    ): void;

    /**
     * 注销指定特殊属性代码上的常规查询效果
     * @param code 特殊属性代码
     * @param effect 常规查询效果
     */
    unregisterCommonQueryEffect(
        code: number,
        effect: IEnemyCommonQueryEffect<TEnemy, THero>
    ): void;

    /**
     * 注册一个最终效果
     * @param effect 最终效果
     */
    registerFinalEffect(effect: IEnemyFinalEffect<TEnemy, THero>): void;

    /**
     * 注销一个最终效果
     * @param effect 最终效果
     */
    unregisterFinalEffect(effect: IEnemyFinalEffect<TEnemy, THero>): void;

    /**
     * 绑定勇士对象
     * @param hero 勇士属性对象
     */
    bindHero(hero: IReadonlyHeroAttribute<THero> | null): void;

    /**
     * 获取当前绑定的勇士属性对象
     */
    getBindedHero(): IReadonlyHeroAttribute<THero> | null;

    /**
     * 获取指定怪物对象当前所在位置
     * @param enemy 怪物对象
     */
    getEnemyLocator(enemy: IEnemy<TEnemy>): Readonly<ITileLocator> | null;

    /**
     * 获取指定怪物视图当前所在位置
     * @param view 怪物视图
     */
    getEnemyLocatorByView(
        view: IEnemyView<TEnemy>
    ): Readonly<ITileLocator> | null;

    /**
     * 根据定位符获取怪物视图
     * @param locator 地图定位符
     */
    getEnemyByLocator(locator: ITileLocator): IEnemyView<TEnemy> | null;

    /**
     * 根据坐标获取怪物视图
     * @param x 横坐标
     * @param y 纵坐标
     */
    getEnemyByLoc(x: number, y: number): IEnemyView<TEnemy> | null;

    /**
     * 根据计算后怪物对象反查怪物视图
     * @param enemy 计算后怪物对象
     */
    getViewByComputed(enemy: IReadonlyEnemy<TEnemy>): IEnemyView<TEnemy> | null;

    /**
     * 在指定位置放置一个怪物对象
     * @param locator 地图定位符
     * @param enemy 怪物对象
     */
    setEnemyAt(locator: ITileLocator, enemy: IEnemy<TEnemy>): void;

    /**
     * 删除指定位置的怪物
     * @param locator 地图定位符
     */
    deleteEnemy(locator: ITileLocator): void;

    /**
     * 扫描指定范围内的怪物视图
     * @param range 范围对象
     * @param param 范围参数
     */
    scanRange<T>(
        range: IRange<T>,
        param: T
    ): Iterable<[ITileLocator, IEnemyView<TEnemy>]>;

    /**
     * 迭代上下文中的全部怪物
     */
    iterateEnemy(): Iterable<[ITileLocator, IEnemyView<TEnemy>]>;

    /**
     * 添加一个全局光环视图
     * @param aura 光环视图
     */
    addAura(aura: IAuraView<TEnemy>): void;

    /**
     * 删除一个全局光环视图
     * @param aura 光环视图
     */
    deleteAura(aura: IAuraView<TEnemy>): void;

    /**
     * 绑定地图伤害管理器
     * @param damage 地图伤害管理器
     */
    attachMapDamage(damage: IMapDamage<TEnemy, THero> | null): void;

    /**
     * 获取当前绑定的地图伤害管理器
     */
    getMapDamage(): IMapDamage<TEnemy, THero> | null;

    /**
     * 绑定伤害计算系统
     * @param system 伤害系统
     */
    attachDamageSystem(system: IDamageSystem<TEnemy, unknown> | null): void;

    /**
     * 获取当前绑定的伤害计算系统
     */
    getDamageSystem(): IDamageSystem<TEnemy, THero> | null;

    /**
     * 重建当前上下文中的全部怪物计算结果
     *
     * 1. 对所有光环及特殊查询进行构建操作，这一步中会决定每个怪物所拥有的特殊属性，后续不会变动
     * 2. 执行所有的普通光环效果，修改怪物的基础属性
     * 3. 执行常规查询效果，允许查询上下文状态并修改怪物自身的基础属性
     * 4. 执行最终效果，不允许查询上下文状态，仅允许修改怪物自身的基础属性
     */
    buildup(): void;

    /**
     * 将指定怪物视图标记为脏
     * @param view 怪物视图
     */
    markDirty(view: IEnemyView<TEnemy>): void;

    /**
     * 申请刷新指定怪物视图
     * @param view 怪物视图
     */
    requestRefresh(view: IEnemyView<TEnemy>): void;

    /**
     * 清空当前上下文中的所有对象与运行状态
     */
    clear(): void;

    /**
     * 销毁当前上下文
     */
    destroy(): void;
}

//#endregion
