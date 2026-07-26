import {
    IFacedTileLocator,
    IHookBase,
    IHookable,
    ITileLocator
} from '@motajs/common';
import {
    FaceDirection,
    IDataCommonExtended,
    IFaceHandler,
    IItemRawData,
    IObjectMovable,
    IObjectMover,
    ISaveableContent
} from '@user/data-common';

//#region 勇士属性

export interface IHeroModifier<
    H = unknown, // 属性值类型
    V = unknown, // 修饰器参数类型
    Save = unknown // 存档类型
> extends ISaveableContent<Save> {
    /** 修饰器类型 */
    readonly type: string;
    /** 修饰器优先级 */
    readonly priority: number;
    /** 修饰器参数值 */
    readonly value: V;
    /** 当前修饰器所属的勇士属性对象 */
    readonly owner: IHeroAttribute<unknown> | null;

    /**
     * 设置修饰器参数值
     * @param value 参数值
     */
    setValue(value: V): void;

    /**
     * 获取修饰器参数值
     */
    getValue(): V;

    /**
     * 绑定勇士属性对象
     * @param attribute 勇士属性对象
     */
    bindAttribute(attribute: IHeroAttribute<unknown> | null): void;

    /**
     * 对指定属性值进行修改
     * @param value 该属性值的当前属性值，即经过了优先级更高的修饰器修饰后的属性值
     * @param baseValue 该属性值的基础属性值
     * @param name 属性名称
     */
    modify(value: H, baseValue: H, name: PropertyKey): H;

    /**
     * 深拷贝此修饰器
     */
    clone(): IHeroModifier<H, V>;
}

export interface IModifierStateSave<THero> {
    /** 属性名称 */
    readonly name: keyof THero;
    /** 修饰器类型 */
    readonly type: string;
    /** 修饰器存档数据 */
    readonly state: unknown;
}

export interface IHeroAttributeCloneOption {
    /** 是否克隆属性修饰器，默认为 `true` */
    cloneModifier: boolean;
}

export interface IReadonlyHeroAttribute<THero> {
    /**
     * 获取勇士的基础属性，即未经过任何 Buff 或装备等加成的属性
     * @param name 属性名称
     */
    getBaseAttribute<K extends keyof THero>(name: K): THero[K];

    /**
     * 获取勇士的最终属性，即经过了 Buff 或装备等加成的属性
     * @param name 属性名称
     */
    getFinalAttribute<K extends keyof THero>(name: K): THero[K];

    /**
     * 将指定属性标记为脏
     * @param name 属性名称
     */
    markDirty(name: keyof THero): void;

    /**
     * 将指定属性修饰器标记为脏
     * @param modifier 属性修饰器
     */
    markModifierDirty(modifier: IHeroModifier): void;

    /**
     * 深拷贝此勇士属性对象
     * @param option 深拷贝选项
     */
    clone(
        option?: Readonly<Partial<IHeroAttributeCloneOption>>
    ): IHeroAttribute<THero>;

    /**
     * 获取此勇士属性对象的可修改副本，与 `clone()` 效果一致
     */
    getModifiableClone(): IHeroAttribute<THero>;

    /**
     * 转换为结构化对象
     */
    toStructured(): THero;

    /**
     * 遍历所有已挂载的属性修饰器
     */
    iterateModifiers(): Iterable<[PropertyKey, IHeroModifier]>;

    /**
     * 获取指定属性名称的所有修饰器
     * @param name 属性名称
     */
    getModifiers<K extends keyof THero>(
        name: K
    ): Iterable<IHeroModifier<THero[K]>>;

    /**
     * 获取指定修饰器的索引位置
     * @param modifier 修饰器对象
     */
    getModifierIndex(modifier: IHeroModifier): number;

    /**
     * 设置指定修饰器的存档状态
     * @param modifier 属性修饰器
     * @param save 不进入存档
     */
    setModifierSaveEnabled(modifier: IHeroModifier, save: boolean): void;

    /**
     * 获取指定修饰器的存档状态
     * @param modifier 属性修饰器
     */
    getModifierSaveEnabled(modifier: IHeroModifier): boolean;
}

export interface IHeroAttribute<THero> extends IReadonlyHeroAttribute<THero> {
    /**
     * 设置勇士的基础属性
     * @param name 属性名称
     * @param value 要设置为的值
     */
    set<K extends keyof THero>(name: K, value: THero[K]): void;

