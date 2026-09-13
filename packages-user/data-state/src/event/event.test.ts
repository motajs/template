import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { Statement, StatementType } from '@motajs/anon-tokyo';
import {
    FaceDirection,
    IGameEvent,
    ObjectMoveType,
    EventTrigger,
    TileType
} from '@user/data-common';
import {
    BlockEventType,
    IBlockEventEnv,
    IGameEventInvocation
} from '@user/data-system';
import { CoreState } from '../core';
import {
    createEventRegistrations,
    EventDeleteBlock,
    EventInsertEvent,
    EventInsertEvents,
    EventMoveBlock,
    EventMoveHero,
    EventMoveHeroStep,
    EventSetBlock,
    EventTouchFront
} from './index';
import { EventSetBlock as MapEventSetBlock } from './map';
import { EventTouchFront as HeroEventTouchFront } from './hero';
import { EventInsertEvent as ControlEventInsertEvent } from './event';
import * as dataStateRoot from '../index';

interface EventFixture {
    readonly state: CoreState;
    readonly map: ReturnType<CoreState['maps']['createMap']>;
    readonly layer: ReturnType<
        ReturnType<CoreState['maps']['createMap']>['addLayer']
    >;
    readonly env: IBlockEventEnv;
}

type RegisteredBuiltin = ReturnType<typeof createEventRegistrations>[number];

function invokeBuiltin<TParam>(
    registration: RegisteredBuiltin,
    param: TParam,
    env: IBlockEventEnv
): Promise<void> {
    return Promise.resolve(registration.func(param, env));
}

function getRegistration(name: string): RegisteredBuiltin {
    const registration = createEventRegistrations().find(
        item => item.name === name
    );
    if (!registration) throw new Error(`${name} registration missing`);
    return registration;
}

function createFixture(): EventFixture {
    const state = new CoreState();
    state.tileStore.addTile({
        num: 1,
        id: 'floor',
        events: {},
        type: TileType.Terrain,
        pass: { onlyEvents: false, outPass: 15, inPass: 15 },
        eventPass: true
    });
    state.tileStore.addTile({
        num: 2,
        id: 'block',
        events: {},
        type: TileType.Terrain,
        pass: { onlyEvents: false, outPass: 15, inPass: 15 },
        eventPass: true
    });
    const map = state.maps.createMap('F1', 4, 1);
    const layer = map.addLayer();
    layer.setMapRef(new Uint32Array([1, 1, 1, 1]));
    map.setEventLayer(layer);
    state.hero.location.setFloor('F1');
    state.hero.location.setPos(0, 0);
    state.hero.location.mover.setFaceDir(FaceDirection.Right);
    const env: IBlockEventEnv = {
        state,
        type: BlockEventType.CommonEvent,
        trigger: EventTrigger.None,
        heroLocator: state.hero.getLocation(),
        heroFloor: 'F1',
        triggerLocator: null,
        tile: null,
        layer,
        map
    };
    return { state, map, layer, env };
}

function createEvent(
    state: CoreState,
    trigger: EventTrigger,
    execute: (env: IBlockEventEnv) => Promise<void>
): IGameEvent<Record<string, never>, IBlockEventEnv, void> {
    return {
        interpreter: state.eventSystem.executor.interpreter,
        trigger,
        rawEvent: [],
        compiled: null,
        compile: () => null,
        execute: async (_param, env) => execute(env),
        setTrigger: () => {},
        setRaw: () => {}
    };
}

function invocation(id: string, env: IBlockEventEnv): IGameEventInvocation {
    return { id, env };
}

