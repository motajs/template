import { ISaveableContent } from '../common';

//#region 怪物基础

/** 单个 IEnemy 的存档状态 */
export interface IEnemySaveState<TAttr> {
    /** 怪物属性的深拷贝 */
    readonly attrs: TAttr;
    /** 特殊属性按 code 映射，值为各 ISpecial.saveState() 的结果 */
    readonly specials: ReadonlyMap<number, unknown>;
}

/** IEnemyManager 的存档状态，只保存与参考状态不同的模板 */
export interface IEnemyManagerSaveState<TAttr> {
    /** code -> 变更后的 IEnemySaveState，仅包含脏模板 */
    readonly modified: ReadonlyMap<number, IEnemySaveState<TAttr>>;
}

export interface IEnemyComparer<TAttr> {
    /**
     * 比较两个怪物是否完全相同
     * @param enemyA 怪物 A
     * @param enemyB 怪物 B
     */
    compare(
        enemyA: IReadonlyEnemy<TAttr>,
        enemyB: IReadonlyEnemy<TAttr>
    ): boolean;
}

export interface ISpecial<T = void> extends ISaveableContent<T> {
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

    /**
     * 深度比较此特殊属性与另一特殊属性是否相同
     * @param other 另一特殊属性
     */
    deepEqualsTo(other: ISpecial<T>): boolean;
}

export interface IReadonlyEnemy<TAttr> {
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
    getAttribute<K extends keyof TAttr>(key: K): TAttr[K];

    /**
     * 深拷贝怪物属性并将其返回
     */
    cloneAttributes(): TAttr;

    /**
     * 深拷贝此怪物对象
     */
    clone(): IReadonlyEnemy<TAttr>;
}

export interface IEnemy<TAttr>
    extends IReadonlyEnemy<TAttr>, ISaveableContent<IEnemySaveState<TAttr>> {
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
    setAttribute<K extends keyof TAttr>(key: K, value: TAttr[K]): void;

    /**
     * 对一个数字类型的属性值进行增减操作
     * @param key 属性名称
     * @param value 要增加的属性值，可以是负值
     */
    addAttribute<K extends SelectKey<TAttr, number>>(
        key: K,
        value: number
    ): void;

    /**
     * 深拷贝此怪物对象
     */
    clone(): IEnemy<TAttr>;

    /**
     * 从一个怪物对象中将属性复制到当前对象
     * @param enemy 怪物对象
     */
    copyFrom(enemy: IReadonlyEnemy<TAttr>): void;
}

//#endregion

//#region 怪物管理器

export type SpecialCreation<T, TAttr> = (enemy: IEnemy<TAttr>) => ISpecial<T>;

export interface IEnemyLegacyBridge<TAttr> {
    /**
     * 从旧样板的怪物对象中获取其属性
     * @param enemy 旧样板怪物对象
     */
    fromLegacyEnemy(enemy: Enemy, defaultValue: Partial<TAttr>): TAttr;
}

export interface IEnemyManager<TAttr> extends ISaveableContent<
    IEnemyManagerSaveState<TAttr>
> {
    /**
     * 注册一个特殊属性
     * @param code 特殊属性代码
     * @param cons 特殊属性创建函数
     */
    registerSpecial(code: number, cons: SpecialCreation<any, TAttr>): void;

    /**
     * 注册一个怪物属性
     * @param name 属性名称
     * @param defaultValue 属性默认值
     */
    setAttributeDefaults<K extends keyof TAttr>(
        name: K,
        defaultValue: TAttr[K]
    ): void;

    /**
     * 根据旧样板怪物对象生成一个新的怪物对象
     * @param code 怪物数字
     * @param enemy 旧样板怪物对象
     */
    fromLegacyEnemy(code: number, enemy: Enemy): IEnemy<TAttr>;

    /**
     * 创建怪物对象，如果对应数字的怪物不存在则会返回 `null`
     * @param code 怪物图块数字
     */
    createEnemy(code: number): IEnemy<TAttr> | null;

    /**
     * 根据怪物的 `id` 创建怪物对象，如果对应的怪物不存在则会返回 `null`
     * @param id 怪物 `id`
     */
    createEnemyById(id: string): IEnemy<TAttr> | null;

    /**
     * 添加怪物模板，如果 `id` 或 `code` 与已有的冲突，则不会做任何操作，
     * 如果需要修改怪物模板，请使用 {@link changePrefab}
     * @param enemy 怪物对象
     */
    addPrefab(enemy: IEnemy<TAttr>): void;

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
    getPrefab(code: number): IReadonlyEnemy<TAttr> | null;

    /**
     * 根据怪物的 `id` 获取对应的怪物模板
     * @param id 怪物 `id`
     */
    getPrefabById(id: string): IReadonlyEnemy<TAttr> | null;

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
    changePrefab(code: number | string, enemy: IEnemy<TAttr>): void;

    /**
     * 让指定的怪物数字和怪物 id 复用指定的模板
     * @param source 怪物模板源
     * @param code 复用怪物数字
     * @param id 复用怪物 id
     */
    reusePrefab(source: number | string, code: number, id: string): void;

    /**
     * 设置参考快照，后续对模板的修改将与此比较以确定是否脏。
     * 非首次调用时会发出警告，但仍执行覆盖
     * @param reference code -> 参考怪物的 Map
     */
    compareWith(reference: ReadonlyMap<number, IReadonlyEnemy<TAttr>>): void;

    /**
     * 修改指定怪物模板的属性，修改完成后自动与参考模板比较并更新 dirty 集合
     * @param code 怪物的图块数字或 `id`
     * @param modify 修改函数，传入可写怪物对象，返回修改后的对象
     */
    modifyPrefabAttribute(
        code: number | string,
        modify: (prefab: IEnemy<TAttr>) => IEnemy<TAttr>
    ): void;

    /**
     * 附加怪物比较器，用于 dirty 集合的判断
     * @param comparer 比较器对象
     */
    attachEnemyComparer(comparer: IEnemyComparer<TAttr>): void;

    /**
     * 获取当前附加的怪物比较器，如未设置则返回 `null`
     */
    getEnemyComparer(): IEnemyComparer<TAttr> | null;
}

//#endregion