    /**
     * 增减勇士属性
     * @param name 属性名称
     * @param value 属性增减值
     */
    add(name: SelectKey<THero, number>, value: number): void;

    /**
     * 将勇士属性乘以某一个值
     * @param name 属性名称
     * @param value 属性乘数
     */
    mul(name: SelectKey<THero, number>, value: number): void;

    /**
     * 将勇士属性除以某一个值
     * @param name 属性名称
     * @param value 属性除数
     */
    div(name: SelectKey<THero, number>, value: number): void;

    /**
     * 向一个属性添加属性修饰器
     * @param name 属性名称
     * @param modifier 属性修饰器
     * @param save 是否进入存档，默认 true
     */
    addModifier<K extends keyof THero>(
        name: K,
        modifier: IHeroModifier<THero[K]>,
        save?: boolean
    ): void;

    /**
     * 删除指定的属性修饰器
     * @param name 属性名称
     * @param modifier 属性修饰器
     */
    deleteModifier<K extends keyof THero>(
        name: K,
        modifier: IHeroModifier<THero[K]>
    ): void;

    /**
     * 根据修饰器索引删除指定修饰器
     * @param name 属性名称
     * @param index 修饰器索引
     * @returns 被删除的修饰器
     */
    deleteModifierByIndex<K extends keyof THero>(
        name: K,
        index: number
    ): IHeroModifier<THero[K]> | null;

    /**
     * 获取勇士指定属性计算过程的可迭代对象，一般用于调试。
     * 此方法仅输出计算过程及结果，不会修改内部存储的最终属性。
     * @param name 属性名称
     */
    catchCalculateProgress<K extends keyof THero>(
        name: K
    ): Iterable<[IHeroModifier<THero[K]>, THero[K]]>;
}

//#endregion

//#region 勇士位置

export interface IHeroLocationHook extends IHookBase {
    /**
     * 当设置勇士位置时触发
     * @param x 设置为的横坐标
     * @param y 设置为的纵坐标
     */
    onSetPos?(x: number, y: number): void;

    /**
     * 当设置勇士所处楼层时触发
     * @param floorId 设置为的楼层 id，undefined 表示尚不处于任何楼层
     */
    onSetFloor?(floorId: string | undefined): void;
}

export interface IHeroLocationSave {
    /** 当前横坐标 */
    readonly x: number;
    /** 当前纵坐标 */
    readonly y: number;
    /** 当前朝向 */
    readonly direction: FaceDirection;
    /** 当前所在楼层 id，undefined 表示尚不处于任何楼层 */
    readonly floorId: string | undefined;
}

export interface IHeroLocation
    extends
        ISaveableContent<IHeroLocationSave>,
        IObjectMovable,
        IHookable<IHeroLocationHook>,
        IDataCommonExtended {
    /** 当前所在楼层 id，undefined 表示尚不处于任何楼层 */
    readonly floorId: string | undefined;
    /** 勇士的移动对象 */
    readonly mover: IHeroMover<this>;

    /**
     * 设置勇士所在的楼层 id，注意此方法会引起数据变化，但是不会产生楼层切换动画
     * @param floorId 目标楼层 id
     */
    setFloor(floorId: string | undefined): void;
}

//#endregion

//#region 勇士移动

export const enum HeroMoveCode {
    /** 正常移动 */
    Step,
    /** 移动被停止 */
    Stop,
    /** 不能移动，并撞击目标格触发器 */
    Hit,
    /** 不能移动，不触发触发器 */
    CannotMove
}

export interface IHeroMoveTopHandler extends IDataCommonExtended {
    /** 当前位置 */
    readonly currLoc: ITileLocator;
    /** 要移动至的位置 */
    readonly nextLoc: ITileLocator;
    /** 移动方向 */
    readonly direction: FaceDirection;
    /** 当前楼层 id */
    readonly floorId: string | undefined;
    /** 朝向管理对象 */
    readonly face: IFaceHandler<FaceDirection>;
}

export interface IHeroMoveTopImpl {
    /**
     * 检查目标位置是否在地图范围内
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 楼层 id
     */
    inBound(x: number, y: number, floorId: string | undefined): boolean;

    /**
     * 判断在指定楼层中，从指定坐标向指定方向移动一格是否可通行
     * @param handler 通行性检查对象
     */
    canPass(handler: IHeroMoveTopHandler): boolean;

