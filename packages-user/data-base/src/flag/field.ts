import { IFlagCommonField, IFlagSystem } from './types';
import { logger } from '@motajs/common';

export class FlagCommonField<T> implements IFlagCommonField<T> {
    readonly system: IFlagSystem;

    /** Flag 当前值 */
    private value: T;

    /** 此 Flag 的键名 */
    private readonly key: PropertyKey;

    constructor(system: IFlagSystem, key: PropertyKey, value: T) {
        this.system = system;
        this.key = key;
        this.value = value;
    }

    set(value: T): void {
        this.value = value;
    }

    add(value: number): void {
        if (typeof this.value !== 'number') {
            logger.warn(111, String(this.key));
            return;
        }
        // @ts-expect-error T 已通过运行时检查确认为 number
        this.value += value;
    }

    get(): T {
        return this.value;
    }

    toStructured(): any {
        return structuredClone(this.value);
    }

    fromStructured(data: any): void {
        this.value = structuredClone(data) as T;
    }
}
