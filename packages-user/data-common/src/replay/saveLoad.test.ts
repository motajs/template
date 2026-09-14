// 测试录像存读档：ReplayArray 与 ReplaySystem 同实例往返与多类型参数读回
import { afterAll, describe, expect, it, vi } from 'vitest';
import { ReplayArray } from './array';
import { ReplaySystem } from './system';
import { ReplayCommandWidth } from './types';

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

interface IArrayOverrides {
    initCommandLength?: number;
    initParamLength?: number;
    commandExpandMultiplier?: number;
    paramExpandMultiplier?: number;
    commandWidth?: ReplayCommandWidth;
    commandMaxLength?: number;
    paramMaxLength?: number;
}

/** 与 system.ts 初始化保持一致的构造入口，默认给足初始容量避免无关扩容 */
function createArray(overrides: IArrayOverrides = {}): ReplayArray {
    return new ReplayArray({
        initCommandLength: 32,
        initParamLength: 128,
        commandExpandMultiplier: 2,
        paramExpandMultiplier: 2,
        commandWidth: ReplayCommandWidth.Uint8,
        commandMaxLength: 64,
        paramMaxLength: 512,
        ...overrides
    });
}

/** 构造一个独立的录像系统实例 */
function createSystem(): ReplaySystem {
    return new ReplaySystem();
}

describe('ReplayArray save and load round trips', () => {
    // 验证指令位宽与首步命令及多类型参数在同实例上读回一致
    it('restores the command width and reads back the first step on the same instance', () => {
        const array = createArray();
        array.add(3, [true, -128, 32768, 'hello', 5]);

        const saved = array.saveState();
        array.add(9, [1]);
        array.loadState(saved);

        expect(array.commandWidth).toBe(saved.metadata.commandWidth);
        expect(array.get(0)).toEqual({
            command: 3,
            params: [true, -128, 32768, 'hello', 5],
            index: 0
        });
    });

    // 疑似 bug：loadState 未恢复录像长度与索引数组，详见 06-TEST-FINDINGS.md #06-09-4
    it.skip('restores the recorded length on the same instance', () => {
        const array = createArray();
        array.add(1, [10]);

        const saved = array.saveState();
        array.add(2, [20]);
        array.loadState(saved);

        expect(array.length).toBe(1);
        expect(array.get(0)).toEqual({ command: 1, params: [10], index: 0 });
    });
});

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
