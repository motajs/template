// 测试按键系统的注册表、作用域、KeyUp 规则、holding、优先级、监听、条件与时序行为
import { IExcitable, IExcitation } from '@motajs/animate';
import { logger } from '@motajs/common';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { KeyCode } from '../keyCodes';
import { HotkeySystem } from '../system';
import { HotkeyEmitMode, IHotkeyCommand, IHotkeyCommandInit } from '../types';

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

// 以指令标识符作为显示名称注册按键指令
function addCommand(
    system: HotkeySystem,
    command: string,
    init: IHotkeyCommandInit
): IHotkeyCommand {
    return system.addCommand(command, command, init);
}

// 最小化的假元素，记录注册的监听器并支持手动派发事件
class FakeElement {
    readonly listeners: Map<string, ((event: KeyboardEvent) => void)[]> =
        new Map();

    addEventListener(
        type: string,
        listener: (event: KeyboardEvent) => void
    ): void {
        const list = this.listeners.get(type) ?? [];
        list.push(listener);
        this.listeners.set(type, list);
    }

    removeEventListener(
        type: string,
        listener: (event: KeyboardEvent) => void
    ): void {
        const list = this.listeners.get(type);
        if (!list) return;
        this.listeners.set(
            type,
            list.filter(v => v !== listener)
        );
    }

    dispatch(type: string, event: FakeKeyEvent): void {
        const list = this.listeners.get(type) ?? [];
        list.forEach(v => v(event as unknown as KeyboardEvent));
    }

    count(): number {
        let total = 0;
        this.listeners.forEach(v => (total += v.length));
        return total;
    }
}

interface FakeKeyEvent {
    keyCode: number;
    repeat: boolean;
    preventDefault: ReturnType<typeof vi.fn>;
}

// 构造一个只包含测试所需字段的伪键盘事件
function createKeyEvent(
    keyCode: number,
    repeat: boolean = false
): FakeKeyEvent {
    return {
        keyCode,
        repeat,
        preventDefault: vi.fn()
    };
}

// 构造一个可手动激励的假激励源，激励负载就是传入的时间值
function createExcitation(): IExcitation<number> {
    const excitables = new Set<IExcitable<number>>();
    let current = 0;
    return {
        payload: () => current,
        excite: payload => {
            current = payload;
            excitables.forEach(v => v.excited(payload));
        },
        add: object => {
            excitables.add(object);
            return {
                excitable: object,
                revoke: () => {
                    excitables.delete(object);
                },
                excite: (payload: number) => {
                    current = payload;
                    object.excited(payload);
                }
            };
        },
        remove: object => excitables.delete(object),
        destroy: () => {
            excitables.clear();
        }
    };
}

