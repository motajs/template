//#region tile

export const enum TileType {
    /** 未知或尚未归类的图块 */
    Unknown,
    /** 空白图块 */
    None,
    /** 地形类图块 */
    Terrain,
    /** 动画类图块 */
    Animate,
    /** 道具类图块 */
    Item,
    /** 怪物类图块 */
    Enemy,
    /** NPC 类图块 */
    Npc,
    /** 自动元件 */
    Autotile,
    /** Tileset 切片图块 */
    Tileset
}

export const enum PassBit {
    /** 上方向掩码 */
    Up = 0b0001,
    /** 右方向掩码 */
    Right = 0b0010,
    /** 下方向掩码 */
    Down = 0b0100,
    /** 左方向掩码 */
    Left = 0b1000
}

export interface ITilePassData {
    /** 是否仅当图块处在事件层时生效 */
    readonly onlyEvents: boolean;
    /** 可以离开的方向 */
    readonly outPass: number;
    /** 可以进入的方向 */
    readonly inPass: number;
}

export interface ITileRawData {
    /** 图块数字 */
    readonly num: number;
    /** 图块字符串 id */
    readonly id: string;
    /** 默认触发器类型 */
    readonly trigger: number;
    /** 图块逻辑类型 */
    readonly type: TileType;
    /** 图块的通行性对象 */
    readonly pass: ITilePassData;
    /**
     * 事件可通行性，当为 `false` 时，玩家会通过撞击触发图块的触发器，
     * 当为 `true` 时，玩家会通过走上去触发图块的触发器。类似于旧样板的 `noPass`
     */
    readonly eventPass: boolean;
}

export interface ITileLegacyConverter<TLegacy> {
    /**
     * 将旧样板图块定义转换为新的图块原始数据
     * @param num 图块数字
     * @param legacy 旧样板图块定义
     */
    fromLegacy(num: number, legacy: TLegacy): ITileRawData;
}

export interface ITileStore<TLegacy = unknown> {
    /**
     * 获取指定图块数字对应的完整原始定义
     * @param num 图块数字
     */
    getData(num: number): ITileRawData | null;

    /**
     * 获取指定图块数字对应的默认触发器类型
     * @param num 图块数字
     */
    getTrigger(num: number): number;

    /**
     * 获取指定图块数字对应的图块类型
     * @param num 图块数字
     */
    getType(num: number): TileType;

    /**
     * 添加一个图块定义；若 `num` 或 `id` 冲突则警告并覆盖
     * @param data 图块原始定义
     */
    addTile(data: ITileRawData): void;

    /**
     * 根据图块 id 查询对应图块数字
     * @param id 图块 id
     */
    idToNumber(id: string): number | undefined;

    /**
     * 根据图块数字查询对应图块 id
     * @param num 图块数字
     */
    numberToId(num: number): string | undefined;

    /**
     * 传入图块数字或 id，返回图块数字
     * @param token 图块数字或 id
     */
    num(token: number | string): number | undefined;

    /**
     * 传入图块数字或 id，返回图块 id
     * @param token 图块数字或 id
     */
    id(token: number | string): string | undefined;

    /**
     * 挂载一个旧样板转换器
     * @param converter 旧样板转换器
     */
    attachLegacyConverter(converter: ITileLegacyConverter<TLegacy>): void;

    /**
     * 使用当前转换器转换并写入一个旧样板图块定义
     * @param num 图块数字
     * @param legacy 旧样板图块定义
     */
    fromLegacy(num: number, legacy: TLegacy): ITileRawData;
}

//#endregion

//#region item

export const enum ItemCategory {
    /** 未知或尚未归类的道具 */
    Unknown,
    /** 永久道具，使用后不会消耗 */
    Constant,
    /** 一次性道具，使用后消耗 */
    Consumable,
    /** 即捡即用道具，捡到立刻生效 */
    Pick,
    /** 装备类道具，可装备 / 卸下 */
    Equipment
}

