import { logger } from '@motajs/common';
import { ITrigger, ITriggerRegistry, TriggerFactory } from './types';
import { IStateBase } from '@user/data-base';

export class TriggerRegistry implements ITriggerRegistry {
    /** 数字类型到触发器工厂的映射 */
    private readonly typeMap: Map<number, TriggerFactory> = new Map();

    constructor(public readonly state: IStateBase) {}

    register(type: number, factory: TriggerFactory): void {
        if (this.typeMap.has(type)) {
            logger.warn(132, 'type', type.toString());
        }
        this.typeMap.set(type, factory);
    }

    get(type: number): TriggerFactory | null {
        return this.typeMap.get(type) ?? null;
    }

    create(num: number): ITrigger | null {
        const factory = this.get(num);
        if (!factory) return null;
        return factory(num, this.state);
    }
}
