// 测试 ReplaySystem 的指令注册、录像录制与沙箱生命周期
import { logger } from '@motajs/common';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { ReplaySystem } from './system';
import {
    IReplayCommand,
    IReplaySandbox,
    ReplayCommandWidth,
    ReplayParamValue
} from './types';

vi.hoisted(() => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
});

afterAll(() => {
    vi.unstubAllGlobals();
});

// 构造一个结果固定的录像命令
function createCommand(result: boolean = true): IReplayCommand {
    return { execute: async () => result };
}

// 构造一个记录 reset 入参的状态重置对象
function createReseter() {
    const calls: Array<Map<string, unknown> | undefined> = [];
    return {
        calls,
        reseter: {
            reset: (save?: Map<string, unknown>) => {
                calls.push(save);
            }
        }
    };
}

describe('ReplaySystem registration and recording', () => {
    // 验证构造出的录像操作器为默认 uint8 位宽且初始为空
    it('builds an empty uint8 route', () => {
        const system = new ReplaySystem();

        expect(system.array.commandWidth).toBe(ReplayCommandWidth.Uint8);
        expect(system.array.length).toBe(0);
    });

    // 验证注册后可取回命令且未知码返回 null
    it('registers a command and returns null for an unknown code', () => {
        const system = new ReplaySystem();
        const command = createCommand();

        system.registerCommand(7, command);

        expect(system.getCommand(7)).toBe(command);
        expect(system.getCommand(99)).toBeNull();
    });

    // 验证重复注册触发告警码 163 且保留原命令
    it('warns code 163 on a duplicate registration and keeps the original', () => {
        const system = new ReplaySystem();
        const first = createCommand(true);
        const second = createCommand(false);
        system.registerCommand(1, first);

        const { info } = logger.catch(() => system.registerCommand(1, second));

        expect(info.map(v => v.code)).toContain(163);
        expect(system.getCommand(1)).toBe(first);
    });

    // 验证 record 追加录像步并触发 onRecordCommand 钩子
    it('appends a replay step and dispatches the record hook', () => {
        const system = new ReplaySystem();
        const recorded: Array<
            readonly [number, number, readonly ReplayParamValue[]]
        > = [];
        system
            .addHook({
                onRecordCommand: (code, index, params) => {
                    recorded.push([code, index, params]);
                }
            })
            .load();

        system.record(5, 1, true);

        expect(system.array.length).toBe(1);
        expect(system.array.get(0)).toEqual({
            command: 5,
            params: [1, true],
            index: 0
        });
        expect(recorded).toEqual([[5, 1, [1, true]]]);
    });

    // 验证每个 ReplaySystem 实例的注册与录像相互独立
    it('keeps commands and routes independent between instances', () => {
        const first = new ReplaySystem();
        const second = new ReplaySystem();
        first.registerCommand(1, createCommand());
        first.record(1);

        expect(second.getCommand(1)).toBeNull();
        expect(second.array.length).toBe(0);
        expect(first.array.length).toBe(1);
    });
});

describe('ReplaySystem sandbox lifecycle', () => {
    // 验证创建沙箱时用存档重置状态、保存 sandbox 并触发 onCreateSandbox
    it('creates a sandbox, resets state and dispatches onCreateSandbox', () => {
        const system = new ReplaySystem();
        const { calls, reseter } = createReseter();
        const created: IReplaySandbox[] = [];
        system
            .addHook({
                onCreateSandbox: sandbox => {
                    created.push(sandbox);
                }
            })
            .load();
        const save = new Map<string, unknown>([['hp', 10]]);

        const sandbox = system.createReplaySandbox({
            route: system.array,
            reseter,
            save
        });

        expect(calls).toEqual([save]);
        expect(system.sandbox).toBe(sandbox);
        expect(created).toEqual([sandbox]);
    });

    // 验证释放沙箱时停止播放并清空当前沙箱引用
    it('stops and clears the active sandbox on release', () => {
        const system = new ReplaySystem();
        const { reseter } = createReseter();
        const sandbox = system.createReplaySandbox({
            route: system.array,
            reseter
        });
        const stop = vi.spyOn(sandbox, 'stop').mockResolvedValue(undefined);

        system.releaseSandbox();

        expect(stop).toHaveBeenCalledTimes(1);
        expect(system.sandbox).toBeNull();
    });

    // 验证没有活跃沙箱时释放操作安全地保持为空
    it('releases safely when no sandbox is active', () => {
        const system = new ReplaySystem();

        system.releaseSandbox();

        expect(system.sandbox).toBeNull();
    });
});

describe('ReplaySystem disable and revert', () => {
    // 验证禁用后 record 被忽略，恢复后继续记录并委托给 route
    it('delegates disable and revert to the route', () => {
        const system = new ReplaySystem();
        const disable = vi.spyOn(system.array, 'disable');
        const revert = vi.spyOn(system.array, 'revert');
        system.record(1);

        system.disable();
        system.record(2);
        expect(disable).toHaveBeenCalledTimes(1);
        expect(system.array.length).toBe(1);

        system.revert();
        system.record(3);
        expect(revert).toHaveBeenCalledTimes(1);
        expect(system.array.length).toBe(2);
        expect(system.array.get(1).command).toBe(3);
    });
});
