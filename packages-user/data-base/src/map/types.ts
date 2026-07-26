import {
    IHookable,
    IHookBase,
    IHookController,
    ITileLocator
} from '@motajs/common';
import {
    FaceDirection,
    IDataCommonExtended,
    IMapBlockRawData,
    IMapRawData,
    IMoverController,
    IObjectMovable,
    IObjectMover,
    IRoleFaceBinder,
    ISaveableContent,
    ITileRawData
} from '@user/data-common';
import { ITileStore } from '@user/data-common';

//#region 静态图层

export interface IMapLayerData {
    /** 当前引用是否过期，当地图图层内部的地图数组引用更新时，此项会变为 `true` */
    expired: boolean;
    /** 地图图块数组，是对内部存储的直接引用，仅建议读取，不建议修改 */
    array: Uint32Array;
}

export interface ILayerLocation {
    /** 该点的位置 */
    readonly locator: ITileLocator;
    /** 该点的静态图块数字 */
    readonly tile: number;
    /** 该点的静态图块信息 */
    readonly raw: ITileRawData | null;
    /** 该点的静态触发器，-1 表示未设置（即使用图块本身的触发器），否则表示该点的静态触发器，覆盖图块本身的触发器 */
    readonly trigger: number;
    /** 该点包含的所有动态图块 */
    readonly dynamics: Iterable<IDynamicTile>;
    /** 该点的静态图块原始数据 */
    readonly block: IMapBlockRawData;
}

export interface IMapLayerHooks extends IHookBase {
    /**
     * 当地图大小发生变化时执行，如果调用了地图的 `resize` 方法，但是地图大小没变，则不会触发
     * @param width 地图宽度
     * @param height 地图高度
     */
    onResize(width: number, height: number): void;

    /**
     * 当更新某个区域的图块时执行
     * @param x 更新区域左上角横坐标
     * @param y 更新区域左上角纵坐标
     * @param width 更新区域宽度
     * @param height 更新区域高度
     */
    onUpdateArea(x: number, y: number, width: number, height: number): void;

    /**
     * 当更新某个点的图块时执行，如果设置的图块与原先一样，则不会触发此方法
     * @param block 更新为的图块数字
     * @param x 更新点横坐标
     * @param y 更新点纵坐标
     */
    onUpdateBlock(block: number, x: number, y: number): void;

    /**
     * 当开门时触发，返回一个 `Promise`，当相关动画执行完毕后兑现
     * @param x 门横坐标
     * @param y 门纵坐标
     */
    onOpenDoor(x: number, y: number): Promise<void>;

    /**
     * 当关门时触发，返回一个 `Promise`，当相关动画执行完毕后兑现
     * @param num 门的图块数字
     * @param x 门横坐标
     * @param y 门纵坐标
     */
    onCloseDoor(num: number, x: number, y: number): Promise<void>;
}

export interface IMapLayerHookController extends IHookController<IMapLayerHooks> {
    /** 拓展所属的图层对象 */
    readonly layer: IMapLayer;

    /**
     * 获取地图数据，是对内部存储的直接引用
     */
    getMapData(): Readonly<IMapLayerData>;
}

