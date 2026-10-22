// 测试按键系统的注册表、作用域、KeyUp 与 KeyDown 派发、时序与监听行为
import { IExcitable, IExcitation } from '@motajs/animate';
import { logger } from '@motajs/common';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { KeyCode } from '../keyCodes';
import { HotkeySystem } from '../system';
import { HotkeyEmitMode, HotkeyEmitType, IHotkeyCommandInit } from '../type';

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

interface FakeExcitation extends IExcitation<number> {
    controllers: { revoke: ReturnType<typeof vi.fn> }[];
}

// 构造一个可手动激励的假激励源，并记录创建的控制器
function createExcitation(): FakeExcitation {
    const excitables = new Set<IExcitable<number>>();
    const controllers: { revoke: ReturnType<typeof vi.fn> }[] = [];
    return {
        controllers,
        payload: () => 0,
        excite: payload => {
            excitables.forEach(v => v.excited(payload));
        },
        add: object => {
            excitables.add(object);
            const controller = {
                excitable: object,
                revoke: vi.fn(() => {
                    excitables.delete(object);
                }),
                excite: (payload: number) => {
                    object.excited(payload);
                }
            };
            controllers.push(controller);
            return controller;
        },
        remove: object => excitables.delete(object),
        destroy: () => {
            excitables.clear();
        }
    };
}

