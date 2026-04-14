import { IRange } from '@motajs/common';
import { ITileLocator } from '@user/types';

export interface IEnemyAttributes {
    /** 怪物生命值 */
    hp: number;
    /** 怪物攻击力 */
    atk: number;
    /** 怪物防御力 */
    def: number;
    /** 怪物金币 */
    money: number;
    /** 怪物经验值 */
    exp: number;
    /** 怪物加点量 */
    point: number;
}

export interface ISpecial<T = void> {
    /** 特殊属性代码 */
    readonly code: number;
    /** 特殊属性需要的数值 */
    readonly value: T;

    /**
     * 设置特殊属性数值
     * @param value 特殊属性数值
     */
    setValue(value: T): void;

    /**
     * 获取特殊属性数值
     */
    getValue(): T;

    /**
     * 获取此特殊属性的名称
     */
    getSpecialName(): string;

    /**
     * 获取此特殊属性的描述
     */
    getDescription(): string;

    /**
     * 从旧样板的怪物对象中导入此特殊属性
     * @param enemy 旧样板怪物对象
     */
    fromLegacyEnemy(enemy: Enemy): void;

    /**
     * 深拷贝此特殊属性
     */
    clone(): ISpecial<T>;
}

export interface IReadonlyEnemy {
    /** 怪物标识符 */
    readonly id: string;
    /** 怪物在地图上的标识数字 */
    readonly code: number;

    /**
     * 根据特殊属性代码获取对应的对象
     * @param code 特殊属性代码
     */
    getSpecial<T>(code: number): ISpecial<T> | null;

    /**
     * 判断怪物是否拥有指定属性
     * @param code 特殊属性代码
     */
    hasSpecial(code: number): boolean;

    /**
     * 迭代此怪物所包含的所有特殊属性
     */
    iterateSpecials(): Iterable<ISpecial<any>>;

    /**
     * 获取怪物属性值
     * @param key 属性名称
     */
    getAttribute<K extends keyof IEnemyAttributes>(key: K): IEnemyAttributes[K];

    /**
     * 深拷贝此怪物对象
     */
    clone(): IReadonlyEnemy;
}

export interface IEnemy extends IReadonlyEnemy {
    /** 怪物标识符 */
    readonly id: string;
    /** 怪物在地图上的标识数字 */
    readonly code: number;
    /** 怪物属性值 */
    readonly attributes: Readonly<IEnemyAttributes>;
    /** 怪物拥有的特殊属性列表 */
    readonly specials: Set<ISpecial<any>>;

    /**
     * 添加特殊属性
     * @param special 特殊属性对象
     */
    addSpecial(special: ISpecial<any>): void;

    /**
     * 删除指定的特殊属性
     * @param special 特殊属性代码或对象
     */
    deleteSpecial(special: number | ISpecial<any>): void;

    /**
     * 设置怪物属性值
     * @param key 属性名称
     * @param value 新的属性值
     */
    setAttribute<K extends keyof IEnemyAttributes>(
        key: K,
        value: IEnemyAttributes[K]
    ): void;

    /**
     * 深拷贝此怪物对象
     */
    clone(): IEnemy;

    /**
     * 从一个怪物对象中将属性复制到当前对象
     * @param enemy 怪物对象
     */
    copy(enemy: IReadonlyEnemy): void;
}

export type SpecialCreation<T> = (enemy: IEnemy) => ISpecial<T>;

export interface IEnemyManager {
    /**
     * 注册一个特殊属性
     * @param code 特殊属性代码
     * @param cons 特殊属性创建函数
     */
    registerSpecial(code: number, cons: SpecialCreation<any>): void;

    /**
     * 注册一个怪物属性
     * @param name 属性名称
     * @param defaultValue 属性默认值
     */
    registerAttribute(name: string, defaultValue: any): void;

    /**
     * 根据旧样板怪物对象生成一个新的怪物对象
     * @param enemy 旧样板怪物对象
     */
    fromLegacyEnemy(enemy: Enemy): IEnemy;

    /**
     * 创建怪物对象，如果对应数字的怪物不存在则会返回 `null`
     * @param code 怪物图块数字
     */
    createEnemy(code: number): IEnemy | null;

