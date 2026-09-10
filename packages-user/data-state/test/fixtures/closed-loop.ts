import { Statement, StatementType } from 'anon-tokyo';
import {
    EventTrigger,
    FaceDirection,
    IReplaySandbox,
    IReplaySystem,
    IReplayArray,
    IEnemyAttr,
    IHeroAttr,
    SaveCompression,
    TileType
} from '@user/data-common';
import {
    IEnemyManagerSaveState,
    IFlagSystemSave,
    IGameMap,
    IHeroStateSave,
    IMapLayer,
    IMapStoreSave
} from '@user/data-base';
import { CoreState, createCoreState } from '../../src/core.ts';
import {
    ILegacySerializedLoadData,
    LOAD_SERIALIZED_DATA
} from '../../src/legacy/dependencies.ts';
import { ReplayCommandCode } from '../../src/replay/types.ts';

export interface IClosedLoopLayerSnapshot {
    readonly zIndex: number;
    readonly matrix: Uint32Array;
}

export interface IClosedLoopFloorSnapshot {
    readonly floorId: string;
    readonly layers: readonly IClosedLoopLayerSnapshot[];
}

export interface IClosedLoopExpectedSnapshot {
    readonly hero: IHeroAttr;
    readonly maps: readonly IClosedLoopFloorSnapshot[];
}

export interface IClosedLoopInitialState {
    readonly hero: IHeroStateSave<IHeroAttr>;
    readonly flags: IFlagSystemSave;
    readonly maps: IMapStoreSave;
    readonly enemy: IEnemyManagerSaveState<IEnemyAttr>;
}

export interface IClosedLoopFixture {
    readonly state: CoreState;
    readonly map: IGameMap;
    readonly eventLayer: IMapLayer;
    readonly replay: IReplaySystem;
    readonly route: IReplayArray;
    readonly sandbox: IReplaySandbox;
    readonly initialState: IClosedLoopInitialState;
    readonly expected: IClosedLoopExpectedSnapshot;
    readonly eventId: string;
    readonly rawEvent: Statement[];
    readonly reset: () => void;
    readonly eventCompleted: () => boolean;
}

export function createClosedLoopFixture(): IClosedLoopFixture {
    const state = createCoreState();
    state.tileStore.addTile({
        num: 1,
        id: 'floor',
        events: {},
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

    const rawEvent: Statement[] = [
        {
            type: StatementType.Call,
            functionName: 'eventSetBlock',
            builtIn: true,
            async: true,
            parameters: { x: 1, y: 0, tile: 2 }
        }
    ];
    const serialized: ILegacySerializedLoadData = {
        events: {
            'mutate-map': {
                trigger: EventTrigger.OnEnter,
                rawEvent
            }
        },
        maps: [
            {
                floorId: 'F1',
                width: 3,
                map: {
                    0: [7, 7, 7],
                    10: [8, 8, 8],
                    20: [1, 1, 1],
                    30: [9, 9, 9],
                    40: [10, 10, 10]
                },
                layerAlias: {
                    0: 'bg',
                    10: 'bg2',
                    20: 'event',
                    30: 'fg',
                    40: 'fg2'
                },
                events: {
                    0: {},
                    10: {},
                    20: { 1: { 10: 'mutate-map' } },
                    30: {},
                    40: {}
                }
            },
            {
                floorId: 'F2',
                width: 2,
                map: {
                    0: [11, 11, 11, 11],
                    10: [12, 12, 12, 12],
                    20: [13, 13, 13, 13],
                    30: [14, 14, 14, 14],
                    40: [15, 15, 15, 15]
                },
                layerAlias: {
                    0: 'bg',
                    10: 'bg2',
                    20: 'event',
                    30: 'fg',
                    40: 'fg2'
                },
                events: {
                    0: {},
                    10: {},
                    20: {},
                    30: {},
                    40: {}
                }
            }
        ]
    };
    state[LOAD_SERIALIZED_DATA](serialized);
    const map = state.maps.getMap('F1');
    if (!map || !map.eventLayer) {
        throw new Error('closed-loop fixture map was not created');
    }
    const secondMap = state.maps.getMap('F2');
    if (!secondMap || !secondMap.eventLayer) {
        throw new Error('closed-loop fixture second map was not created');
    }
    const eventLayer = map.eventLayer;
    state.maps.setMapActiveStatus('F1', true);
    state.maps.setMapActiveStatus('F2', true);

    state.hero.location.setFloor('F1');
    state.hero.location.setPos(0, 0);
    state.hero.location.mover.setFaceDir(FaceDirection.Right);

    const replay = state.replaySystem;
    replay.record(ReplayCommandCode.Right);
    const route = replay.route;

    const initialState: IClosedLoopInitialState = {
        hero: state.hero.saveState(SaveCompression.NoCompression),
        flags: state.flags.saveState(SaveCompression.NoCompression),
        maps: state.maps.saveState(SaveCompression.NoCompression),
        enemy: state.enemyManager.saveState(SaveCompression.NoCompression)
    };

    const expected: IClosedLoopExpectedSnapshot = {
        hero: {
            name: '',
            hp: 1,
            hpmax: 0,
            atk: 0,
            def: 0,
            mdef: 0,
            mana: 0,
            manamax: 0,
            money: 0,
            exp: 0
        },
        maps: [
            {
                floorId: 'F1',
                layers: [
                    { zIndex: 0, matrix: new Uint32Array([7, 7, 7]) },
                    { zIndex: 10, matrix: new Uint32Array([8, 8, 8]) },
                    { zIndex: 20, matrix: new Uint32Array([1, 2, 1]) },
                    { zIndex: 30, matrix: new Uint32Array([9, 9, 9]) },
                    { zIndex: 40, matrix: new Uint32Array([10, 10, 10]) }
                ]
            },
            {
                floorId: 'F2',
                layers: [
                    {
                        zIndex: 0,
                        matrix: new Uint32Array([11, 11, 11, 11])
                    },
                    {
                        zIndex: 10,
                        matrix: new Uint32Array([12, 12, 12, 12])
                    },
                    {
                        zIndex: 20,
                        matrix: new Uint32Array([13, 13, 13, 13])
                    },
                    {
                        zIndex: 30,
                        matrix: new Uint32Array([14, 14, 14, 14])
                    },
                    {
                        zIndex: 40,
                        matrix: new Uint32Array([15, 15, 15, 15])
                    }
                ]
            }
        ]
    };

    const reset = () => {
        state.hero.location.setFloor('F1');
        state.hero.location.setPos(0, 0);
        state.hero.location.mover.setFaceDir(FaceDirection.Right);
        state.flags.loadState(
            initialState.flags,
            SaveCompression.NoCompression
        );
        state.maps.loadState(initialState.maps, SaveCompression.NoCompression);
        state.enemyManager.loadState(
            initialState.enemy,
            SaveCompression.NoCompression
        );
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
        route,
        sandbox,
        initialState,
        expected,
        reset,
        eventId: 'mutate-map',
        rawEvent,
        eventCompleted: () => eventLayer.getBlock(1, 0) === 2
    };
}