describe('event built-ins', () => {
    // 验证真实注册项设置图块并安全跳过无效图块
    it('sets a block and safely skips an unknown tile', async () => {
        const fixture = createFixture();
        const registration = getRegistration('setBlock');
        await invokeBuiltin(
            registration,
            { x: 1, y: 0, tile: 'block' },
            fixture.env
        );
        expect(fixture.layer.getBlock(1, 0)).toBe(2);
        await invokeBuiltin(
            registration,
            { x: 1, y: 0, tile: 'missing' },
            fixture.env
        );
        expect(fixture.layer.getBlock(1, 0)).toBe(2);
    });

    // 验证真实注册项移动动态图块并按 safe 分支还原
    it('moves a dynamic block and respects safe static transfer', async () => {
        const fixture = createFixture();
        await invokeBuiltin(
            getRegistration('moveBlock'),
            {
                x: 1,
                y: 0,
                steps: [
                    { type: ObjectMoveType.Teleport, x: 2, y: 0, rel: false }
                ],
                safe: true
            },
            fixture.env
        );
        expect([...fixture.layer.getDynamicTilesAt(2, 0)]).toHaveLength(1);
        expect(fixture.layer.getBlock(2, 0)).toBe(1);
    });

    // 验证真实注册项删除图块并清理静态与动态图块
    it('deletes static and dynamic blocks at a coordinate', async () => {
        const fixture = createFixture();
        fixture.layer.transferToDynamic(1, 0);
        await invokeBuiltin(
            getRegistration('deleteBlock'),
            { x: 1, y: 0 },
            fixture.env
        );
        expect(fixture.layer.getBlock(1, 0)).toBe(0);
        expect([...fixture.layer.getDynamicTilesAt(1, 0)]).toHaveLength(0);
    });

    // 验证真实注册项的勇士移动序列和向前一步都等待移动结束
    it('awaits hero sequence and forward-step movement', async () => {
        const fixture = createFixture();
        await invokeBuiltin(
            getRegistration('moveHero'),
            {
                steps: [{ type: ObjectMoveType.Dir, move: FaceDirection.Right }]
            },
            fixture.env
        );
        expect(fixture.state.hero.location.x).toBe(1);
        await invokeBuiltin(getRegistration('moveHeroStep'), {}, fixture.env);
        expect(fixture.state.hero.location.x).toBe(2);
    });

    // 验证真实注册项触发面前 onTouch 且不移动勇士
    it('triggers front onTouch events without moving the hero', async () => {
        const fixture = createFixture();
        const calls: IGameEventInvocation[] = [];
        fixture.layer.event(1, 0)!.set(10, 'touch');
        fixture.state.eventStore.addEvent(
            'touch',
            createEvent(fixture.state, EventTrigger.OnTouch, async env => {
                calls.push(invocation('touch', env));
            })
        );
        await invokeBuiltin(getRegistration('touchFront'), {}, fixture.env);
        expect(calls).toHaveLength(1);
        expect(calls[0].env.trigger).toBe(EventTrigger.OnTouch);
        expect(fixture.state.hero.location.x).toBe(0);
    });

    // 验证真实注册项按顺序等待临时事件序列并直接执行语句体
    it('awaits id sequences and executes a direct statement body', async () => {
        const fixture = createFixture();
        const calls: string[] = [];
        fixture.state.eventStore.addEvent(
            'first',
            createEvent(fixture.state, EventTrigger.None, async () => {
                await Promise.resolve();
                calls.push('first');
            })
        );
        fixture.state.eventStore.addEvent(
            'second',
            createEvent(fixture.state, EventTrigger.None, async () => {
                calls.push('second');
            })
        );
        await invokeBuiltin(
            getRegistration('insertEvents'),
            { ids: ['first', 'second', 'missing'] },
            fixture.env
        );
        const body: Statement[] = [
            {
                type: StatementType.Call,
                functionName: 'setBlock',
                builtIn: true,
                async: true,
                parameters: { x: 3, y: 0, tile: 2 }
            }
        ];
        await invokeBuiltin(getRegistration('insertEvent'), body, fixture.env);
        expect(calls).toEqual(['first', 'second']);
        expect(fixture.layer.getBlock(3, 0)).toBe(2);
        expect(fixture.state.eventStore.getEvent('inline-body')).toBeNull();
    });

    // 验证默认注册项只包含批准的八个稳定名称
    it('registers exactly the approved built-ins in AnonTokyo', () => {
        const fixture = createFixture();
        const names = createEventRegistrations().map(item => item.name);
        expect(names).toEqual([
            'setBlock',
            'moveBlock',
            'deleteBlock',
            'moveHero',
            'moveHeroStep',
            'touchFront',
            'insertEvents',
            'insertEvent'
        ]);
        for (const name of names) {
            expect(
                fixture.state.eventSystem.executor.interpreter.getBuiltInFunction(
                    name
                )
            ).toMatchObject({
                name,
                func: expect.any(Function)
            });
        }
    });

    // 验证真实注册项在缺失地图和事件 id 时都安全返回
    it('safely skips missing targets and event ids', async () => {
        const fixture = createFixture();
        const missingEnv: IBlockEventEnv = {
            ...fixture.env,
            map: null,
            layer: null,
            heroFloor: 'missing'
        };
        await expect(
            invokeBuiltin(
                getRegistration('moveBlock'),
                { x: 0, y: 0, steps: [] },
                missingEnv
            )
        ).resolves.toBeUndefined();
        await expect(
            invokeBuiltin(
                getRegistration('deleteBlock'),
                { x: 0, y: 0 },
                missingEnv
            )
        ).resolves.toBeUndefined();
        await expect(
            invokeBuiltin(getRegistration('touchFront'), {}, missingEnv)
        ).resolves.toBeUndefined();
        await expect(
            invokeBuiltin(getRegistration('insertEvent'), [], fixture.env)
        ).resolves.toBeUndefined();
    });
});

