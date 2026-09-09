// 测试事件 trigger 过滤、来源环境、执行顺序、await、cut/reduce 和移动钩子
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
    BlockEventType,
    type IBlockEventEnv,
    type IGameEventInvocation
} from '@user/data-base';
import {
    type IDataCommon,
    type IGameEventStore,
    type IReadonlyGameEvent,
    type ITileStore,
    EventTrigger
} from '@user/data-common';
import { type IStateSystem } from '../types';
import { EventExecuteMode, EventReduceMode } from './types';
import { AnonTokyoInterpreter } from 'anon-tokyo';

vi.hoisted(() => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    Map.prototype.getOrInsertComputed ??= function <K, V>(
        this: Map<K, V>,
        key: K,
        callback: (key: K) => V
    ): V {
        const existing = this.get(key);
        if (existing !== undefined) return existing;
        const value = callback(key);
        this.set(key, value);
        return value;
    };
});

const eventTriggers = {
    OnEnter: EventTrigger.OnEnter,
    OnLeave: EventTrigger.OnLeave,
    OnTouch: EventTrigger.OnTouch
} as const;

const blockEventTypes = {
    PointEvent: BlockEventType.PointEvent,
    TileEvent: BlockEventType.TileEvent
} as const;

const eventExecuteModes = {
    Normal: EventExecuteMode.Normal,
    CutIfFalsy: EventExecuteMode.CutIfFalsy,
    CutIfTruthy: EventExecuteMode.CutIfTruthy
} as const;

const eventReduceModes = {
    NoReduce: EventReduceMode.NoReduce,
    OrReduce: EventReduceMode.OrReduce,
    AndReduce: EventReduceMode.AndReduce
} as const;

interface TestModules {
    EventExecutor: typeof import('./executor').EventExecutor;
    DefaultHeroMoveTopImpl: typeof import('@user/data-state').DefaultHeroMoveTopImpl;
    MapState: typeof import('@user/data-base').MapState;
    TileStore: typeof import('@user/data-common').TileStore;
    RoleFaceBinder: typeof import('@user/data-common').RoleFaceBinder;
    FaceManager: typeof import('@user/data-common').FaceManager;
    Dir8FaceHandler: typeof import('@user/data-common').Dir8FaceHandler;
    EventTrigger: typeof eventTriggers;
    BlockEventType: typeof blockEventTypes;
    EventExecuteMode: typeof eventExecuteModes;
    EventReduceMode: typeof eventReduceModes;
}

interface EventCall {
    readonly id: string;
    readonly trigger: number;
    readonly type: number;
    readonly tile: object | null;
    readonly hero: Readonly<{ x: number; y: number }>;
    readonly triggerLocator: Readonly<{ x: number; y: number }> | null;
}

let modules: TestModules;

beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    const executorModule = await import('./executor');
    const stateModule = await import('../../../data-state/src/hero');
    const baseModule = await import('@user/data-base');
    const commonModule = await import('@user/data-common');
    modules = {
        EventExecutor: executorModule.EventExecutor,
        DefaultHeroMoveTopImpl: stateModule.DefaultHeroMoveTopImpl,
        MapState: baseModule.MapState,
        TileStore: commonModule.TileStore,
        RoleFaceBinder: commonModule.RoleFaceBinder,
        FaceManager: commonModule.FaceManager,
        Dir8FaceHandler: commonModule.Dir8FaceHandler,
        EventTrigger: eventTriggers,
        BlockEventType: blockEventTypes,
        EventExecuteMode: eventExecuteModes,
        EventReduceMode: eventReduceModes
    };
});