    /**
     * 判断在指定楼层中，从指定坐标向指定方向移动时是否应该产生撞击，撞击将会触发目标位置的触发器
     * @param handler 通行性检查对象
     */
    shouldHit(handler: IHeroMoveTopHandler): boolean;

    /**
     * 勇士撞击某一个图块时执行的内容，一般用于触发目标位置的触发器
     * @param handler 撞击行为对象
     */
    hit(handler: IHeroMoveTopHandler): Promise<void>;
}

export interface IHeroMoverConfig {
    /** 是否不记录进路线系统 */
    noRoute: boolean;
    /** 是否忽略地形碰撞检测 */
    ignoreTerrain: boolean;
    /** 是否在特定时机触发自动存档 */
    autoSave: boolean;
    /** 是否允许到达地图外 */
    allowOutBound: boolean;
}

export interface IHeroMover<T extends IHeroLocation>
    extends IObjectMover<T>, IDataCommonExtended {
    /**
     * 配置本次移动的行为模式
     * @param config 配置对象，未传入的字段保持当前值
     */
    config(config: Partial<IHeroMoverConfig>): this;

    /**
     * 获取当前移动配置的只读快照
     */
    getConfig(): Readonly<IHeroMoverConfig>;

    /**
     * 设置勇士移动的顶层实现对象，主要用于进行各种判定与勇士行为
     * @param impl 顶层实现对象
     */
    useTopImplementation(impl: IHeroMoveTopImpl | null): void;
}

//#endregion

//#region 勇士渲染

export interface IHeroRenderingSave {
    /** 勇士的不透明度 */
    readonly alpha: number;
}

export interface IHeroRenderingHooks extends IHookBase {
    /**
     * 当勇士的不透明度被修改时触发
     * @param alpha 不透明度
     */
    onSetAlpha?(alpha: number): void;
}

export interface IHeroRendering
    extends
        ISaveableContent<IHeroRenderingSave>,
        IHookable<IHeroRenderingHooks>,
        IDataCommonExtended {
    /** 勇士的当前不透明度 */
    readonly alpha: number;

    /**
     * 设置勇士的不透明度
     * @param alpha 不透明度
     */
    setAlpha(alpha: number): void;
}

//#endregion

//#region 勇士跟随者

export interface IHeroFollowerSave {
    /** 跟随者图块数字 */
    readonly num: number;
    /** 跟随者渲染对象保存 */
    readonly rendering: IHeroRenderingSave;
    /** 跟随者位置保存 */
    readonly location: IHeroLocationSave;
}

export interface IHeroFollower
    extends ISaveableContent<IHeroFollowerSave>, IDataCommonExtended {
    /** 跟随者的图块数字 */
    readonly num: number;
    /** 跟随者的渲染信息对象 */
    readonly rendering: IHeroRendering;
    /** 跟随者的位置对象 */
    readonly location: IHeroLocation;

    /**
     * 获取下一个跟随者
     * @returns null 表示当前为最后一个
     */
    next(): IHeroFollower | null;

    /**
     * 获取上一个跟随者
     * @returns null 表示当前为第一个
     */
    last(): IHeroFollower | null;
}

export interface IHeroFollowersControllerHooks extends IHookBase {
    /**
     * 当添加跟随者时触发
     * @param follower 跟随者对象
     * @param index 添加的跟随者的索引
     */
    onAddFollower?(follower: IHeroFollower, index: number): void;

    /**
     * 当移除跟随者时触发
     * @param follower 跟随者对象
     * @param index 要移除的跟随者索引
     */
    onRemoveFollower?(follower: IHeroFollower, index: number): void;

    /**
     * 当聚集跟随者时触发
     * @param sync 是否为同步调用（即是否通过 `gatherFollowersSync` 触发）
     */
    onGatherFollowers?(sync: boolean): void;
}

