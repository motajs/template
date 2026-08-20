import {
    IHookable,
    IHookBase,
    IHookController,
    ITileLocator
} from '@motajs/common';
import {
    FaceDirection,
    IDataCommonExtended,
    ILocationHelper,
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

//#region 图块信息

export interface IMapBlockSaveBase {
    /** 此图块的触发器 */
    triggers?: ReadonlySet<number>;
}

export interface IStaticBlockSave extends IMapBlockSaveBase {}

export interface IDynamicBlockSave extends IMapBlockSaveBase {
    /** 此动态图块的图块数字 */
    num: number;
}

export interface ITileBase {
    /** 该图块所处的位置 */
    readonly locator: ITileLocator;
    /** 该图块所处的图层对象 */
    readonly layer: IMapLayer;
    /** 包含的触发器列表，不存在时表示使用图块本身的触发器 */
    readonly triggers: ReadonlySet<number> | null;

    /**
     * 获取该图块的原始图块信息
     */
    raw(): ITileRawData | null;

    /**
     * 获取该图块的原始点位信息
     */
    block(): IMapBlockRawData | null;

    /**
     * 获取该图块的图块数字
     */
    num(): number;

    /**
     * 设置此图块为指定图块
     * @param num 图块数字
     */
    set(num: number): void;

    /**
     * 设置图块朝向，会一并修改 {@link num}，返回设置后的当前图块数字
     * @param direction 图块朝向
     */
    setFaceDirection(direction: FaceDirection): number;

    /**
     * 清空此图块实例的触发器，回退为图块本身的触发器
     */
    clearTrigger(): void;

    /**
     * 在此图块实例上添加触发器，当图块实例包含触发器时，将会覆盖图块本身的触发器
     * @param trigger 触发器数字
     */
    addTrigger(trigger: number): void;

    /**
     * 删除此图块实例上添加的触发器
     * @param trigger 触发器数字
     */
    deleteTrigger(trigger: number): void;

    /**
     * 将此图块实例的触发器设置为无触发器，并覆盖图块本身的触发器。若图块本身包含触发器，此方法可以将其禁用
     */
    useEmptyTrigger(): void;
}

export interface IStaticTile
    extends
        ITileBase,
        IDataCommonExtended,
        ISaveableContent<Readonly<IStaticBlockSave>> {
    /**
     * 将此静态图块转换为动态图块
     */
    toDynamic(): IDynamicTile;

    /**
     * 判断当前静态图块是否需要存档
     */
    shouldSave(): boolean;
}

export interface IDynamicTile
    extends
        ITileBase,
        IObjectMovable,
        IDataCommonExtended,
        ISaveableContent<Readonly<IDynamicBlockSave>> {
    /** 该动态图块的移动器 */
    readonly mover: IObjectMover<IDynamicTile>;
    /** 该动态图块所属的动态图层 */
    readonly layer: IMapLayer;

    /**
     * 将该动态图块转换为静态图块，如果该动态图块的坐标不为整数或正在移动，那么会转换失败并返回 `null`。
     * 如果目标点有静态图块，那么会将其覆盖。
     */
    toStatic(): IStaticTile | null;

    /**
     * 将该动态图块转换为静态图块，如果该动态图块的坐标不为整数或正在移动，或目标点不为空，那么会转换失败并返回 `null`。
     * 即在 `toStatic` 的基础上添加了一个目标点是否为空的判断。
     */
    toStaticIfSafe(): IStaticTile | null;

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
     * 直接删除此图块
     */
    delete(): Promise<void>;
}

//#region 地图图层

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
    /** 该点包含的所有动态图块 */
    readonly dynamics: Iterable<IDynamicTile>;
    /** 该点的静态图块原始数据 */
    readonly static: IStaticTile;
}

export interface IMapLayerHooks extends IHookBase {
    /**
     * 当地图大小发生变化时执行，如果调用了地图的 `resize` 方法，但是地图大小没变，则不会触发
     * @param width 地图宽度
     * @param height 地图高度
     */
    onResize(width: number, height: number): void;

    /**
     * 当更新某个区域的图块时执行，对应于 `putMapData` 方法
     * @param x 更新区域左上角横坐标
     * @param y 更新区域左上角纵坐标
     * @param width 更新区域宽度
     * @param height 更新区域高度
     */
    onUpdateArea(x: number, y: number, width: number, height: number): void;