    /**
     * 根据怪物的 `id` 创建怪物对象，如果对应的怪物不存在则会返回 `null`
     * @param id 怪物 `id`
     */
    createEnemyById(id: string): IEnemy | null;

    /**
     * 添加怪物模板，如果 `id` 或 `code` 与已有的冲突，则不会做任何操作，
     * 如果需要修改怪物模板，请使用 {@link changePrefab}
     * @param enemy 怪物对象
     */
    addPrefab(enemy: IEnemy): void;

    /**
     * 从旧样板的怪物对象中添加怪物模板
     * @param code 怪物对象对应的图块数字
     * @param enemy 旧样板怪物对象
     */
    addPrefabFromLegacy(code: number, enemy: Enemy): void;

    /**
     * 获取指定怪物的模板
     * @param code 怪物图块数字
     */
    getPrefab(code: number): IEnemy | null;

    /**
     * 根据怪物的 `id` 获取对应的怪物模板
     * @param id 怪物 `id`
     */
    getPrefabById(id: string): IEnemy | null;

    /**
     * 删除指定的怪物模板
     * @param code 怪物的图块数字或 `id`
     */
    deletePrefab(code: number | string): void;

    /**
     * 修改一个已有的怪物模板，如果不存在则会新增
     * @param code 怪物的图块数字或 `id`
     * @param enemy 新的怪物模板
     */
    changePrefab(code: number | string, enemy: IEnemy): void;
}

//#region 辅助接口

export interface IMapLocHelper {
    /**
     * 坐标 -> 索引
     * @param x 横坐标
     * @param y 纵坐标
     */
    locToIndex(x: number, y: number): number;

    /**
     * 定位符 -> 索引
     * @param locator 定位符
     */
    locaterToIndex(locator: ITileLocator): number;

    /**
     * 索引 -> 定位符
     * @param index 索引
     */
    indexToLocator(index: number): ITileLocator;
}

export interface IMapLocIndexer extends IMapLocHelper {
    /**
     * 设置地图宽度
     * @param width 地图宽度
     */
    setWidth(width: number): void;
}

//#endregion

//#region 怪物对象

export interface IEnemyView {
    /** 怪物视图所属的上下文 */
    readonly context: IEnemyContext;

    /**
     * 重置此怪物视图的状态，将计算后怪物对象恢复至初始状态
     */
    reset(): void;

    /**
     * 获取基本怪物对象
     */
    getBaseEnemy(): IReadonlyEnemy;

    /**
     * 获取计算后的怪物对象，返回的怪物对象同引用
     */
    getComputedEnemy(): IReadonlyEnemy;

    /**
     * 获取可修改的怪物对象。如果修改此方法获取的怪物对象，那么怪物的真实信息是不会刷新的，
     * 需要手动调用 markDirty 方法来刷新。
     */
    getModifiableEnemy(): IEnemy;

    /**
     * 将此怪物标记为脏，需要更新
     */
    markDirty(): void;
}

//#endregion

//#region 光环与查询

export interface IEnemySpecialModifier {
    /**
     * 获取要添加到指定怪物身上的特殊属性
     * @param enemy 怪物对象
     * @param locator 怪物定位符
     */
    add(enemy: IReadonlyEnemy, locator: ITileLocator): ISpecial<any>[];

    /**
     * 获取制定怪物身上要删除的特殊属性
     * @param enemy 怪物对象
     * @param locator 怪物定位符
     */
    delete(enemy: IReadonlyEnemy, locator: ITileLocator): ISpecial<any>[];

    /**
     * 修改一个怪物的特殊属性，如果真正进行了修改则返回 true，否则返回 false
     * @param enemy 怪物对象
     * @param special 要修改的怪物特殊属性
     * @param locator 怪物定位符
     */
    modify(
        enemy: IReadonlyEnemy,
        special: ISpecial<any>,
        locator: ITileLocator
    ): boolean;
}

export interface IAuraView<T = any> {
    /** 此光环视图的优先级 */
    readonly priority: number;
    /** 此光环视图的影响范围 */
    readonly range: IRange<T>;

    /** 这个光环视图是否有可能修改怪物的基本属性 */
    readonly couldApplyBase: boolean;
    /** 这个光环视图是否有可能修改怪物的特殊属性 */
    readonly couldApplySpecial: boolean;

