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

    /** 按键组合列表，长度与 {@link length} 保持一致 */
    private keys: KeyCode[][] = [];

    constructor(
        readonly command: string,
        init: IHotkeyCommandInit
    ) {
        this.command = command;
        this.priority = init.priority;
        this.block = init.block ?? false;
        this.mode = init.mode ?? HotkeyEmitMode.KeyUp;
        this.timeout = init.timeout ?? 0;
        this.interval = init.interval ?? 0;
        this.dt = init.dt ?? 0;
        this.length = 0;
        this.setKeys(init.defaults.length);
        init.defaults.forEach((keys, index) =>
            this.setKeyCombination(index, keys)
        );
    }

    setKeys(count: number): void {
        if (!Number.isInteger(count)) {
            logger.warn(207, 'float');
            return;
        }
        if (count <= 0) {
            logger.warn(207, 'negative integer');
            return;
        }
        if (count > this.keys.length) {
            while (count > this.keys.length) {
                this.keys.push([]);
            }
        } else if (count < this.keys.length) {
            while (count < this.keys.length) {
                this.keys.pop();
            }
        }
        this.length = this.keys.length;
    }

    setKeyCombination(index: number, keys: KeyCode[]): void {
        if (!Number.isInteger(index)) {
            logger.warn(206, 'float');
            return;
        }
        if (index < 0) {
            logger.warn(206, 'negetive integer');
            return;
        }
        if (index >= this.keys.length) {
            logger.warn(206, 'integer but exceeds combination count');
            return;
        }
        this.keys[index] = keys.slice();
        if (this.mode === HotkeyEmitMode.KeyUp) {
            const regular = keys.filter(v => !isAuxiliaryKey(v));
            if (regular.length >= 2) {
                logger.warn(203, this.command);
            }
        }
    }

    getKeyCombination(index: number): readonly KeyCode[] {
        return this.keys[index]?.slice() ?? [];
    }

    *iterateKeyCombinations(): Iterable<
        [index: number, key: readonly KeyCode[]]
    > {
        for (let i = 0; i < this.keys.length; i++) {
            yield [i, this.keys[i].slice()];
        }
    }

    keyUp(timeout: number = 0): void {
        this.mode = HotkeyEmitMode.KeyUp;
        this.timeout = timeout;
    }

    once(timeout: number = 0): void {
        this.mode = HotkeyEmitMode.Once;
        this.timeout = timeout;
    }

    continuous(
        interval: number = 0,
        dt: number = 0,
        timeout: number = 0
    ): void {
        this.mode = HotkeyEmitMode.Continuous;
        this.interval = interval;
        this.dt = dt;
        this.timeout = timeout;
    }
}