    /**
     * 当更新某个点的图块时执行，如果设置的图块与原先一样，则不会触发此方法，对应于 `setBlock` 方法
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

    /**
     * 当动态图块被创建时触发，包括从静态图块转换为动态图块
     * @param tile 被创建的动态图块
     */
    onCreateDynamic?(tile: IDynamicTile): void;

    /**
     * 当动态图块被删除时触发
     * @param tile 被删除的动态图块
     */
    onDeleteDynamic?(tile: IDynamicTile): Promise<void>;

    /**
     * 当更新动态图块的位置时触发
     * @param tile 更新位置的图块
     */
    onUpdateDynamicPosition?(tile: IDynamicTile): void;
}

export interface IMapLayerHookController extends IHookController<IMapLayerHooks> {
    /** 拓展所属的图层对象 */
    readonly layer: IMapLayer;

    /**
     * 获取地图数据，是对内部存储的直接引用
     */
    getMapData(): Readonly<IMapLayerData>;
}

interface ILayerStatic {
    /**
     * 设置某一点的图块，会标记图层为脏
     * @param block 图块数字
     * @param x 图块横坐标
     * @param y 图块纵坐标
     */
    setBlock(block: number, x: number, y: number): void;

    /**
     * 获取指定点的图块数字
     * @param x 图块横坐标
     * @param y 图块纵坐标
     * @returns 指定点的图块，如果没有图块，返回 0，如果不在地图上，返回 -1
     */
    getBlock(x: number, y: number): number;

    /**
     * 获取指定点的静态图块实例
     * @param x 图块横坐标
     * @param y 图块纵坐标
     */
    getTile(x: number, y: number): IStaticTile | null;

    /**
     * 设置地图图块，会标记图层为脏
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
     * 直接替换内部图块数组引用，跳过拷贝，高性能但风险较高。一般仅供内部使用，外部不需要调用。
     * 此操作不会标记图层为脏。调用方需确保传入数组的长度与 `width * height` 匹配，
     * 且调用后不得再持有或修改传入的数组。
     * @param array 地图数组，会直接替换内部引用
     */
    setMapRef(array: Uint32Array): void;

    /**
     * 获取整个地图的地图数组，是对内部数组的直接引用
     */
    getMapRef(): IMapLayerData;

    /**
     * 设置静态图块的朝向
     * @param x 要设置的静态图块横坐标
     * @param y 要设置的静态图块纵坐标
     * @param direction 目标朝向
     * @returns 更新朝向后该静态图块的图块数字
     */
    setStaticDirection(x: number, y: number, direction: FaceDirection): number;

    /**
     * 迭代所有的图块
     */
    iterateBlocks(): Iterable<ILayerLocation>;
}

interface ILayerDynamic {
    /**
     * 在指定位置创建一个动态图块
     * @param num 图块数字
     * @param x 横坐标
     * @param y 纵坐标
     */
    createDynamic(num: number, x: number, y: number): IDynamicTile;

    /**
     * 从静态图层读取并清除指定位置的图块，创建对应动态图块并返回
     * @param x 横坐标
     * @param y 纵坐标
     * @param keepTrigger 是否将静态图块的触发器保留至动态图块，不论是否保留，此格的静态触发器都会被清空
     */
    transferToDynamic(
        x: number,
        y: number,
        keepTrigger?: boolean
    ): IDynamicTile | null;

    /**
     * 将动态图块还原为静态图块
     * @param tile 要还原的动态图块
     * @param keepTrigger 是否保留动态图块的触发器至静态图块，若不保留，那么此格将回退为静态图块本身的触发器
     */
    transferToStatic(
        tile: IDynamicTile,
        keepTrigger?: boolean
    ): IStaticTile | null;

    /**
     * 仅当目标位置不存在静态图块时才还原为静态图块，否则不转换
     * @param tile 要还原的动态图块
     * @param keepTrigger 是否保留动态图块的触发器至静态图块，若不保留，那么此格将回退为静态图块本身的触发器
     */
    transferToStaticIfSafe(
        tile: IDynamicTile,
        keepTrigger?: boolean
    ): IStaticTile | null;

