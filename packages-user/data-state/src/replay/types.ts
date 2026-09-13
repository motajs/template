/** 顶层拥有的稳定录像指令码，数值属于录像格式的一部分 */
export const enum ReplayCommandCode {
    /** 向上移动一步 */
    Up = 0,
    /** 向右移动一步 */
    Right = 1,
    /** 向下移动一步 */
    Down = 2,
    /** 向左移动一步 */
    Left = 3,
    /** 自动寻路至目标点 */
    Teleport = 4,
    /** 使用道具 */
    UseItem = 5,
    /** 装备物品 */
    Equip = 6,
    /** 卸下装备 */
    Unequip = 7
}

/** 供测试读取的稳定指令码顺序 */
export const REPLAY_COMMAND_ORDER: readonly ReplayCommandCode[] = [
    ReplayCommandCode.Up,
    ReplayCommandCode.Right,
    ReplayCommandCode.Down,
    ReplayCommandCode.Left,
    ReplayCommandCode.Teleport,
    ReplayCommandCode.UseItem,
    ReplayCommandCode.Equip,
    ReplayCommandCode.Unequip
];