describe('HotkeySystem', () => {
    // 重复注册同名指令发出告警 204 并返回已有对象
    it('warns 204 for duplicate commands and returns the existing one', () => {
        const system = new HotkeySystem();
        const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        const init = createInit({ defaults: [[KeyCode.KeyS]] });
        const first = addCommand(system, 'save', init);

        const second = addCommand(system, 'save', init);

        expect(second).toBe(first);
        expect(warn).toHaveBeenCalledWith(204, 'save');
        expect([...system.iterateCommands()].length).toBe(1);
    });

    // getCommand 对未注册的标识符返回 null，注册后返回同一对象
    it('returns null for an unregistered command and the same object after adding', () => {
        const system = new HotkeySystem();

        expect(system.getCommand('missing')).toBeNull();

        const command = addCommand(system, 'save', createInit());
        expect(system.getCommand('save')).toBe(command);
    });

    // deleteCommand 移除指令、清理作用域实现与待触发项，未知标识符不抛错
    it('deletes a command and drops its pending items', () => {
        const system = new HotkeySystem();
        const handler = vi.fn();
        addCommand(system, 'fire', createInit({ defaults: [[KeyCode.KeyA]] }));
        system.enterScope();
        system.implement('fire', handler);
        system.down(KeyCode.KeyA);

        system.deleteCommand('fire');
        system.up(KeyCode.KeyA);

        expect(system.getCommand('fire')).toBeNull();
        expect([...system.iterateCommands()]).toEqual([]);
        expect(handler).not.toHaveBeenCalled();
        expect(() => system.deleteCommand('missing')).not.toThrow();
    });

    // iterateCommands 按注册顺序产出全部指令
    it('iterates every registered command in registration order', () => {
        const system = new HotkeySystem();
        const first = addCommand(system, 'save', createInit());
        const second = addCommand(system, 'load', createInit());

        expect([...system.iterateCommands()]).toEqual([first, second]);
    });

    // enterScope 返回新作用域的标识符
    it('returns a symbol from enterScope', () => {
        const system = new HotkeySystem();

        expect(typeof system.enterScope()).toBe('symbol');
    });

    // 无参 leaveScope 只弹出栈顶一级且不误发 205（修正 3 的直接回归）
    it('pops exactly one scope on no-arg leaveScope without warning', () => {
        const system = new HotkeySystem();
        const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        const parentHandler = vi.fn();
        const childHandler = vi.fn();
        addCommand(system, 'fire', createInit({ defaults: [[KeyCode.KeyA]] }));
        system.enterScope();
        system.implement('fire', parentHandler);
        system.enterScope();
        system.implement('fire', childHandler);

        system.leaveScope();
        system.down(KeyCode.KeyA);
        system.up(KeyCode.KeyA);

        expect(childHandler).not.toHaveBeenCalled();
        expect(parentHandler).toHaveBeenCalledTimes(1);
        expect(warn).not.toHaveBeenCalled();
    });

    // 空栈调用无参 leaveScope 发出告警 205 且不抛错
    it('warns 205 when leaving with an empty scope stack', () => {
        const system = new HotkeySystem();
        const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});

        expect(() => system.leaveScope()).not.toThrow();
        expect(warn).toHaveBeenCalledWith(205);
    });

    // leaveScope(sym) 保留指定作用域并丢弃其上方的作用域
    it('leaves back to a specific scope and drops scopes above it', () => {
        const system = new HotkeySystem();
        const firstHandler = vi.fn();
        const secondHandler = vi.fn();
        const thirdHandler = vi.fn();
        addCommand(system, 'fire', createInit({ defaults: [[KeyCode.KeyA]] }));
        const first = system.enterScope();
        system.implement('fire', firstHandler);
        system.enterScope();
        system.implement('fire', secondHandler);
        system.enterScope();
        system.implement('fire', thirdHandler);

        system.leaveScope(first);
        system.down(KeyCode.KeyA);
        system.up(KeyCode.KeyA);

        expect(firstHandler).toHaveBeenCalledTimes(1);
        expect(secondHandler).not.toHaveBeenCalled();
        expect(thirdHandler).not.toHaveBeenCalled();
    });

    // leaveScope 指定不存在的作用域发出告警 205 且栈顶实现仍然生效
    it('warns 205 when leaving an unknown scope and keeps the top scope', () => {
        const system = new HotkeySystem();
        const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        const handler = vi.fn();
        addCommand(system, 'fire', createInit({ defaults: [[KeyCode.KeyA]] }));
        system.enterScope();
        system.implement('fire', handler);

        system.leaveScope(Symbol());
        system.down(KeyCode.KeyA);
        system.up(KeyCode.KeyA);

        expect(warn).toHaveBeenCalledWith(205);
        expect(handler).toHaveBeenCalledTimes(1);
    });

    // 没有作用域时 when 与 implement 各发出告警 201 并返回自身
    it('warns 201 for when and implement without an active scope', () => {
        const system = new HotkeySystem();
        const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});

        expect(system.when(() => true)).toBe(system);
        expect(system.implement('fire', () => {})).toBe(system);
        expect(warn).toHaveBeenCalledTimes(2);
        expect(warn).toHaveBeenCalledWith(201);
    });

    // implement 未注册的指令发出告警 202 并返回自身
    it('warns 202 when implementing a nonexistent command', () => {
        const system = new HotkeySystem();
        const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        system.enterScope();

        expect(system.implement('missing', () => {})).toBe(system);
        expect(warn).toHaveBeenCalledWith(202, 'missing');
    });

    // KeyUp 组合在辅助键仍按住时抬起主键触发，且上下文按活引用口径构造
    it('triggers a KeyUp combination while auxiliary keys are held', () => {
        const system = new HotkeySystem();
        const handler = vi.fn();
        addCommand(
            system,
            'save',
            createInit({ defaults: [[KeyCode.Ctrl, KeyCode.KeyS]] })
        );
        system.enterScope();
        system.implement('save', handler);

        system.down(KeyCode.Ctrl);
        system.down(KeyCode.KeyS);
        system.up(KeyCode.KeyS);

        expect(handler).toHaveBeenCalledTimes(1);
        const info = handler.mock.calls[0][0];
        expect(info.mode).toBe(HotkeyEmitMode.KeyUp);
        expect(info.index).toBe(0);
        expect(info.keys).toEqual([KeyCode.Ctrl, KeyCode.KeyS]);
        expect(info.command.command).toBe('save');
        expect(info.command.mode).toBe(HotkeyEmitMode.KeyUp);
        // holding 是活引用，仅修饰键布尔量是匹配时刻快照
        expect(info.context.holding).toEqual([KeyCode.Ctrl]);
        expect(info.context.ctrl).toBe(true);
        expect(info.context.shift).toBe(false);
        expect(info.context.alt).toBe(false);
        expect(info.context.meta).toBe(false);
    });

    // KeyUp 组合在辅助键先松开时抬起主键不触发
    it('does not trigger when an auxiliary key was released first', () => {
        const system = new HotkeySystem();
        const handler = vi.fn();
        addCommand(
            system,
            'save',
            createInit({ defaults: [[KeyCode.Ctrl, KeyCode.KeyS]] })
        );
        system.enterScope();
        system.implement('save', handler);

        system.down(KeyCode.Ctrl);
        system.down(KeyCode.KeyS);
        system.up(KeyCode.Ctrl);
        system.up(KeyCode.KeyS);

        expect(handler).not.toHaveBeenCalled();
    });

    // 仅含一个辅助键的组合在该键抬起时触发，抬起后 holding 不再包含它
    it('triggers a single auxiliary key combination on release', () => {
        const system = new HotkeySystem();
        const handler = vi.fn();
        addCommand(system, 'ctrl', createInit({ defaults: [[KeyCode.Ctrl]] }));
        system.enterScope();
        system.implement('ctrl', handler);

        system.down(KeyCode.Ctrl);
        system.up(KeyCode.Ctrl);

        expect(handler).toHaveBeenCalledTimes(1);
        const info = handler.mock.calls[0][0];
        // holding 是活引用，仅修饰键布尔量是匹配时刻快照
        expect(info.context.holding).toEqual([]);
        expect(info.context.ctrl).toBe(true);
    });

    // 两个辅助键的组合在最后一个键抬起时触发
    it('triggers a combination of two auxiliary keys on releasing the last key', () => {
        const system = new HotkeySystem();
        const handler = vi.fn();
        addCommand(
            system,
            'both',
            createInit({ defaults: [[KeyCode.Ctrl, KeyCode.Shift]] })
        );
        system.enterScope();
        system.implement('both', handler);

        system.down(KeyCode.Ctrl);
        system.down(KeyCode.Shift);
        system.up(KeyCode.Shift);

        expect(handler).toHaveBeenCalledTimes(1);
        const info = handler.mock.calls[0][0];
        expect(info.keys).toEqual([KeyCode.Ctrl, KeyCode.Shift]);
        // holding 是活引用，抬起后只保留仍按住的 Ctrl
        expect(info.context.holding).toEqual([KeyCode.Ctrl]);

        system.up(KeyCode.Ctrl);
    });

    // 两个常规键的 KeyUp 组合在最后一个键抬起时触发且不告警
    it('triggers a KeyUp combination with two regular keys', () => {
        const system = new HotkeySystem();
        const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        const handler = vi.fn();
        addCommand(
            system,
            'invalid',
            createInit({ defaults: [[KeyCode.KeyA, KeyCode.KeyB]] })
        );
        system.enterScope();
        system.implement('invalid', handler);

        system.down(KeyCode.KeyA);
        system.down(KeyCode.KeyB);
        system.up(KeyCode.KeyB);
        system.up(KeyCode.KeyA);

        expect(warn).not.toHaveBeenCalled();
        expect(system.getCommand('invalid')!.getKeyCombination(0)).toEqual([
            KeyCode.KeyA,
            KeyCode.KeyB
        ]);
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0].keys).toEqual([
            KeyCode.KeyA,
            KeyCode.KeyB
        ]);
    });

    // 空组合在 KeyUp 模式下不触发且不产生告警
    it('does not trigger or warn for an empty combination', () => {
        const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        const system = new HotkeySystem();
        const handler = vi.fn();
        addCommand(system, 'empty', createInit({ defaults: [[]] }));
        system.enterScope();
        system.implement('empty', handler);

        system.down(KeyCode.KeyA);
        system.up(KeyCode.KeyA);

        expect(handler).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
    });

    // holding 按按下顺序排列，重复按下同一按键不改变顺序也不重复入栈
    it('keeps holding ordered and de-duplicated', () => {
        const system = new HotkeySystem();
        system.enterScope();

        system.down(KeyCode.Ctrl);
        system.down(KeyCode.KeyS);
        system.down(KeyCode.Ctrl);

        expect(system.holding).toEqual([KeyCode.Ctrl, KeyCode.KeyS]);
    });

    // KeyDown 组合按 holding 子集匹配，未写入组合的辅助键不构成限制
    it('matches KeyDown combinations as a subset of held keys', () => {
        const system = new HotkeySystem();
        const comboHandler = vi.fn();
        const plainHandler = vi.fn();
        addCommand(
            system,
            'combo',
            createInit({
                mode: HotkeyEmitMode.Once,
                defaults: [[KeyCode.Ctrl, KeyCode.KeyS]]
            })
        );
        addCommand(
            system,
            'plain',
            createInit({
                mode: HotkeyEmitMode.Once,
                defaults: [[KeyCode.KeyS]]
            })
        );
        system.enterScope();
        system.implement('combo', comboHandler);
        system.implement('plain', plainHandler);

        system.down(KeyCode.Ctrl);
        expect(comboHandler).not.toHaveBeenCalled();
        expect(plainHandler).not.toHaveBeenCalled();

        system.down(KeyCode.KeyS);
        expect(comboHandler).toHaveBeenCalledTimes(1);
        expect(plainHandler).toHaveBeenCalledTimes(1);
    });

    // 只有一组候选时，即使还按着其它按键也直接触发
    it('triggers a single candidate even with extra held keys', () => {
        const system = new HotkeySystem();
        const handler = vi.fn();
        addCommand(
            system,
            'fire',
            createInit({
                mode: HotkeyEmitMode.Once,
                defaults: [[KeyCode.KeyS]]
            })
        );
        system.enterScope();
        system.implement('fire', handler);

        system.down(KeyCode.Ctrl);
        system.down(KeyCode.Alt);
        system.down(KeyCode.KeyS);

        expect(handler).toHaveBeenCalledTimes(1);
        const info = handler.mock.calls[0][0];
        expect(info.index).toBe(0);
        expect(info.keys).toEqual([KeyCode.KeyS]);
    });

    // 多组候选时只触发辅助键精确匹配的那一组
    it('triggers only the exact combination among multiple candidates', () => {
        const system = new HotkeySystem();
        const handler = vi.fn();
        addCommand(
            system,
            'fire',
            createInit({
                mode: HotkeyEmitMode.Once,
                defaults: [[KeyCode.Ctrl, KeyCode.KeyS], [KeyCode.KeyS]]
            })
        );
        system.enterScope();
        system.implement('fire', handler);

        system.down(KeyCode.Ctrl);
        system.down(KeyCode.KeyS);

        expect(handler).toHaveBeenCalledTimes(1);
        const info = handler.mock.calls[0][0];
        expect(info.index).toBe(0);
        expect(info.keys).toEqual([KeyCode.Ctrl, KeyCode.KeyS]);
    });

    // 多组候选且没有精确匹配时不触发
    it('does not trigger when multiple candidates have no exact match', () => {
        const system = new HotkeySystem();
        const handler = vi.fn();
        addCommand(
            system,
            'fire',
            createInit({
                mode: HotkeyEmitMode.Once,
                defaults: [[KeyCode.Ctrl, KeyCode.KeyS], [KeyCode.KeyS]]
            })
        );
        system.enterScope();
        system.implement('fire', handler);

        system.down(KeyCode.Ctrl);
        system.down(KeyCode.Alt);
        system.down(KeyCode.KeyS);

        expect(handler).not.toHaveBeenCalled();
    });

    // 返回值反映调用后仍存在的待触发项：KeyUp 按下为真，抬起触发后为假
    it('returns whether pending items remain after down and up', () => {
        const system = new HotkeySystem();
        const handler = vi.fn();
        addCommand(system, 'fire', createInit({ defaults: [[KeyCode.KeyA]] }));
        system.enterScope();
        system.implement('fire', handler);

        expect(system.down(KeyCode.KeyA)).toBe(true);
        expect(system.up(KeyCode.KeyA)).toBe(false);
    });

    // up 对未处于按下状态的按键返回 false
    it('returns false when releasing a key that is not held', () => {
        const system = new HotkeySystem();

        expect(system.up(KeyCode.KeyC)).toBe(false);
    });

    // 优先级更高的指令先执行
    it('runs higher priority commands first', () => {
        const system = new HotkeySystem();
        const order: string[] = [];
        addCommand(
            system,
            'low',
            createInit({ priority: 1, defaults: [[KeyCode.KeyA]] })
        );
        addCommand(
            system,
            'high',
            createInit({ priority: 10, defaults: [[KeyCode.KeyA]] })
        );
        system.enterScope();
        system.implement('low', () => order.push('low'));
        system.implement('high', () => order.push('high'));

        system.down(KeyCode.KeyA);
        system.up(KeyCode.KeyA);

        expect(order).toEqual(['high', 'low']);
    });

    // block 指令阻断严格更低优先级的指令
    it('blocks strictly lower priority commands', () => {
        const system = new HotkeySystem();
        const high = vi.fn();
        const low = vi.fn();
        addCommand(
            system,
            'high',
            createInit({
                priority: 10,
                block: true,
                defaults: [[KeyCode.KeyA]]
            })
        );
        addCommand(
            system,
            'low',
            createInit({ priority: 5, defaults: [[KeyCode.KeyA]] })
        );
        system.enterScope();
        system.implement('high', high);
        system.implement('low', low);

        system.down(KeyCode.KeyA);
        system.up(KeyCode.KeyA);

        expect(high).toHaveBeenCalledTimes(1);
        expect(low).not.toHaveBeenCalled();
    });

    // block 不阻断同优先级指令
    it('does not block commands at the same priority', () => {
        const system = new HotkeySystem();
        const blocking = vi.fn();
        const same = vi.fn();
        addCommand(
            system,
            'blocking',
            createInit({ priority: 5, block: true, defaults: [[KeyCode.KeyA]] })
        );
        addCommand(
            system,
            'same',
            createInit({ priority: 5, defaults: [[KeyCode.KeyA]] })
        );
        system.enterScope();
        system.implement('blocking', blocking);
        system.implement('same', same);

        system.down(KeyCode.KeyA);
        system.up(KeyCode.KeyA);

        expect(blocking).toHaveBeenCalledTimes(1);
        expect(same).toHaveBeenCalledTimes(1);
    });

    // listen 注册按下与抬起两个监听，只在 down 返回真时阻止默认行为
    it('listens to keydown and keyup and prevents default only on down', () => {
        const system = new HotkeySystem();
        const handler = vi.fn();
        const target = new FakeElement();
        addCommand(system, 'fire', createInit({ defaults: [[KeyCode.KeyA]] }));
        system.enterScope();
        system.implement('fire', handler);
        system.listen(target as unknown as HTMLElement);

        const downEvent = createKeyEvent(65);
        const upEvent = createKeyEvent(65);
        target.dispatch('keydown', downEvent);
        target.dispatch('keyup', upEvent);

        expect(target.count()).toBe(2);
        expect(handler).toHaveBeenCalledTimes(1);
        // 当前实现：down 建立了待触发项返回真，KeyUp 抬起触发后已无待触发项返回假
        expect(downEvent.preventDefault).toHaveBeenCalledTimes(1);
        expect(upEvent.preventDefault).not.toHaveBeenCalled();
    });

    // 重复按下不会重复触发，抬起后仍只触发一次
    it('ignores repeated keydown events and triggers once', () => {
        const system = new HotkeySystem();
        const handler = vi.fn();
        const target = new FakeElement();
        addCommand(system, 'fire', createInit({ defaults: [[KeyCode.KeyA]] }));
        system.enterScope();
        system.implement('fire', handler);
        system.listen(target as unknown as HTMLElement);

        target.dispatch('keydown', createKeyEvent(65));
        target.dispatch('keydown', createKeyEvent(65, true));
        target.dispatch('keyup', createKeyEvent(65));

        expect(handler).toHaveBeenCalledTimes(1);
    });

    // listen 将 91 / 92 / 224 都映射为 Meta 并触发 Meta 组合
    it('maps key codes 91, 92 and 224 to Meta', () => {
        for (const code of [91, 92, 224]) {
            const system = new HotkeySystem();
            const handler = vi.fn();
            const target = new FakeElement();
            addCommand(
                system,
                'meta',
                createInit({ defaults: [[KeyCode.Meta]] })
            );
            system.enterScope();
            system.implement('meta', handler);
            system.listen(target as unknown as HTMLElement);

            target.dispatch('keydown', createKeyEvent(code));
            target.dispatch('keyup', createKeyEvent(code));

            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler.mock.calls[0][0].context.meta).toBe(true);
        }
    });

    // 没有映射的按键码被跳过，既不进入 holding 也不触发
    it('skips key codes without a mapping', () => {
        const system = new HotkeySystem();
        const handler = vi.fn();
        const target = new FakeElement();
        addCommand(system, 'fire', createInit({ defaults: [[KeyCode.KeyA]] }));
        system.enterScope();
        system.implement('fire', handler);
        system.listen(target as unknown as HTMLElement);

        target.dispatch('keydown', createKeyEvent(999));
        target.dispatch('keyup', createKeyEvent(999));

        expect(handler).not.toHaveBeenCalled();
        expect(system.holding).toEqual([]);
    });

    // listen(null) 解绑全部监听，后续事件不再触发
    it('unbinds listeners when listening to null', () => {
        const system = new HotkeySystem();
        const handler = vi.fn();
        const target = new FakeElement();
        addCommand(system, 'fire', createInit({ defaults: [[KeyCode.KeyA]] }));
        system.enterScope();
        system.implement('fire', handler);

        system.listen(target as unknown as HTMLElement);
        expect(target.count()).toBe(2);
        system.listen(null);
        expect(target.count()).toBe(0);
        target.dispatch('keydown', createKeyEvent(65));
        target.dispatch('keyup', createKeyEvent(65));

        expect(handler).not.toHaveBeenCalled();
        expect(system.listening).toBeNull();
    });

    // 同一元素重复 listen 不重复注册，切换到新元素时旧监听被解绑
    it('does not register duplicate listeners and rebinds on a new element', () => {
        const system = new HotkeySystem();
        const target = new FakeElement();
        const other = new FakeElement();

        system.listen(target as unknown as HTMLElement);
        system.listen(target as unknown as HTMLElement);
        expect(target.count()).toBe(2);
        expect(system.listening).toBe(target);

        system.listen(other as unknown as HTMLElement);
        expect(target.count()).toBe(0);
        expect(other.count()).toBe(2);
        expect(system.listening).toBe(other);
    });

    // KeyDown 按下时条件为假仍建立待触发项，随后的激励不会触发
    it('tracks a KeyDown pending even when the condition is false', () => {
        const system = new HotkeySystem();
        const excitation = createExcitation();
        const handler = vi.fn();
        const ok = false;
        system.excitedBy(excitation);
        addCommand(
            system,
            'fire',
            createInit({
                mode: HotkeyEmitMode.Once,
                timeout: 0,
                defaults: [[KeyCode.KeyA]]
            })
        );
        system.enterScope();
        system.implement('fire', handler);
        system.when(() => ok);

        expect(system.down(KeyCode.KeyA)).toBe(true);
        excitation.excite(10);

        expect(handler).not.toHaveBeenCalled();
    });

    // KeyDown 条件为假且没有新的按键匹配时永远不会触发
    it('never emits a KeyDown pending whose condition stays false', () => {
        const system = new HotkeySystem();
        const excitation = createExcitation();
        const handler = vi.fn();
        const ok = false;
        system.excitedBy(excitation);
        addCommand(
            system,
            'fire',
            createInit({
                mode: HotkeyEmitMode.Once,
                timeout: 0,
                defaults: [[KeyCode.KeyA]]
            })
        );
        system.enterScope();
        system.implement('fire', handler);
        system.when(() => ok);

        system.down(KeyCode.KeyA);
        excitation.excite(10);
        excitation.excite(20);
        system.up(KeyCode.KeyA);
        excitation.excite(30);

        expect(handler).not.toHaveBeenCalled();
    });

    // KeyDown 松键后条件恢复再按下可以再次触发且不重复
    it('fires once after releasing and pressing again with the condition restored', () => {
        const system = new HotkeySystem();
        const excitation = createExcitation();
        const handler = vi.fn();
        let ok = false;
        system.excitedBy(excitation);
        addCommand(
            system,
            'fire',
            createInit({
                mode: HotkeyEmitMode.Once,
                timeout: 0,
                defaults: [[KeyCode.KeyA]]
            })
        );
        system.enterScope();
        system.implement('fire', handler);
        system.when(() => ok);

        system.down(KeyCode.KeyA);
        system.up(KeyCode.KeyA);
        ok = true;
        system.down(KeyCode.KeyA);

        excitation.excite(10);
        expect(handler).toHaveBeenCalledTimes(1);

        excitation.excite(20);
        expect(handler).toHaveBeenCalledTimes(1);
    });

    // KeyUp 抬起时不重新求值，匹配时刻条件为假就不触发
    it('does not re-evaluate the condition when a KeyUp command is released', () => {
        const system = new HotkeySystem();
        const handler = vi.fn();
        let ok = false;
        addCommand(system, 'fire', createInit({ defaults: [[KeyCode.KeyS]] }));
        system.enterScope();
        system.implement('fire', handler);
        system.when(() => ok);

        expect(system.down(KeyCode.KeyS)).toBe(true);
        ok = true;
        system.up(KeyCode.KeyS);

        expect(handler).not.toHaveBeenCalled();
    });

    // 条件为真时正常触发
    it('triggers when the condition returns true', () => {
        const system = new HotkeySystem();
        const handler = vi.fn();
        addCommand(system, 'fire', createInit({ defaults: [[KeyCode.KeyS]] }));
        system.enterScope();
        system.implement('fire', handler);
        system.when(() => true);

        system.down(KeyCode.KeyS);
        system.up(KeyCode.KeyS);

        expect(handler).toHaveBeenCalledTimes(1);
    });

    // 阻断线只由真的会触发的指令抬高，条件为假的高优先级指令不阻断低优先级
    it('keeps blocking based only on commands that really fire', () => {
        const system = new HotkeySystem();
        const high = vi.fn();
        const low = vi.fn();
        let calls = 0;
        addCommand(
            system,
            'high',
            createInit({
                priority: 10,
                block: true,
                defaults: [[KeyCode.KeyA]]
            })
        );
        addCommand(
            system,
            'low',
            createInit({ priority: 5, defaults: [[KeyCode.KeyA]] })
        );
        system.enterScope();
        system.implement('high', high);
        system.implement('low', low);
        // 顺序化条件：先注册的 high 取到假，后注册的 low 取到真
        system.when(() => {
            calls++;
            return calls > 1;
        });

        system.down(KeyCode.KeyA);
        system.up(KeyCode.KeyA);

        expect(calls).toBe(2);
        expect(high).not.toHaveBeenCalled();
        expect(low).toHaveBeenCalledTimes(1);
    });

    // Once 指令在 timeout 到期的那次激励才首次触发，之后不再触发
    it('waits for the Once timeout before the first emit', () => {
        const system = new HotkeySystem();
        const excitation = createExcitation();
        const handler = vi.fn();
        system.excitedBy(excitation);
        addCommand(
            system,
            'fire',
            createInit({
                mode: HotkeyEmitMode.Once,
                timeout: 100,
                defaults: [[KeyCode.KeyA]]
            })
        );
        system.enterScope();
        system.implement('fire', handler);

        system.down(KeyCode.KeyA);
        excitation.excite(99);
        expect(handler).not.toHaveBeenCalled();

        excitation.excite(100);
        expect(handler).toHaveBeenCalledTimes(1);

        excitation.excite(150);
        expect(handler).toHaveBeenCalledTimes(1);
    });

    // Continuous 指令的第二次触发按 interval、其后按 dt
    it('applies interval and dt to Continuous commands', () => {
        const system = new HotkeySystem();
        const excitation = createExcitation();
        const handler = vi.fn();
        system.excitedBy(excitation);
        addCommand(
            system,
            'continuous',
            createInit({
                mode: HotkeyEmitMode.Continuous,
                timeout: 0,
                interval: 50,
                dt: 200,
                defaults: [[KeyCode.KeyA]]
            })
        );
        system.enterScope();
        system.implement('continuous', handler);

        system.down(KeyCode.KeyA);
        expect(handler).toHaveBeenCalledTimes(1);

        excitation.excite(40);
        expect(handler).toHaveBeenCalledTimes(1);

        excitation.excite(50);
        expect(handler).toHaveBeenCalledTimes(2);

        excitation.excite(100);
        expect(handler).toHaveBeenCalledTimes(2);

        excitation.excite(250);
        expect(handler).toHaveBeenCalledTimes(3);
    });

    // Continuous 的 interval 与 dt 都为 0 时每次激励都触发
    it('emits on every excitation when interval and dt are zero', () => {
        const system = new HotkeySystem();
        const excitation = createExcitation();
        const handler = vi.fn();
        system.excitedBy(excitation);
        addCommand(
            system,
            'continuous',
            createInit({
                mode: HotkeyEmitMode.Continuous,
                defaults: [[KeyCode.KeyA]]
            })
        );
        system.enterScope();
        system.implement('continuous', handler);

        system.down(KeyCode.KeyA);
        expect(handler).toHaveBeenCalledTimes(1);

        excitation.excite(10);
        expect(handler).toHaveBeenCalledTimes(2);

        excitation.excite(20);
        expect(handler).toHaveBeenCalledTimes(3);
    });

    // Continuous 在 timeout 到期前不触发，且到期的那次激励只触发一次
    it('waits for the Continuous timeout and emits once', () => {
        const system = new HotkeySystem();
        const excitation = createExcitation();
        const handler = vi.fn();
        system.excitedBy(excitation);
        addCommand(
            system,
            'continuous',
            createInit({
                mode: HotkeyEmitMode.Continuous,
                timeout: 100,
                defaults: [[KeyCode.KeyA]]
            })
        );
        system.enterScope();
        system.implement('continuous', handler);

        system.down(KeyCode.KeyA);
        expect(handler).not.toHaveBeenCalled();

        excitation.excite(99);
        expect(handler).not.toHaveBeenCalled();

        excitation.excite(100);
        expect(handler).toHaveBeenCalledTimes(1);

        excitation.excite(110);
        expect(handler).toHaveBeenCalledTimes(2);
    });

    // Continuous 未到 timeout 就松键时，在到期的那次激励补触发一次
    it('fires a released Continuous command once at its timeout', () => {
        const system = new HotkeySystem();
        const excitation = createExcitation();
        const handler = vi.fn();
        system.excitedBy(excitation);
        addCommand(
            system,
            'continuous',
            createInit({
                mode: HotkeyEmitMode.Continuous,
                timeout: 100,
                defaults: [[KeyCode.KeyA]]
            })
        );
        system.enterScope();
        system.implement('continuous', handler);

        system.down(KeyCode.KeyA);
        excitation.excite(50);
        expect(handler).not.toHaveBeenCalled();

        system.up(KeyCode.KeyA);
        excitation.excite(99);
        expect(handler).not.toHaveBeenCalled();

        excitation.excite(100);
        expect(handler).toHaveBeenCalledTimes(1);

        excitation.excite(200);
        expect(handler).toHaveBeenCalledTimes(1);
    });

    // 松开按键后 Continuous 不再随激励触发
    it('stops Continuous commands after the key is released', () => {
        const system = new HotkeySystem();
        const excitation = createExcitation();
        const handler = vi.fn();
        system.excitedBy(excitation);
        addCommand(
            system,
            'continuous',
            createInit({
                mode: HotkeyEmitMode.Continuous,
                defaults: [[KeyCode.KeyA]]
            })
        );
        system.enterScope();
        system.implement('continuous', handler);

        system.down(KeyCode.KeyA);
        system.up(KeyCode.KeyA);
        excitation.excite(10);

        expect(handler).toHaveBeenCalledTimes(1);
    });

    // 未触发的 Once 松键后转入待触发并在到期的那次激励触发一次（松键不是取消）
    it('keeps a pending Once alive after release and fires it once', () => {
        const system = new HotkeySystem();
        const excitation = createExcitation();
        const handler = vi.fn();
        system.excitedBy(excitation);
        addCommand(
            system,
            'fire',
            createInit({
                mode: HotkeyEmitMode.Once,
                timeout: 100,
                defaults: [[KeyCode.KeyA]]
            })
        );
        system.enterScope();
        system.implement('fire', handler);

        system.down(KeyCode.KeyA);
        system.up(KeyCode.KeyA);
        excitation.excite(200);
        expect(handler).toHaveBeenCalledTimes(1);

        excitation.excite(300);
        expect(handler).toHaveBeenCalledTimes(1);
    });

    // KeyUp 延时项的上下文是活引用，派发时不含被抬起的主键
    it('uses the live holding array for a delayed KeyUp command', () => {
        const system = new HotkeySystem();
        const excitation = createExcitation();
        const handler = vi.fn();
        system.excitedBy(excitation);
        addCommand(
            system,
            'fire',
            createInit({ timeout: 100, defaults: [[KeyCode.KeyS]] })
        );
        system.enterScope();
        system.implement('fire', handler);

        system.down(KeyCode.KeyS);
        system.up(KeyCode.KeyS);
        expect(handler).not.toHaveBeenCalled();

        excitation.excite(200);

        expect(handler).toHaveBeenCalledTimes(1);
        // holding 是活引用，仅修饰键布尔量是匹配时刻快照
        expect(handler.mock.calls[0][0].context.holding).toEqual([]);
    });

    // KeyUp 的 timeout 从抬起时刻开始计时
    it('starts the KeyUp timeout at release', () => {
        const system = new HotkeySystem();
        const excitation = createExcitation();
        const handler = vi.fn();
        system.excitedBy(excitation);
        addCommand(
            system,
            'fire',
            createInit({ timeout: 100, defaults: [[KeyCode.KeyS]] })
        );
        system.enterScope();
        system.implement('fire', handler);

        system.down(KeyCode.KeyS);
        excitation.excite(150);
        expect(handler).not.toHaveBeenCalled();

        system.up(KeyCode.KeyS);
        excitation.excite(200);
        expect(handler).not.toHaveBeenCalled();

        excitation.excite(250);
        expect(handler).toHaveBeenCalledTimes(1);
    });

    // KeyUp 带 timeout 且匹配时条件为假，抬起不触发也不会补发
    it('drops a KeyUp pending captured with a false condition', () => {
        const system = new HotkeySystem();
        const excitation = createExcitation();
        const handler = vi.fn();
        const ok = false;
        system.excitedBy(excitation);
        addCommand(
            system,
            'fire',
            createInit({ timeout: 100, defaults: [[KeyCode.KeyS]] })
        );
        system.enterScope();
        system.implement('fire', handler);
        system.when(() => ok);

        system.down(KeyCode.KeyS);
        system.up(KeyCode.KeyS);
        excitation.excite(200);

        expect(handler).not.toHaveBeenCalled();
    });

    // KeyUp 带 timeout 且匹配时条件为真，到期前转假仍按捕获值触发一次
    it('fires a delayed KeyUp pending with the captured condition', () => {
        const system = new HotkeySystem();
        const excitation = createExcitation();
        const handler = vi.fn();
        let ok = true;
        system.excitedBy(excitation);
        addCommand(
            system,
            'fire',
            createInit({ timeout: 100, defaults: [[KeyCode.KeyS]] })
        );
        system.enterScope();
        system.implement('fire', handler);
        system.when(() => ok);

        system.down(KeyCode.KeyS);
        system.up(KeyCode.KeyS);
        ok = false;

        excitation.excite(200);

        expect(handler).toHaveBeenCalledTimes(1);
    });

    // excitedBy 切换激励源后只有新的激励源能驱动系统
    it('honours only the latest excitation source', () => {
        const system = new HotkeySystem();
        const first = createExcitation();
        const second = createExcitation();
        const handler = vi.fn();
        system.excitedBy(first);
        addCommand(
            system,
            'continuous',
            createInit({
                mode: HotkeyEmitMode.Continuous,
                defaults: [[KeyCode.KeyA]]
            })
        );
        system.enterScope();
        system.implement('continuous', handler);

        system.down(KeyCode.KeyA);
        expect(handler).toHaveBeenCalledTimes(1);

        system.excitedBy(second);
        first.excite(10);
        expect(handler).toHaveBeenCalledTimes(1);

        second.excite(10);
        expect(handler).toHaveBeenCalledTimes(2);
    });

    // excitedBy(null) 后旧激励源不再驱动，系统本身仍能正常触发
    it('stops excitation after unbinding the source', () => {
        const system = new HotkeySystem();
        const excitation = createExcitation();
        const handler = vi.fn();
        system.excitedBy(excitation);
        addCommand(
            system,
            'continuous',
            createInit({
                mode: HotkeyEmitMode.Continuous,
                defaults: [[KeyCode.KeyA]]
            })
        );
        system.enterScope();
        system.implement('continuous', handler);

        system.down(KeyCode.KeyA);
        system.excitedBy(null);
        excitation.excite(10);
        expect(handler).toHaveBeenCalledTimes(1);

        system.up(KeyCode.KeyA);
        system.down(KeyCode.KeyA);
        expect(handler).toHaveBeenCalledTimes(2);
    });

    // 未绑定激励源时延时触发的指令永远不会执行
    it('never fires delayed commands without an excitation source', () => {
        const system = new HotkeySystem();
        const handler = vi.fn();
        addCommand(
            system,
            'fire',
            createInit({
                mode: HotkeyEmitMode.Once,
                timeout: 100,
                defaults: [[KeyCode.KeyA]]
            })
        );
        system.enterScope();
        system.implement('fire', handler);

        system.down(KeyCode.KeyA);

        expect(handler).not.toHaveBeenCalled();
    });

    // 触发信息中的指令为对象，且上下文包含按下顺序的全部按键
    it('delivers the command object and the full held keys', () => {
        const system = new HotkeySystem();
        const handler = vi.fn();
        addCommand(
            system,
            'fire',
            createInit({
                mode: HotkeyEmitMode.Once,
                defaults: [[KeyCode.KeyS]]
            })
        );
        system.enterScope();
        system.implement('fire', handler);

        system.down(KeyCode.Ctrl);
        system.down(KeyCode.Shift);
        system.down(KeyCode.KeyS);

        expect(handler).toHaveBeenCalledTimes(1);
        const info = handler.mock.calls[0][0];
        expect(info.command.command).toBe('fire');
        expect(info.command.mode).toBe(HotkeyEmitMode.Once);
        expect(info.index).toBe(0);
        expect(info.keys).toEqual([KeyCode.KeyS]);
        expect(info.context.holding).toEqual([
            KeyCode.Ctrl,
            KeyCode.Shift,
            KeyCode.KeyS
        ]);
        expect(info.context.ctrl).toBe(true);
        expect(info.context.shift).toBe(true);
        expect(info.context.alt).toBe(false);
        expect(info.context.meta).toBe(false);
    });
});