    /**
     * 删除指定动态图块，当删除完成后兑现返回值
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
     * 设置动态图块的朝向
     * @param tile 要设置朝向的动态图块
     * @param direction 目标朝向
     * @returns 更新朝向后该动态图块的图块数字
     */
    setDynamicDirection(tile: IDynamicTile, direction: FaceDirection): number;

    /**
     * 更新动态图块位置，用于在图块发生移动时更新内部存储，一般不需要手动调用
     * @param tile 动态图块
     */
    updateDynamicTile(tile: IDynamicTile): void;
}

export interface IMapLayerSave {
    /** 地图宽度 */
    readonly width: number;
    /** 地图高度 */
    readonly height: number;

    /**
     * 每行的地图数据，键表示行索引，值表示该行完整的 Uint32Array 数据。
     * HighCompression 时使用此接口，仅包含与参考基准不同的行。
     */
    readonly rows?: ReadonlyMap<number, Uint32Array>;

    /** 完整地图，当使用 `NoCompression` 和 `LowCompression` 时使用此接口 */
    readonly fullMap?: Uint32Array;

    /**
     * 每个静态图块实例的存储，在 `LowCompression` 和 `HighCompression` 下，
     * 此存储只会保存被标记为脏的图块，避免占用过大的存储空间。
     */
    readonly staticBlocks?: ReadonlyMap<number, Readonly<IStaticBlockSave>>;
    /**
     * 每个动态图块实例的存储，在 `LowCompression` 和 `HighCompression` 下，
     * 此存储只会保存被标记为脏的图块，避免占用过大的存储空间。
     */
    readonly dynamicBlocks?: ReadonlyMap<number, Readonly<IDynamicBlockSave>[]>;
}

export interface IMapLayer
    extends
        IHookable<IMapLayerHooks, IMapLayerHookController>,
        IDataCommonExtended,
        ILayerStatic,
        ILayerDynamic,
        ISaveableContent<IMapLayerSave> {
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
    readonly map: IGameMap;
    /** 该图层使用的朝向绑定器 */
    readonly faceBinder: IRoleFaceBinder;

    /**
     * 设置图层的参考基准，存档时会根据参考基准进行必要的压缩处理，仅可调用一次，多次调用无效
     * @param data 图层的静态地图矩阵
     */
    compareWith(data: Uint32Array): void;

    /**
     * 判断指定坐标是否在地图内
     * @param x 横坐标
     * @param y 纵坐标
     */
    inMap(x: number, y: number): boolean;

    /**
     * 设置该图层使用的朝向绑定器，用于控制图块转向操作
     * @param binder 朝向绑定器
     */
    setFaceBinder(binder: IRoleFaceBinder | null): void;

    /**
     * 获取指定点的所有图块信息
     * @param x 横坐标
     * @param y 纵坐标
     */
    getLocationData(x: number, y: number): ILayerLocation | null;

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

    /**
     * 当前图层是否为脏，即是否经过了修改，相对于设置的参考基准。
     * 图层相对于参考基准变化时一定为 `true`，但为 `true` 时图层不一定相对参考基准发生了变化。
     * 此标记仅针对静态图层，动态图块的改动不会影响此值。
     */
    dirty(): boolean;

    /**
     * 标记当前图层是否为脏，会影响存档，如果不明白原理不建议随意调用
     * @param dirty 图层是否为脏
     */
    markDirty(dirty: boolean): void;
}

export interface IResizableMapLayer extends IMapLayer {
    /**
     * 重设图层宽高，清空地图上的所有内容，会标记图层为脏
     * @param width 要设置为的宽度
     * @param height 要设置为的高度
     */
    resize(width: number, height: number): void;

    /**
     * 重设图层宽高，会保留已有图块内容，扩大的区域补零，缩小的区域裁剪，会标记图层为脏
     * @param width 要设置为的宽度
     * @param height 要设置为的高度
     */
    resize2(width: number, height: number): void;
}

//#endregion

//#region 图层管理

export interface IGameMapHooks extends IHookBase {
    /**
     * 当设置背景图块时执行，如果设置的背景图块与原先一样，则不会执行
     * @param tile 背景图块
     */
    onChangeBackground?(tile: number): void;

    /**
     * 当地图列表发生变化时执行
     * @param layerList 地图图层列表
     */
    onUpdateLayer?(layerList: Set<IMapLayer>): void;