export interface IHeroFollowersController
    extends IHookable<IHeroFollowersControllerHooks>, IDataCommonExtended {
    /**
     * 添加跟随者
     * @param num 跟随者的图块数字或图块 id
     */
    addFollower(num: number | string): IHeroFollower;

    /**
     * 根据跟随者的索引数字获取跟随者对象
     * @param index 跟随者的索引数字
     */
    getFollower(index: number): IHeroFollower | null;

    /**
     * 根据跟随者的图块数字或图块 id 获取所有符合的跟随者
     * @param num 跟随者的图块数字或图块 id
     * @returns 一个输出 [跟随者索引, 跟随者对象] 的迭代器
     */
    getFollowersById(num: number | string): Iterable<[number, IHeroFollower]>;

    /**
     * 获取勇士的所有跟随者
     */
    getAllFollowers(): IHeroFollower[];

    /**
     * 移除指定跟随者
     * @param index 跟随者索引
     */
    removeFollower(index: number): Promise<void>;

    /**
     * 移除所有的跟随者
     */
    removeAllFollowers(): Promise<void>;

    /**
     * 将所有跟随者聚集到勇士位置，并调整朝向为与勇士相同
     */
    gatherFollowers(): Promise<void>;

    /**
     * 立刻将所有跟随者聚集到勇士位置，并调整朝向为与勇士相同，不会播放移动动画
     */
    gatherFollowersSync(): void;
}

//#endregion

//#region 勇士道具

export interface IHeroItemSave {
    /** 道具图块数字 */
    readonly num: number;
    /** 道具持有数量 */
    readonly count: number;
}

export interface IHeroItemsSave<THero> {
    /** 永久道具存档 */
    readonly constants: readonly IHeroItemSave[];
    /** 消耗道具存档 */
    readonly consumables: readonly IHeroItemSave[];
    /** 装备实例仓库存档 */
    readonly equipStore: IHeroEquipsStoreSave<THero>;
}

export interface IHeroItemState<THero> {
    /** 道具字符串 id */
    readonly id: string;
    /** 道具图块数字 */
    readonly num: number;
    /** 道具原始定义数据引用 */
    readonly raw: IItemRawData<THero>;
    /** 道具持有数量 */
    count: number;
}

export interface IHeroItems<THero>
    extends ISaveableContent<IHeroItemsSave<THero>>, IDataCommonExtended {
    /** 勇士装备实例存储 */
    readonly equipment: IHeroEquipsStore<THero>;

    /**
     * 增加道具数量，count 可以填负数。当道具为 `Pick` 类型时会立刻执行其效果。
     * @param item 道具图块数字或字符串 id
     * @param count 要增加的数量，默认为 1
     */
    addItem(item: number | string, count?: number): void;

    /**
     * 勇士获取指定道具，当道具为 `Pick` 类型时会立刻执行其效果，否则使背包中的数量加一。
     * 是 `addItem(item, 1)` 的另一种写法。
     * @param item 带锯图块数字或 id
     */
    getItem(item: number | string): void;

    /**
     * 获取指定道具的状态
     * @param item 道具图块数字或字符串 id
     */
    getItemState(item: number | string): Readonly<IHeroItemState<THero>> | null;

    /**
     * 使用道具，仅对 Constant 与 Consumable 类型生效。Consumable 类型使用后数量减一。
     * @param item 道具图块数字或字符串 id
     * @returns 道具是否使用成功
     */
    useItem(item: number | string): boolean;

    /**
     * 获取指定道具的持有数量
     * @param item 道具图块数字或字符串 id
     */
    itemCount(item: number | string): number;
}

//#endregion

//#region 勇士装备

export interface IEquipmentStateSave<THero> {
    /** 装备实例 uid */
    readonly uid: number;
    /** 装备道具图块数字 */
    readonly num: number;
    /** 当前数值加成 */
    readonly value: Map<SelectKey<THero, number>, number>;
    /** 当前百分比加成 */
    readonly percentage: Map<SelectKey<THero, number>, number>;
}

export interface IHeroEquipsStoreSave<THero> {
    /** 所有装备实例的存档 */
    readonly equipments: readonly IEquipmentStateSave<THero>[];
}

export interface IEquipmentState<THero> extends ISaveableContent<
    IEquipmentStateSave<THero>
> {
    /** 装备实例 uid */
    readonly uid: number;
    /** 装备的定义数据引用 */
    readonly item: IItemRawData<THero>;

    /**
     * 获取装备产生的所有修饰器，每个元素为 [属性名, 修饰器]
     */
    getModifiers(): Iterable<[SelectKey<THero, number>, IHeroModifier<number>]>;
}

export interface IEquipmentSortHandler<THero> extends IDataCommonExtended {
    /** 要排序的装备 A */
    readonly equipA: IEquipmentState<THero>;
    /** 要排序的装备 B */
    readonly equipB: IEquipmentState<THero>;
    /** 装备存储实例 */
    readonly store: IHeroEquipsStore<THero>;
}

