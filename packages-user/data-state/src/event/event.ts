import { BuiltInFunction } from 'anon-tokyo';
import {
    IBlockEventEnv,
    IBlockEventParam,
    IGameEventExecutor,
    IGameEventInvocation,
    IGameEventSystem,
    BlockEventType
} from '@user/data-system';
import {
    FaceDirection,
    EventTrigger,
    IGameEventStore
} from '@user/data-common';
import {
    IStateBase,
    IReadonlyTileBase as IReadonlyMapTileBase
} from '@user/data-base';
import { getPossibleLayer } from './map';
import {
    EventBuiltinName,
    IInsertEventEventParam,
    IInsertEventsEventParam,
    ITouchFrontEventParam
} from './types';

type ControlEventBuiltinHandler<TParam> = (
    param: TParam,
    env: IBlockEventEnv
) => void | Promise<void>;

function createControlEventBuiltin<TParam>(
    name: EventBuiltinName,
    handler: ControlEventBuiltinHandler<TParam>
): BuiltInFunction {
    return { name, func: handler as BuiltInFunction['func'] };
}

interface IEventSource {
    readonly priority: number;
    readonly id: string;
    readonly type: BlockEventType;
    readonly tile: IReadonlyMapTileBase | null;
}

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
function getEventRuntime(env: IBlockEventEnv): {
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

/** 按坐标收集事件来源并保留其触发环境 */
function collectInvocations(
    env: IBlockEventEnv,
    layer: NonNullable<IBlockEventEnv['layer']>,
    x: number,
    y: number,
    trigger: EventTrigger
): IGameEventInvocation[] {
    const pointSources: IEventSource[] = [];
    const tileSources: IEventSource[] = [];
    const point = layer.getPointEvent(x, y);
    const location = layer.getLocationData(x, y);
    if (point) {
        for (const [priority, id] of point) {
            pointSources.push({
                priority,
                id,
                type: BlockEventType.PointEvent,
                tile: null
            });
        }
    }
    if (location) {
        if (location.static) {
            for (const [priority, id] of location.static.tileEvent().get()) {
                tileSources.push({
                    priority,
                    id,
                    type: BlockEventType.TileEvent,
                    tile: location.static
                });
            }
        }
        for (const tile of location.dynamics) {
            for (const [priority, id] of tile.tileEvent().get()) {
                tileSources.push({
                    priority,
                    id,
                    type: BlockEventType.TileEvent,
                    tile
                });
            }
        }
    }
    pointSources.sort((a, b) => b.priority - a.priority);
    tileSources.sort((a, b) => b.priority - a.priority);

    const hero = env.state.hero.getLocation();
    const invocations: IGameEventInvocation[] = [];
    for (const source of [...pointSources, ...tileSources]) {
        const sourceEnv: IBlockEventEnv = {
            state: env.state,
            type: source.type,
            trigger,
            heroLocator: hero,
            heroFloor: env.heroFloor,
            triggerLocator: { x, y },
            tile: source.tile,
            layer,
            map: layer.map
        };
        invocations.push({ id: source.id, env: sourceEnv });
    }
    return invocations;
}

/** 触发勇士正面的 onTouch 事件 */
export async function eventTouchFront(
    _param: ITouchFrontEventParam,
    env: IBlockEventEnv
): Promise<void> {
    if (!env.state.hero) return;
    const layer = getPossibleLayer(env);
    if (!layer) return;
    const runtime = getEventRuntime(env);
    if (!runtime) return;

    const hero = env.state.hero.getLocation();
    const mover = env.state.hero.location.mover;
    const direction = mover.tile.getCurrentFaceDirection();
    if (direction === FaceDirection.Unknown) return;
    const movement = mover.faceHandler.movement(direction);
    const x = hero.x + movement.x;
    const y = hero.y + movement.y;
    if (!layer.inMap(x, y)) return;

    const invocations = collectInvocations(
        env,
        layer,
        x,
        y,
        EventTrigger.OnTouch
    );
    if (invocations.length === 0) return;
    await runtime.executor.execute<void>(invocations, { custom: {} });
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

/** 临时执行指定事件 */
export async function eventInsertEvent(
    param: IInsertEventEventParam,
    env: IBlockEventEnv
): Promise<void> {
    if (!param.id) return;
    await eventInsertEvents({ ids: [param.id] }, env);
}

/** 创建事件控制事件的内建函数注册项 */
export function createControlEventBuiltinRegistrations(): ReadonlyArray<BuiltInFunction> {
    return [
        createControlEventBuiltin(EventBuiltinName.TouchFront, eventTouchFront),
        createControlEventBuiltin(
            EventBuiltinName.InsertEvents,
            eventInsertEvents
        ),
        createControlEventBuiltin(
            EventBuiltinName.InsertEvent,
            eventInsertEvent
        )
    ];
}
