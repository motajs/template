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
     * @param cloneModifier 是否同时复制修饰器，默认复制
     */
    clone(cloneModifier?: boolean): IReadonlyHeroAttribute<THero>;

    /**
     * 获取此勇士属性对象的可修改副本
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
    add<K extends SelectKey<THero, number>>(name: K, value: number): void;

    /**
     * 将勇士属性乘以某一个值
     * @param name 属性名称
     * @param value 属性乘数
     */
    mul<K extends SelectKey<THero, number>>(name: K, value: number): void;

    /**
     * 将勇士属性除以某一个值
     * @param name 属性名称
     * @param value 属性除数
     */
    div<K extends SelectKey<THero, number>>(name: K, value: number): void;

    /**
     * 向一个属性添加属性修饰器
     * @param name 属性名称
     * @param modifier 属性修饰器
     */
    addModifier<K extends keyof THero>(
        name: K,
        modifier: IHeroModifier<THero[K]>
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
     * 深拷贝此勇士属性对象
     * @param cloneModifier 是否同时复制修饰器，默认复制
     */
    clone(cloneModifier?: boolean): IHeroAttribute<THero>;

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
        IDataCommonExtended {
    /** 当前所在楼层 id，undefined 表示尚不处于任何楼层 */
    readonly floorId: string | undefined;
    /** 勇士的移动对象 */
    readonly mover: IObjectMover<this>;
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

export interface IHeroMoveHandlerBase extends IDataCommonExtended {
    /** 当前位置 */
    readonly currLoc: ITileLocator;
    /** 要移动至的位置 */
    readonly nextLoc: ITileLocator;
    /** 移动方向 */
    readonly direction: FaceDirection;
    /** 当前楼层 id */
    readonly floorId: string | undefined;
}

export interface IPassCheckerHandler extends IHeroMoveHandlerBase {
    /** 朝向管理对象 */
    readonly face: IFaceHandler<FaceDirection>;
}

export interface IHeroHitHandler extends IHeroMoveHandlerBase {}

export interface ITerrainPassChecker {
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
    canPass(handler: IPassCheckerHandler): boolean;

    /**
     * 判断在指定楼层中，从指定坐标向指定方向移动时是否应该产生撞击，撞击将会触发目标位置的触发器
     * @param handler 通行性检查对象
     */
    shouldHit(handler: IPassCheckerHandler): boolean;
}

export interface IHeroHitAction {
    /**
     * 勇士撞击某一个图块时执行的内容，一般用于触发目标位置的触发器
     * @param handler 撞击行为对象
     */
    hit(handler: IHeroHitHandler): Promise<void>;
}

export interface IHeroMoverConfig {
    /** 本次移动是否不记录进路线系统 */
    noRoute?: boolean;
    /** 本次移动是否忽略地形碰撞检测 */
    ignoreTerrain?: boolean;
    /** 本次移动是否在特定时机触发自动存档 */
    autoSave?: boolean;
}

export interface IHeroMover<T extends IHeroLocation>
    extends IObjectMover<T>, IDataCommonExtended {
    /**
     * 配置本次移动的行为模式
     * @param config 配置对象，未传入的字段保持当前值
     */
    config(config: Readonly<IHeroMoverConfig>): this;

    /**
     * 获取当前移动配置的只读快照
     */
    getConfig(): Readonly<IHeroMoverConfig>;

    /**
     * 设置地形通行判定器，传入 `null` 移表示移除
     * @param checker 地形判定器
     */
    useTerrainChecker(checker: ITerrainPassChecker | null): void;

    /**
     * 设置勇士撞击行为的执行对象，传入 `null` 表示移除。
     * @param action 撞击行为对象
     */
    useHitAction(action: IHeroHitAction | null): void;
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

//#region 勇士状态

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
}

export interface IHeroState<THero> extends ISaveableContent<
    IHeroStateSave<THero>
> {
    /** 勇士移动对象 */
    readonly location: IHeroLocation;
    /** 勇士属性对象 */
    readonly attribute: IReadonlyHeroAttribute<THero>;
    /** 勇士跟随者对象 */
    readonly followers: IHeroFollowersController;
    /** 勇士的渲染对象，包含一些必要渲染信息，存在于数据端，并非渲染端 */
    readonly rendering: IHeroRendering;

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
}

//#endregion