    /**
     * 当地图状态对象的某个图层大小发生变化时执行
     * @param layer 触发更新的地图图层对象
     * @param width 地图的新宽度
     * @param height 地图的新高度
     */
    onResizeLayer?(layer: IMapLayer, width: number, height: number): void;
}

export interface IGameMapSave {
    /** 楼层背景 */
    readonly background: number;
    /** 该地图每一个图层的存档信息，键表示纵深，值对应图层存档数据 */
    readonly layers: ReadonlyMap<number, IMapLayerSave>;
}

export interface IGameMap
    extends
        IHookable<IGameMapHooks>,
        IDataCommonExtended,
        ISaveableContent<IGameMapSave> {
    /** 坐标索引器，用于坐标与扁平索引之间的双向转换 */
    readonly indexer: ILocationHelper;
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
     * 设置地图的参考基准，存档时会根据参考基准进行必要的压缩，仅可调用一次，多次调用无效
     * @param data 地图的静态地图矩阵，键表示纵深，值表示对应图层的矩阵
     */
    compareWith(data: Map<number, Uint32Array>): void;

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
     * 当前地图是否为脏，相对于参考基准，当任意图层或地图设置发生变化时为脏。
     * 地图相对于参考基准变化时一定为 `true`，但为 `true` 时地图不一定相对参考基准发生了变化。
     * 此标记仅针对静态图层和本地图的地图设置，动态图块的改动不会影响此值。
     */
    dirty(): boolean;

    /**
     * 标记当前地图是否为脏，会影响存档，如果不明白原理不建议随意调用
     * @param dirty 地图是否为脏
     */
    markDirty(dirty: boolean): void;
}

//#endregion

//#region 楼层管理

export interface IMapStoreSave {
    /** 键表示楼层 id，只包含已激活的楼层，未激活的楼层不写入 */
    readonly floors: ReadonlyMap<string, IGameMapSave>;
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
     * 创建并注册一个空白楼层，若 id 已存在则警告并覆盖，返回楼层状态对象
     * @param id 楼层 id
     * @param width 地图宽度
     * @param height 地图高度
     */
    createMap(id: string, width: number, height: number): IGameMap;

    /**
     * 获取指定 id 的楼层状态，不存在则返回 `null`
     * @param id 楼层 id
     */
    getMap(id: string): IGameMap | null;

    /**
     * 从楼层原始数据生成楼层状态
     * @param raw 楼层原始数据
     */
    fromRaw(raw: IMapRawData): IGameMap | null;

    /**
     * 获取指定 id 的楼层状态，要求楼层必须是已激活的，否则返回 `null`
     * @param id 楼层 id
     */
    getActiveMap(id: string): IGameMap | null;

    /**
     * 获取指定 id 的楼层是否激活，不存在的 id 返回 `false`
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
     * 迭代所有已激活的楼层
     */
    iterateActiveMaps(): Iterable<[string, IGameMap]>;

    /**
     * 迭代所有未激活的楼层
     */
    iterateInactiveMaps(): Iterable<[string, IGameMap]>;

    /**
     * 迭代所有楼层
     */
    iterateAllMaps(): Iterable<[string, IGameMap]>;

    /**
     * 设置参考基准，存档时会根据参考基准进行必要的压缩处理，仅可调用一次，多次调用无效
     * @param ref 外层键表示楼层 id，内层键表示图层纵深，值表示图层完整图块数据
     */
    compareWith(ref: Map<string, Map<number, Uint32Array>>): void;

    /**
     * 设定楼层有序列表。设定后有序列表将用于分区索引计算
     * @param maps 楼层 id 数组
     */
    setMapList(maps: string[]): void;

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
     * 取消激活指定楼层所属分区的所有楼层
     * @param id 楼层 id
     */
    deactiveArea(id: string): void;

    /**
     * 开启或关闭自动分区激活器
     * @param enable 是否开启
     */
    useAutoActivitor(enable: boolean): void;

    /**
     * 通知当前勇士进入的楼层，用于自动分区。当开启自动分区激活器时，若进入的楼层不属于当前分区，
     * 那么会自动取消激活当前分区，然后激活新进入的分区。此函数一般不需要手动调用。
     * @param id 楼层 id
     */
    notifyEnterFloor(id: string): void;
}

//#endregion