describe('event registration ownership', () => {
    // 验证单一注册函数按地图勇士控制三类顺序返回全部八个新鲜实例
    it('returns the eight fresh registrations in stable category order', () => {
        const registrations = createEventRegistrations();
        expect(registrations).toHaveLength(8);
        expect(registrations.map(item => item.name)).toEqual([
            'setBlock',
            'moveBlock',
            'deleteBlock',
            'moveHero',
            'moveHeroStep',
            'touchFront',
            'insertEvents',
            'insertEvent'
        ]);
        expect(registrations[0]).toBeInstanceOf(EventSetBlock);
        expect(registrations[1]).toBeInstanceOf(EventMoveBlock);
        expect(registrations[2]).toBeInstanceOf(EventDeleteBlock);
        expect(registrations[3]).toBeInstanceOf(EventMoveHero);
        expect(registrations[4]).toBeInstanceOf(EventMoveHeroStep);
        expect(registrations[5]).toBeInstanceOf(EventTouchFront);
        expect(registrations[6]).toBeInstanceOf(EventInsertEvents);
        expect(registrations[7]).toBeInstanceOf(EventInsertEvent);
        expect(createEventRegistrations()).not.toBe(registrations);
        expect(createEventRegistrations()[0]).not.toBe(registrations[0]);
    });

    // 验证每个注册实例直接拥有自己的稳定名称与可调用函数
    it('owns a stable name and callable function on every instance', () => {
        for (const registration of createEventRegistrations()) {
            expect(typeof registration.name).toBe('string');
            expect(registration.name.length).toBeGreaterThan(0);
            expect(typeof registration.func).toBe('function');
        }
    });

    // 验证注册类分别来自地图勇士事件模块且勇士面前注册类归 hero 所有
    it('originates registration classes from their owning event modules', () => {
        expect(EventSetBlock).toBe(MapEventSetBlock);
        expect(EventTouchFront).toBe(HeroEventTouchFront);
        expect(EventInsertEvent).toBe(ControlEventInsertEvent);
        expect(getRegistration('touchFront')).toBeInstanceOf(
            HeroEventTouchFront
        );
    });

    // 验证事件 barrel 仅含导出语句且既有公开事件符号仍可从根索引导入
    it('keeps both barrels export-only and preserves public event symbols', () => {
        const eventBarrel = readFileSync(
            new URL('./index.ts', import.meta.url),
            'utf8'
        );
        const rootBarrel = readFileSync(
            new URL('../index.ts', import.meta.url),
            'utf8'
        );
        expect(eventBarrel).not.toMatch(/^\s*import\s/m);
        expect(rootBarrel).not.toMatch(/^\s*import\s/m);
        expect(eventBarrel).not.toMatch(
            /^\s*(?:export\s+)?(?:async\s+)?function\s/m
        );
        const reachableNames = [
            'createEventRegistrations',
            'EventSetBlock',
            'EventMoveBlock',
            'EventDeleteBlock',
            'EventMoveHero',
            'EventMoveHeroStep',
            'EventTouchFront',
            'EventInsertEvents',
            'EventInsertEvent'
        ];
        const rootKeys = Object.keys(dataStateRoot);
        for (const name of reachableNames) {
            expect(rootKeys).toContain(name);
        }
    });
});
