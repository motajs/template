import { IMapLayer, IReadonlyTileBase, IStateBase } from '@user/data-base';
import { EventTrigger, IGameEventStore } from '@user/data-common';
import { AnonTokyoInterpreter, BuiltInFunction } from '@motajs/anon-tokyo';
import { EventExecutor } from './executor';
import {
    BlockEventType,
    IBlockEventEnv,
    IGameEventExecutor,
    IGameEventInvocation,
    IGameEventSystem
} from './types';

interface IEventSource {
    readonly priority: number;
    readonly id: string;
    readonly type: BlockEventType;
    readonly tile: IReadonlyTileBase | null;
}

export class GameEventSystem implements IGameEventSystem {
    readonly executor: IGameEventExecutor;
    store: IGameEventStore | null;

    constructor(
        readonly state: IStateBase,
        builtins: ReadonlyArray<BuiltInFunction> = []
    ) {
        this.store = state.eventStore;
        const interpreter = new AnonTokyoInterpreter({
            builtInFunctions: [...builtins],
            globalFunctions: []
        });
        this.executor = new EventExecutor(interpreter, () => this.store);
    }

    useStore(store: IGameEventStore | null): void {
        this.store = store;
    }

    collectEvent(
        layer: IMapLayer,
        trigger: EventTrigger,
        x: number,
        y: number
    ): IGameEventInvocation[] {
        if (!layer.inMap(x, y)) return [];

        const pointSources: IEventSource[] = [];
        const tileSources: IEventSource[] = [];

        const point = layer.getPointEvent(x, y);
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

        const loc = layer.getLocationData(x, y);
        if (loc) {
            if (loc.static) {
                for (const [priority, id] of loc.static.tileEvent().get()) {
                    tileSources.push({
                        priority,
                        id,
                        type: BlockEventType.TileEvent,
                        tile: loc.static
                    });
                }
            }
            for (const tile of loc.dynamics) {
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

        const invocations: IGameEventInvocation[] = [];
        for (const source of [...pointSources, ...tileSources]) {
            const env: IBlockEventEnv = {
                state: this.state,
                type: source.type,
                trigger,
                system: this,
                heroLocator: this.state.hero.location,
                heroFloor: this.state.hero.location.floorId,
                triggerLocator: { x, y },
                tile: source.tile,
                layer,
                map: layer.map
            };
            invocations.push({ id: source.id, env });
        }

        return invocations;
    }
}
