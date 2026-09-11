import { BuiltInFunction } from 'anon-tokyo';
import {
    IBlockEventEnv,
    IBlockEventParam,
    IGameEventExecutor,
    IGameEventInvocation,
    IGameEventSystem
} from '@user/data-system';
import { IGameEventStore } from '@user/data-common';
import { IStateBase } from '@user/data-base';
import {
    EventBuiltinName,
    IInsertEventEventParam,
    IInsertEventsEventParam
} from './types';

interface IEventState extends IStateBase {
    readonly eventSystem: IGameEventSystem;
}

const EVENT_INSERT_MAX_DEPTH = 32;
const eventInsertDepth: WeakMap<IBlockEventEnv, number> = new WeakMap();

/** 判断状态是否包含事件执行器 */
function hasEventSystem(state: IStateBase): state is IEventState {
    return 'eventSystem' in state;
}

/** 从环境获取事件执行器和事件存储器 */
export function getEventRuntime(env: IBlockEventEnv): {
    readonly executor: IGameEventExecutor;
    readonly store: IGameEventStore;
} | null {
    if (!hasEventSystem(env.state)) return null;
    const store = env.state.eventStore;
    if (!store) return null;
    return {
        executor: env.state.eventSystem.executor,
        store
    };
}

/** 过滤存在的事件 id 并构造临时事件调用 */
function collectEventInvocations(
    ids: readonly string[],
    env: IBlockEventEnv,
    store: IGameEventStore
): IGameEventInvocation[] {
    const invocations: IGameEventInvocation[] = [];
    for (const id of ids) {
        if (
            !id ||
            !store.getEvent<IBlockEventParam, IBlockEventEnv, void>(id)
        ) {
            continue;
        }
        invocations.push({ id, env });
    }
    return invocations;
}

/** 临时按顺序执行指定事件 */
export async function eventInsertEvents(
    param: IInsertEventsEventParam,
    env: IBlockEventEnv
): Promise<void> {
    if (param.ids.length === 0) return;
    const runtime = getEventRuntime(env);
    if (!runtime) return;
    const depth = eventInsertDepth.get(env) ?? 0;
    if (depth >= EVENT_INSERT_MAX_DEPTH) return;
    const invocations = collectEventInvocations(param.ids, env, runtime.store);
    if (invocations.length === 0) return;
    eventInsertDepth.set(env, depth + 1);
    try {
        await runtime.executor.execute<void>(invocations, { custom: {} });
    } finally {
        eventInsertDepth.delete(env);
    }
}

/** 临时直接执行一段事件语句 */
export async function eventInsertEvent(
    param: IInsertEventEventParam,
    env: IBlockEventEnv
): Promise<void> {
    if (param.length === 0 || !hasEventSystem(env.state)) return;
    const depth = eventInsertDepth.get(env) ?? 0;
    if (depth >= EVENT_INSERT_MAX_DEPTH) return;
    eventInsertDepth.set(env, depth + 1);
    try {
        await env.state.eventSystem.executor.interpreter.exec(
            param,
            { custom: {} },
            env
        );
    } finally {
        eventInsertDepth.delete(env);
    }
}

export class InsertEventsEventRegistration implements BuiltInFunction {
    readonly name: EventBuiltinName.InsertEvents =
        EventBuiltinName.InsertEvents;
    readonly func: BuiltInFunction['func'] =
        eventInsertEvents as BuiltInFunction['func'];
}

export class InsertEventEventRegistration implements BuiltInFunction {
    readonly name: EventBuiltinName.InsertEvent = EventBuiltinName.InsertEvent;
    readonly func: BuiltInFunction['func'] =
        eventInsertEvent as BuiltInFunction['func'];
}
