import { IStateBase } from '@user/data-base';
import { ITrigger, ITriggerCollection, ITriggerHandler } from './types';
import { TriggerCollection } from './collection';

export abstract class BaseTrigger implements ITrigger {
    abstract type: number;
    abstract priority: number;

    constructor(readonly state: IStateBase) {}

    abstract onEnter(handler: ITriggerHandler): Promise<void>;

    abstract onLeave(handler: ITriggerHandler): Promise<void>;

    abstract onHit(handler: ITriggerHandler): Promise<void>;

    abstract onCannotEnter(handler: ITriggerHandler): Promise<void>;

    collection(): ITriggerCollection {
        return new TriggerCollection([this]);
    }
}
