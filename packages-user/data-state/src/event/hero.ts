import { BuiltInFunction } from '@motajs/anon-tokyo';
import {
    BlockEventType,
    IBlockEventEnv,
    IGameEventInvocation
} from '@user/data-system';
import { IReadonlyTileBase as IReadonlyMapTileBase } from '@user/data-base';
import { EventTrigger, FaceDirection } from '@user/data-common';
import {
    IMoveHeroEventParam,
    IMoveHeroStepEventParam,
    ITouchFrontEventParam
} from './types';
import { getEventExecutor, getPossibleLayer } from './utils';

interface IEventSource {
    readonly priority: number;
    readonly id: string;
    readonly type: BlockEventType;
    readonly tile: IReadonlyMapTileBase | null;
}

export class EventMoveHero implements BuiltInFunction<
    IMoveHeroEventParam,
    IBlockEventEnv
> {
    name: string = 'moveHero';

    async func(param: IMoveHeroEventParam, env: IBlockEventEnv) {
        const mover = env.state.hero.location.mover;
        if (mover.moving) return;

        mover.push([...param.steps]);
        const controller = mover.start();
        if (!controller) return;
        await controller.onEnd;
    }
}

export class EventMoveHeroStep implements BuiltInFunction<
    IMoveHeroStepEventParam,
    IBlockEventEnv
> {
    name: string = 'moveHeroStep';

    async func(_param: IMoveHeroStepEventParam, env: IBlockEventEnv) {
        const mover = env.state.hero.location.mover;
        if (mover.moving) return;

        mover.forward(1);
        const controller = mover.start();
        if (!controller) return;
        await controller.onEnd;
    }
}

export class EventTouchFront implements BuiltInFunction<
    ITouchFrontEventParam,
    IBlockEventEnv
> {
    name: string = 'touchFront';

    async func(_param: ITouchFrontEventParam, env: IBlockEventEnv) {
        const layer = getPossibleLayer(env);
        if (!layer) return;

        const executor = getEventExecutor(env);
        if (!executor) return;

        const hero = env.state.hero.getLocation();
        const mover = env.state.hero.location.mover;
        const direction = mover.tile.getCurrentFaceDirection();
        if (direction === FaceDirection.Unknown) return;
        const movement = mover.faceHandler.movement(direction);
        const x = hero.x + movement.x;
        const y = hero.y + movement.y;
        if (!layer.inMap(x, y)) return;

        const invocations = this.collectInvocations(
            env,
            layer,
            x,
            y,
            EventTrigger.OnTouch
        );
        if (invocations.length === 0) return;
        await executor.execute<void>(invocations, { custom: {} });
    }

    /**
     * 按坐标收集事件来源并保留其触发环境
     */
    private collectInvocations(
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
                for (const [priority, id] of location.static
                    .tileEvent()
                    .get()) {
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
}