export interface IMapLayer
    extends
        IHookable<IMapLayerHooks, IMapLayerHookController>,
        IDataCommonExtended {
    /** 地图宽度 */
    readonly width: number;
    /** 地图高度 */
    readonly height: number;
    /**
     * 地图是否全部空白，此值具有充分性，但不具有必要性，
     * 即如果其为 `true`，则地图一定空白，但是如果其为 `false`，那么地图也有可能空白
     */
    readonly empty: boolean;
    /** 图层纵深 */
    readonly zIndex: number;

    /** 当前图层所属的地图状态对象 */
    readonly layerState: ILayerState;
    /** 此图层对应的动态图块图层，z 层级与静态图块一致 */
    readonly dynamicLayer: IDynamicLayer;

    /**
     * 判断指定坐标是否在地图内
     * @param x 横坐标
     * @param y 纵坐标
     */
    inMap(x: number, y: number): boolean;

    /**
     * 设置某一点的图块
     * @param block 图块数字
     * @param x 图块横坐标
     * @param y 图块纵坐标
     */
    setBlock(block: number, x: number, y: number): void;

    /**
     * 获取指定点的图块
     * @param x 图块横坐标
     * @param y 图块纵坐标
     * @returns 指定点的图块，如果没有图块，返回 0，如果不在地图上，返回 -1
     */
    getBlock(x: number, y: number): number;

    /**
     * 获取指定点的所有图块信息
     * @param x 横坐标
     * @param y 纵坐标
     */
    getLocationData(x: number, y: number): ILayerLocation | null;

    /**
     * 获取指定点的静态图块对应的有效触发器类型，若手动覆盖不存在则回退到图块默认触发器
     * @param x 图块横坐标
     * @param y 图块纵坐标
     */
    getTriggerType(x: number, y: number): number;

    /**
     * 设置指定点静态图块的触发器
     * @param type 触发器类型
     * @param x 图块横坐标
     * @param y 图块纵坐标
     */
    setTriggerType(type: number, x: number, y: number): void;

    /**
     * 删除指定点静态图块的触发器，回退为图块默认触发器
     * @param x 图块横坐标
     * @param y 图块纵坐标
     */
    revertTrigger(x: number, y: number): void;

    /**
     * 清空地图上所有静态图块的手动设置的触发器，恢复为图块默认触发器
     */
    clearTrigger(): void;

    /**
     * 设置地图图块
     * @param array 地图图块数组
     * @param x 数组第一项代表的横坐标
     * @param y 数组第一项代表的纵坐标
     * @param width 传入数组所表示的矩形范围的宽度
     */
    putMapData(array: Uint32Array, x: number, y: number, width: number): void;

    /**
     * 获取整个地图的地图数组，是对内部地图数组的拷贝，并不能通过修改它来直接修改地图内容
     */
    getMapData(): Uint32Array;
    /**
     * 获取地图指定区域的地图数组，是对内部地图数组的拷贝，并不能通过修改它来直接修改地图内容
     * @param x 左上角横坐标
     * @param y 左上角纵坐标
     * @param width 获取区域的宽度
     * @param height 获取区域的高度
     */
    getMapData(
        x: number,
        y: number,
        width: number,
        height: number
    ): Uint32Array;

    /**
     * 直接替换内部图块数组引用，跳过拷贝，高性能但风险较高。
     * 一般仅供 `MapStore` 读档时内部使用，外部正常情况下不应调用。
     * 调用方需确保传入数组的长度与 `width * height` 匹配，
     * 且调用后不得再持有或修改传入的数组。
     * @param array 地图数组，会直接替换内部引用
     */
    setMapRef(array: Uint32Array): void;

    /**
     * 获取整个地图的地图数组，是对内部数组的直接引用
     */
    getMapRef(): IMapLayerData;

    /**
     * 直接设置内部触发器映射对象，一般仅供内部存读档使用，外部正常情况下不应调用
     * @param triggers 触发器映射
     */
    setTriggerRef(triggers: Map<number, number>): void;

    /**
     * 获取静态触发器覆盖映射，一般仅供内部存档逻辑使用
     */
    getTriggerRef(): ReadonlyMap<number, number>;

    /**
     * 设置地图纵深，会影响渲染的遮挡顺序
     * @param zIndex 纵深
     */
    setZIndex(zIndex: number): void;

    /**
     * 开启指定位置的门
     * @param x 门横坐标
     * @param y 门纵坐标
     */
    openDoor(x: number, y: number): Promise<void>;

    /**
     * 在指定位置关门，门的图块数字由参数指定
     * @param num 门图块数字
     * @param x 门横坐标
     * @param y 门纵坐标
     */
    closeDoor(num: number, x: number, y: number): Promise<void>;
}

//#endregion

//#region 图层管理

export interface ILayerStateHooks extends IHookBase {
    /**
     * 当设置背景图块时执行，如果设置的背景图块与原先一样，则不会执行
     * @param tile 背景图块
     */
    onChangeBackground(tile: number): void;

    /**
     * 当地图列表发生变化时执行
     * @param layerList 地图图层列表
     */
    onUpdateLayer(layerList: Set<IMapLayer>): void;

    /**
     * 当地图状态对象的某个图层发生区域更新时执行
     * @param layer 触发更新的地图图层对象
     * @param x 更新区域左上角横坐标
     * @param y 更新区域左上角纵坐标
     * @param width 更新区域宽度
     * @param height 更新区域高度
     */
    onUpdateLayerArea(
        layer: IMapLayer,
        x: number,
        y: number,
        width: number,
        height: number
    ): void;

