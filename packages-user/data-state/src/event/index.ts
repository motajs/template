import { BuiltInFunction } from 'anon-tokyo';
import { IBlockEventEnv } from '@user/data-system';
import { ObjectMoveStep } from '@user/data-common';
import { eventDeleteBlock, eventMoveBlock, eventSetBlock } from './map';
import { eventMoveHero, eventMoveHeroStep } from './hero';
import { eventInsertEvent, eventInsertEvents, eventTouchFront } from './event';
import {
    EventBuiltinName,
    IDeleteBlockEventParam,
    IInsertEventEventParam,
    IInsertEventsEventParam,
    IMoveBlockEventParam,
    IMoveHeroEventParam,
    ISetBlockEventParam
} from './types';

function readProperty(value: object, key: string): unknown {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return descriptor ? descriptor.value : undefined;
}

function readNumber(value: object, key: string): number | null {
    const result = readProperty(value, key);
    return typeof result === 'number' ? result : null;
}

function readString(value: object, key: string): string | null {
    const result = readProperty(value, key);
    return typeof result === 'string' ? result : null;
}

function readBoolean(value: object, key: string): boolean | undefined {
    const result = readProperty(value, key);
    return typeof result === 'boolean' ? result : undefined;
}

function isObjectMoveStep(value: unknown): value is ObjectMoveStep {
    if (!value || typeof value !== 'object') return false;
    return typeof readProperty(value, 'type') === 'number';
}

function readMoveSteps(
    value: object,
    key: string
): readonly ObjectMoveStep[] | null {
    const result = readProperty(value, key);
    if (!Array.isArray(result)) return null;
    if (!result.every(isObjectMoveStep)) return null;
    return result;
}

function readStringArray(value: object, key: string): readonly string[] | null {
    const result = readProperty(value, key);
    if (!Array.isArray(result)) return null;
    if (!result.every(item => typeof item === 'string')) return null;
    return result;
}

function parseSetBlock(param: object): ISetBlockEventParam | null {
    const x = readNumber(param, 'x');
    const y = readNumber(param, 'y');
    const tile = readProperty(param, 'tile');
    if (x === null || y === null) return null;
    if (typeof tile !== 'number' && typeof tile !== 'string') return null;
    return { x, y, tile };
}

function parseMoveBlock(param: object): IMoveBlockEventParam | null {
    const x = readNumber(param, 'x');
    const y = readNumber(param, 'y');
    const steps = readMoveSteps(param, 'steps');
    if (x === null || y === null || !steps) return null;
    return { x, y, steps, safe: readBoolean(param, 'safe') };
}

function parseDeleteBlock(param: object): IDeleteBlockEventParam | null {
    const x = readNumber(param, 'x');
    const y = readNumber(param, 'y');
    if (x === null || y === null) return null;
    return { x, y };
}

function parseMoveHero(param: object): IMoveHeroEventParam | null {
    const steps = readMoveSteps(param, 'steps');
    return steps ? { steps } : null;
}

function parseInsertEvents(param: object): IInsertEventsEventParam | null {
    const ids = readStringArray(param, 'ids');
    return ids ? { ids } : null;
}

function parseInsertEvent(param: object): IInsertEventEventParam | null {
    const id = readString(param, 'id');
    return id === null ? null : { id };
}

type BuiltinParameter = Parameters<BuiltInFunction['func']>[0];
type BuiltinEnvironment = Parameters<BuiltInFunction['func']>[1];

function isBlockEventEnv(value: BuiltinEnvironment): value is IBlockEventEnv {
    return (
        'state' in value &&
        'type' in value &&
        'trigger' in value &&
        'heroLocator' in value &&
        'heroFloor' in value &&
        'triggerLocator' in value &&
        'tile' in value &&
        'layer' in value &&
        'map' in value
    );
}

type EventBuiltinHandler = (
    param: BuiltinParameter,
    env: IBlockEventEnv
) => void | Promise<void>;

function createBuiltin(handler: EventBuiltinHandler): BuiltInFunction['func'] {
    return (param: BuiltinParameter, env: BuiltinEnvironment) => {
        if (!isBlockEventEnv(env)) return;
        return handler(param, env);
    };
}

/** 创建八个批准事件 built-in 的稳定注册项 */
export function createEventBuiltinRegistrations(): ReadonlyArray<BuiltInFunction> {
    const registrations: BuiltInFunction[] = [
        {
            name: EventBuiltinName.SetBlock,
            func: createBuiltin((param, env) => {
                const parsed = parseSetBlock(param);
                if (!parsed) return;
                return eventSetBlock(parsed, env);
            })
        },
        {
            name: EventBuiltinName.MoveBlock,
            func: createBuiltin((param, env) => {
                const parsed = parseMoveBlock(param);
                if (!parsed) return;
                return eventMoveBlock(parsed, env);
            })
        },
        {
            name: EventBuiltinName.DeleteBlock,
            func: createBuiltin((param, env) => {
                const parsed = parseDeleteBlock(param);
                if (!parsed) return;
                return eventDeleteBlock(parsed, env);
            })
        },
        {
            name: EventBuiltinName.MoveHero,
            func: createBuiltin((param, env) => {
                const parsed = parseMoveHero(param);
                if (!parsed) return;
                return eventMoveHero(parsed, env);
            })
        },
        {
            name: EventBuiltinName.MoveHeroStep,
            func: createBuiltin((_param, env) => eventMoveHeroStep({}, env))
        },
        {
            name: EventBuiltinName.TouchFront,
            func: createBuiltin((_param, env) => eventTouchFront({}, env))
        },
        {
            name: EventBuiltinName.InsertEvents,
            func: createBuiltin((param, env) => {
                const parsed = parseInsertEvents(param);
                if (!parsed) return;
                return eventInsertEvents(parsed, env);
            })
        },
        {
            name: EventBuiltinName.InsertEvent,
            func: createBuiltin((param, env) => {
                const parsed = parseInsertEvent(param);
                if (!parsed) return;
                return eventInsertEvent(parsed, env);
            })
        }
    ];
    return registrations;
}

export * from './event';
export * from './hero';
export * from './map';
export * from './types';
