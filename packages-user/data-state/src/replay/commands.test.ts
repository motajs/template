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
import { EquipStatus } from '@user/data-base';
import { readFileSync } from 'node:fs';
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

interface IManualReplaySandbox extends IReplaySandbox {
    playing: boolean;
    pausing: boolean;
}

describe('replay commands', () => {
    // 验证默认 command item 只按稳定 enum 顺序提供八个实现
    it('creates the approved command order without module-owned numbering', () => {
        const state = createCoreState();
        const items = createReplayCommandItems(state);
        expect(items.map(item => item.code)).toEqual(REPLAY_COMMAND_ORDER);
        expect(items).toHaveLength(8);
        expect(items.map(item => item.command.execute)).toHaveLength(8);
        expect(items.map(item => item.command.constructor.name)).toEqual([
            'ReplayDirectionCommand',
            'ReplayDirectionCommand',
            'ReplayDirectionCommand',
            'ReplayDirectionCommand',
            'ReplayAutoPathfindCommand',
            'ReplayUseItemCommand',
            'ReplayEquipCommand',
            'ReplayUnequipCommand'
        ]);
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
        const firstCommands = REPLAY_COMMAND_ORDER.map(
            code => first.replaySystem.getCommand(code)!
        );
        const secondCommands = REPLAY_COMMAND_ORDER.map(
            code => second.replaySystem.getCommand(code)!
        );
        expect(first.replaySystem).not.toBe(second.replaySystem);
        expect(first.pathfinding).not.toBe(second.pathfinding);
        expect(firstCommands).toHaveLength(8);
        expect(secondCommands).toHaveLength(8);
        expect(new Set(firstCommands).size).toBe(8);
        expect(new Set(secondCommands).size).toBe(8);
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
        for (let index = 0; index < firstCommands.length; index++) {
            expect(firstCommands[index]).not.toBe(secondCommands[index]);
        }
    });

    // 验证现有 command item 扩展边界可以替换单个实现而不改变注册器
    it('registers an existing custom command item through the current interface', () => {
        const state = createCoreState();
        const replay = new ReplaySystem();
        const defaultItems = createReplayCommandItems(state);
        const customItem: IReplayCommandItem = {
            code: ReplayCommandCode.Up,
            command: {
                execute: () => Promise.resolve(true)
            }
        };
        registerReplayCommandItems(replay, [
            customItem,
            ...defaultItems.slice(1)
        ]);
        expect(replay.getCommand(ReplayCommandCode.Up)).toBe(
            customItem.command
        );
        expect(replay.getCommand(ReplayCommandCode.Right)).toBe(
            defaultItems[1].command
        );
    });

    // 验证稳定 registry 使用直接构造且不依赖手工 formatter 抑制
    it('keeps registry construction direct and formatter-normalized', () => {
        const source = readFileSync(
            new URL('./commands.ts', import.meta.url),
            'utf8'
        );
        expect(source).not.toContain('prettier-ignore');
        expect(source).toContain(
            'command: new ReplayDirectionCommand(state, FaceDirection.Up)'
        );
        expect(source).toContain(
            'command: new ReplayAutoPathfindCommand(state)'
        );
        expect(source).toContain('command: new ReplayUseItemCommand(state)');
        expect(source).toContain('command: new ReplayEquipCommand(state)');
        expect(source).toContain('command: new ReplayUnequipCommand(state)');
    });

    // 验证四向移动等待 controller.onEnd 后才完成 command 并进入下一步
    it('awaits directional movement before the next replay step', async () => {
        const state = createCoreState();
        const items = createReplayCommandItems(state);
        const first = Promise.withResolvers<void>();
        const second = Promise.withResolvers<void>();
        const mover = state.hero.location.mover;
        const move = vi.spyOn(mover, 'step');
        const start = vi
            .spyOn(mover, 'start')
            .mockReturnValueOnce(controller(first.promise))
            .mockReturnValueOnce(controller(second.promise));
        const replay = new ReplaySystem();
        registerReplayCommandItems(replay, items);
        replay.record(ReplayCommandCode.Right);
        replay.record(ReplayCommandCode.Right);
        const sandbox = replay.createReplaySandbox({
            route: replay.route,
            reseter: { reset: () => {} }
        }) as IManualReplaySandbox;
        sandbox.playing = true;
        sandbox.pausing = false;
        const result = sandbox.step();
        expect(move).toHaveBeenCalledWith(FaceDirection.Right);
        expect(start).toHaveBeenCalledTimes(1);
        await Promise.resolve();
        expect(start).toHaveBeenCalledTimes(1);
        first.resolve();
        await expect(result).resolves.toBe(true);
        const next = sandbox.step();
        await Promise.resolve();
        expect(start).toHaveBeenCalledTimes(2);
        second.resolve();
        await expect(next).resolves.toBe(true);
    });

    // 验证自动寻路等待 PathfindingSystem 返回的 controller 后才进入下一步
    it('awaits pathfinding before the next replay step', async () => {
        const state = createCoreState();
        const items = createReplayCommandItems(state);
        const first = Promise.withResolvers<void>();
        const second = Promise.withResolvers<void>();
        const moveTo = vi
            .spyOn(state.pathfinding, 'moveTo')
            .mockReturnValueOnce({
                controller: controller(first.promise),
                path: []
            })
            .mockReturnValueOnce({
                controller: controller(second.promise),
                path: []
            });
        const replay = new ReplaySystem();
        registerReplayCommandItems(replay, items);
        replay.record(ReplayCommandCode.AutoPathfindToPoint, 2, 3);
        replay.record(ReplayCommandCode.AutoPathfindToPoint, 4, 5);
        const sandbox = replay.createReplaySandbox({
            route: replay.route,
            reseter: { reset: () => {} }
        }) as IManualReplaySandbox;
        sandbox.playing = true;
        sandbox.pausing = false;
        const result = sandbox.step();
        expect(moveTo).toHaveBeenCalledWith({ x: 2, y: 3 });
        expect(moveTo).toHaveBeenCalledTimes(1);
        await Promise.resolve();
        expect(moveTo).toHaveBeenCalledTimes(1);
        first.resolve();
        await expect(result).resolves.toBe(true);
        const next = sandbox.step();
        await Promise.resolve();
        expect(moveTo).toHaveBeenCalledWith({ x: 4, y: 5 });
        expect(moveTo).toHaveBeenCalledTimes(2);
        second.resolve();
        await expect(next).resolves.toBe(true);
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

    // 验证生产 command 不拥有 replay safety helper 且纯查询不制造安全记录
    it('keeps replay safety ownership below production commands', async () => {
        const state = createCoreState();
        const replay = new ReplaySystem();
        registerReplayCommandItems(replay, createReplayCommandItems(state));
        const source = readFileSync(
            new URL('./commands.ts', import.meta.url),
            'utf8'
        );
        expect(source).not.toContain('shouldReplay');
        const getPath = vi
            .spyOn(state.pathfinding, 'getPath')
            .mockReturnValue([]);
        const warning = vi.spyOn(logger, 'warn');
        let ended = false;
        beginReplaySafetyCollection(replay);
        try {
            expect(state.pathfinding.getPath({ x: 1, y: 1 })).toEqual([]);
            await expect(
                replay
                    .getCommand(ReplayCommandCode.UseItem)!
                    .execute(step(ReplayCommandCode.UseItem, []))
            ).resolves.toBe(false);
            endReplaySafetyCollection();
            ended = true;

            expect(getPath).toHaveBeenCalledWith({ x: 1, y: 1 });
            expect(
                warning.mock.calls.filter(call => call[0] === 161)
            ).toHaveLength(0);
        } finally {
            if (!ended) endReplaySafetyCollection();
            warning.mockRestore();
        }
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

    // 验证方向 command 共享一个参数化类且不存在旧的重复入口
    it('keeps directional command ownership parameterized', () => {
        const source = readFileSync(
            new URL('./commands.ts', import.meta.url),
            'utf8'
        );
        const classes = [
            'ReplayDirectionCommand',
            'ReplayAutoPathfindCommand',
            'ReplayUseItemCommand',
            'ReplayEquipCommand',
            'ReplayUnequipCommand'
        ];
        expect(source).not.toContain('ReplayCommandEntrances');
        expect(source).not.toContain('createMoveCommand');
        expect(source).not.toMatch(/\bentries\./);
        expect(source).not.toMatch(
            /class\s+Replay(?:Up|Right|Down|Left)Command\b/
        );
        expect(
            (source.match(/new ReplayDirectionCommand\(state,/g) ?? []).length
        ).toBe(4);
        expect(source).toContain(
            'new ReplayDirectionCommand(state, FaceDirection.Up)'
        );
        expect(source).toContain(
            'new ReplayDirectionCommand(state, FaceDirection.Right)'
        );
        expect(source).toContain(
            'new ReplayDirectionCommand(state, FaceDirection.Down)'
        );
        expect(source).toContain(
            'new ReplayDirectionCommand(state, FaceDirection.Left)'
        );
        for (const className of classes) {
            const body = source.match(
                new RegExp(
                    `class\\s+${className}\\b[\\s\\S]*?(?=\\r?\\nclass\\s|\\r?\\nfunction\\s|\\r?\\nexport function\\s|\\r?\\n/\\*\\*/)`
                )
            )?.[0];
            expect(body).toBeDefined();
            expect(body).toMatch(/execute\s*\(/);
            for (const otherClass of classes) {
                if (otherClass === className) continue;
                expect(body).not.toContain(otherClass);
            }
        }
    });
});