    /**
     * 当地图状态对象的某个图层设置图块时执行，如果设置的图块与原先一样则不会触发
     * @param layer 触发更新的地图图层对象
     * @param block 设置为的图块
     * @param x 图块横坐标
     * @param y 图块纵坐标
     */
    onUpdateLayerBlock(
        layer: IMapLayer,
        block: number,
        x: number,
        y: number
    ): void;

    /**
     * 当地图状态对象的某个图层大小发生变化时执行
     * @param layer 触发更新的地图图层对象
     * @param width 地图的新宽度
     * @param height 地图的新高度
     */
    onResizeLayer(layer: IMapLayer, width: number, height: number): void;
}

export interface ILayerState
    extends IHookable<ILayerStateHooks>, IDataCommonExtended {
    /** 地图列表 */
    readonly layerList: Set<IMapLayer>;
    /** 当前楼层共享的图块定义 store */
    readonly tileStore: ITileStore;
    /** 此楼层是否处于激活状态 */
    readonly active: boolean;
    /** 此楼层的地图宽度 */
    readonly width: number;
    /** 此楼层的地图高度 */
    readonly height: number;
    /** 当前楼层的默认事件层 */
    readonly eventLayer: IMapLayer | null;

    /**
     * 添加图层，使用楼层预设的宽高
     */
    addLayer(): IMapLayer;

    /**
     * 移除指定图层
     * @param layer 图层对象
     */
    removeLayer(layer: IMapLayer): void;

    /**
     * 当前地图状态对象是否包含指定图层对象
     * @param layer 图层对象
     */
    hasLayer(layer: IMapLayer): boolean;

    /**
     * 设置图层别名
     * @param layer 图层对象
     * @param alias 图层别名
     */
    setLayerAlias(layer: IMapLayer, alias: string): void;

    /**
     * 根据图层别名获取图层对象
     * @param alias 图层别名
     */
    getLayerByAlias(alias: string): IMapLayer | null;

    /**
     * 获取图层对象的别名
     * @param layer 图层对象
     */
    getLayerAlias(layer: IMapLayer): string | undefined;

    /**
     * 重新设置所有图层的大小，同时更新楼层预设宽高
     * @param width 新的地图宽度
     * @param height 新的地图高度
     * @param keepBlock 是否保留原有图块，默认不保留
     */
    resizeLayer(width: number, height: number, keepBlock?: boolean): void;

    /**
     * 设置背景图块
     * @param tile 背景图块数字
     */
    setBackground(tile: number): void;

    /**
     * 获取背景图块数字，如果没有设置过，则返回 0
     */
    getBackground(): number;

    /**
     * 设置楼层激活状态
     * @param active 激活状态
     */
    setActiveStatus(active: boolean): void;

    /**
     * 设置本楼层的事件层图层
     * @param layer 图层
     */
    setEventLayer(layer: IMapLayer | null): void;

    /**
     * 楼层是否被修改过（相对于参考基准）
     */
    isDirty(): boolean;

    /**
     * 设置楼层脏标记
     */
    setDirty(dirty: boolean): void;
}

//#endregion

//#region 楼层管理

export interface IMapLayerSave {
    readonly width: number;
    readonly height: number;

    /**
     * key = 行索引，value = 该行完整的 Uint32Array 数据；
     * HighCompression 时使用此接口，仅包含与参考基准不同的行；
     * 读档时，不在此 Map 中的行从参考基准还原。
     */
    readonly rows?: ReadonlyMap<number, Uint32Array>;

    /** 完整地图，当使用 `NoCompression` 和 `LowCompression` 时使用此接口 */
    readonly fullMap?: Uint32Array;
}

export interface ILayerStateSave {
    /** 楼层背景 */
    readonly background: number;
    /** key = zIndex，value = 对应图层存档数据 */
    readonly layers: ReadonlyMap<number, IMapLayerSave>;
    /** 静态触发器覆盖映射，仅在存在覆盖时写入 */
    readonly triggers: ReadonlyMap<number, ReadonlyMap<number, number>>;
}

export interface IMapStoreSave {
    /** key = 楼层 id，只包含 active 的楼层，inactive 的楼层不写入，读档时无需处理 */
    readonly floors: ReadonlyMap<string, ILayerStateSave>;
}