export interface IItemEffect<THero> {
    /**
     * 道具使用事件内容对于 `Pick` 类型，会在拾取时触发；
     * 对于 `Constant` 和 `Consumable` 类型，会在使用时触发。
     */
    readonly useEvent: unknown;

    /**
     * 道具使用效果，使用道具时调用。对于 `Pick` 类型，会在拾取时触发；
     * 对于 `Constant` 和 `Consumable` 类型，会在使用时触发。
     * @param item 当前道具数据
     */
    useEffect(item: IItemRawData<THero>): void;

    /**
     * 能否使用道具，仅对 `Constant` 和 `Consumable` 类型的道具生效
     * @param item 当前道具数据
     */
    canUse(item: IItemRawData<THero>): boolean;
}

export interface IItemEquipData<THero> {
    /** 可以装备至的装备槽，`number` 表示指定索引装备槽，`string` 表示指定装备槽名称，每个装备槽之间为或的关系 */
    readonly slots: (number | string)[];
    /** 动画 id */
    readonly animate: AnimationIds;
    /** 数值加成 */
    readonly value: Map<SelectKey<THero, number>, number>;
    /** 百分比加成 */
    readonly percentage: Map<SelectKey<THero, number>, number>;
    /** 穿上装备事件 */
    readonly loadEvent: unknown;
    /** 脱下装备事件 */
    readonly unloadEvent: unknown;
}

export interface IItemRawData<THero> {
    /** 道具在地图上的图块数字 */
    readonly num: number;
    /** 道具的字符串标识符 */
    readonly id: string;
    /** 道具分类 */
    readonly category: ItemCategory;
    /** 道具显示名称 */
    readonly name: string;
    /** 道具描述文本 */
    readonly text: string;

    /** 是否在道具栏中隐藏 */
    readonly hideInToolbox: boolean;

    /** 道具效果对象（非 Equipment 类型） */
    readonly effect: IItemEffect<THero>;
    /** 装备道具属性（Equipment 类型） */
    readonly equip: IItemEquipData<THero>;
}

export interface IItemLegacyConverter<THero, TLegacy> {
    /**
     * 将旧样板道具定义转换为新的道具原始数据
     * @param num 道具图块数字
     * @param legacy 旧样板道具定义
     */
    fromLegacy(num: number, legacy: TLegacy): IItemRawData<THero>;
}

export interface IItemStore<THero, TLegacy> {
    /**
     * 获取指定图块数字对应的道具原始数据
     * @param num 道具图块数字
     */
    getData(num: number): IItemRawData<THero> | null;

    /**
     * 获取指定图块数字对应的道具分类
     * @param num 道具图块数字
     */
    getCategory(num: number): ItemCategory;

    /**
     * 添加一个道具原始数据定义
     * @param data 道具原始数据
     */
    addItem(data: IItemRawData<THero>): void;

    /**
     * 挂载一个旧样板转换器
     * @param converter 旧样板转换器
     */
    attachLegacyConverter(
        converter: IItemLegacyConverter<THero, TLegacy>
    ): void;

    /**
     * 使用当前转换器转换并写入一个旧样板道具定义
     * @param num 道具图块数字
     * @param legacy 旧样板道具定义
     */
    fromLegacy(num: number, legacy: TLegacy): IItemRawData<THero>;
}

//#endregion

//#region map

export interface IMapRawData {
    /** 楼层 id */
    readonly floorId: string;
    /** 地图宽度 */
    readonly width: number;
    /** 地图数组 */
    readonly map: Record<number, number[]>;
    /** 每个地图图层的字符串别名 */
    readonly layerAlias: Record<number, string>;
}

export interface IMapStore {
    /**
     * 根据地图 id 获取指定地图的原始数据
     * @param floorId 楼层 id
     */
    getMap(floorId: string): IMapRawData | null;

    /**
     * 添加地图的原始数据定义
     * @param map 地图原始数据
     */
    addMap(map: IMapRawData): void;
}

//#endregion
