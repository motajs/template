// 测试录像存读档：ReplaySystem 同实例往返与多类型参数读回
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

        expect(system.route.length).toBe(1);
        expect(system.route.commandWidth).toBe(snapshot.commandWidth);
        expect(system.route.get(0)).toEqual({
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

        expect(system.route.getCommandArray()).toBe(snapshot.commandArray);
        expect(system.route.getParamArray()).toBe(snapshot.paramArray);
        expect(system.route.get(0).command).toBe(2);
    });
});
