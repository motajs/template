import { logger } from '@motajs/common';
import {
    FaceDirection,
    IReplayStepHandler,
    IMoverController,
    beginReplaySafetyCollection,
    endReplaySafetyCollection,
    logReplaySafetyDetail,
    shouldReplay
} from '@user/data-common';
import { EquipStatus } from '@user/data-base';
import { describe, expect, it, vi } from 'vitest';
import { createCoreState } from '../core';
import { ReplaySystem } from '../../../data-common/src/replay/system';
import {
    createReplayCommandItems,
    registerReplayCommandItems
} from './commands';
import {
    IReplayCommandItem,
    ReplayCommandCode,
    REPLAY_COMMAND_ORDER
} from './types';

function step(
    command: number,
    params: IReplayStepHandler['params']
): IReplayStepHandler {
    return { command, params, index: 0 };
}

function controller(onEnd: Promise<void>): Readonly<IMoverController> {
    return {
        done: false,
        onEnd,
        push: () => {},
        insert: () => {},
        stop: () => onEnd
    };
}

describe('replay commands', () => {
    // 验证默认 command item 只按稳定 enum 顺序提供八个实现
    it('creates the approved command order without module-owned numbering', () => {
        const state = createCoreState();
        const items = createReplayCommandItems(state);
        expect(items.map(item => item.code)).toEqual(REPLAY_COMMAND_ORDER);
        expect(items).toHaveLength(8);
        expect(items.map(item => item.command.execute)).toHaveLength(8);
    });

    // 验证顶层注册器按稳定顺序注册并拒绝重复 code
    it('registers commands in order and rejects duplicate codes', () => {
        const state = createCoreState();
        const replay = new ReplaySystem();
        const items = createReplayCommandItems(state);
        registerReplayCommandItems(replay, items);
        expect(
            REPLAY_COMMAND_ORDER.every(code => replay.getCommand(code))
        ).toBe(true);

        const duplicate: IReplayCommandItem[] = items.map((item, index) =>
            index === 1 ? { ...item, code: ReplayCommandCode.Up } : item
        );
        expect(() =>
            registerReplayCommandItems(new ReplaySystem(), duplicate)
        ).toThrow('Duplicate replay command code');
    });

    // 验证每个 CoreState 都独立装配八个稳定 command 与寻路访问边界
    it('assembles an independent top-level registry for every CoreState', () => {
        const first = createCoreState();
        const second = createCoreState();
        expect(first.replaySystem).not.toBe(second.replaySystem);
        expect(first.pathfinding).not.toBe(second.pathfinding);
        expect(
            REPLAY_COMMAND_ORDER.map(code =>
                first.replaySystem.getCommand(code)
            ).length
        ).toBe(8);
        expect(
            REPLAY_COMMAND_ORDER.map(code =>
                second.replaySystem.getCommand(code)
            ).length
        ).toBe(8);
        expect(
            REPLAY_COMMAND_ORDER.every(
                code => first.replaySystem.getCommand(code) !== null
            )
        ).toBe(true);
        expect(
            REPLAY_COMMAND_ORDER.every(
                code => second.replaySystem.getCommand(code) !== null
            )
        ).toBe(true);
        expect(first.replaySystem.route).not.toBe(second.replaySystem.route);
    });

    // 验证四向移动在 controller.onEnd 兑现前不会完成 command
    it('awaits a directional movement controller', async () => {
        const state = createCoreState();
        const items = createReplayCommandItems(state);
        const deferred = Promise.withResolvers<void>();
        const mover = state.hero.location.mover;
        const move = vi.spyOn(mover, 'step');
        const start = vi
            .spyOn(mover, 'start')
            .mockReturnValue(controller(deferred.promise));
        const result = items[ReplayCommandCode.Right].command.execute(
            step(ReplayCommandCode.Right, [])
        );
        let settled = false;
        void result.then(() => {
            settled = true;
        });
        await Promise.resolve();
        expect(settled).toBe(false);
        expect(move).toHaveBeenCalledWith(FaceDirection.Right);
        expect(start).toHaveBeenCalledTimes(1);
        deferred.resolve();
        await expect(result).resolves.toBe(true);
    });

    // 验证自动寻路等待 PathfindingSystem 返回的完整 controller
    it('awaits the pathfinding controller and returns false when no path exists', async () => {
        const state = createCoreState();
        const items = createReplayCommandItems(state);
        const deferred = Promise.withResolvers<void>();
        const moveTo = vi.spyOn(state.pathfinding, 'moveTo');
        moveTo.mockReturnValue({
            controller: controller(deferred.promise),
            path: []
        });
        const result = items[
            ReplayCommandCode.AutoPathfindToPoint
        ].command.execute(step(ReplayCommandCode.AutoPathfindToPoint, [2, 3]));
        await Promise.resolve();
        expect(moveTo).toHaveBeenCalledWith({ x: 2, y: 3 });
        deferred.resolve();
        await expect(result).resolves.toBe(true);
        moveTo.mockReturnValue(null);
        await expect(
            items[ReplayCommandCode.AutoPathfindToPoint].command.execute(
                step(ReplayCommandCode.AutoPathfindToPoint, [2, 3])
            )
        ).resolves.toBe(false);
    });

    // 验证道具和装备 command 使用既有状态 API 并把失败结果返回给 replay
    it('returns the existing item and equipment action results', async () => {
        const state = createCoreState();
        const items = createReplayCommandItems(state);
        const useItem = vi
            .spyOn(state.hero.items, 'useItem')
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(false);
        await expect(
            items[ReplayCommandCode.UseItem].command.execute(
                step(ReplayCommandCode.UseItem, [12])
            )
        ).resolves.toBe(true);
        await expect(
            items[ReplayCommandCode.UseItem].command.execute(
                step(ReplayCommandCode.UseItem, ['unknown'])
            )
        ).resolves.toBe(false);
        expect(useItem).toHaveBeenNthCalledWith(1, 12);

        const canEquipTo = vi
            .spyOn(state.hero.equip, 'canEquipTo')
            .mockReturnValue(EquipStatus.CanEquip);
        const getEquipped = vi
            .spyOn(state.hero.equip, 'getEquipped')
            .mockReturnValueOnce(undefined)
            .mockReturnValueOnce(99)
            .mockReturnValueOnce(99)
            .mockReturnValueOnce(undefined);
        const equip = vi
            .spyOn(state.hero.equip, 'equip')
            .mockImplementation(() => undefined);
        await expect(
            items[ReplayCommandCode.Equip].command.execute(
                step(ReplayCommandCode.Equip, [99, 0])
            )
        ).resolves.toBe(true);
        expect(canEquipTo).toHaveBeenCalledWith(99, 0);
        expect(equip).toHaveBeenCalledWith(99, 0, undefined);
        await expect(
            items[ReplayCommandCode.Unequip].command.execute(
                step(ReplayCommandCode.Unequip, [0])
            )
        ).resolves.toBe(true);
        expect(getEquipped).toHaveBeenCalled();
    });

    // 验证所有 command 对无效参数都以 false 结束而不推进状态
    it('returns false for invalid command parameters', async () => {
        const state = createCoreState();
        const items = createReplayCommandItems(state);
        const invalid = [
            items[ReplayCommandCode.Up].command.execute(step(0, [1])),
            items[ReplayCommandCode.AutoPathfindToPoint].command.execute(
                step(4, ['x', 1])
            ),
            items[ReplayCommandCode.UseItem].command.execute(step(5, [])),
            items[ReplayCommandCode.Equip].command.execute(step(6, [1])),
            items[ReplayCommandCode.Unequip].command.execute(step(7, ['slot']))
        ];
        await expect(Promise.all(invalid)).resolves.toEqual([
            false,
            false,
            false,
            false,
            false
        ]);
    });
});

