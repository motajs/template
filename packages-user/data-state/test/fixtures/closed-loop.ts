import { AnonTokyoInterpreter } from 'anon-tokyo';
import {
    EventTrigger,
    FaceDirection,
    IReplaySandbox,
    TileType
} from '@user/data-common';
import { IGameMap, IMapLayer } from '@user/data-base';
import { IReadonlyBlockEvent } from '@user/data-system';
import { ReplaySystem } from '../../../data-common/src/replay/system';
import { createCoreState, CoreState } from '../../src/core';

export interface IClosedLoopFixture {
    readonly state: CoreState;
    readonly map: IGameMap;
    readonly eventLayer: IMapLayer;
    readonly replay: ReplaySystem;
    readonly sandbox: IReplaySandbox;
    readonly eventCompleted: () => boolean;
}

const MOVE_RIGHT_COMMAND = 1;

export function createClosedLoopFixture(): IClosedLoopFixture {
    const state = createCoreState();
    state.tileStore.addTile({
        num: 1,
        id: 'floor',
        events: { 10: 'mutate-map' },
        type: TileType.Terrain,
        pass: { onlyEvents: false, outPass: 0b1111, inPass: 0b1111 },
        eventPass: true
    });
    state.tileStore.addTile({
        num: 2,
        id: 'changed-floor',
        events: {},
        type: TileType.Terrain,
        pass: { onlyEvents: false, outPass: 0b1111, inPass: 0b1111 },
        eventPass: true
    });

    const map = state.maps.fromRaw({
        floorId: 'F1',
        width: 3,
        map: { 20: [1, 1, 1] },
        layerAlias: { 20: 'event' },
        events: { 20: {} }
    });
    if (!map || !map.eventLayer) {
        throw new Error('closed-loop fixture map was not created');
    }
    const eventLayer = map.eventLayer;
    let completed = false;
    const event: IReadonlyBlockEvent = {
        interpreter: new AnonTokyoInterpreter({
            builtInFunctions: [],
            globalFunctions: []
        }),
        trigger: EventTrigger.OnEnter,
        rawEvent: [],
        compiled: null,
        compile: () => null,
        execute: async (_param, env) => {
            await Promise.resolve();
            if (!env.layer || !env.triggerLocator) {
                throw new Error('closed-loop event lost its map source');
            }
            env.layer.setBlock(2, env.triggerLocator.x, env.triggerLocator.y);
            completed = true;
        }
    };
    state.eventStore.addEvent('mutate-map', event);

    state.hero.location.setFloor('F1');
    state.hero.location.setPos(0, 0);
    state.hero.location.mover.setFaceDir(FaceDirection.Right);

    const replay = new ReplaySystem();
    replay.registerCommand(MOVE_RIGHT_COMMAND, {
        execute: async step => {
            if (step.params.length !== 0) return false;
            const mover = state.hero.location.mover;
            mover.step(FaceDirection.Right);
            const controller = mover.start();
            if (!controller) return false;
            await controller.onEnd;
            return true;
        }
    });
    replay.record(MOVE_RIGHT_COMMAND);

    const reset = () => {
        eventLayer.setMapRef(new Uint32Array([1, 1, 1]));
        state.hero.location.setFloor('F1');
        state.hero.location.setPos(0, 0);
        state.hero.location.mover.setFaceDir(FaceDirection.Right);
        completed = false;
    };
    const sandbox = replay.createReplaySandbox({
        route: replay.route,
        reseter: { reset }
    });

    return {
        state,
        map,
        eventLayer,
        replay,
        sandbox,
        eventCompleted: () => completed
    };
}
