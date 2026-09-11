import { BuiltInFunction } from 'anon-tokyo';
import {
    BlockEventType,
    IBlockEventEnv,
    IGameEventInvocation
} from '@user/data-system';
import {
    IGameMap,
    IHeroLocation,
    IHeroMover,
    IMapLayer,
    IReadonlyTileBase as IReadonlyMapTileBase
} from '@user/data-base';
import {
    EventTrigger,
    FaceDirection,
    IMoverController,
    IObjectMovable,
    IObjectMover,
    ObjectMoveStep,
    ObjectMoveType,
    ObjectSpecialStep
} from '@user/data-common';
import {
    EventBuiltinName,
    IMoveHeroEventParam,
    IMoveHeroStepEventParam,
    ITouchFrontEventParam
} from './types';
import { getEventRuntime } from './event';

/** 通过环境参量获取可能的地图对象 */
export function getPossibleMap(env: IBlockEventEnv): IGameMap | null {
    if (env.map) return env.map;
    if (env.layer) return env.layer.map;

    const map = env.state.maps.getMap(env.heroFloor);
    if (map) return map;

    return null;
}

/** 通过环境参量获取可能的事件图层 */
export function getPossibleLayer(env: IBlockEventEnv): IMapLayer | null {
    if (env.layer) return env.layer;

    const map = getPossibleMap(env);
    if (map?.eventLayer) return map.eventLayer;

    return null;
}

/** 启动勇士移动并等待其完整结束 */
export function appendMoveSteps<T extends IObjectMovable>(
    mover: IObjectMover<T>,
    steps: readonly ObjectMoveStep[]
): void {
    for (const step of steps) {
        switch (step.type) {
            case ObjectMoveType.Dir:
                mover.step(step.move);
                break;
            case ObjectMoveType.DirFace:
                mover.stepFace(step.move, step.face);
                break;
            case ObjectMoveType.Speed:
                mover.speed(step.value);
                break;
            case ObjectMoveType.Face:
                mover.face(step.value);
                break;
            case ObjectMoveType.Special:
                if (step.direction === ObjectSpecialStep.Forward) {
                    mover.forward();
                } else {
                    mover.backward();
                }
                break;
            case ObjectMoveType.AnimDir:
                mover.animDir(step.dir);
                break;
            case ObjectMoveType.Teleport:
                mover.tp(step.x, step.y, step.rel);
                break;
            case ObjectMoveType.Jump:
                mover.jump(step.x, step.y, step.rel);
                break;
        }
    }
}

/** 启动勇士移动并等待其完整结束 */
async function startHeroMove(
    mover: IHeroMover<IHeroLocation>,
    steps: readonly ObjectMoveStep[]
): Promise<void> {
    if (mover.moving) return;
    appendMoveSteps(mover, steps);
    const controller: Readonly<IMoverController> | null = mover.start();
    if (!controller) return;
    await controller.onEnd;
}

/** 获取可以执行移动的勇士移动器 */
function getHeroMover(env: IBlockEventEnv): IHeroMover<IHeroLocation> | null {
    const hero = env.state.hero;
    if (!hero) return null;
    return hero.location.mover;
}

/** 按指定移动序列移动勇士 */
export async function eventMoveHero(
    param: IMoveHeroEventParam,
    env: IBlockEventEnv
): Promise<void> {
    const mover = getHeroMover(env);
    if (!mover) return;
    await startHeroMove(mover, param.steps);
}

/** 让勇士沿当前朝向移动一步 */
export async function eventMoveHeroStep(
    _param: IMoveHeroStepEventParam,
    env: IBlockEventEnv
): Promise<void> {
    const mover = getHeroMover(env);
    if (!mover) return;
    if (mover.moving) return;
    mover.forward(1);
    const controller = mover.start();
    if (!controller) return;
    await controller.onEnd;
}

interface IEventSource {
    readonly priority: number;
    readonly id: string;
    readonly type: BlockEventType;
    readonly tile: IReadonlyMapTileBase | null;
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

export class MoveHeroEventRegistration implements BuiltInFunction {
    readonly name: EventBuiltinName.MoveHero = EventBuiltinName.MoveHero;
    readonly func: BuiltInFunction['func'] =
        eventMoveHero as BuiltInFunction['func'];
}

export class MoveHeroStepEventRegistration implements BuiltInFunction {
    readonly name: EventBuiltinName.MoveHeroStep =
        EventBuiltinName.MoveHeroStep;
    readonly func: BuiltInFunction['func'] =
        eventMoveHeroStep as BuiltInFunction['func'];
}

export class TouchFrontEventRegistration implements BuiltInFunction {
    readonly name: EventBuiltinName.TouchFront = EventBuiltinName.TouchFront;
    readonly func: BuiltInFunction['func'] =
        eventTouchFront as BuiltInFunction['func'];
}

/** 创建勇士控制事件的内建函数注册项 */
export function createHeroEventBuiltinRegistrations(): ReadonlyArray<BuiltInFunction> {
    return [
        new MoveHeroEventRegistration(),
        new MoveHeroStepEventRegistration(),
        new TouchFrontEventRegistration()
    ];
}
