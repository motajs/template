import { EventTrigger, GameEvent, IGameEventStore } from '@user/data-common';
import { AnonTokyoInterpreter, Statement } from 'anon-tokyo';

/** 旧样板内部加载边界使用的序列化事件定义 */
export interface ISerializedEventData {
    readonly trigger: EventTrigger;
    readonly rawEvent: Statement[];
}

/** 事件 id 到序列化事件定义的映射 */
export interface ISerializedEventDefinitions {
    readonly [id: string]: ISerializedEventData;
}

interface IRuntimeStatement {
    readonly type?: unknown;
}

function isStatement(value: unknown): value is Statement {
    if (!value || typeof value !== 'object') return false;
    const statement = value as IRuntimeStatement;
    return (
        typeof statement.type === 'number' &&
        Number.isInteger(statement.type) &&
        statement.type >= 0 &&
        statement.type <= 10
    );
}

function isEventTrigger(value: unknown): value is EventTrigger {
    return (
        typeof value === 'number' &&
        Number.isInteger(value) &&
        value >= EventTrigger.None &&
        value <= EventTrigger.OnAfterChangeFloor
    );
}

function isSerializedEventData(value: unknown): value is ISerializedEventData {
    if (!value || typeof value !== 'object') return false;
    const data = value as ISerializedEventData;
    return isEventTrigger(data.trigger) && Array.isArray(data.rawEvent)
        ? data.rawEvent.every(isStatement)
        : false;
}

/** 将内部序列化事件定义转换为带有统一解释器的游戏事件实例 */
export function registerSerializedEvents(
    store: IGameEventStore,
    interpreter: AnonTokyoInterpreter,
    definitions: ISerializedEventDefinitions
): void {
    if (!definitions || typeof definitions !== 'object') return;
    for (const [id, data] of Object.entries(definitions)) {
        if (!id || !isSerializedEventData(data)) continue;
        const event = new GameEvent<
            Record<string, any>,
            Record<string, any>,
            any
        >(interpreter, data.rawEvent);
        event.setTrigger(data.trigger);
        store.addEvent(id, event);
    }
}
