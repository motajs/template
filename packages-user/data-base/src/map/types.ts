import { IHookable, IHookBase, IHookController } from '@motajs/common';
import { ISaveableContent } from '../common';

export interface IMapLayerData {
    /** 当前引用是否过期，当地图图层内部的地图数组引用更新时，此项会变为 `true` */
    expired: boolean;
    /** 地图图块数组，是对内部存储的直接引用 */
    array: Uint32Array;
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

export interface IMapLayer extends IHookable<
    IMapLayerHooks,
    IMapLayerHookController
> {
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

    /**
     * 调整地图尺寸，维持原有图块。如果尺寸变大，那么会补零，如果尺寸变小，那么会将当前数组裁剪
     * @param width 地图宽度
     * @param height 地图高度
     */
    resize(width: number, height: number): void;

    /**
     * 调整地图尺寸，但是将地图全部重置为零，不保留原地图数据
     * @param width 地图宽度
     * @param height 地图高度
     */
    resize2(width: number, height: number): void;

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
     * 获取整个地图的地图数组，是对内部数组的直接引用
     */
    getMapRef(): IMapLayerData;

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
     * 直接替换内部图块数组引用，跳过拷贝，高性能但风险较高。
     * 一般仅供 `MapStore` 读档时内部使用，外部正常情况下不应调用。
     * 调用方需确保传入数组的长度与 `width * height` 匹配，
     * 且调用后不得再持有或修改传入的数组。
     * @param array 地图数组，会直接替换内部引用
     */
    setMapRef(array: Uint32Array): void;
}

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

export interface ILayerState extends IHookable<ILayerStateHooks> {
    /** 地图列表 */
    readonly layerList: Set<IMapLayer>;
    /** 此楼层是否处于激活状态 */
    readonly active: boolean;

    /**
     * 添加图层
     * @param width 地图宽度
     * @param height 地图高度
     */
    addLayer(width: number, height: number): IMapLayer;

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
     * 重新设置图层的大小
     * @param layer 图层对象
     * @param width 新的图层宽度
     * @param height 新的图层高度
     * @param keepBlock 是否保留原有图块，默认不保留
     */
    resizeLayer(
        layer: IMapLayer,
        width: number,
        height: number,
        keepBlock?: boolean
    ): void;

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
     * 楼层是否被修改过（相对于参考基准）
     */
    isDirty(): boolean;

    /**
     * 设置楼层脏标记
     */
    setDirty(dirty: boolean): void;
}

/** 单个 MapLayer 的存档数据 */
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

/** 单个楼层的存档数据 */
export interface ILayerStateSave {
    readonly background: number;

    /** key = zIndex，value = 对应图层存档数据 */
    readonly layers: ReadonlyMap<number, IMapLayerSave>;
}

/** 整个 MapStore 的存档数据 */
export interface IMapStoreSave {
    /** key = 楼层 id，只包含 active 的楼层，inactive 的楼层不写入，读档时无需处理 */
    readonly floors: ReadonlyMap<string, ILayerStateSave>;
}

export interface IMapStore extends ISaveableContent<IMapStoreSave> {
    /** 所有楼层的 id 集合 */
    readonly maps: ReadonlySet<string>;

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
     * 创建并注册一个空白楼层，若 id 已存在则警告并覆盖，返回楼层状态对象
     * @param id 楼层 id
     */
    createLayerState(id: string): ILayerState;

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
}
