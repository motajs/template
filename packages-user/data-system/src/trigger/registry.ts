import { logger } from '@motajs/common';
import { ITrigger, ITriggerRegistry, TriggerFactory } from './types';
import { IStateBase } from '@user/data-base';

export class TriggerRegistry<
    TEnemy = unknown,
    THero = unknown
> implements ITriggerRegistry<TEnemy, THero> {
    /** 数字类型到触发器工厂的映射 */
    private readonly typeMap: Map<number, TriggerFactory<TEnemy, THero>> =
        new Map();

    constructor(public readonly state: IStateBase<TEnemy, THero>) {}

    register(type: number, factory: TriggerFactory<TEnemy, THero>): void {
        if (this.typeMap.has(type)) {
            logger.warn(132, 'type', type.toString());
        }
        this.typeMap.set(type, factory);
    }

    get(type: number): TriggerFactory<TEnemy, THero> | null {
        return this.typeMap.get(type) ?? null;
    }

    create(num: number): ITrigger<TEnemy, THero> | null {
        const factory = this.get(num);
        if (!factory) return null;
        return factory(num, this.state);
    }
}
