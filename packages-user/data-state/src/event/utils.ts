import { IGameMap, IMapLayer, IStateBase } from '@user/data-base';
import {
    IBlockEventEnv,
    IGameEventExecutor,
    IGameEventSystem
} from '@user/data-system';

interface IEventState extends IStateBase {
    readonly eventSystem: IGameEventSystem;
}

/**
 * 判断状态对象是否包含事件系统
 */
function hasEventSystem(state: IStateBase): state is IEventState {
    return 'eventSystem' in state;
}

/**
 * 通过环境参量获取可能的地图对象
 */
export function getPossibleMap(env: IBlockEventEnv): IGameMap | null {
    if (env.map) return env.map;
    if (env.layer) return env.layer.map;

    const map = env.state.maps.getMap(env.heroFloor);
    if (map) return map;

    return null;
}

/**
 * 通过环境参量获取可能的事件图层
 */
export function getPossibleLayer(env: IBlockEventEnv): IMapLayer | null {
    if (env.layer) return env.layer;

    const map = getPossibleMap(env);
    if (map?.eventLayer) return map.eventLayer;

    return null;
}

/**
 * 通过环境参量获取事件执行器
 */
export function getEventExecutor(
    env: IBlockEventEnv
): IGameEventExecutor | null {
    if (!hasEventSystem(env.state)) return null;
    return env.state.eventSystem.executor;
}

/** 事件插入允许的最大嵌套深度 */
const EVENT_INSERT_MAX_DEPTH = 32;
/** 每个环境当前的事件插入深度 */
const eventInsertDepth: WeakMap<IBlockEventEnv, number> = new WeakMap();

/**
 * 进入一层事件插入，超过最大嵌套深度时返回 false
 */
export function enterEventInsert(env: IBlockEventEnv): boolean {
    const depth = eventInsertDepth.get(env) ?? 0;
    if (depth >= EVENT_INSERT_MAX_DEPTH) return false;
    eventInsertDepth.set(env, depth + 1);
    return true;
}

/**
 * 退出一层事件插入
 */
export function exitEventInsert(env: IBlockEventEnv): void {
    eventInsertDepth.delete(env);
}
