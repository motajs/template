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

describe('replay commands', () => {
    // 验证默认 command item 只按稳定 enum 顺序提供八个实现
    it('creates the approved command order without module-owned numbering', () => {
        const state = createCoreState();
        const items = createReplayCommandItems(state);
        expect(items.map(item => item.code)).toEqual(REPLAY_COMMAND_ORDER);
        expect(items).toHaveLength(8);
        expect(items.map(item => item.command.execute)).toHaveLength(8);
        expect(items.map(item => item.command.constructor.name)).toEqual([
            'ReplayUpCommand',
            'ReplayRightCommand',
            'ReplayDownCommand',
            'ReplayLeftCommand',
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

    // 验证四向移动不等待 controller.onEnd 即完成 command
    it('completes directional movement without awaiting the controller', async () => {
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
        expect(move).toHaveBeenCalledWith(FaceDirection.Right);
        expect(start).toHaveBeenCalledTimes(1);
        await expect(result).resolves.toBe(true);
        deferred.resolve();
    });

    // 验证自动寻路不等待 PathfindingSystem 返回的 controller
    it('completes pathfinding without awaiting the controller', async () => {
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
        expect(moveTo).toHaveBeenCalledWith({ x: 2, y: 3 });
        await expect(result).resolves.toBe(true);
        deferred.resolve();
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

    // 验证真实 registry 的生产移动入口在同步返回时恢复安全收集上下文
    it('restores registry movement safety context synchronously', async () => {
        const state = createCoreState();
        const replay = new ReplaySystem();
        registerReplayCommandItems(replay, createReplayCommandItems(state));
        const deferred = Promise.withResolvers<void>();
        const mover = state.hero.location.mover;
        vi.spyOn(mover, 'start').mockReturnValue(controller(deferred.promise));
        const warning = vi.spyOn(logger, 'warn');
        let ended = false;
        beginReplaySafetyCollection(replay);
        try {
            const action = replay
                .getCommand(ReplayCommandCode.Right)!
                .execute(step(ReplayCommandCode.Right, []));
            await expect(action).resolves.toBe(true);
            deferred.resolve();
            endReplaySafetyCollection();
            ended = true;

            const detail = warning.mock.calls.find(call => call[0] === 161);
            expect(detail).toBeDefined();
            expect(String(detail![2])).toContain('replay command: move hero');
        } finally {
            if (!ended) endReplaySafetyCollection();
            warning.mockRestore();
        }
    });

    // 验证真实 registry 的道具和装备入口均经过生产 replay 安全边界
    it('decorates real registry item and equipment actions', async () => {
        const state = createCoreState();
        const replay = new ReplaySystem();
        registerReplayCommandItems(replay, createReplayCommandItems(state));
        vi.spyOn(state.hero.items, 'useItem').mockReturnValue(true);
        vi.spyOn(state.hero.equip, 'canEquipTo').mockReturnValue(
            EquipStatus.CanEquip
        );
        vi.spyOn(state.hero.equip, 'getEquipped')
            .mockReturnValueOnce(undefined)
            .mockReturnValueOnce(99);
        vi.spyOn(state.hero.equip, 'equip').mockImplementation(() => undefined);
        const warning = vi.spyOn(logger, 'warn');
        let ended = false;
        beginReplaySafetyCollection(replay);
        try {
            await expect(
                replay
                    .getCommand(ReplayCommandCode.UseItem)!
                    .execute(step(ReplayCommandCode.UseItem, [12]))
            ).resolves.toBe(true);
            await expect(
                replay
                    .getCommand(ReplayCommandCode.Equip)!
                    .execute(step(ReplayCommandCode.Equip, [99, 0]))
            ).resolves.toBe(true);
            endReplaySafetyCollection();
            ended = true;

            const detail = warning.mock.calls.find(call => call[0] === 161);
            expect(detail).toBeDefined();
            expect(String(detail![2])).toContain('replay command: use item');
            expect(String(detail![2])).toContain('replay command: equip item');
        } finally {
            if (!ended) endReplaySafetyCollection();
            warning.mockRestore();
        }
    });

    // 验证生产 command 的参数校验和寻路查询不会制造 replay 安全记录
    it('keeps pure path queries and validation outside the safety boundary', async () => {
        const state = createCoreState();
        const replay = new ReplaySystem();
        registerReplayCommandItems(replay, createReplayCommandItems(state));
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

    // 验证八个 command 类各自拥有 execute 且不存在共享入口或跨类调用
    it('keeps replay command ownership isolated in the command module', () => {
        const source = readFileSync(
            new URL('./commands.ts', import.meta.url),
            'utf8'
        );
        const classes = [
            'ReplayUpCommand',
            'ReplayRightCommand',
            'ReplayDownCommand',
            'ReplayLeftCommand',
            'ReplayAutoPathfindCommand',
            'ReplayUseItemCommand',
            'ReplayEquipCommand',
            'ReplayUnequipCommand'
        ];
        expect(source).not.toContain('ReplayCommandEntrances');
        expect(source).not.toContain('createMoveCommand');
        expect(source).not.toMatch(/\bentries\./);
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
