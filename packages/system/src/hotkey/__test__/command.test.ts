// 测试按键指令对象的组合管理、模式切换与非法组合告警
import { logger } from '@motajs/common';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { HotkeyCommand, isAuxiliaryKey } from '../command';
import { KeyCode } from '../keyCodes';
import { HotkeyEmitMode, IHotkeyCommandInit } from '../type';

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

describe('HotkeyCommand', () => {
    // 辅助键判定覆盖 Ctrl / Shift / Alt / Meta 四个按键
    it('recognizes auxiliary keys', () => {
        expect(isAuxiliaryKey(KeyCode.Ctrl)).toBe(true);
        expect(isAuxiliaryKey(KeyCode.Shift)).toBe(true);
        expect(isAuxiliaryKey(KeyCode.Alt)).toBe(true);
        expect(isAuxiliaryKey(KeyCode.Meta)).toBe(true);
    });

    // 常规按键不会被判定为辅助键
    it('rejects regular keys as auxiliary', () => {
        expect(isAuxiliaryKey(KeyCode.KeyA)).toBe(false);
        expect(isAuxiliaryKey(KeyCode.Digit1)).toBe(false);
        expect(isAuxiliaryKey(KeyCode.Space)).toBe(false);
    });

    // 构造器应用缺省值并将默认组合拷贝进指令
    it('applies defaults and copies the default combinations', () => {
        const defaults = [[KeyCode.Ctrl, KeyCode.KeyS]];
        const command = new HotkeyCommand('save', createInit({ defaults }));

        expect(command.mode).toBe(HotkeyEmitMode.KeyUp);
        expect(command.timeout).toBe(0);
        expect(command.interval).toBe(0);
        expect(command.dt).toBe(0);
        expect(command.length).toBe(1);
        expect(command.getKeyCombination(0)).toEqual([
            KeyCode.Ctrl,
            KeyCode.KeyS
        ]);

        defaults[0].push(KeyCode.KeyA);
        expect(command.getKeyCombination(0)).toEqual([
            KeyCode.Ctrl,
            KeyCode.KeyS
        ]);
    });

    // getKeyCombination 返回副本，修改不会影响指令内部组合
    it('returns a copy from getKeyCombination', () => {
        const command = new HotkeyCommand(
            'save',
            createInit({ defaults: [[KeyCode.KeyS]] })
        );
        const keys = command.getKeyCombination(0);
        keys.push(KeyCode.KeyA);

        expect(command.getKeyCombination(0)).toEqual([KeyCode.KeyS]);
    });

    // setKeys 扩容补空组合、缩容截断并同步 length
    it('resizes combinations with setKeys', () => {
        const command = new HotkeyCommand('save', createInit());
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

    // setKeys 忽略负值与非整数
    it('ignores invalid counts in setKeys', () => {
        const command = new HotkeyCommand(
            'save',
            createInit({ defaults: [[KeyCode.KeyS]] })
        );
        command.setKeys(-1);
        command.setKeys(1.5);

        expect(command.length).toBe(1);
        expect(command.getKeyCombination(0)).toEqual([KeyCode.KeyS]);
    });

    // setKeyCombination 忽略越界索引
    it('ignores out-of-range combination indexes', () => {
        const command = new HotkeyCommand(
            'save',
            createInit({ defaults: [[KeyCode.KeyS]] })
        );
        command.setKeyCombination(3, [KeyCode.KeyA]);
        command.setKeyCombination(-1, [KeyCode.KeyD]);

        expect(command.length).toBe(1);
        expect(command.getKeyCombination(0)).toEqual([KeyCode.KeyS]);
        expect(command.getKeyCombination(3)).toEqual([]);
    });

    // iterateKeyCombinations 按索引升序产出并返回副本
    it('iterates combinations in order with copies', () => {
        const command = new HotkeyCommand(
            'save',
            createInit({
                defaults: [[KeyCode.KeyS], [KeyCode.Ctrl, KeyCode.KeyD]]
            })
        );
        const entries = [...command.iterateKeyCombinations()];

        expect(entries.map(v => v[0])).toEqual([0, 1]);
        expect(entries[1][1]).toEqual([KeyCode.Ctrl, KeyCode.KeyD]);
        entries[0][1].push(KeyCode.KeyA);
        expect(command.getKeyCombination(0)).toEqual([KeyCode.KeyS]);
    });

    // KeyUp 模式下两个常规键的组合会发一次 203 且组合仍可读取
    it('warns 203 once for an invalid KeyUp combination', () => {
        const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        const command = new HotkeyCommand(
            'save',
            createInit({ defaults: [[KeyCode.KeyA, KeyCode.KeyB]] })
        );

        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn).toHaveBeenCalledWith(203, 'save');
        expect(command.getKeyCombination(0)).toEqual([
            KeyCode.KeyA,
            KeyCode.KeyB
        ]);
    });

    // KeyUp 模式下单个常规键加辅助键不会告警
    it('accepts one regular key with auxiliary keys', () => {
        const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        new HotkeyCommand(
            'save',
            createInit({ defaults: [[KeyCode.Ctrl, KeyCode.KeyS]] })
        );
        new HotkeyCommand(
            'save',
            createInit({ defaults: [[KeyCode.Ctrl, KeyCode.Shift]] })
        );

        expect(warn).not.toHaveBeenCalled();
    });

    // keyUp() 切换到 KeyUp 并对已有非法组合只发一次 203
    it('switches to KeyUp and warns once for invalid combinations', () => {
        const command = new HotkeyCommand(
            'save',
            createInit({
                mode: HotkeyEmitMode.Once,
                defaults: [
                    [KeyCode.KeyA, KeyCode.KeyB],
                    [KeyCode.KeyC, KeyCode.KeyD]
                ]
            })
        );
        const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        command.keyUp(120);

        expect(command.mode).toBe(HotkeyEmitMode.KeyUp);
        expect(command.timeout).toBe(120);
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn).toHaveBeenCalledWith(203, 'save');
    });

    // 四个模式方法设置模式与时间参数并保留未传入的值
    it('updates mode and timing parameters', () => {
        const command = new HotkeyCommand(
            'save',
            createInit({ defaults: [[KeyCode.KeyS]] })
        );

        command.continuous(30, 60);
        expect(command.mode).toBe(HotkeyEmitMode.Continuous);
        expect(command.interval).toBe(30);
        expect(command.timeout).toBe(60);

        command.throttle(10);
        expect(command.mode).toBe(HotkeyEmitMode.Throttle);
        expect(command.dt).toBe(10);
        expect(command.interval).toBe(30);
        expect(command.timeout).toBe(60);

        command.once(15);
        expect(command.mode).toBe(HotkeyEmitMode.Once);
        expect(command.timeout).toBe(15);

        command.keyUp(5);
        expect(command.mode).toBe(HotkeyEmitMode.KeyUp);
        expect(command.timeout).toBe(5);
    });
});
