import { logger } from '@motajs/common';
import { KeyCode } from './keyCodes';
import { HotkeyEmitMode, IHotkeyCommand, IHotkeyCommandInit } from './type';

/**
 * 判断按键是否为辅助按键，即 Ctrl / Shift / Alt / Meta 之一
 * @param key 按键码
 */
export function isAuxiliaryKey(key: KeyCode): boolean {
    return (
        key === KeyCode.Ctrl ||
        key === KeyCode.Shift ||
        key === KeyCode.Alt ||
        key === KeyCode.Meta
    );
}

export class HotkeyCommand implements IHotkeyCommand {
    readonly priority: number;
    readonly block: boolean;
    mode: HotkeyEmitMode;
    interval: number;
    timeout: number;
    dt: number;
    length: number;

    /** 指令标识符，用于告警信息 */
    private readonly command: string;
    /** 按键组合列表，长度与 {@link length} 保持一致 */
    private combinations: KeyCode[][];

    constructor(command: string, init: IHotkeyCommandInit) {
        this.command = command;
        this.priority = init.priority;
        this.block = init.block;
        this.mode = init.mode ?? HotkeyEmitMode.KeyUp;
        this.timeout = init.timeout ?? 0;
        this.interval = init.interval ?? 0;
        this.dt = init.dt ?? 0;
        this.combinations = [];
        this.length = 0;
        this.setKeys(init.defaults.length);
        init.defaults.forEach((keys, index) =>
            this.setKeyCombination(index, keys)
        );
    }

    setKeys(count: number): void {
        if (!Number.isInteger(count) || count < 0) return;
        while (this.combinations.length < count) {
            this.combinations.push([]);
        }
        if (this.combinations.length > count) {
            this.combinations.length = count;
        }
        this.length = this.combinations.length;
    }

    setKeyCombination(index: number, keys: KeyCode[]): void {
        if (
            !Number.isInteger(index) ||
            index < 0 ||
            index >= this.combinations.length
        ) {
            return;
        }
        const copy = keys.slice();
        this.combinations[index] = copy;
        if (this.mode === HotkeyEmitMode.KeyUp) {
            const regular = copy.filter(v => !isAuxiliaryKey(v));
            if (regular.length >= 2) {
                logger.warn(203, this.command);
            }
        }
    }

    getKeyCombination(index: number): KeyCode[] {
        const keys = this.combinations[index];
        return keys ? keys.slice() : [];
    }

    *iterateKeyCombinations(): Iterable<[index: number, key: KeyCode[]]> {
        for (let i = 0; i < this.combinations.length; i++) {
            yield [i, this.combinations[i].slice()];
        }
    }

    keyUp(timeout?: number): void {
        this.mode = HotkeyEmitMode.KeyUp;
        if (timeout !== undefined) this.timeout = timeout;
        const invalid = this.combinations.some(
            keys => keys.filter(v => !isAuxiliaryKey(v)).length >= 2
        );
        if (invalid) logger.warn(203, this.command);
    }

    once(timeout?: number): void {
        this.mode = HotkeyEmitMode.Once;
        if (timeout !== undefined) this.timeout = timeout;
    }

    continuous(interval?: number, timeout?: number): void {
        this.mode = HotkeyEmitMode.Continuous;
        if (interval !== undefined) this.interval = interval;
        if (timeout !== undefined) this.timeout = timeout;
    }

    throttle(dt: number, interval?: number, timeout?: number): void {
        this.mode = HotkeyEmitMode.Throttle;
        this.dt = dt;
        if (interval !== undefined) this.interval = interval;
        if (timeout !== undefined) this.timeout = timeout;
    }
}