export interface IMapAreaInterval {
    /** 区域起始索引，包含 */
    readonly start: number;
    /** 区域结束索引，包含 */
    readonly end: number;
}

export type MapArea = IMapAreaInterval[];

export interface IMapState
    extends ISaveableContent<IMapStoreSave>, IDataCommonExtended {
    /** 所有楼层的 id 有序数组 */
    readonly maps: ReadonlyArray<string>;

    /**
     * 获取指定 id 的楼层状态，不存在则返回 null
     * @param id 楼层 id
     */
    getLayerState(id: string): ILayerState | null;

    /**
     * 获取指定 id 的楼层状态，要求楼层必须是 active 的，否则返回 null
     * @param id 楼层 id
     */
    getActiveMap(id: string): ILayerState | null;

    /**
     * 从楼层原始数据生成楼层状态
     * @param raw 楼层原始数据
     */
    fromRaw(raw: IMapRawData): ILayerState | null;

    /**
     * 创建并注册一个空白楼层，若 id 已存在则警告并覆盖，返回楼层状态对象
     * @param id 楼层 id
     * @param width 地图宽度
     * @param height 地图高度
     */
    createLayerState(id: string, width: number, height: number): ILayerState;

    /**
     * 获取指定 id 的楼层是否激活，不存在的 id 返回 false
     * @param id 楼层 id
     */
    isMapActive(id: string): boolean;

    /**
     * 设置指定 id 楼层的激活状态
     * @param id 楼层 id
     * @param active 激活状态
     */
    setMapActiveStatus(id: string, active: boolean): void;

    /**
     * 迭代所有 active 的楼层，yield [id, ILayerState]
     */
    iterateActiveMaps(): Iterable<[string, ILayerState]>;

    /**
     * 迭代所有 inactive 的楼层，yield [id, ILayerState]
     */
    iterateInactiveMaps(): Iterable<[string, ILayerState]>;

    /**
     * 迭代所有楼层，yield [id, ILayerState]
     */
    iterateAllMaps(): Iterable<[string, ILayerState]>;

    /**
     * 设置压缩参考基准，以首次调用为唯一基准，再次调用不更新。
     * @param ref 外层 key = 楼层 id，内层 key = zIndex，value = 图层完整图块数据
     */
    compareWith(ref: Map<string, Map<number, Uint32Array>>): void;

    /**
     * 设定楼层有序列表。设定后有序列表将用于分区索引计算
     * @param maps 楼层 id 数组
     */
    setMapList(maps: string[]): void;

    /**
     * 使用自定义排序函数重排 maps。排序函数接收当前列表的副本，返回新顺序。
     * 若返回的数组元素集合与原列表不一致，则警告并放弃本次排序
     * @param sort 排序函数
     */
    useManualOrder(sort: (arr: string[]) => string[]): void;

    /**
     * 设定分区列表。每个分区由一个或多个区间组成
     * @param areas 分区集合
     */
    setArea(areas: Set<MapArea>): void;

    /**
     * 激活指定楼层所属分区的所有楼层
     * @param id 楼层 id
     */
    activeArea(id: string): void;

    /**
     * 去激活指定楼层所属分区的所有楼层
     * @param id 楼层 id
     */
    deactiveArea(id: string): void;

    /**
     * 开启或关闭自动分区激活器
     * @param enable 是否开启
     */
    useAutoActivitor(enable: boolean): void;

    /**
     * 通知当前进入的楼层。开启自动激活器时，将自动去激活上一个分区并激活新分区
     * @param id 楼层 id
     */
    notifyEnterFloor(id: string): void;
}

//#endregion

//#region 动态图块

export interface IDynamicLayerHooks extends IHookBase {
    /**
     * 当图块被创建（含从静态图块转换）时触发
     * @param tile 被创建的动态图块
     * @param layer 所属的动态图层
     */
    onCreateTile?(tile: IDynamicTile, layer: IDynamicLayer): void;

    /**
     * 当图块被删除时触发
     * @param tile 被删除的动态图块
     * @param layer 所属的动态图层
     */
    onDeleteTile?(tile: IDynamicTile, layer: IDynamicLayer): Promise<void>;

    /**
     * 当更新动态图块的位置时触发（包括使用 `mover` 触发的移动）
     * @param tile 更新位置的图块
     * @param layer 所属的动态图层
     */
    onUpdateTilePosition?(tile: IDynamicTile, layer: IDynamicLayer): void;
}

