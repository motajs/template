import { logger } from '@motajs/common';
import {
    FaceDirection,
    IReplayStepHandler,
    IReplaySandbox,
    IMoverController,
    beginReplaySafetyCollection,
    endReplaySafetyCollection,
    logReplaySafetyDetail,
    shouldReplay
} from '@user/data-common';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { createCoreState } from '../core';
import { ReplaySystem } from '../../../data-common/src/replay/system';
import {
    ReplayEquipCommand,
    ReplayMoveCommand,
    ReplayTeleportCommand,
    ReplayUnequipCommand,
    ReplayUseItemCommand
} from './commands';
import { ReplayCommandCode, REPLAY_COMMAND_ORDER } from './types';

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

interface IManualReplaySandbox extends IReplaySandbox {
    playing: boolean;
    pausing: boolean;
}

describe('replay commands', () => {
    // 验证每个 CoreState 都按稳定顺序装配八个指令
    it('registers the eight stable commands in order on every CoreState', () => {
        const state = createCoreState();
        expect(REPLAY_COMMAND_ORDER).toEqual([
            ReplayCommandCode.Up,
            ReplayCommandCode.Right,
            ReplayCommandCode.Down,
            ReplayCommandCode.Left,
            ReplayCommandCode.Teleport,
            ReplayCommandCode.UseItem,
            ReplayCommandCode.Equip,
            ReplayCommandCode.Unequip
        ]);
        expect(
            REPLAY_COMMAND_ORDER.every(code =>
                state.replaySystem.getCommand(code)
            )
        ).toBe(true);
    });

    // 验证每个 CoreState 独立装配，且四向共用一个参数化移动类
    it('assembles an independent command set per CoreState', () => {
        const first = createCoreState();
        const second = createCoreState();
        const firstCommands = REPLAY_COMMAND_ORDER.map(
            code => first.replaySystem.getCommand(code)!
        );
        const secondCommands = REPLAY_COMMAND_ORDER.map(
            code => second.replaySystem.getCommand(code)!
        );
        expect(new Set(firstCommands).size).toBe(8);
        expect(new Set(secondCommands).size).toBe(8);
        for (let index = 0; index < firstCommands.length; index++) {
            expect(firstCommands[index]).not.toBe(secondCommands[index]);
        }
        expect(firstCommands.map(command => command.constructor.name)).toEqual([
            'ReplayMoveCommand',
            'ReplayMoveCommand',
            'ReplayMoveCommand',
            'ReplayMoveCommand',
            'ReplayTeleportCommand',
            'ReplayUseItemCommand',
            'ReplayEquipCommand',
            'ReplayUnequipCommand'
        ]);
    });

    // 验证移动指令只加入方向步，由 notExecuted 统一启动并等待
    it('steps direction without starting and finalizes through notExecuted', async () => {
        const state = createCoreState();
        const mover = state.hero.location.mover;
        const move = vi.spyOn(mover, 'step');
        const first = Promise.withResolvers<void>();
        const start = vi
            .spyOn(mover, 'start')
            .mockReturnValueOnce(controller(first.promise));
        const command = new ReplayMoveCommand(state, FaceDirection.Right);

        await expect(
            command.execute(step(ReplayCommandCode.Right, []))
        ).resolves.toBe(true);
        expect(move).toHaveBeenCalledWith(FaceDirection.Right);
        expect(start).not.toHaveBeenCalled();

        let result: boolean | undefined;
        const pending = command.notExecuted().then(value => {
            result = value;
        });
        await Promise.resolve();
        expect(start).toHaveBeenCalledTimes(1);
        expect(result).toBeUndefined();
        first.resolve();
        await pending;
        expect(result).toBe(true);
    });

    // 验证移动已在进行中或无法启动时返回 false 并记录错误码
    it('rejects a move while moving and a missing controller', async () => {
        const state = createCoreState();
        const error = vi.spyOn(logger, 'error');
        const mover = state.hero.location.mover;
        (mover as unknown as { moving: boolean }).moving = true;
        const command = new ReplayMoveCommand(state, FaceDirection.Up);
        await expect(
            command.execute(step(ReplayCommandCode.Up, []))
        ).resolves.toBe(false);
        expect(error).toHaveBeenCalledWith(2003);

        (mover as unknown as { moving: boolean }).moving = false;
        vi.spyOn(mover, 'start').mockReturnValueOnce(null);
        await expect(command.notExecuted()).resolves.toBe(false);
        expect(error).toHaveBeenCalledWith(2004);
        error.mockRestore();
    });

    // 验证瞬移等待寻路控制器完成，无路径时返回 false
    it('teleports and awaits the pathfinding controller', async () => {
        const state = createCoreState();
        const first = Promise.withResolvers<void>();
        const teleport = vi
            .spyOn(state.pathfinding, 'teleportTo')
            .mockReturnValueOnce({
                controller: controller(first.promise),
                path: []
            });
        const command = new ReplayTeleportCommand(state);

        let result: boolean | undefined;
        const pending = command
            .execute(step(ReplayCommandCode.Teleport, [2, 3]))
            .then(value => {
                result = value;
            });
        await Promise.resolve();
        expect(teleport).toHaveBeenCalledWith({ x: 2, y: 3 });
        expect(result).toBeUndefined();
        first.resolve();
        await pending;
        expect(result).toBe(true);

        const error = vi.spyOn(logger, 'error');
        teleport.mockReturnValueOnce(null);
        await expect(
            command.execute(step(ReplayCommandCode.Teleport, [4, 5]))
        ).resolves.toBe(false);
        expect(error).toHaveBeenCalledWith(2005, '4', '5');
        error.mockRestore();
    });

    // 验证道具使用直接返回既有状态接口结果，失败时记录错误码
    it('returns the hero item-use result', async () => {
        const state = createCoreState();
        const error = vi.spyOn(logger, 'error');
        const useItem = vi
            .spyOn(state.hero.items, 'useItem')
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(false);
        const command = new ReplayUseItemCommand(state);

        await expect(
            command.execute(step(ReplayCommandCode.UseItem, [12]))
        ).resolves.toBe(true);
        await expect(
            command.execute(step(ReplayCommandCode.UseItem, [34]))
        ).resolves.toBe(false);
        expect(useItem).toHaveBeenNthCalledWith(1, 12);
        expect(error).toHaveBeenCalledWith(2006, '34');
        error.mockRestore();
    });

    // 验证装备指令复用既有装备边界并区分三种失败位置
    // 验证装备指令复用既有装备边界并以最终槽位校验结果
    it('equips through the existing equipment boundary', async () => {
        const state = createCoreState();
        const equipment = state.hero.equip;
        const error = vi.spyOn(logger, 'error');
        const getEquipped = vi.spyOn(equipment, 'getEquipped');
        const equip = vi
            .spyOn(equipment, 'equip')
            .mockImplementation(() => undefined);
        const command = new ReplayEquipCommand(state);

        // 装备后槽位为指定 uid
        getEquipped.mockReturnValueOnce(99);
        await expect(
            command.execute(step(ReplayCommandCode.Equip, [99, 0, true]))
        ).resolves.toBe(true);
        expect(equip).toHaveBeenCalledWith(99, 0, true);

        // 装备后槽位未变为指定 uid
        getEquipped.mockReturnValueOnce(undefined);
        await expect(
            command.execute(step(ReplayCommandCode.Equip, [99, 1, false]))
        ).resolves.toBe(false);
        expect(error).toHaveBeenCalledWith(2007, '99', '1');

        error.mockRestore();
    });

    // 验证卸下指令复用既有装备边界并以最终槽位校验结果
    it('unequips through the existing equipment boundary', async () => {
        const state = createCoreState();
        const equipment = state.hero.equip;
        const error = vi.spyOn(logger, 'error');
        const getEquipped = vi.spyOn(equipment, 'getEquipped');
        const unequip = vi
            .spyOn(equipment, 'unequip')
            .mockImplementation(() => undefined);
        const command = new ReplayUnequipCommand(state);

        // 卸下后槽位为空
        getEquipped.mockReturnValueOnce(undefined);
        await expect(
            command.execute(step(ReplayCommandCode.Unequip, [0]))
        ).resolves.toBe(true);
        expect(unequip).toHaveBeenCalledWith(0);

        // 卸下后槽位仍有装备
        getEquipped.mockReturnValueOnce(88);
        await expect(
            command.execute(step(ReplayCommandCode.Unequip, [1]))
        ).resolves.toBe(false);
        expect(error).toHaveBeenCalledWith(2008, '1');

        error.mockRestore();
    });

    // 验证沙箱在下一步指令前先结束上一步的移动批次
    it('finalizes the previous move before executing a different command', async () => {
        const state = createCoreState();
        const mover = state.hero.location.mover;
        const move = vi.spyOn(mover, 'step');
        const first = Promise.withResolvers<void>();
        const start = vi
            .spyOn(mover, 'start')
            .mockReturnValueOnce(controller(first.promise));
        const useItem = vi
            .spyOn(state.hero.items, 'useItem')
            .mockReturnValueOnce(true);
        const replay = state.replaySystem;
        replay.record(ReplayCommandCode.Right);
        replay.record(ReplayCommandCode.UseItem, 5);
        const sandbox = replay.createReplaySandbox({
            route: replay.route,
            reseter: { reset: () => {} }
        }) as IManualReplaySandbox;
        sandbox.playing = true;
        sandbox.pausing = false;

        await expect(sandbox.step()).resolves.toBe(true);
        expect(move).toHaveBeenCalledWith(FaceDirection.Right);
        expect(start).not.toHaveBeenCalled();

        const next = sandbox.step();
        await Promise.resolve();
        expect(start).toHaveBeenCalledTimes(1);
        expect(useItem).not.toHaveBeenCalled();
        first.resolve();
        await expect(next).resolves.toBe(true);
        expect(useItem).toHaveBeenCalledWith(5);
    });

    // 验证参数数量或类型不符的指令以 false 结束
    it('returns false for invalid command parameters', async () => {
        const state = createCoreState();
        const move = new ReplayMoveCommand(state, FaceDirection.Up);
        const teleport = new ReplayTeleportCommand(state);
        const useItem = new ReplayUseItemCommand(state);
        const equip = new ReplayEquipCommand(state);
        const unequip = new ReplayUnequipCommand(state);
        const invalid = [
            move.execute(step(ReplayCommandCode.Up, [1])),
            teleport.execute(step(ReplayCommandCode.Teleport, ['x', 1])),
            teleport.execute(step(ReplayCommandCode.Teleport, [1])),
            useItem.execute(step(ReplayCommandCode.UseItem, [])),
            useItem.execute(step(ReplayCommandCode.UseItem, ['id'])),
            equip.execute(step(ReplayCommandCode.Equip, [1, 0])),
            equip.execute(step(ReplayCommandCode.Equip, [1, 0, 'x'])),
            unequip.execute(step(ReplayCommandCode.Unequip, ['slot']))
        ];
        await expect(Promise.all(invalid)).resolves.toEqual([
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false
        ]);
    });

    // 验证注册直接写在 CoreState 内，且指令模块自包含、不含 replay safety
    it('keeps registration direct and the command module self-contained', () => {
        const commands = readFileSync(
            new URL('./commands.ts', import.meta.url),
            'utf8'
        );
        expect(commands).not.toContain('createReplayCommandItems');
        expect(commands).not.toContain('registerReplayCommandItems');
        expect(commands).not.toContain('prettier-ignore');
        expect(commands).not.toContain('function isNumber');
        expect(commands).not.toContain('function resolveSlot');
        expect(commands).not.toContain('shouldReplay');

        const core = readFileSync(
            new URL('../core.ts', import.meta.url),
            'utf8'
        );
        expect(core).not.toContain('createReplayCommandItems');
        expect(core).not.toContain('registerReplayCommandItems');
        expect(core).toContain('private registerReplayCommands()');
        expect((core.match(/new ReplayMoveCommand\(this,/g) ?? []).length).toBe(
            4
        );
        expect(core).toContain('new ReplayTeleportCommand(this)');
        expect(core).toContain('new ReplayUseItemCommand(this)');
        expect(core).toContain('new ReplayEquipCommand(this)');
        expect(core).toContain('new ReplayUnequipCommand(this)');
    });
});

describe('replay safety decorators', () => {
    // 验证同步 decorator 在方法返回后恢复嵌套 collection 上下文
    it('restores collection context after synchronous nested actions', () => {
        interface DecoratedFixture {
            inner(): void;
            outer(): void;
        }
        const inner = shouldReplay('inner')(
            function (this: DecoratedFixture): void {},
            { name: 'inner' } as ClassMethodDecoratorContext<
                DecoratedFixture,
                (this: DecoratedFixture) => void
            >
        );
        const outer = shouldReplay('outer')(
            function (this: DecoratedFixture): void {
                this.inner();
            },
            { name: 'outer' } as ClassMethodDecoratorContext<
                DecoratedFixture,
                (this: DecoratedFixture) => void
            >
        );
        const fixture: DecoratedFixture = {
            inner,
            outer
        };

        const replay = new ReplaySystem();
        const warning = vi.spyOn(logger, 'warn');
        const group = vi.spyOn(console, 'group').mockImplementation(() => {});
        const output = vi.spyOn(console, 'log').mockImplementation(() => {});
        beginReplaySafetyCollection(replay);
        try {
            fixture.outer();
            fixture.inner();
            endReplaySafetyCollection();

            const detail = warning.mock.calls.find(call => call[0] === 161);
            expect(detail).toBeDefined();
            const command = String(detail![1]);
            const match = command.match(/\((\d+)\)/);
            expect(match).not.toBeNull();
            logReplaySafetyDetail(Number(match![1]));
            expect(group).toHaveBeenCalled();
            expect(
                output.mock.calls.filter(call =>
                    String(call[0]).startsWith('inner:')
                )
            ).toHaveLength(2);
        } finally {
            warning.mockRestore();
            group.mockRestore();
            output.mockRestore();
        }
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

    // 验证用户拥有的勇士属性方法未增加 replay decorator
    it('does not change user-owned attribute decorator placement', () => {
        const source = readFileSync(
            new URL(
                '../../../data-base/src/hero/attribute.ts',
                import.meta.url
            ),
            'utf8'
        );
        expect(source).not.toContain('shouldReplay');
    });
});
