import { ITileLocator } from '@motajs/common';
import {
    IDataBaseExtended,
    IGameMap,
    IMapLayer,
    IReadonlyTileBase
} from '@user/data-base';
import {
    EventTrigger,
    IGameEvent,
    IGameEventStore,
    IReadonlyGameEvent
} from '@user/data-common';
import { AnonTokyoInterpreter } from 'anon-tokyo';

export const enum BlockEventType {
    /** 普通事件类型，一般是手动触发的 */
    CommonEvent,
    /** 点事件类型 */
    PointEvent,
    /** 图块事件类型 */
    TileEvent
}

export interface IBlockEventParam {
    /** 自定义参数 */
    readonly custom: Record<string, any>;
}

export interface IBlockEventEnv extends IDataBaseExtended {
    /** 事件类型 */
    readonly type: BlockEventType;
    /** 本次事件的触发器类型 */
    readonly trigger: EventTrigger;
    /** 触发事件时玩家的位置 */
    readonly heroLocator: Readonly<ITileLocator>;
    /** 触发事件时玩家的位置 */
    readonly heroFloor: string;
    /** 触发事件时触发者的位置，有可能不存在 */
    readonly triggerLocator: Readonly<ITileLocator> | null;
    /** 触发事件的图块，有可能不存在 */
    readonly tile: IReadonlyTileBase | null;
    /** 触发事件的图层，有可能不存在 */
    readonly layer: IMapLayer | null;
    /** 触发事件的地图，有可能不存在 */
    readonly map: IGameMap | null;
}

export interface IGameEventInvocation {
    /** 事件在 `IGameEventStore` 中的 id */
    readonly id: string;
    /** 此次调用对应的真实来源环境 */
    readonly env: IBlockEventEnv;
}

export interface IReadonlyBlockEvent<R = void> extends IReadonlyGameEvent<
    IBlockEventParam,
    IBlockEventEnv,
    R
> {}

export interface IBlockEvent<R = void> extends IGameEvent<
    IBlockEventParam,
    IBlockEventEnv,
    R
> {}

export const enum EventExecuteMode {
    /** 正常顺序执行，执行完前一个后执行后一个 */
    Normal,
    /** 若事件执行过程中有任意事件返回了 `falsy` 值，立刻结束事件的运行 */
    CutIfFalsy,
    /** 若事件执行过程中有任意事件返回了 `truthy` 值，立刻结束事件的运行 */
    CutIfTruthy
}

export const enum EventReduceMode {
    /** 不对事件的返回值做折叠处理，按照执行顺序将事件返回值组成一个列表返回 */
    NoReduce,
    /**
     * 将每个事件的返回值取或后返回，如果返回值类型不是布尔值，
     * 那么按照正常短路运算符规则输出返回值，并抛出警告。
     */
    OrReduce,
    /**
     * 将每个事件的返回值取与后返回，如果返回值类型不是布尔值，
     * 那么按照正常短路运算符规则输出返回值，并抛出警告
     */
    AndReduce
}

export type GameEventBuiltinFunction = (
    param: IBlockEventParam,
    env: IBlockEventEnv
) => any;

export interface IGameEventInit {
    /**
     * 向事件系统添加内建函数
     * @param name 函数名称
     * @param func 函数内容
     */
    addBuiltinFunction(name: string, func: GameEventBuiltinFunction): void;
}

export interface IGameEventExecutor {
    /** 当前的执行器执行模式 */
    readonly mode: EventExecuteMode;
    /** 当前的执行器返回值折叠方式 */
    readonly reduce: EventReduceMode;
    /** 事件解释器 */
    readonly interpreter: AnonTokyoInterpreter;

    /**
     * 设置执行器的执行模式
     * @param mode 执行模式
     */
    setMode(mode: EventExecuteMode): void;

    /**
     * 设置执行器的返回值折叠方式
     * @param reduce 折叠方式
     */
    setReduce(reduce: EventReduceMode): void;

    /**
     * 执行指定的事件列表
     * @param events 带有来源环境的事件调用列表
     * @param param 传递给事件的参数
     */
    execute<R = void>(
        events: IGameEventInvocation[],
        param: IBlockEventParam
    ): Promise<R>;
}

export interface IGameEventSystem extends IDataBaseExtended {
    /** 游戏事件执行器 */
    readonly executor: IGameEventExecutor;
    /** 事件系统使用的存储器 */
    readonly store: IGameEventStore | null;

    /**
     * 设置系统使用的事件存储器
     * @param store 事件存储器
     */
    useStore(store: IGameEventStore | null): void;
}