function createFixture(
    pointEvents: Record<number, Record<number, string>> = {},
    staticEvent: string = 'static-enter',
    dynamicEvent: string = 'dynamic-enter'
) {
    const tileStore: ITileStore = new modules.TileStore() as never;
    tileStore.addTile({
        num: 1,
        id: 'static',
        events: { 30: staticEvent },
        type: 0,
        pass: { onlyEvents: false, outPass: 15, inPass: 15 },
        eventPass: true
    });
    tileStore.addTile({
        num: 2,
        id: 'dynamic',
        events: { 40: dynamicEvent },
        type: 0,
        pass: { onlyEvents: false, outPass: 15, inPass: 15 },
        eventPass: true
    });
    const faceManager = new modules.FaceManager();
    faceManager.register(1, new modules.Dir8FaceHandler());
    const commonState: IDataCommon = {
        tileStore,
        itemStore: {},
        mapStore: {},
        eventStore: {},
        roleFace: new modules.RoleFaceBinder(),
        faceManager,
        saveSystem: {}
    } as never;
    const maps = new modules.MapState(tileStore, commonState);
    const map = maps.fromRaw({
        floorId: 'F1',
        width: 3,
        map: { 0: [1, 1, 1] },
        layerAlias: { 0: 'event' },
        events: { 0: pointEvents }
    });
    const layer = map!.getLayerByAlias('event')!;
    const dynamic = layer.createDynamic(2, 1, 0);
    dynamic.set(2);
    const events = new Map<string, object>();
    const store: IGameEventStore = {
        addEvent() {},
        getEvent<
            P extends Record<string, any>,
            E extends Record<string, any>,
            R = void
        >(id: string): IReadonlyGameEvent<P, E, R> | null {
            return events.get(id) as never;
        }
    };
    const executor = new modules.EventExecutor(
        {} as AnonTokyoInterpreter,
        () => store
    );
    const state = {
        maps,
        eventSystem: { executor }
    };
    const fixtureState: IStateSystem & IDataCommon = state as never;
    const mover = new modules.DefaultHeroMoveTopImpl(fixtureState);
    return {
        events,
        executor,
        layer,
        map: map!,
        dynamic,
        mover,
        state: fixtureState
    };
}

function addEvent(
    events: Map<string, object>,
    id: string,
    trigger: number,
    result: unknown,
    calls: EventCall[]
): void {
    events.set(id, {
        trigger,
        execute: async (
            _param: unknown,
            env: {
                trigger: number;
                type: number;
                tile: object | null;
                heroLocator: Readonly<{ x: number; y: number }>;
                triggerLocator: Readonly<{ x: number; y: number }> | null;
            }
        ) => {
            calls.push({
                id,
                trigger: env.trigger,
                type: env.type,
                tile: env.tile,
                hero: env.heroLocator,
                triggerLocator: env.triggerLocator
            });
            return result;
        }
    });
}

function invocation(id: string, trigger: EventTrigger): IGameEventInvocation {
    const env: IBlockEventEnv = {
        state: {} as IDataCommon,
        type: BlockEventType.CommonEvent,
        trigger,
        heroLocator: { x: 0, y: 0 },
        triggerLocator: null,
        tile: null,
        layer: null,
        map: null
    };
    return { id, env };
}

