// 测试录像存读档：ReplaySystem 同实例往返、多类型参数读回与活跃读流跨读档过期
import { logger } from '@motajs/common';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { ReplaySystem } from './system';

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

afterAll(() => {
    vi.unstubAllGlobals();
});

/** 构造一个独立的录像系统实例 */
function createSystem(): ReplaySystem {
    return new ReplaySystem();
}

describe('ReplaySystem save and load round trips', () => {
    // 验证已注册指令与录像步在同实例上恢复到存档点
    it('restores the route and registered commands on the same instance', () => {
        const system = createSystem();
        system.registerCommand(3, { execute: async () => true });
        system.record(3, 1, true, 'param');

        const snapshot = system.saveState();
        system.record(4, 2);
        system.replaying = true;
        system.loadState(snapshot);

        expect(system.array.length).toBe(1);
        expect(system.array.commandWidth).toBe(snapshot.commandWidth);
        expect(system.array.get(0)).toEqual({
            command: 3,
            params: [1, true, 'param'],
            index: 0
        });
        expect(system.getCommand(3)).not.toBeNull();
        expect(system.getCommand(4)).toBeNull();
    });

    // 验证读档后命令与参数数组与快照关键内容一致
    it('keeps the command and param arrays consistent with the snapshot', () => {
        const system = createSystem();
        system.record(2, 7);

        const snapshot = system.saveState();
        system.record(5, 9);
        system.loadState(snapshot);

        expect(system.array.getCommandArray()).toBe(snapshot.commandArray);
        expect(system.array.getParamArray()).toBe(snapshot.paramArray);
        expect(system.array.get(0).command).toBe(2);
    });

    // 验证读档整体替换缓冲区后，此前创建的活跃沙箱读流被标记过期并触发告警码 156（#06-17-3）
    it('expires an active sandbox read stream when a snapshot is loaded', () => {
        const system = createSystem();
        system.registerCommand(1, { execute: async () => true });
        system.record(1, 7);

        const snapshot = system.saveState();
        system.record(1, 9);

        const sandbox = system.createReplaySandbox({
            route: system.array,
            reseter: { reset: () => {} }
        });
        system.loadState(snapshot);

        const { info } = logger.catch(() => sandbox.play());

        expect(info.map(v => v.code)).toContain(156);
    });
});