describe('HotkeySystem', () => {
    // 没有作用域时 when 发出告警 201 并返回自身
    it('warns 201 when setting a condition without a scope', () => {
        const system = new HotkeySystem();
        const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});

        expect(system.when(() => true)).toBe(system);
        expect(warn).toHaveBeenCalledWith(201);
    });

    // 没有作用域时 implement 发出告警 201 并返回自身
    it('warns 201 when implementing without a scope', () => {
        const system = new HotkeySystem();
        const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});

        expect(system.implement('fire', () => {})).toBe(system);
        expect(warn).toHaveBeenCalledWith(201);
    });

    // implement 未注册的指令发出告警 202
    it('warns 202 when implementing a nonexistent command', () => {
        const system = new HotkeySystem();
        const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        system.enterScope();

        expect(system.implement('missing', () => {})).toBe(system);
        expect(warn).toHaveBeenCalledWith(202, 'missing');
    });

    // 重复注册同名指令发出告警 204 并返回已有对象
    it('warns 204 for duplicate commands and returns the existing one', () => {
        const system = new HotkeySystem();
        const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        const init = createInit({ defaults: [[KeyCode.KeyS]] });
        const first = system.addCommand('save', init);

        const second = system.addCommand('save', init);

        expect(second).toBe(first);
        expect(warn).toHaveBeenCalledWith(204, 'save');
        expect([...system.iterateCommands()].length).toBe(1);
    });

    // getCommand 对未注册的标识符返回 null
    it('returns null for an unregistered command', () => {
        const system = new HotkeySystem();

        expect(system.getCommand('missing')).toBeNull();
    });

    // iterateCommands 遍历所有已注册的指令
    it('iterates every registered command', () => {
        const system = new HotkeySystem();
        const first = system.addCommand('save', createInit());
        const second = system.addCommand('load', createInit());

        expect([...system.iterateCommands()]).toEqual([first, second]);
    });

    // deleteCommand 移除指令并清理作用域中的实现
    it('deletes a command and cleans its handler', () => {
        const system = new HotkeySystem();
        const handler = vi.fn();
        const command = system.addCommand(
            'fire',
            createInit({ defaults: [[KeyCode.KeyA]] })
        );
        system.enterScope();
        system.implement('fire', handler);

        expect(system.getCommand('fire')).toBe(command);
        system.deleteCommand('fire');
        system.down(KeyCode.KeyA);
        system.up(KeyCode.KeyA);

        expect(system.getCommand('fire')).toBeNull();
        expect(handler).not.toHaveBeenCalled();
    });

    // enterScope 返回新作用域的标识符
    it('returns a symbol from enterScope', () => {
        const system = new HotkeySystem();

        expect(typeof system.enterScope()).toBe('symbol');
    });

    // leaveScope 无参退出栈顶作用域并恢复上一级
    it('leaves the top scope and restores the parent', () => {
        const system = new HotkeySystem();
        const parentHandler = vi.fn();
        const childHandler = vi.fn();
        system.addCommand('fire', createInit({ defaults: [[KeyCode.KeyA]] }));
        system.enterScope();
        system.implement('fire', parentHandler);
        system.enterScope();
        system.implement('fire', childHandler);

        system.leaveScope();
        system.down(KeyCode.KeyA);
        system.up(KeyCode.KeyA);

        expect(childHandler).not.toHaveBeenCalled();
        expect(parentHandler).toHaveBeenCalledTimes(1);
    });

    // leaveScope(sym) 保留指定作用域并删除其上方的作用域
    it('leaves back to a specific scope and drops scopes above it', () => {
        const system = new HotkeySystem();
        const firstHandler = vi.fn();
        const secondHandler = vi.fn();
        const thirdHandler = vi.fn();
        system.addCommand('fire', createInit({ defaults: [[KeyCode.KeyA]] }));
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

    // leaveScope 指定不存在的作用域发出告警 205
    it('warns 205 when leaving an unknown scope', () => {
        const system = new HotkeySystem();
        const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        system.enterScope();

        system.leaveScope(Symbol());

        expect(warn).toHaveBeenCalledWith(205);
    });

    // 空栈调用无参 leaveScope 发出告警 205
    it('warns 205 when leaving with an empty scope stack', () => {
        const system = new HotkeySystem();
        const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});

        system.leaveScope();

        expect(warn).toHaveBeenCalledWith(205);
    });

    // 子作用域激活时父作用域的实现不生效，退出后恢复
    it('uses only the top scope handlers and restores the parent', () => {
        const system = new HotkeySystem();
        const parentHandler = vi.fn();
        const childHandler = vi.fn();
        system.addCommand('fire', createInit({ defaults: [[KeyCode.KeyA]] }));
        system.enterScope();
        system.implement('fire', parentHandler);
        system.enterScope();
        system.implement('fire', childHandler);

        system.down(KeyCode.KeyA);
        system.up(KeyCode.KeyA);

        expect(childHandler).toHaveBeenCalledTimes(1);
        expect(parentHandler).not.toHaveBeenCalled();
    });

    // 栈顶作用域条件为 false 时按下与抬起都不触发实现
    it('does not trigger when the top scope condition is false', () => {
        const system = new HotkeySystem();
        const handler = vi.fn();
        system.addCommand('fire', createInit({ defaults: [[KeyCode.KeyA]] }));
        system.enterScope();
        system.implement('fire', handler);
        system.when(() => false);

        expect(system.down(KeyCode.KeyA)).toBe(false);
        expect(system.up(KeyCode.KeyA)).toBe(false);
        expect(handler).not.toHaveBeenCalled();
    });

    // KeyUp 组合在辅助键仍按住时触发
    it('triggers a KeyUp combination while auxiliary keys are held', () => {
        const system = new HotkeySystem();
        const handler = vi.fn();
        system.addCommand(
            'save',
            createInit({ defaults: [[KeyCode.Ctrl, KeyCode.KeyS]] })
        );
        system.enterScope();
        system.implement('save', handler);

        system.down(KeyCode.Ctrl);
        system.down(KeyCode.KeyS);
        system.up(KeyCode.KeyS);

        expect(handler).toHaveBeenCalledTimes(1);
    });

    // KeyUp 组合在辅助键已松开后不触发
    it('does not trigger when an auxiliary key was released first', () => {
        const system = new HotkeySystem();
        const handler = vi.fn();
        system.addCommand(
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

    // 仅含一个辅助键的组合在该键抬起时触发
    it('triggers a single auxiliary key combination on release', () => {
        const system = new HotkeySystem();
        const handler = vi.fn();
        system.addCommand('ctrl', createInit({ defaults: [[KeyCode.Ctrl]] }));
        system.enterScope();
        system.implement('ctrl', handler);

        system.down(KeyCode.Ctrl);
        system.up(KeyCode.Ctrl);

        expect(handler).toHaveBeenCalledTimes(1);
    });

    // 仅含两个辅助键的组合不会触发
    it('does not trigger a combination of two auxiliary keys', () => {
        const system = new HotkeySystem();
        const handler = vi.fn();
        system.addCommand(
            'both',
            createInit({ defaults: [[KeyCode.Ctrl, KeyCode.Shift]] })
        );
        system.enterScope();
        system.implement('both', handler);

        system.down(KeyCode.Ctrl);
        system.down(KeyCode.Shift);
        system.up(KeyCode.Shift);
        system.up(KeyCode.Ctrl);

        expect(handler).not.toHaveBeenCalled();
    });

    // 包含两个常规键的 KeyUp 组合告警后永不触发
    it('never triggers a KeyUp combination with two regular keys', () => {
        const system = new HotkeySystem();
        const handler = vi.fn();
        system.addCommand(
            'invalid',
            createInit({ defaults: [[KeyCode.KeyA, KeyCode.KeyB]] })
        );
        system.enterScope();
        system.implement('invalid', handler);

        system.down(KeyCode.KeyA);
        system.down(KeyCode.KeyB);
        system.up(KeyCode.KeyB);
        system.up(KeyCode.KeyA);

        expect(handler).not.toHaveBeenCalled();
    });

    // 空组合在 KeyUp 模式下不触发且不产生告警
    it('does not trigger or warn for an empty combination', () => {
        const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        const system = new HotkeySystem();
        const handler = vi.fn();
        system.addCommand('empty', createInit({ defaults: [[]] }));
        system.enterScope();
        system.implement('empty', handler);

        system.down(KeyCode.KeyA);
        system.up(KeyCode.KeyA);

        expect(handler).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
    });

    // KeyUp 上下文不包含被抬起的按键且辅助键状态正确
    it('builds the KeyUp context without the released key', () => {
        const system = new HotkeySystem();
        const handler = vi.fn();
        system.addCommand(
            'save',
            createInit({ defaults: [[KeyCode.Ctrl, KeyCode.KeyS]] })
        );
        system.enterScope();
        system.implement('save', handler);

        system.down(KeyCode.Ctrl);
        system.down(KeyCode.KeyS);
        system.up(KeyCode.KeyS);

        const info = handler.mock.calls[0][0];
        expect(info.command).toBe('save');
        expect(info.index).toBe(0);
        expect(info.keys).toEqual([KeyCode.Ctrl, KeyCode.KeyS]);
        expect(info.context.type).toBe(HotkeyEmitType.KeyUp);
        expect(info.context.key).toBe(KeyCode.KeyS);
        expect(info.context.holding).toEqual([KeyCode.Ctrl]);
        expect(info.context.ctrl).toBe(true);
        expect(info.context.shift).toBe(false);
        expect(info.context.alt).toBe(false);
        expect(info.context.meta).toBe(false);
    });

    // 同一优先级下的所有已实现指令都会触发
    it('triggers every implemented command at the same priority', () => {
        const system = new HotkeySystem();
        const first = vi.fn();
        const second = vi.fn();
        system.addCommand(
            'first',
            createInit({ priority: 5, defaults: [[KeyCode.KeyA]] })
        );
        system.addCommand(
            'second',
            createInit({ priority: 5, defaults: [[KeyCode.KeyA]] })
        );
        system.enterScope();
        system.implement('first', first);
        system.implement('second', second);

        system.down(KeyCode.KeyA);
        system.up(KeyCode.KeyA);

        expect(first).toHaveBeenCalledTimes(1);
        expect(second).toHaveBeenCalledTimes(1);
    });

    // 优先级更高的指令先执行
    it('runs higher priority commands first', () => {
        const system = new HotkeySystem();
        const order: string[] = [];
        system.addCommand(
            'low',
            createInit({ priority: 1, defaults: [[KeyCode.KeyA]] })
        );
        system.addCommand(
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
        system.addCommand(
            'high',
            createInit({
                priority: 10,
                block: true,
                defaults: [[KeyCode.KeyA]]
            })
        );
        system.addCommand(
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
        system.addCommand(
            'blocking',
            createInit({ priority: 5, block: true, defaults: [[KeyCode.KeyA]] })
        );
        system.addCommand(
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

    // 匹配但未实现的指令不会阻断更低优先级
    it('does not let an unimplemented command block lower priorities', () => {
        const system = new HotkeySystem();
        const low = vi.fn();
        system.addCommand(
            'high',
            createInit({
                priority: 10,
                block: true,
                defaults: [[KeyCode.KeyA]]
            })
        );
        system.addCommand(
            'low',
            createInit({ priority: 5, defaults: [[KeyCode.KeyA]] })
        );
        system.enterScope();
        system.implement('low', low);

        system.down(KeyCode.KeyA);
        system.up(KeyCode.KeyA);

        expect(low).toHaveBeenCalledTimes(1);
    });

    // down 与 up 返回是否触发了已实现的指令
    it('returns whether a release triggered an implemented command', () => {
        const system = new HotkeySystem();
        const handler = vi.fn();
        system.addCommand('fire', createInit({ defaults: [[KeyCode.KeyA]] }));
        system.enterScope();
        system.implement('fire', handler);

        expect(system.down(KeyCode.KeyA)).toBe(false);
        expect(system.up(KeyCode.KeyA)).toBe(true);
    });

    // up 对未处于按下状态的按键返回 false
    it('returns false when releasing a key that is not held', () => {
        const system = new HotkeySystem();

        expect(system.up(KeyCode.KeyA)).toBe(false);
    });

    // listen 将按下与抬起映射到按键，只在触发时阻止默认行为
    it('listens to keydown and keyup and prevents default on triggers', () => {
        const system = new HotkeySystem();
        const handler = vi.fn();
        const target = new FakeElement();
        system.addCommand('fire', createInit({ defaults: [[KeyCode.KeyA]] }));
        system.enterScope();
        system.implement('fire', handler);
        system.listen(target as unknown as HTMLElement);

        const downEvent = createKeyEvent(65);
        const upEvent = createKeyEvent(65);
        target.dispatch('keydown', downEvent);
        target.dispatch('keyup', upEvent);

        expect(handler).toHaveBeenCalledTimes(1);
        expect(downEvent.preventDefault).not.toHaveBeenCalled();
        expect(upEvent.preventDefault).toHaveBeenCalledTimes(1);
    });

    // listen 忽略 repeat 事件的按下
    it('ignores repeated keydown events', () => {
        const system = new HotkeySystem();
        const handler = vi.fn();
        const target = new FakeElement();
        system.addCommand('fire', createInit({ defaults: [[KeyCode.KeyA]] }));
        system.enterScope();
        system.implement('fire', handler);
        system.listen(target as unknown as HTMLElement);

        target.dispatch('keydown', createKeyEvent(65, true));
        target.dispatch('keyup', createKeyEvent(65));
        expect(handler).not.toHaveBeenCalled();

        target.dispatch('keydown', createKeyEvent(65));
        target.dispatch('keyup', createKeyEvent(65));
        expect(handler).toHaveBeenCalledTimes(1);
    });

    // listen 将 91 / 92 / 224 映射为 Meta 并触发 Meta 组合
    it('maps key codes 91, 92 and 224 to Meta', () => {
        for (const code of [91, 92, 224]) {
            const system = new HotkeySystem();
            const handler = vi.fn();
            const target = new FakeElement();
            system.addCommand(
                'meta',
                createInit({ defaults: [[KeyCode.Meta]] })
            );
            system.enterScope();
            system.implement('meta', handler);
            system.listen(target as unknown as HTMLElement);

            target.dispatch('keydown', createKeyEvent(code));
            target.dispatch('keyup', createKeyEvent(code));

            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler.mock.calls[0][0].context.key).toBe(KeyCode.Meta);
        }
    });

    // listen(null) 解绑全部监听，后续事件不再触发
    it('unbinds listeners when listening to null', () => {
        const system = new HotkeySystem();
        const handler = vi.fn();
        const target = new FakeElement();
        system.addCommand('fire', createInit({ defaults: [[KeyCode.KeyA]] }));
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

    // 重复监听同一元素不会重复注册监听器
    it('does not register duplicate listeners for the same element', () => {
        const system = new HotkeySystem();
        const target = new FakeElement();

        system.listen(target as unknown as HTMLElement);
        system.listen(target as unknown as HTMLElement);

        expect(target.count()).toBe(2);
        expect(system.listening).toBe(target);
    });

    // Once 模式下按下立即触发一次，重复按下不触发，抬起后可再次触发
    it('triggers Once commands once per press', () => {
        const system = new HotkeySystem();
        const handler = vi.fn();
        system.addCommand(
            'once',
            createInit({
                mode: HotkeyEmitMode.Once,
                defaults: [[KeyCode.KeyA]]
            })
        );
        system.enterScope();
        system.implement('once', handler);

        expect(system.down(KeyCode.KeyA)).toBe(true);
        expect(handler).toHaveBeenCalledTimes(1);
        expect(system.down(KeyCode.KeyA)).toBe(false);
        expect(handler).toHaveBeenCalledTimes(1);

        system.up(KeyCode.KeyA);
        system.down(KeyCode.KeyA);
        expect(handler).toHaveBeenCalledTimes(2);
    });

    // KeyDown 组合需被 holding 满足，未写入组合的辅助键不构成限制
    it('matches KeyDown combinations as a subset of held keys', () => {
        const system = new HotkeySystem();
        const comboHandler = vi.fn();
        const plainHandler = vi.fn();
        system.addCommand(
            'combo',
            createInit({
                mode: HotkeyEmitMode.Once,
                defaults: [[KeyCode.Ctrl, KeyCode.KeyS]]
            })
        );
        system.addCommand(
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

    // Continuous 在 timeout 为 0 时当刻触发，之后每次激励都触发
    it('triggers Continuous commands immediately and on excitation', () => {
        const system = new HotkeySystem();
        const excitation = createExcitation();
        const handler = vi.fn();
        system.addCommand(
            'continuous',
            createInit({
                mode: HotkeyEmitMode.Continuous,
                defaults: [[KeyCode.KeyA]]
            })
        );
        system.enterScope();
        system.implement('continuous', handler);
        system.excitedBy(excitation);

        system.down(KeyCode.KeyA);
        expect(handler).toHaveBeenCalledTimes(1);

        excitation.excite(10);
        expect(handler).toHaveBeenCalledTimes(2);
        excitation.excite(20);
        expect(handler).toHaveBeenCalledTimes(3);
    });

    // Continuous 的 timeout 到期前不触发，之后按 interval 触发第二次
    it('waits for the Continuous timeout and then the interval', () => {
        const system = new HotkeySystem();
        const excitation = createExcitation();
        const handler = vi.fn();
        system.addCommand(
            'continuous',
            createInit({
                mode: HotkeyEmitMode.Continuous,
                timeout: 100,
                interval: 50,
                defaults: [[KeyCode.KeyA]]
            })
        );
        system.enterScope();
        system.implement('continuous', handler);
        system.excitedBy(excitation);

        expect(system.down(KeyCode.KeyA)).toBe(true);
        expect(handler).not.toHaveBeenCalled();

        excitation.excite(99);
        expect(handler).not.toHaveBeenCalled();

        excitation.excite(100);
        expect(handler).toHaveBeenCalledTimes(1);

        excitation.excite(120);
        expect(handler).toHaveBeenCalledTimes(1);

        excitation.excite(150);
        expect(handler).toHaveBeenCalledTimes(2);

        excitation.excite(160);
        expect(handler).toHaveBeenCalledTimes(3);
    });

    // Throttle 第二次触发需经过 interval，之后需经过 dt
    it('applies interval and dt to Throttle commands', () => {
        const system = new HotkeySystem();
        const excitation = createExcitation();
        const handler = vi.fn();
        system.addCommand(
            'throttle',
            createInit({
                mode: HotkeyEmitMode.Throttle,
                interval: 50,
                dt: 200,
                defaults: [[KeyCode.KeyA]]
            })
        );
        system.enterScope();
        system.implement('throttle', handler);
        system.excitedBy(excitation);

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

    // 松开按键后 Continuous 的待触发项被丢弃，不再随激励触发
    it('stops Continuous commands after the key is released', () => {
        const system = new HotkeySystem();
        const excitation = createExcitation();
        const handler = vi.fn();
        system.addCommand(
            'continuous',
            createInit({
                mode: HotkeyEmitMode.Continuous,
                defaults: [[KeyCode.KeyA]]
            })
        );
        system.enterScope();
        system.implement('continuous', handler);
        system.excitedBy(excitation);

        system.down(KeyCode.KeyA);
        system.up(KeyCode.KeyA);
        excitation.excite(10);

        expect(handler).toHaveBeenCalledTimes(1);
    });

    // Once 的 timeout 未到就松键时不会触发
    it('cancels a delayed Once command when the key is released', () => {
        const system = new HotkeySystem();
        const excitation = createExcitation();
        const handler = vi.fn();
        system.addCommand(
            'once',
            createInit({
                mode: HotkeyEmitMode.Once,
                timeout: 100,
                defaults: [[KeyCode.KeyA]]
            })
        );
        system.enterScope();
        system.implement('once', handler);
        system.excitedBy(excitation);

        system.down(KeyCode.KeyA);
        system.up(KeyCode.KeyA);
        excitation.excite(200);

        expect(handler).not.toHaveBeenCalled();
    });

    // excitedBy 切换激励源时先撤销旧控制器
    it('revokes the previous excitation controller when switching sources', () => {
        const system = new HotkeySystem();
        const first = createExcitation();
        const second = createExcitation();
        system.excitedBy(first);

        system.excitedBy(second);

        expect(first.controllers[0].revoke).toHaveBeenCalledTimes(1);
        expect(second.controllers.length).toBe(1);
    });

    // 未绑定激励源时延时触发的指令不会执行
    it('never fires delayed commands without an excitation source', () => {
        const system = new HotkeySystem();
        const handler = vi.fn();
        system.addCommand(
            'once',
            createInit({
                mode: HotkeyEmitMode.Once,
                timeout: 100,
                defaults: [[KeyCode.KeyA]]
            })
        );
        system.enterScope();
        system.implement('once', handler);

        system.down(KeyCode.KeyA);

        expect(handler).not.toHaveBeenCalled();
    });

    // 指令模式切换后旧的待触发项被丢弃
    it('drops pending items when the command mode changes', () => {
        const system = new HotkeySystem();
        const excitation = createExcitation();
        const handler = vi.fn();
        const command = system.addCommand(
            'once',
            createInit({
                mode: HotkeyEmitMode.Once,
                timeout: 100,
                defaults: [[KeyCode.KeyA]]
            })
        );
        system.enterScope();
        system.implement('once', handler);
        system.excitedBy(excitation);
        system.down(KeyCode.KeyA);

        command.keyUp();
        excitation.excite(200);

        expect(handler).not.toHaveBeenCalled();
    });

    // 入队场景下 KeyDown 的 down 与 KeyUp 的 up 仍返回真
    it('returns true when a command is enqueued', () => {
        const downSystem = new HotkeySystem();
        downSystem.addCommand(
            'once',
            createInit({
                mode: HotkeyEmitMode.Once,
                timeout: 100,
                defaults: [[KeyCode.KeyA]]
            })
        );
        downSystem.enterScope();
        downSystem.implement('once', () => {});

        const upSystem = new HotkeySystem();
        upSystem.addCommand(
            'up',
            createInit({ timeout: 100, defaults: [[KeyCode.KeyB]] })
        );
        upSystem.enterScope();
        upSystem.implement('up', () => {});

        expect(downSystem.down(KeyCode.KeyA)).toBe(true);
        expect(upSystem.down(KeyCode.KeyB)).toBe(false);
        expect(upSystem.up(KeyCode.KeyB)).toBe(true);
    });

    // 延时触发时使用触发时刻的 holding 重建上下文
    it('rebuilds the delayed context from the current holding', () => {
        const system = new HotkeySystem();
        const excitation = createExcitation();
        const handler = vi.fn();
        system.addCommand(
            'continuous',
            createInit({
                mode: HotkeyEmitMode.Continuous,
                timeout: 100,
                defaults: [[KeyCode.KeyS]]
            })
        );
        system.enterScope();
        system.implement('continuous', handler);
        system.excitedBy(excitation);

        system.down(KeyCode.KeyS);
        system.down(KeyCode.Digit1);
        excitation.excite(100);

        expect(handler).toHaveBeenCalled();
        expect(handler.mock.calls[0][0].context.holding).toEqual([
            KeyCode.KeyS,
            KeyCode.Digit1
        ]);
    });

    // 延时触发的 KeyUp 上下文不包含已经抬起的按键
    it('rebuilds the delayed KeyUp context without the released key', () => {
        const system = new HotkeySystem();
        const excitation = createExcitation();
        const handler = vi.fn();
        system.addCommand(
            'save',
            createInit({ timeout: 100, defaults: [[KeyCode.KeyS]] })
        );
        system.enterScope();
        system.implement('save', handler);
        system.excitedBy(excitation);

        system.down(KeyCode.KeyS);
        system.up(KeyCode.KeyS);
        expect(handler).not.toHaveBeenCalled();

        system.down(KeyCode.Digit1);
        excitation.excite(100);

        const info = handler.mock.calls[0][0];
        expect(info.context.key).toBe(KeyCode.KeyS);
        expect(info.context.holding).toEqual([KeyCode.Digit1]);
    });

    // listen 在 KeyDown 模式下阻止默认行为，并把 Meta 映射进上下文
    it('prevents default on KeyDown triggers and sets meta context', () => {
        for (const code of [91, 92, 224]) {
            const system = new HotkeySystem();
            const handler = vi.fn();
            const target = new FakeElement();
            system.addCommand(
                'meta',
                createInit({
                    mode: HotkeyEmitMode.Once,
                    defaults: [[KeyCode.Meta]]
                })
            );
            system.enterScope();
            system.implement('meta', handler);
            system.listen(target as unknown as HTMLElement);

            const event = createKeyEvent(code);
            target.dispatch('keydown', event);

            expect(handler).toHaveBeenCalledTimes(1);
            expect(event.preventDefault).toHaveBeenCalledTimes(1);
            expect(handler.mock.calls[0][0].context.meta).toBe(true);
        }
    });

    // 退出作用域后其中入队的待触发项被丢弃
    it('drops pending items when their scope is left', () => {
        const system = new HotkeySystem();
        const excitation = createExcitation();
        const handler = vi.fn();
        system.addCommand(
            'once',
            createInit({
                mode: HotkeyEmitMode.Once,
                timeout: 100,
                defaults: [[KeyCode.KeyA]]
            })
        );
        system.excitedBy(excitation);
        system.enterScope();
        system.implement('once', handler);
        system.down(KeyCode.KeyA);

        system.leaveScope();
        excitation.excite(200);

        expect(handler).not.toHaveBeenCalled();
    });
});