export interface IEquipmentSorter<THero> {
    /**
     * 对比两个装备，返回哪个装备要排到更前面，即哪个装备更强。
     * 返回负值表示 `equipA` 排到前面，返回正值表示 `equipB` 排到前面，返回 0 表示按照装备实例的 `uid` 排序。
     * @param handler 装备排序信息对象
     */
    compare(handler: IEquipmentSortHandler<THero>): number;
}

export interface IHeroEquipsStore<THero>
    extends ISaveableContent<IHeroEquipsStoreSave<THero>>, IDataCommonExtended {
    /**
     * 获得一件装备道具，创建装备实例
     * @param item 道具图块数字或字符串 id
     * @returns 新分配的装备实例 uid
     */
    add(item: number | string): number;

    /**
     * 移除指定装备实例
     * @param uid 装备实例 uid
     */
    delete(uid: number): void;

    /**
     * 获取指定装备实例的状态，与当前是否装备无关
     * @param uid 装备实例 uid
     */
    get(uid: number): IEquipmentState<THero> | null;

    /**
     * 设置当前对象的装备排序器
     * @param comparer 装备排序器
     */
    useSorter(comparer: IEquipmentSorter<THero> | null): void;

    /**
     * 获取指定装备的所有装备实例，按照排序器的顺序进行排序，如没有排序器则按 `uid` 排序
     * @param equip 装备的图块数字或 id
     */
    instancesOf(equip: number | string): IEquipmentState<THero>[];

    /**
     * 获取当前的所有装备实例，按照排序器的顺序输出，如没有排序器则按 `uid` 排序
     */
    instances(): IEquipmentState<THero>[];

    /**
     * 获取指定类型装备的实例总数
     * @param item 道具图块数字或字符串 id
     */
    count(item: number | string): number;
}

export interface IHeroEquipmentSave {
    /** 当前已装备的 uid 映射 */
    readonly equipped: ReadonlyMap<number, number>;
    /** 当前装备槽数组 */
    readonly slots: readonly string[];
}

export const enum EquipStatus {
    /** 可以直接装备到目标装备栏 */
    CanEquip,
    /** 不能装备到目标装备栏 */
    CannotEquip,
    /** 需要将目标装备栏上的装备进行替换 */
    NeedReplace
}

export interface IHeroEquipment<THero>
    extends ISaveableContent<IHeroEquipmentSave>, IDataCommonExtended {
    /** 装备槽位数组，每一项字符串表示这一栏装备的名称，用于显示及装备槽匹配 */
    readonly slots: readonly string[];

    /**
     * 设置装备槽
     * @param slots 装备槽位数组
     */
    setSlots(slots: string[]): void;

    /**
     * 判断指定装备是否可以装备到指定装备槽
     * @param uid 装备实例的 uid
     * @param slot 要装备至的装备槽，可以是装备槽的索引，也可以是装备槽的名称
     */
    canEquipTo(uid: number, slot: number | string): EquipStatus;

    /**
     * 将指定装备穿上
     * @param uid 装备实例 uid
     * @param slot 要装备至的装备槽，可以是装备槽的索引，也可以是装备槽的名称
     * @param autoUnload 当要装备的装备已经处于某个装备槽，是否自动将其卸下，默认为 `true`
     * @returns 被卸下的装备实例 uid，如果没有装备被卸下，那么为 `undefined`
     */
    equip(
        uid: number,
        slot: number | string,
        autoUnload?: boolean
    ): number | undefined;

    /**
     * 将指定装备卸下
     * @param slot 要卸下的装备槽索引
     * @returns 被卸下的装备实例 uid，如果没有装备被卸下，那么为 `undefined`
     */
    unequip(slot: number): number | undefined;

    /**
     * 查询指定装备是否处于装备状态
     * @param uid 装备实例 uid
     */
    equipped(uid: number): boolean;

    /**
     * 获取指定装备槽索引位置的装备 uid
     * @param slot 要获取的装备槽索引
     */
    getEquipped(slot: number): number | undefined;

    /**
     * 获取所有已装备的实例，按照装备槽排序
     */
    getEquips(): (IEquipmentState<THero> | null)[];

    /**
     * 比较两个装备在指定槽位的表现，输出装备 A 时的属性减装备 B 时的属性
     * @param equipA 要比较的装备 A 的 uid
     * @param equipB 要比较的装备 B 的 uid
     * @param slot 要比较的装备槽索引
     */
    compareEquip(
        equipA: number,
        equipB: number,
        slot: number
    ): Readonly<Partial<THero>>;
}