describe('source-aware matching dispatch', () => {
    it('executes a map-bound point id through the event layer and mover', async () => {
        const calls: EventCall[] = [];
        const fixture = createFixture({ 1: { 50: 'legacy-point-enter' } });
        addEvent(
            fixture.events,
            'legacy-point-enter',
            modules.EventTrigger.OnEnter,
            true,
            calls
        );

        expect(fixture.map.eventLayer).toBe(fixture.layer);
        await fixture.mover.enter({
            state: fixture.state,
            currLoc: { x: 0, y: 0 },
            nextLoc: { x: 1, y: 0 },
            direction: 0,
            floorId: 'F1',
            face: new modules.Dir8FaceHandler()
        });

        expect(calls).toHaveLength(1);
        expect(calls[0]).toMatchObject({
            id: 'legacy-point-enter',
            trigger: modules.EventTrigger.OnEnter,
            type: modules.BlockEventType.PointEvent,
            tile: null,
            hero: { x: 1, y: 0 },
            triggerLocator: { x: 1, y: 0 }
        });
    });

    it('source-aware matching dispatch', async () => {
        const calls: EventCall[] = [];
        const fixture = createFixture({
            1: { 50: 'point-enter', 60: 'leave-only' }
        });
        addEvent(
            fixture.events,
            'point-enter',
            modules.EventTrigger.OnEnter,
            true,
            calls
        );
        addEvent(
            fixture.events,
            'leave-only',
            modules.EventTrigger.OnLeave,
            true,
            calls
        );
        addEvent(
            fixture.events,
            'static-enter',
            modules.EventTrigger.OnEnter,
            true,
            calls
        );
        addEvent(
            fixture.events,
            'dynamic-enter',
            modules.EventTrigger.OnEnter,
            true,
            calls
        );

        await fixture.mover.enter({
            state: fixture.state,
            currLoc: { x: 0, y: 0 },
            nextLoc: { x: 1, y: 0 },
            direction: 0,
            floorId: 'F1',
            face: new modules.Dir8FaceHandler()
        });

        expect(calls.map(call => call.id)).toEqual([
            'point-enter',
            'dynamic-enter',
            'static-enter'
        ]);
        expect(calls.map(call => call.type)).toEqual([
            modules.BlockEventType.PointEvent,
            modules.BlockEventType.TileEvent,
            modules.BlockEventType.TileEvent
        ]);
        expect(calls[0].tile).toBeNull();
        expect(calls[1].tile).toBe(fixture.dynamic);
        expect(calls[2].tile).toBe(fixture.layer.getLocationData(1, 0)!.static);
        expect(calls[1].triggerLocator).toEqual({ x: 1, y: 0 });
        expect(calls[2].triggerLocator).toEqual({ x: 1, y: 0 });
    });

    it('awaits each source before continuing to the next one', async () => {
        const calls: EventCall[] = [];
        let release: () => void = () => {};
        const pending = new Promise<void>(resolve => {
            release = resolve;
        });
        const fixture = createFixture({ 1: { 50: 'slow-point' } });
        fixture.events.set('slow-point', {
            trigger: modules.EventTrigger.OnEnter,
            execute: async (
                _param: unknown,
                env: {
                    trigger: number;
                    type: number;
                    tile: object | null;
                    heroLocator: Readonly<{ x: number; y: number }>;
                    triggerLocator: Readonly<{ x: number; y: number }> | null;
                }
            ) => {
                calls.push({
                    id: 'slow-point',
                    trigger: env.trigger,
                    type: env.type,
                    tile: env.tile,
                    hero: env.heroLocator,
                    triggerLocator: env.triggerLocator
                });
                await pending;
                return true;
            }
        });
        addEvent(
            fixture.events,
            'static-enter',
            modules.EventTrigger.OnEnter,
            true,
            calls
        );
        addEvent(
            fixture.events,
            'dynamic-enter',
            modules.EventTrigger.OnEnter,
            true,
            calls
        );

        const running = fixture.mover.enter({
            state: fixture.state,
            currLoc: { x: 0, y: 0 },
            nextLoc: { x: 1, y: 0 },
            direction: 0,
            floorId: 'F1',
            face: new modules.Dir8FaceHandler()
        });
        await Promise.resolve();
        expect(calls.map(call => call.id)).toEqual(['slow-point']);
        release();
        await running;
        expect(calls.map(call => call.id)).toEqual([
            'slow-point',
            'dynamic-enter',
            'static-enter'
        ]);
    });
});

