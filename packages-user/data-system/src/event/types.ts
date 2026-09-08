import {
    IBlockEventEnv,
    IBlockEventParam,
    IDataBaseExtended,
    IGameEventInvocation
} from '@user/data-base';
import { IGameEventStore } from '@user/data-common';
import { AnonTokyoInterpreter } from 'anon-tokyo';

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