//#endregion

//#region 勇士状态

export interface IHeroChangeFloorInfo {
    /** 要切换至的目标楼层 */
    readonly target: string;
    /** 要切换至的目标位置横坐标 */
    readonly x: number;
    /** 要切换至的目标位置纵坐标 */
    readonly y: number;
    /** 要切换至的目标朝向 */
    readonly face: FaceDirection;
}

export interface IHeroStateHook extends IHookBase {
    /**
     * 当勇士切换楼层前触发，此钩子执行完毕后会立刻触发 `IHeroLocation` 的 `onSetFloor` 钩子。
     * 此钩子应该用于切换楼层前的过渡及必要的数据准备，不应该修改勇士位置相关的数据。
     * @param info 勇士切换楼层信息对象
     */
    onBeforeChangeFloor?(info: IHeroChangeFloorInfo): Promise<void>;

    /**
     * 当勇士切换楼层后触发，此钩子会在 `IHeroLocation` 的 `onSetFloor` 钩子执行完毕后立刻触发。
     * 此钩子应该用于切换楼层后的过渡及必要的数据处理，不应该修改勇士位置相关的数据。
     * @param info 勇士切换楼层信息对象
     */
    onAfterChangeFloor?(info: IHeroChangeFloorInfo): Promise<void>;
}

export interface IHeroStateSave<THero> {
    /** 勇士属性状态 */
    readonly attribute: THero;
    /** 勇士当前位置 */
    readonly location: IHeroLocationSave;
    /** 勇士渲染状态 */
    readonly rendering: IHeroRenderingSave;
    /** 勇士当前的跟随者 */
    readonly followers: readonly IHeroFollowerSave[];
    /** 勇士属性修饰器状态 */
    readonly modifiers: readonly IModifierStateSave<THero>[];
    /** 勇士道具背包状态 */
    readonly items: IHeroItemsSave<THero>;
    /** 勇士装备状态 */
    readonly equip: IHeroEquipmentSave;
}

export interface IHeroState<THero>
    extends ISaveableContent<IHeroStateSave<THero>>, IHookable<IHeroStateHook> {
    /** 勇士移动对象 */
    readonly location: IHeroLocation;
    /** 勇士属性对象 */
    readonly attribute: IReadonlyHeroAttribute<THero>;
    /** 勇士跟随者对象 */
    readonly followers: IHeroFollowersController;
    /** 勇士的渲染对象，包含一些必要渲染信息，存在于数据端，并非渲染端 */
    readonly rendering: IHeroRendering;
    /** 勇士道具背包 */
    readonly items: IHeroItems<THero>;
    /** 勇士装备系统 */
    readonly equip: IHeroEquipment<THero>;

    /**
     * 获取勇士当前的位置
     */
    getLocation(): IFacedTileLocator;

    /**
     * 绑定勇士属性对象
     * @param attribute 勇士属性对象
     */
    attachAttribute(attribute: IHeroAttribute<THero>): void;

    /**
     * 获取可修改勇士对象
     */
    getModifiableAttribute(): IHeroAttribute<THero>;

    /**
     * 获取只读勇士对象
     */
    getAttribute(): IReadonlyHeroAttribute<THero>;

    /**
     * 获取独立勇士属性对象，修改此对象不会影响勇士本身的属性
     */
    getIsolatedAttribute(): IHeroAttribute<THero>;

    /**
     * 注册一个修饰器工厂函数
     * @param type 修饰器类型
     * @param cons 工厂函数
     */
    registerModifier(type: string, cons: () => IHeroModifier): void;

    /**
     * 创建指定类型的修饰器实例
     * @param type 修饰器类型
     */
    createModifier<T, V>(type: string): IHeroModifier<T, V> | null;

    /**
     * 创建指定类型的修饰器实例并插入至勇士属性对象
     * @param type 修饰器类型
     * @param name 属性名称
     */
    createAndInsertModifier<K extends keyof THero, V>(
        type: string,
        name: K
    ): IHeroModifier<THero[K], V> | null;

    /**
     * 切换勇士所在楼层
     * @param info 楼层切换信息对象
     */
    changeFloor(info: IHeroChangeFloorInfo): Promise<void>;
}

//#endregion