export interface IDynamicLayer
    extends IHookable<IDynamicLayerHooks>, IDataCommonExtended {
    /** 当前动态图层所属的静态图层 */
    readonly layer: IMapLayer;

    /**
     * 在指定位置创建一个动态图块
     * @param num 图块数字
     * @param x 横坐标
     * @param y 纵坐标
     * @returns 创建的动态图块引用
     */
    createDynamic(num: number, x: number, y: number): IDynamicTile;

    /**
     * 从所属静态图层读取并清除指定位置的图块，创建对应动态图块并返回引用。
     * 若该位置图块为 0，则发出警告并仍然创建 `num = 0` 的动态图块
     * @param x 横坐标
     * @param y 纵坐标
     * @returns 创建的动态图块引用
     */
    transferToDynamic(
        x: number,
        y: number,
        keepTrigger?: boolean
    ): IDynamicTile;

    /**
     * 将动态图块还原为静态图块。坐标越界则警告并放弃，
     * 否则写回静态图层并触发 {@link IDynamicLayerHooks.onDeleteTile}
     * @param tile 要还原的动态图块
     */
    transferToStatic(tile: IDynamicTile, keepTrigger?: boolean): void;

    /**
     * 仅当目标位置静态图块为 0（空白）时才还原为静态图块，否则不转换
     * @param tile 要还原的动态图块
     * @returns 是否转换成功
     */
    transferToStaticIfSafe(tile: IDynamicTile, keepTrigger?: boolean): boolean;

    /**
     * 删除指定动态图块，触发 {@link IDynamicLayerHooks.onDeleteTile} 钩子。
     * 若图块不属于此层则发出警告
     * @param tile 要删除的动态图块
     */
    deleteDynamic(tile: IDynamicTile): Promise<void>;

    /**
     * 获取指定格点上所有动态图块的可迭代对象
     * @param x 横坐标
     * @param y 纵坐标
     */
    getDynamicTilesAt(x: number, y: number): Iterable<IDynamicTile>;

    /**
     * 迭代所有的动态图块
     */
    iterateDynamicTiles(): Iterable<IDynamicTile>;

    /**
     * 手动设置动态图块的朝向，更新 `tile.num`（若有朝向绑定）。
     * 转向逻辑与移动时的转向逻辑相同，但不触发移动
     * @param tile 要设置朝向的动态图块
     * @param direction 目标朝向
     */
    setDynamicDirection(tile: IDynamicTile, direction: FaceDirection): void;

    /**
     * 更新图块内部存储位置
     * @param tile 动态图块
     */
    updateDynamicTile(tile: IDynamicTile): void;
}

export interface IDynamicTile extends IObjectMovable, IDataCommonExtended {
    /** 当前图块数字 */
    readonly num: number;
    /** 当前动态图块携带的触发器类型，-1 表示无触发器 */
    readonly triggerType: number;
    /** 当前图块所属的动态图层 */
    readonly layer: IDynamicLayer;
    /** 当前动态图块的移动器 */
    readonly mover: IObjectMover<IDynamicTile>;
    /** 当前动态图块的图块数据 */
    readonly raw: ITileRawData | null;

    /**
     * 设置图块朝向，会一并修改 {@link num}，返回设置后的当前图块数字
     * @param direction 图块朝向
     */
    setFaceDirection(direction: FaceDirection): number;

    /**
     * 设置当前动态图块的触发器类型
     * @param type 触发器类型
     */
    setTriggerType(type: number): void;

    /**
     * 直接删除此图块
     */
    delete(): Promise<void>;

    /**
     * 将当前图块还原为静态图块
     */
    toStatic(): void;

    /**
     * 还原为静态图块，如果当前位置有东西则不转换
     */
    toStaticIfSafe(): boolean;

    /**
     * 单步便捷移动接口，适用于简单移动场景，复杂路径通过 `tile.mover` 访问。
     * 等价于：
     *
     * ```ts
     * mover.step(dir, count);
     * return mover.start();
     * ```
     */
    step(dir: FaceDirection, count?: number): IMoverController | null;

    /**
     * 注入朝向绑定器，初始状态视为无朝向绑定
     * @param binder 朝向绑定器
     */
    setFaceBinder(binder: IRoleFaceBinder | null): void;
}

//#endregion