    /**
     * 获取范围扫描参数
     */
    getRangeParam(): T;

    /**
     * 对指定怪物对象施加修饰器
     * @param enemy 怪物对象
     * @param locator 怪物定位符
     */
    apply(
        enemy: IEnemy,
        baseEnemy: IReadonlyEnemy,
        locator: ITileLocator
    ): void;

    /**
     * 对指定怪物对象添加特殊属性修饰器
     * @param enemy 怪物对象
     * @param locator 怪物定位符
     */
    applySpecial(
        enemy: IReadonlyEnemy,
        baseEnemy: IReadonlyEnemy,
        locator: ITileLocator
    ): IEnemySpecialModifier | null;
}

export interface IEnemyAuraView<T, S> extends IAuraView<T> {
    /** 此光环视图所属的怪物 */
    readonly enemy: IReadonlyEnemy;
    /** 此光环视图所属的特殊属性 */
    readonly special: ISpecial<S>;
    /** 此光环视图所属怪物的定位符 */
    readonly locator: ITileLocator;
}

export interface IAuraConverter {
    /**
     * 判断一个特殊属性是否应该被当前光环转换器执行转换
     */
    shouldConvert(
        special: ISpecial<any>,
        enemy: IReadonlyEnemy,
        locator: ITileLocator
    ): boolean;

    /**
     * 将一个特殊属性转换为光环视图
     */
    convert(
        special: ISpecial<any>,
        enemy: IReadonlyEnemy,
        locator: ITileLocator
    ): IEnemyAuraView<any, any>;
}

export interface IEnemySpecialQueryModifier extends IEnemySpecialModifier {
    /**
     * 判断一个怪物是否应该查询外部状态
     */
    shouldQuery(enemy: IReadonlyEnemy, locator: ITileLocator): boolean;
}

export interface IEnemySpecialQueryEffect {
    /** 效果优先级，与光环属性共用 */
    readonly priority: number;

    /**
     * 根据传入的怪物上下文，获取对应的怪物特殊属性修饰器
     */
    for(ctx: IEnemyContext): IEnemySpecialQueryModifier;
}

export interface IEnemyCommonQueryEffect {
    /** 优先级，越高的越先执行 */
    readonly priority: number;

    /**
     * 对怪物的某个特殊属性施加常规查询效果
     */
    apply(
        enemy: IEnemy,
        special: ISpecial<any>,
        query: () => IEnemyContext,
        locator: ITileLocator
    ): void;
}

export interface IEnemyFinalEffect {
    /** 效果优先级，越高会越先被执行 */
    readonly priority: number;

    /**
     * 向怪物施加最终修饰效果
     */
    apply(enemy: IEnemy, locator: ITileLocator): void;
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
    /** 获取地图伤害影响范围 */
    getRange(): IRange<T>;

    /** 获取范围参数 */
    getRangeParam(): T;

    /**
     * 获取指定位置的地图伤害，会对坐标进行判断
     * @param locator 伤害位置
     */
    getDamageAt(locator: ITileLocator): Readonly<IMapDamageInfo> | null;

    /**
     * 获取指定位置的地图伤害，但是不会对坐标进行判断
     * @param locator 伤害位置
     */
    getDamageWithoutCheck(
        locator: ITileLocator
    ): Readonly<IMapDamageInfo> | null;
}

export interface IMapDamageConverter {
    /** 转换地图伤害视图 */
    convert(
        enemy: IReadonlyEnemy,
        locator: ITileLocator,
        context: IEnemyContext
    ): IMapDamageView<any>[];
}

export interface IMapDamageReducer {
    /** 对伤害信息进行合并 */
    reduce(
        info: Iterable<Readonly<IMapDamageInfo>>,
        locator: ITileLocator
    ): Readonly<IMapDamageInfo>;
}

export interface IMapDamage {
    /** 当前绑定的怪物上下文 */
    readonly context: IEnemyContext;

    /**
     * 设置地图伤害转换器，并基于当前上下文重建所有地图伤害视图
     * @param converter 地图伤害转换器
     */
    useConverter(converter: IMapDamageConverter): void;

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
    markEnemyDirty(view: IEnemyView): void;

