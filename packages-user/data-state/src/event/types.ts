import { ObjectMoveStep } from '@user/data-common';

//#region 地图控制

/** 事件：设置图块 */
export interface ISetBlockEventParam {
    /** 横坐标 */
    readonly x: number;
    /** 纵坐标 */
    readonly y: number;
    /** 要设置为的图块 */
    readonly tile: number | string;
}

/** 事件：移动图块 */
export interface IMoveBlockEventParam {
    /** 起始横坐标 */
    readonly x: number;
    /** 起始纵坐标 */
    readonly y: number;
    /** 移动步骤 */
    readonly steps: readonly ObjectMoveStep[];
    /** 是否仅在目标位置安全时转回静态图块 */
    readonly safe?: boolean;
}

/** 事件：删除图块 */
export interface IDeleteBlockEventParam {
    /** 横坐标 */
    readonly x: number;
    /** 纵坐标 */
    readonly y: number;
}

//#endregion

//#region 玩家控制

/** 事件：按步骤移动勇士 */
export interface IMoveHeroEventParam {
    /** 移动步骤 */
    readonly steps: readonly ObjectMoveStep[];
}

/** 事件：向前移动一步 */
export interface IMoveHeroStepEventParam {}

/** 事件：触发勇士面前的 onTouch */
export interface ITouchFrontEventParam {}

//#endregion

//#region 事件控制

/** 事件：临时插入多个事件 */
export interface IInsertEventsEventParam {
    /** 事件 id 顺序 */
    readonly ids: readonly string[];
}

/** 事件：临时插入一个事件 */
export interface IInsertEventEventParam {
    /** 事件 id */
    readonly id: string;
}

/** 内建函数的稳定注册名称 */
export const enum EventBuiltinName {
    SetBlock = 'eventSetBlock',
    MoveBlock = 'eventMoveBlock',
    DeleteBlock = 'eventDeleteBlock',
    MoveHero = 'eventMoveHero',
    MoveHeroStep = 'eventMoveHeroStep',
    TouchFront = 'eventTouchFront',
    InsertEvents = 'eventInsertEvents',
    InsertEvent = 'eventInsertEvent'
}

//#endregion
