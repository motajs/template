import { IReplayCommand, ReplayParamValue } from '@user/data-common';
import { EquipStatus, IHeroLocation, IHeroMover } from '@user/data-base';
import { IPathfindingSystem } from '@user/data-system';

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
    AutoPathfindToPoint = 4,
    /** 使用道具 */
    UseItem = 5,
    /** 装备物品 */
    Equip = 6,
    /** 卸下装备 */
    Unequip = 7
}

/** replay command 使用的勇士道具访问边界 */
export interface IReplayHeroItems {
    /** 使用指定道具 */
    useItem(item: number | string): boolean;
}

/** replay command 使用的勇士装备访问边界 */
export interface IReplayHeroEquipment {
    /** 判断装备是否可以放入目标槽位 */
    canEquipTo(uid: number, slot: number | string): EquipStatus;

    /** 将装备放入目标槽位 */
    equip(
        uid: number,
        slot: number | string,
        autoUnload?: boolean
    ): number | undefined;

    /** 卸下指定槽位的装备 */
    unequip(slot: number): number | undefined;

    /** 获取槽位上的装备 uid */
    getEquipped(slot: number): number | undefined;

    /** 当前装备槽名称 */
    readonly slots: readonly string[];
}

/** replay command 使用的勇士移动访问边界 */
export interface IReplayHeroLocation {
    /** 勇士移动器 */
    readonly mover: IHeroMover<IHeroLocation>;
}

/** replay command 使用的勇士访问边界 */
export interface IReplayHero {
    /** 勇士位置 */
    readonly location: IReplayHeroLocation;
    /** 勇士道具 */
    readonly items: IReplayHeroItems;
    /** 勇士装备 */
    readonly equip: IReplayHeroEquipment;
}

/** replay command 实现可访问的 CoreState 内部边界 */
export interface IReplayCommandState {
    /** 勇士状态 */
    readonly hero: IReplayHero;
    /** 已绑定勇士移动器的寻路系统 */
    readonly pathfinding: IPathfindingSystem;
}

/** 模块提供给顶层注册器的 command item */
export interface IReplayCommandItem {
    /** 顶层稳定指令码 */
    readonly code: ReplayCommandCode;
    /** 指令实现 */
    readonly command: IReplayCommand;
}

/** 供测试和顶层装配读取的稳定指令码顺序 */
export const REPLAY_COMMAND_ORDER: readonly ReplayCommandCode[] = [
    ReplayCommandCode.Up,
    ReplayCommandCode.Right,
    ReplayCommandCode.Down,
    ReplayCommandCode.Left,
    ReplayCommandCode.AutoPathfindToPoint,
    ReplayCommandCode.UseItem,
    ReplayCommandCode.Equip,
    ReplayCommandCode.Unequip
];

/** 顶层注册器使用的重放系统最小边界 */
export interface IReplayCommandRegistry {
    /** 注册录像指令 */
    registerCommand(code: number, command: IReplayCommand): void;

    /** 查询录像指令 */
    getCommand(code: number): IReplayCommand | null;
}

/** command 参数读取结果 */
export type ReplayCommandParam = ReplayParamValue;