    /**
     * 基于当前上下文重新刷新全部有来源地图伤害
     */
    refreshAll(): void;

    /**
     * 删除指定怪物带来的全部地图伤害来源
     * @param view 怪物视图
     */
    deleteEnemy(view: IEnemyView): void;

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

//#region 上下文

export interface IEnemyContext {
    /** 怪物上下文宽度 */
    readonly width: number;
    /** 怪物上下文高度 */
    readonly height: number;

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
    registerAuraConverter(converter: IAuraConverter): void;

    /**
     * 注销一个光环转换器
     * @param converter 光环转换器
     */
    unregisterAuraConverter(converter: IAuraConverter): void;

    /**
     * 设置光环转换器的启用状态
     * @param converter 光环转换器
     * @param enabled 是否启用
     */
    setAuraConverterEnabled(converter: IAuraConverter, enabled: boolean): void;

    /**
     * 注册一个特殊属性查询效果
     * @param effect 特殊属性查询效果
     */
    registerSpecialQueryEffect(effect: IEnemySpecialQueryEffect): void;

    /**
     * 注销一个特殊属性查询效果
     * @param effect 特殊属性查询效果
     */
    unregisterSpecialQueryEffect(effect: IEnemySpecialQueryEffect): void;

    /**
     * 为指定特殊属性代码注册常规查询效果
     * @param code 特殊属性代码
     * @param effect 常规查询效果
     */
    registerCommonQueryEffect(
        code: number,
        effect: IEnemyCommonQueryEffect
    ): void;

    /**
     * 注销指定特殊属性代码上的常规查询效果
     * @param code 特殊属性代码
     * @param effect 常规查询效果
     */
    unregisterCommonQueryEffect(
        code: number,
        effect: IEnemyCommonQueryEffect
    ): void;

    /**
     * 注册一个最终效果
     * @param effect 最终效果
     */
    registerFinalEffect(effect: IEnemyFinalEffect): void;

    /**
     * 注销一个最终效果
     * @param effect 最终效果
     */
    unregisterFinalEffect(effect: IEnemyFinalEffect): void;

    /**
     * 获取指定怪物对象当前所在位置
     * @param enemy 怪物对象
     */
    getEnemyLocator(enemy: IEnemy): Readonly<ITileLocator> | null;

    /**
     * 获取指定怪物视图当前所在位置
     * @param view 怪物视图
     */
    getEnemyLocatorByView(view: IEnemyView): Readonly<ITileLocator> | null;

    /**
     * 根据定位符获取怪物视图
     * @param locator 地图定位符
     */
    getEnemyByLocator(locator: ITileLocator): IEnemyView | null;

    /**
     * 根据坐标获取怪物视图
     * @param x 横坐标
     * @param y 纵坐标
     */
    getEnemyByLoc(x: number, y: number): IEnemyView | null;

    /**
     * 根据计算后怪物对象反查怪物视图
     * @param enemy 计算后怪物对象
     */
    getViewByComputed(enemy: IReadonlyEnemy): IEnemyView | null;

    /**
     * 在指定位置放置一个怪物对象
     * @param locator 地图定位符
     * @param enemy 怪物对象
     */
    setEnemyAt(locator: ITileLocator, enemy: IEnemy): void;

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
    scanRange<T>(range: IRange<T>, param: T): Iterable<IEnemyView>;

    /**
     * 迭代上下文中的全部怪物
     */
    iterateEnemy(): Iterable<[ITileLocator, IEnemyView]>;

    /**
     * 添加一个全局光环视图
     * @param aura 光环视图
     */
    addAura(aura: IAuraView): void;

    /**
     * 删除一个全局光环视图
     * @param aura 光环视图
     */
    deleteAura(aura: IAuraView): void;

    /**
     * 绑定地图伤害管理器
     * @param damage 地图伤害管理器
     */
    attachMapDamage(damage: IMapDamage | null): void;

    /**
     * 获取当前绑定的地图伤害管理器
     */
    getMapDamage(): IMapDamage | null;

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
    markDirty(view: IEnemyView): void;

    /**
     * 申请刷新指定怪物视图
     * @param view 怪物视图
     */
    requestRefresh(view: IEnemyView): void;

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
