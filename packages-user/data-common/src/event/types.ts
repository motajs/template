import {
    AnonTokyoExecutable,
    AnonTokyoInterpreter,
    Statement
} from 'anon-tokyo';

export const enum EventTrigger {
    /** 无触发器，事件需要手动执行 */
    None,
    /** 当玩家触碰指定图块时触发，如果直接走入则不触发 */
    OnTouch,
    /** 当玩家进入指定图块时触发 */
    OnEnter,
    /** 当玩家离开指定图块时触发 */
    OnLeave,
    /** 当玩家与指定怪物战斗前触发，返回值表示是否与怪物战斗 */
    OnBeforeBattle,
    /** 当玩家与指定怪物战斗后触发 */
    OnAfterBattle,
    /** 当玩家开启指定门之前触发，返回值表示是否能够成功开启门 */
    OnBeforeOpenDoor,
    /** 当玩家开启指定门之后触发 */
    OnAfterOpenDoor,
    /** 当玩家成功拾取指定道具时触发 */
    OnAfterGetItem,
    /** 当玩家使用指定位置或图块触发楼层切换前触发，返回值表示是否执行切换操作 */
    OnBeforeChangeFloor,
    /** 当玩家使用指定位置或图块触发楼层切换后触发 */
    OnAfterChangeFloor
}

export interface IReadonlyGameEvent<
    P extends Record<string, any>,
    E extends Record<string, any>,
    R = void
> {
    /** 事件解释器 */
    readonly interpreter: AnonTokyoInterpreter;
    /** 事件触发器类型，由什么触发器触发 */
    readonly trigger: EventTrigger;
    /** 原始事件数据 */
    readonly rawEvent: Statement[];
    /** 已编译事件数据，可直接执行 */
    readonly compiled: AnonTokyoExecutable | null;

    /**
     * 编译此事件
     */
    compile(): AnonTokyoExecutable | null;

    /**
     * 执行此游戏事件
     * @param param 事件参数
     */
    execute(param: P, env: E): Promise<R>;
}

export interface IGameEvent<
    P extends Record<string, any>,
    E extends Record<string, any>,
    R = void
> extends IReadonlyGameEvent<P, E, R> {
    /**
     * 设置此事件的触发器
     * @param trigger 触发器类型
     */
    setTrigger(trigger: EventTrigger): void;

    /**
     * 设置事件的原始数据
     * @param raw 事件原始数据
     */
    setRaw(raw: Statement[]): void;
}
