import { IStateBase } from '@user/data-base';
import { ITrigger, ITriggerCollection, ITriggerHandler } from './types';
import { TriggerCollection } from './collection';

export abstract class BaseTrigger implements ITrigger {
    abstract type: number;
    abstract priority: number;

    constructor(readonly state: IStateBase) {}

    abstract trigger(handler: ITriggerHandler): Promise<void>;

    collection(): ITriggerCollection {
        return new TriggerCollection([this]);
    }
}
