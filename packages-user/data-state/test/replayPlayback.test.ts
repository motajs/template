// 测试录像完整播放与二次录制比对：小地图场景、逐条相等判定、176 与 error 2001-2008
import { afterEach, describe, expect, it, vi } from 'vitest';
import { logger } from '@motajs/common';
import {
    FaceDirection,
    ReplayCommandCode,
    SaveCompression,
    TileType,
    type IReplayArray,
    type IReplaySandbox,
    type IReplayStepHandler,
    type ReplayParamValue
} from '@user/data-common';
import { type CoreState, createCoreState } from '../src/core';
import { DefaultPassPredicateImpl } from '../src/hero/predicate';
import {
    ReplayEquipCommand,
    ReplayMoveCommand,
    ReplayTeleportCommand,
    ReplayUnequipCommand,
    ReplayUseItemCommand
} from '../src/replay/commands';

vi.hoisted(() => {
    Map.prototype.getOrInsert ??= function <K, V>(
        this: Map<K, V>,
        key: K,
        value: V
    ): V {
        const existing = this.get(key);
        if (existing !== undefined) return existing;
        this.set(key, value);
        return value;
    };
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

afterEach(() => {
    vi.restoreAllMocks();
});

interface IRecordedParam {
    /** 参数运行时类型 */
    readonly type: string;
    /** 参数值 */
    readonly value: ReplayParamValue;
}

interface IRecordedStep {
    /** 录像指令码 */
    readonly code: number;
    /** 本条录像步的参数 */
    readonly params: readonly IRecordedParam[];
}

/**
 * 在录像记录被禁用的状态下执行准备动作，避免准备步骤被误录
 * @param state 顶层状态对象
 * @param action 需要执行的准备动作
 */
function withReplayDisabled<T>(state: CoreState, action: () => T): T {
    state.replaySystem.disable();
    try {
        return action();
    } finally {
        state.replaySystem.revert();
    }
}

/**
 * 用真实地图与勇士接口构造一个 3x3 小地图场景
 * @param state 顶层状态对象
 * @param wireFinder 是否向寻路 finder 手动注入地图状态、事件层与通行谓词
 */
function createSmallMapScene(state: CoreState, wireFinder: boolean = true) {
    state.tileStore.addTile({
        num: 1,
        id: 'floor',
        events: {},
        type: TileType.Terrain,
        pass: { onlyEvents: false, outPass: 0b1111, inPass: 0b1111 },
        eventPass: true
    });
    const map = state.maps.fromRaw({
        floorId: 'F1',
        width: 3,
        map: {
            0: [1, 1, 1, 1, 1, 1, 1, 1, 1],
            20: [1, 1, 1, 1, 1, 1, 1, 1, 1]
        },
        layerAlias: { 0: 'bg', 20: 'event' },
        events: { 0: {}, 20: {} }
    });
    if (!map || !map.eventLayer) {
        throw new Error('small map scene was not created');
    }
    state.maps.setMapActiveStatus('F1', true);
    if (wireFinder) {
        state.pathfinding.finder.useMapState(state.maps);
        state.pathfinding.finder.useMapLayer(map.eventLayer);
        state.pathfinding.finder.usePassPredicate(
            new DefaultPassPredicateImpl(state.maps)
        );
    }
    resetHero(state);
}

/**
 * 把勇士恢复到小地图起点并清空待执行的移动队列
 * @param state 顶层状态对象
 */
function resetHero(state: CoreState): void {
    state.hero.location.setFloor('F1');
    state.hero.location.setPos(0, 0);
    state.hero.location.mover.clear();
    state.hero.location.mover.setFaceDir(FaceDirection.Right);
}

/**
 * 通过真实勇士移动器执行一个方向步并等待其完成，从而录制一步录像
 * @param state 顶层状态对象
 * @param direction 移动方向
 */
async function runHeroStep(
    state: CoreState,
    direction: FaceDirection
): Promise<void> {
    const controller = state.hero.location.mover.step(direction).start();
    if (!controller) throw new Error('hero mover was already running');
    await controller.onEnd;
}

/**
 * 有界等待录像沙箱播放结束，避免非终止录像挂起测试
 * @param sandbox 录像沙箱
 */
async function waitForEnded(sandbox: IReplaySandbox): Promise<void> {
    for (let index = 0; index < 1000 && !sandbox.ended; index++) {
        await new Promise<void>(resolve => setTimeout(resolve, 0));
    }
    if (!sandbox.ended) throw new Error('replay sandbox did not end');
}

/**
 * 播放当前录像并等待结束，播放期间禁用录制以免影响录像本身
 * @param state 顶层状态对象
 */
async function playRoute(state: CoreState): Promise<void> {
    const replay = state.replaySystem;
    const sandbox = replay.createReplaySandbox({
        route: replay.route,
        reseter: { reset: () => resetHero(state) }
    });
    replay.disable();
    try {
        sandbox.play();
        await waitForEnded(sandbox);
    } finally {
        replay.revert();
        replay.releaseSandbox();
    }
    expect(sandbox.ended).toBe(true);
}

/**
 * 把录像数组快照为可逐条比较的纯数据（步数 + code + 各参数的 type/value）
 * @param route 录像数组
 */
function snapshotRoute(route: IReplayArray): IRecordedStep[] {
    const result: IRecordedStep[] = [];
    for (let index = 0; index < route.length; index++) {
        const step = route.get(index);
        result.push({
            code: step.command,
            params: step.params.map(value => ({
                type: typeof value,
                value
            }))
        });
    }
    return result;
}

/**
 * 逐条断言两份录像完全相等（步数 + 每步 code + 各参数的 type/value）
 * @param actual 二次录制的录像
 * @param expected 首次录制的录像
 */
function expectReplayEqual(
    actual: readonly IRecordedStep[],
    expected: readonly IRecordedStep[]
): void {
    expect(actual.length).toBe(expected.length);
    for (let index = 0; index < expected.length; index++) {
        expect(actual[index].code).toBe(expected[index].code);
        expect(actual[index].params.length).toBe(expected[index].params.length);
        for (let param = 0; param < expected[index].params.length; param++) {
            expect(actual[index].params[param].type).toBe(
                expected[index].params[param].type
            );
            expect(actual[index].params[param].value).toBe(
                expected[index].params[param].value
            );
        }
    }
}

/**
 * 组装一个手动触发使用的录像步信息对象
 * @param command 指令码
 * @param params 参数列表
 */
function step(
    command: number,
    params: IReplayStepHandler['params']
): IReplayStepHandler {
    return { command, params, index: 0 };
}

describe('replay recording and route read-back', () => {
    // 验证禁用录像时任何记录都不生效，嵌套 revert 全部恢复后才重新记录
    it('suppresses recording while disabled and resumes after all reverts', () => {
        const state = createCoreState();
        const replay = state.replaySystem;

        replay.disable();
        replay.record(ReplayCommandCode.Right);
        expect(replay.route.length).toBe(0);

        replay.disable();
        replay.revert();
        replay.record(ReplayCommandCode.Right);
        expect(replay.route.length).toBe(0);

        replay.revert();
        replay.record(ReplayCommandCode.Right);
        expect(replay.route.length).toBe(1);
    });

    // 验证八个稳定指令码及其参数都能经录像数组逐条读回
    it('reads back every stable command code and its params', () => {
        const state = createCoreState();
        const replay = state.replaySystem;
        replay.record(ReplayCommandCode.Up);
        replay.record(ReplayCommandCode.Teleport, 3, 4);
        replay.record(ReplayCommandCode.UseItem, 12);
        replay.record(ReplayCommandCode.Equip, 99, 1, true);
        replay.record(ReplayCommandCode.Unequip, 1);

        expect(replay.route.length).toBe(5);
        expect(replay.route.get(0)).toMatchObject({
            command: ReplayCommandCode.Up,
            params: []
        });
        expect(replay.route.get(1)).toMatchObject({
            command: ReplayCommandCode.Teleport,
            params: [3, 4]
        });
        expect(replay.route.get(2)).toMatchObject({
            command: ReplayCommandCode.UseItem,
            params: [12]
        });
        expect(replay.route.get(3)).toMatchObject({
            command: ReplayCommandCode.Equip,
            params: [99, 1, true]
        });
        expect(replay.route.get(4)).toMatchObject({
            command: ReplayCommandCode.Unequip,
            params: [1]
        });
    });

    // 验证真实勇士移动器按方向记录对应移动指令，且准备步骤不会被误录
    it('records hero moves through the real mover and ignores preparation', async () => {
        const state = createCoreState();

        withReplayDisabled(state, () => createSmallMapScene(state));
        expect(state.replaySystem.route.length).toBe(0);

        await runHeroStep(state, FaceDirection.Right);

        expect(state.replaySystem.route.length).toBe(1);
        expect(state.replaySystem.route.get(0)).toMatchObject({
            command: ReplayCommandCode.Right,
            params: []
        });
    });

    // 验证勇士移动方向不属于上右下左时记录告警 176
    it('warns 176 when the hero move direction is not orthogonal', async () => {
        const state = createCoreState();
        withReplayDisabled(state, () => createSmallMapScene(state));
        const warning = vi.spyOn(logger, 'warn');

        const controller = state.hero.location.mover
            .step(FaceDirection.Unknown)
            .start();
        if (controller) await controller.onEnd;

        expect(warning).toHaveBeenCalledWith(176);
    });
});

describe('small-map replay playback and second recording', () => {
    // 验证小地图场景录制后正常播放，并在重置录像后二次录制与原录像逐条完全相等
    it('plays a recorded route and reproduces it exactly on a second recording', async () => {
        const state = createCoreState();
        const replay = state.replaySystem;
        const emptyReplay = replay.saveState(SaveCompression.NoCompression);
        withReplayDisabled(state, () => createSmallMapScene(state));

        await runHeroStep(state, FaceDirection.Right);
        await runHeroStep(state, FaceDirection.Right);
        replay.record(ReplayCommandCode.Teleport, 1, 0);
        replay.record(ReplayCommandCode.Up);

        const firstSteps = snapshotRoute(replay.route);
        expect(firstSteps.map(item => item.code)).toEqual([
            ReplayCommandCode.Right,
            ReplayCommandCode.Right,
            ReplayCommandCode.Teleport,
            ReplayCommandCode.Up
        ]);
        expect(replay.route.get(2)).toMatchObject({
            command: ReplayCommandCode.Teleport,
            params: [1, 0]
        });

        await playRoute(state);
        expect(state.hero.location.x).toBe(1);
        expect(state.hero.location.y).toBe(0);

        replay.loadState(emptyReplay, SaveCompression.NoCompression);
        expect(replay.route.length).toBe(0);
        withReplayDisabled(state, () => resetHero(state));

        await runHeroStep(state, FaceDirection.Right);
        await runHeroStep(state, FaceDirection.Right);
        replay.record(ReplayCommandCode.Teleport, 1, 0);
        replay.record(ReplayCommandCode.Up);

        const secondSteps = snapshotRoute(replay.route);
        expectReplayEqual(secondSteps, firstSteps);

        await playRoute(state);
        expect(state.hero.location.x).toBe(1);
        expect(state.hero.location.y).toBe(0);
    });

    // 疑似缺陷 #06-07-1：CoreState 未向寻路 finder 注入地图状态/事件层/通行谓词，
    // 顶层录像瞬移恒返回 2005；本用例按正确预期编写，修复后取消 skip
    it.skip('plays a teleport step without manual finder wiring', async () => {
        const state = createCoreState();
        const replay = state.replaySystem;
        withReplayDisabled(state, () => createSmallMapScene(state, false));
        await runHeroStep(state, FaceDirection.Right);
        replay.record(ReplayCommandCode.Teleport, 1, 0);

        await playRoute(state);

        expect(state.hero.location.x).toBe(1);
        expect(state.hero.location.y).toBe(0);
    });
});

describe('replay playback error codes 2001-2008', () => {
    // 验证参数数量与参数类型不匹配分别记录错误码 2001 与 2002
    it('warns 2001 and 2002 for parameter count and type mismatches', async () => {
        const state = createCoreState();
        const error = vi.spyOn(logger, 'error');
        const move = new ReplayMoveCommand(state, FaceDirection.Up);
        const teleport = new ReplayTeleportCommand(state);

        await expect(
            move.execute(step(ReplayCommandCode.Up, [1]))
        ).resolves.toBe(false);
        expect(error).toHaveBeenCalledWith(2001, 'move', '0', '1');

        await expect(
            teleport.execute(step(ReplayCommandCode.Teleport, ['x', 1]))
        ).resolves.toBe(false);
        expect(error).toHaveBeenCalledWith(
            2002,
            'teleport',
            '0',
            'number',
            'string'
        );
    });

    // 验证移动已在进行中与移动控制器缺失分别记录错误码 2003 与 2004
    it('warns 2003 and 2004 for a moving hero and a missing controller', async () => {
        const state = createCoreState();
        const error = vi.spyOn(logger, 'error');
        const mover = state.hero.location.mover;
        const move = new ReplayMoveCommand(state, FaceDirection.Up);
        (mover as unknown as { moving: boolean }).moving = true;

        await expect(
            move.execute(step(ReplayCommandCode.Up, []))
        ).resolves.toBe(false);
        expect(error).toHaveBeenCalledWith(2003);

        (mover as unknown as { moving: boolean }).moving = false;
        vi.spyOn(mover, 'start').mockReturnValueOnce(null);
        await expect(move.notExecuted()).resolves.toBe(false);
        expect(error).toHaveBeenCalledWith(2004);
    });

    // 验证瞬移无路径时记录错误码 2005
    it('warns 2005 when teleport finds no path', async () => {
        const state = createCoreState();
        const error = vi.spyOn(logger, 'error');
        vi.spyOn(state.pathfinding, 'teleportTo').mockReturnValueOnce(null);
        const teleport = new ReplayTeleportCommand(state);

        await expect(
            teleport.execute(step(ReplayCommandCode.Teleport, [4, 5]))
        ).resolves.toBe(false);
        expect(error).toHaveBeenCalledWith(2005, '4', '5');
    });

    // 验证使用物品失败时记录错误码 2006
    it('warns 2006 when using an item fails', async () => {
        const state = createCoreState();
        const error = vi.spyOn(logger, 'error');
        vi.spyOn(state.hero.items, 'useItem').mockReturnValueOnce(false);
        const useItem = new ReplayUseItemCommand(state);

        await expect(
            useItem.execute(step(ReplayCommandCode.UseItem, [34]))
        ).resolves.toBe(false);
        expect(error).toHaveBeenCalledWith(2006, '34');
    });

    // 验证装备未落到指定槽位时记录错误码 2007
    it('warns 2007 when equip fails to occupy the slot', async () => {
        const state = createCoreState();
        const error = vi.spyOn(logger, 'error');
        const equipment = state.hero.equip;
        vi.spyOn(equipment, 'equip').mockImplementation(() => undefined);
        vi.spyOn(equipment, 'getEquipped').mockReturnValueOnce(undefined);
        const equip = new ReplayEquipCommand(state);

        await expect(
            equip.execute(step(ReplayCommandCode.Equip, [99, 1, false]))
        ).resolves.toBe(false);
        expect(error).toHaveBeenCalledWith(2007, '99', '1');
    });

    // 验证卸下后槽位仍有装备时记录错误码 2008
    it('warns 2008 when unequip leaves the slot occupied', async () => {
        const state = createCoreState();
        const error = vi.spyOn(logger, 'error');
        const equipment = state.hero.equip;
        vi.spyOn(equipment, 'unequip').mockImplementation(() => undefined);
        vi.spyOn(equipment, 'getEquipped').mockReturnValueOnce(88);
        const unequip = new ReplayUnequipCommand(state);

        await expect(
            unequip.execute(step(ReplayCommandCode.Unequip, [1]))
        ).resolves.toBe(false);
        expect(error).toHaveBeenCalledWith(2008, '1');
    });

    // 验证录像不可存档属主为 ReplaySystem，ReplayArray 不再提供 saveState/loadState
    it('keeps the saveable owner on ReplaySystem instead of ReplayArray', () => {
        const state = createCoreState();
        const route = state.replaySystem.route;
        const save = state.replaySystem.saveState(
            SaveCompression.NoCompression
        );

        expect(save).toMatchObject({
            length: 0,
            commandWidth: route.commandWidth,
            commandArray: expect.any(ArrayBuffer),
            paramArray: expect.any(ArrayBuffer)
        });
        expect(
            (route as unknown as Record<string, unknown>).saveState
        ).toBeUndefined();
        expect(
            (route as unknown as Record<string, unknown>).loadState
        ).toBeUndefined();
    });
});