describe('replay safety decorators', () => {
    // 验证异步 decorator 在 Promise 兑现前保留嵌套 collection 上下文
    it('keeps collection context through deferred nested actions', async () => {
        interface DecoratedFixture {
            inner(): void;
            outer(gate: Promise<void>): Promise<void>;
        }
        const inner = shouldReplay('inner')(
            function (this: DecoratedFixture): void {},
            { name: 'inner' } as ClassMethodDecoratorContext<
                DecoratedFixture,
                (this: DecoratedFixture) => void
            >
        );
        const outer = shouldReplay('outer')(
            async function (
                this: DecoratedFixture,
                gate: Promise<void>
            ): Promise<void> {
                await gate;
                this.inner();
            },
            { name: 'outer' } as ClassMethodDecoratorContext<
                DecoratedFixture,
                (this: DecoratedFixture, gate: Promise<void>) => Promise<void>
            >
        );
        const fixture: DecoratedFixture = {
            inner,
            outer
        };

        const replay = new ReplaySystem();
        const gate = Promise.withResolvers<void>();
        const warning = vi.spyOn(logger, 'warn');
        const group = vi.spyOn(console, 'group').mockImplementation(() => {});
        beginReplaySafetyCollection(replay);
        const action = fixture.outer(gate.promise);
        gate.resolve();
        await action;
        endReplaySafetyCollection();

        const detail = warning.mock.calls.find(call => call[0] === 161);
        expect(detail).toBeDefined();
        const command = String(detail![1]);
        const match = command.match(/\((\d+)\)/);
        expect(match).not.toBeNull();
        const output = vi.spyOn(console, 'log').mockImplementation(() => {});
        logReplaySafetyDetail(Number(match![1]));
        expect(group).toHaveBeenCalled();
        expect(output.mock.calls.flat().join(' ')).toContain('inner');
        warning.mockRestore();
        group.mockRestore();
        output.mockRestore();
    });

    // 验证同步 collection 在结束后可重新开始且不会残留旧上下文
    it('resets the collection lifecycle after completion', () => {
        const replay = new ReplaySystem();
        const warning = vi.spyOn(logger, 'warn');
        beginReplaySafetyCollection(replay);
        endReplaySafetyCollection();
        beginReplaySafetyCollection(replay);
        endReplaySafetyCollection();
        expect(warning).not.toHaveBeenCalledWith(159);
        warning.mockRestore();
    });
});