describe('event execute modes and reductions', () => {
    it('applies cut and reduce only to matching events', async () => {
        const calls: string[] = [];
        const fixture = createFixture();
        fixture.events.set('wrong-trigger', {
            trigger: modules.EventTrigger.OnLeave,
            execute: async () => {
                calls.push('wrong-trigger');
                return true;
            }
        });
        fixture.events.set('false', {
            trigger: modules.EventTrigger.OnEnter,
            execute: async () => {
                calls.push('false');
                return false;
            }
        });
        fixture.events.set('true', {
            trigger: modules.EventTrigger.OnEnter,
            execute: async () => {
                calls.push('true');
                return true;
            }
        });
        const enter = modules.EventTrigger.OnEnter;
        fixture.executor.setMode(modules.EventExecuteMode.Normal);
        fixture.executor.setReduce(modules.EventReduceMode.NoReduce);
        await expect(
            fixture.executor.execute(
                [
                    invocation('wrong-trigger', enter),
                    invocation('false', enter)
                ],
                { custom: {} }
            )
        ).resolves.toEqual([false]);
        expect(calls).toEqual(['false']);

        calls.length = 0;
        fixture.executor.setMode(modules.EventExecuteMode.CutIfFalsy);
        await fixture.executor.execute(
            [
                invocation('wrong-trigger', enter),
                invocation('false', enter),
                invocation('true', enter)
            ],
            { custom: {} }
        );
        expect(calls).toEqual(['false']);

        calls.length = 0;
        fixture.executor.setMode(modules.EventExecuteMode.CutIfTruthy);
        await fixture.executor.execute(
            [
                invocation('wrong-trigger', enter),
                invocation('true', enter),
                invocation('false', enter)
            ],
            { custom: {} }
        );
        expect(calls).toEqual(['true']);

        fixture.executor.setMode(modules.EventExecuteMode.Normal);
        fixture.executor.setReduce(modules.EventReduceMode.OrReduce);
        await expect(
            fixture.executor.execute(
                [invocation('false', enter), invocation('true', enter)],
                { custom: {} }
            )
        ).resolves.toBe(true);
        fixture.executor.setReduce(modules.EventReduceMode.AndReduce);
        await expect(
            fixture.executor.execute(
                [invocation('true', enter), invocation('false', enter)],
                { custom: {} }
            )
        ).resolves.toBe(false);
        fixture.executor.setReduce(modules.EventReduceMode.OrReduce);
        await expect(
            fixture.executor.execute([invocation('wrong-trigger', enter)], {
                custom: {}
            })
        ).resolves.toBe(false);
        fixture.executor.setReduce(modules.EventReduceMode.AndReduce);
        await expect(
            fixture.executor.execute([invocation('wrong-trigger', enter)], {
                custom: {}
            })
        ).resolves.toBe(true);
    });

    it('warns for unknown ids and continues with valid events', async () => {
        const calls: string[] = [];
        const fixture = createFixture();
        fixture.events.set('valid', {
            trigger: modules.EventTrigger.OnEnter,
            execute: async () => {
                calls.push('valid');
                return true;
            }
        });
        fixture.executor.setReduce(modules.EventReduceMode.NoReduce);
        await expect(
            fixture.executor.execute(
                [
                    invocation('missing', modules.EventTrigger.OnEnter),
                    invocation('valid', modules.EventTrigger.OnEnter)
                ],
                { custom: {} }
            )
        ).resolves.toEqual([true]);
        expect(calls).toEqual(['valid']);
    });
});

describe('enter leave hit trigger hooks', () => {
    it('maps enter leave and hit to their approved triggers and coordinates', async () => {
        const calls: EventCall[] = [];
        const fixture = createFixture(
            {
                0: { 10: 'leave-event' },
                1: { 10: 'enter-event' }
            },
            'touch-event',
            'unused'
        );
        addEvent(
            fixture.events,
            'leave-event',
            modules.EventTrigger.OnLeave,
            true,
            calls
        );
        addEvent(
            fixture.events,
            'enter-event',
            modules.EventTrigger.OnEnter,
            true,
            calls
        );
        addEvent(
            fixture.events,
            'touch-event',
            modules.EventTrigger.OnTouch,
            true,
            calls
        );
        const handler = {
            state: fixture.state,
            currLoc: { x: 0, y: 0 },
            nextLoc: { x: 1, y: 0 },
            direction: 0,
            floorId: 'F1',
            face: new modules.Dir8FaceHandler()
        };
        await fixture.mover.enter(handler);
        await fixture.mover.leave(handler);
        await fixture.mover.hit(handler);

        expect(calls.map(call => call.id)).toEqual([
            'enter-event',
            'leave-event',
            'touch-event'
        ]);
        expect(calls.map(call => call.trigger)).toEqual([
            modules.EventTrigger.OnEnter,
            modules.EventTrigger.OnLeave,
            modules.EventTrigger.OnTouch
        ]);
        expect(calls[0].hero).toEqual({ x: 1, y: 0 });
        expect(calls[1].hero).toEqual({ x: 0, y: 0 });
        expect(calls[2].hero).toEqual({ x: 0, y: 0 });
        expect(calls[0].triggerLocator).toEqual({ x: 1, y: 0 });
        expect(calls[1].triggerLocator).toEqual({ x: 0, y: 0 });
        expect(calls[2].triggerLocator).toEqual({ x: 1, y: 0 });
    });
});
