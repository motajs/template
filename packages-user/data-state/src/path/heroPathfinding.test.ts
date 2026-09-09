import { beforeAll, describe, expect, it, vi } from 'vitest';
import { ITileStore } from '@user/data-common';

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

interface TestModules {
    EventExecutor: typeof import('@user/data-system').EventExecutor;
    DefaultHeroMoveTopImpl: typeof import('../hero').DefaultHeroMoveTopImpl;
    HeroMover: typeof import('@user/data-base').HeroMover;
    HeroPathfinding: typeof import('./heroPathfinding').HeroPathfinding;
    MapState: typeof import('@user/data-base').MapState;
    TileStore: typeof import('@user/data-common').TileStore;
    Dir8FaceHandler: typeof import('@user/data-common').Dir8FaceHandler;
    FaceManager: typeof import('@user/data-common').FaceManager;
    RoleFaceBinder: typeof import('@user/data-common').RoleFaceBinder;
}

interface EventCall {
    readonly id: string;
    readonly trigger: number;
    readonly hero: Readonly<{ x: number; y: number }>;
}

interface HeroFixture {
    x: number;
    y: number;
    floorId: string;
    state: unknown;
    mover?: { readonly faceDirection: number };
    setPos(x: number, y: number): void;
    getCurrentFaceDirection(): number;
}

let modules: TestModules;

beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    const base = await import('@user/data-base');
    const common = await import('@user/data-common');
    const state = await import('../hero');
    const path = await import('./heroPathfinding');
    const event = await import('@user/data-system');
    modules = {
        EventExecutor: event.EventExecutor,
        DefaultHeroMoveTopImpl: state.DefaultHeroMoveTopImpl,
        HeroMover: base.HeroMover,
        HeroPathfinding: path.HeroPathfinding,
        MapState: base.MapState,
        TileStore: common.TileStore,
        Dir8FaceHandler: common.Dir8FaceHandler,
        FaceManager: common.FaceManager,
        RoleFaceBinder: common.RoleFaceBinder
    };
});

interface FixtureOptions {
    readonly middleEvent?: boolean;
    readonly targetNoPass?: boolean;
    readonly sealedTarget?: boolean;
}

function createFixture(options: FixtureOptions = {}) {
    const tileStore: ITileStore = new modules.TileStore() as never;
    tileStore.addTile({
        num: 1,
        id: 'floor',
        events: {},
        type: 0,
        pass: { onlyEvents: false, outPass: 15, inPass: 15 },
        eventPass: true
    });
    tileStore.addTile({
        num: 2,
        id: 'wall',
        events: { 40: 'wall-touch' },
        type: 0,
        pass: { onlyEvents: false, outPass: 0, inPass: 0 },
        eventPass: true
    });
    const faceManager = new modules.FaceManager();
    const faceHandler = new modules.Dir8FaceHandler();
    faceManager.register(1, faceHandler);
    const commonState = {
        tileStore,
        itemStore: {},
        mapStore: {},
        eventStore: {},
        roleFace: new modules.RoleFaceBinder(),
        faceManager,
        saveSystem: {}
    } as never;
    const maps = new modules.MapState(tileStore, commonState);
    const eventMap = maps.fromRaw({
        floorId: 'F1',
        width: 3,
        map: {
            0: options.sealedTarget
                ? [1, 2, 2]
                : options.targetNoPass
                  ? [1, 1, 2]
                  : [1, 1, 1]
        },
        layerAlias: { 0: 'event' },
        events: {
            0:
                options.middleEvent === false
                    ? {}
                    : { 1: { 30: 'middle-enter' } }
        }
    })!;
    const events = new Map<string, object>();
    const store = {
        addEvent() {},
        getEvent<
            _P extends Record<string, unknown>,
            _E extends Record<string, unknown>,
            _R = void
        >(id: string) {
            return events.get(id) as never;
        }
    };
    const executor = new modules.EventExecutor({} as never, () => store);
    const state = {
        maps,
        eventSystem: { executor }
    };
    const hero: HeroFixture = {
        x: 0,
        y: 0,
        floorId: 'F1',
        state,
        setPos(x: number, y: number) {
            hero.x = x;
            hero.y = y;
        },
        getCurrentFaceDirection() {
            return 4;
        }
    };
    const mover = new modules.HeroMover(hero as never, faceHandler);
    hero.mover = mover;
    const heroState = { location: hero };
    const fixtureState = { ...state, hero: heroState } as never;
    const topImpl = new modules.DefaultHeroMoveTopImpl(fixtureState);
    mover.useTopImplementation(topImpl);
    const pathfinding = new modules.HeroPathfinding(fixtureState, topImpl);
    return {
        eventMap,
        events,
        executor,
        hero: heroState.location,
        pathfinding,
        state: fixtureState
    };
}

