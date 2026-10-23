// 测试按键指令对象的构造缺省、组合增删、参数校验与模式切换行为
import { logger } from '@motajs/common';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { HotkeyCommand } from '../command';
import { KeyCode } from '../keyCodes';
import { HotkeyEmitMode, IHotkeyCommandInit } from '../types';

vi.hoisted(() => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
});

afterEach(() => {
    vi.restoreAllMocks();
});

afterAll(() => {
    vi.unstubAllGlobals();
});

// 构造一套按键指令初始化参数，未指定的部分使用缺省值
function createInit(
    overrides: Partial<IHotkeyCommandInit> = {}
): IHotkeyCommandInit {
    return {
        priority: 0,
        block: false,
        defaults: [],
        ...overrides
    };
}

// 构造一个用于测试的按键指令，显示名称与标识符一致
function createCommand(
    command: string,
    init: IHotkeyCommandInit
): HotkeyCommand {
    return new HotkeyCommand(command, command, init);
}

describe('HotkeyCommand', () => {
    // 构造器应用缺省值并写入默认组合
    it('applies defaults on construction', () => {
        const command = createCommand(
            'save',
            createInit({
                priority: 7,
                defaults: [[KeyCode.Ctrl, KeyCode.KeyS]]
            })
        );

        expect(command.command).toBe('save');
        expect(command.name).toBe('save');
        expect(command.priority).toBe(7);
        expect(command.block).toBe(false);
        expect(command.mode).toBe(HotkeyEmitMode.KeyUp);
        expect(command.timeout).toBe(0);
        expect(command.interval).toBe(0);
        expect(command.dt).toBe(0);
        expect(command.length).toBe(1);
        expect(command.getKeyCombination(0)).toEqual([
            KeyCode.Ctrl,
            KeyCode.KeyS
        ]);
    });

    // 未指定优先级时默认为 0
    it('defaults priority to zero', () => {
        const command = new HotkeyCommand('save', 'save', { defaults: [] });

        expect(command.priority).toBe(0);
    });

    // 构造器拷贝默认组合，调用方后续修改原数组不影响指令内部
    it('copies the default combinations', () => {
        const defaults = [[KeyCode.Ctrl, KeyCode.KeyS]];
        const command = createCommand('save', createInit({ defaults }));

        defaults[0].push(KeyCode.KeyA);

        expect(command.getKeyCombination(0)).toEqual([
            KeyCode.Ctrl,
            KeyCode.KeyS
        ]);
    });

    // 默认组合为空数组时既不告警，长度也为 0
    it('accepts an empty defaults list without warning', () => {
        const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        const command = createCommand('save', createInit());

        expect(warn).not.toHaveBeenCalled();
        expect(command.length).toBe(0);
    });

    // setKeys(0) 合法：不告警、缩容到空且迭代结果为空
    it('shrinks to zero combinations with setKeys(0)', () => {
        const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        const command = createCommand(
            'save',
            createInit({ defaults: [[KeyCode.KeyS]] })
        );

        command.setKeys(0);

        expect(warn).not.toHaveBeenCalled();
        expect(command.length).toBe(0);
        expect([...command.iterateKeyCombinations()]).toEqual([]);
    });

    // setKeys 对负值与非整数各告警一次 207 并保持原状
    it('warns 207 for negative and non-integer counts in setKeys', () => {
        const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        const command = createCommand(
            'save',
            createInit({ defaults: [[KeyCode.KeyS]] })
        );

        command.setKeys(-1);
        command.setKeys(1.5);

        expect(warn.mock.calls.map(c => c[0])).toEqual([207, 207]);
        expect(command.length).toBe(1);
        expect(command.getKeyCombination(0)).toEqual([KeyCode.KeyS]);
    });

    // setKeys 扩容补空组合、缩容截断并同步 length
    it('resizes combinations with setKeys', () => {
        const command = createCommand('save', createInit());
        command.setKeys(2);
        command.setKeyCombination(0, [KeyCode.KeyS]);
        command.setKeyCombination(1, [KeyCode.KeyD]);

        expect(command.length).toBe(2);
        command.setKeys(3);
        expect(command.length).toBe(3);
        expect(command.getKeyCombination(2)).toEqual([]);

        command.setKeys(1);
        expect(command.length).toBe(1);
        expect(command.getKeyCombination(1)).toEqual([]);
    });

    // setKeyCombination 对非整数、负数、越界索引各告警一次 206 并保持原状
    it('warns 206 for invalid combination indexes', () => {
        const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        const command = createCommand(
            'save',
            createInit({ defaults: [[KeyCode.KeyS]] })
        );

        command.setKeyCombination(1.5, [KeyCode.KeyA]);
        command.setKeyCombination(-1, [KeyCode.KeyA]);
        command.setKeyCombination(3, [KeyCode.KeyA]);

        expect(warn.mock.calls.map(c => c[0])).toEqual([206, 206, 206]);
        expect(command.length).toBe(1);
        expect(command.getKeyCombination(0)).toEqual([KeyCode.KeyS]);
    });

    // setKeyCombination 写入副本，调用方后续修改原数组不影响指令内部
    it('copies the delivered combination', () => {
        const command = createCommand(
            'save',
            createInit({ defaults: [[KeyCode.KeyS]] })
        );
        const keys: KeyCode[] = [KeyCode.Ctrl, KeyCode.KeyS];

        command.setKeyCombination(0, keys);
        keys.push(KeyCode.KeyA);

        expect(command.getKeyCombination(0)).toEqual([
            KeyCode.Ctrl,
            KeyCode.KeyS
        ]);
    });

    // KeyUp 模式接受包含多个常规键的组合且不告警
    it('accepts multiple regular keys without warning', () => {
        const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        const command = createCommand(
            'save',
            createInit({ defaults: [[KeyCode.KeyA, KeyCode.KeyB]] })
        );

        expect(warn).not.toHaveBeenCalled();
        expect(command.getKeyCombination(0)).toEqual([
            KeyCode.KeyA,
            KeyCode.KeyB
        ]);
    });

    // KeyUp 模式接受多个辅助键或空组合且不告警
    it('accepts auxiliary and empty combinations without warning', () => {
        const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        createCommand(
            'both',
            createInit({ defaults: [[KeyCode.Ctrl, KeyCode.Shift]] })
        );
        createCommand('empty', createInit({ defaults: [[]] }));

        expect(warn).not.toHaveBeenCalled();
    });

    // getKeyCombination 越界返回空数组，每次调用都返回新的副本
    it('returns empty arrays out of range and fresh copies in range', () => {
        const command = createCommand(
            'save',
            createInit({ defaults: [[KeyCode.KeyS]] })
        );
        const first = command.getKeyCombination(0);
        const second = command.getKeyCombination(0);

        expect(command.getKeyCombination(5)).toEqual([]);
        expect(first).toEqual([KeyCode.KeyS]);
        expect(first).not.toBe(second);
    });

    // iterateKeyCombinations 按索引升序产出，且每次迭代都产出新的副本
    it('iterates combinations in order with fresh copies', () => {
        const command = createCommand(
            'save',
            createInit({
                defaults: [[KeyCode.KeyS], [KeyCode.Ctrl, KeyCode.KeyD]]
            })
        );
        const entries = [...command.iterateKeyCombinations()];
        const again = [...command.iterateKeyCombinations()];

        expect(entries.map(v => v[0])).toEqual([0, 1]);
        expect(entries[1][1]).toEqual([KeyCode.Ctrl, KeyCode.KeyD]);
        expect(entries[0][1]).not.toBe(again[0][1]);
    });

    // keyUp 与 once 设置对应的模式与首次触发延时，并返回自身
    it('switches between KeyUp and Once with a timeout', () => {
        const command = createCommand(
            'save',
            createInit({ defaults: [[KeyCode.KeyS]] })
        );

        expect(command.keyUp(120)).toBe(command);
        expect(command.mode).toBe(HotkeyEmitMode.KeyUp);
        expect(command.timeout).toBe(120);

        expect(command.once(15)).toBe(command);
        expect(command.mode).toBe(HotkeyEmitMode.Once);
        expect(command.timeout).toBe(15);
    });

    // continuous 写入三个时间参数，缺省调用时三者归零，并返回自身
    it('sets the Continuous timing parameters', () => {
        const command = createCommand(
            'save',
            createInit({ defaults: [[KeyCode.KeyS]] })
        );

        expect(command.continuous(30, 60, 90)).toBe(command);
        expect(command.mode).toBe(HotkeyEmitMode.Continuous);
        expect(command.interval).toBe(30);
        expect(command.dt).toBe(60);
        expect(command.timeout).toBe(90);

        command.continuous();
        expect(command.interval).toBe(0);
        expect(command.dt).toBe(0);
        expect(command.timeout).toBe(0);
    });

    // 直接构造时仍然保留传入的指令标识符
    it('keeps the command identifier passed to the constructor', () => {
        expect(createCommand('fire', createInit()).command).toBe('fire');
    });
});
