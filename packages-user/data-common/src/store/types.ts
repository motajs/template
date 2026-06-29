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
    idToNumber(id: string): number | null;

    /**
     * 根据图块数字查询对应图块 id
     * @param num 图块数字
     */
    numberToId(num: number): string | null;

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