function addEvent(
    events: Map<string, object>,
    id: string,
    trigger: number,
    calls: EventCall[]
): void {
    events.set(id, {
        trigger,
        execute: async (
            _param: unknown,
            env: {
                trigger: number;
                heroLocator: Readonly<{ x: number; y: number }>;
            }
        ) => {
            calls.push({ id, trigger: env.trigger, hero: env.heroLocator });
            return true;
        }
    });
}

describe('hero pathfinding integration', () => {
    // 验证勇士按最小路径逐步移动并按事件链顺序执行途经事件
    it('moves the hero to the target and triggers the traversed event', async () => {
        const calls: EventCall[] = [];
        const fixture = createFixture();
        addEvent(fixture.events, 'middle-enter', 2, calls);

        const path = fixture.pathfinding.getPath({ x: 2, y: 0 });
        expect(path.map(step => step.to)).toEqual([
            { x: 1, y: 0 },
            { x: 2, y: 0 }
        ]);
        const result = fixture.pathfinding.moveTo({ x: 2, y: 0 });
        expect(result).not.toBeNull();
        await result!.controller.onEnd;

        expect({ x: fixture.hero.x, y: fixture.hero.y }).toEqual({
            x: 2,
            y: 0
        });
        expect(calls).toEqual([
            { id: 'middle-enter', trigger: 2, hero: { x: 1, y: 0 } }
        ]);
    });

    // 验证无事件路径的瞬移一步到达目标
    it('teleports directly when the path has no events', async () => {
        const fixture = createFixture({ middleEvent: false });
        const result = fixture.pathfinding.teleportTo({ x: 2, y: 0 });
        expect(result).not.toBeNull();
        await result!.controller.onEnd;

        expect({ x: fixture.hero.x, y: fixture.hero.y }).toEqual({
            x: 2,
            y: 0
        });
    });

    // 验证默认策略检测途经事件并自动回退为逐步移动
    it('falls back to step movement when the path has an event', async () => {
        const calls: EventCall[] = [];
        const fixture = createFixture();
        addEvent(fixture.events, 'middle-enter', 2, calls);

        const result = fixture.pathfinding.teleportTo({ x: 2, y: 0 });
        expect(result).not.toBeNull();
        await result!.controller.onEnd;

        expect({ x: fixture.hero.x, y: fixture.hero.y }).toEqual({
            x: 2,
            y: 0
        });
        expect(calls).toEqual([
            { id: 'middle-enter', trigger: 2, hero: { x: 1, y: 0 } }
        ]);
    });

    // 验证 no-pass 目标移动至相邻格、面朝目标并派发 OnTouch
    it('touches a no-pass target from its reachable adjacent cell', async () => {
        const calls: EventCall[] = [];
        const fixture = createFixture({
            middleEvent: false,
            targetNoPass: true
        });
        addEvent(fixture.events, 'wall-touch', 1, calls);

        const result = fixture.pathfinding.moveTo({ x: 2, y: 0 });
        expect(result).not.toBeNull();
        await result!.controller.onEnd;

        expect({ x: fixture.hero.x, y: fixture.hero.y }).toEqual({
            x: 1,
            y: 0
        });
        expect(fixture.hero.mover!.faceDirection).toBe(3);
        expect(calls).toEqual([
            { id: 'wall-touch', trigger: 1, hero: { x: 1, y: 0 } }
        ]);
    });

    // 验证四邻无可达格时不可达目标不移动且不触发事件
    it('ignores a no-pass target without a reachable adjacent cell', () => {
        const fixture = createFixture({ sealedTarget: true });
        const path = fixture.pathfinding.getPath({ x: 2, y: 0 });

        expect(path).toEqual([]);
        expect(fixture.pathfinding.moveTo({ x: 2, y: 0 })).toBeNull();
        expect({ x: fixture.hero.x, y: fixture.hero.y }).toEqual({
            x: 0,
            y: 0
        });
    });
});
