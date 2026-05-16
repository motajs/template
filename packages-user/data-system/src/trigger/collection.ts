import { ITrigger, ITriggerCollection, ITriggerHandler } from './types';

export class TriggerCollection implements ITriggerCollection {
    /** 当前集合内部维护的触发器列表 */
    private readonly triggerList: ITrigger[];

    constructor(triggers: Iterable<ITrigger>) {
        this.triggerList = Array.from(triggers);
    }

    count(): number {
        return this.triggerList.length;
    }

    async trigger<TEnemy = unknown, THero = unknown>(
        handler: ITriggerHandler<TEnemy, THero>
    ): Promise<void> {
        for (const trigger of this.triggerList) {
            await trigger.trigger(handler);
        }
    }

    async *triggerIter<TEnemy = unknown, THero = unknown>(
        handler: ITriggerHandler<TEnemy, THero>
    ): AsyncGenerator<ITrigger, void, ITriggerHandler<TEnemy, THero> | null> {
        let currentHandler = handler;
        for (const trigger of this.triggerList) {
            await trigger.trigger(currentHandler);
            const nextHandler = yield trigger;
            if (nextHandler) {
                currentHandler = nextHandler;
            } else {
                currentHandler = handler;
            }
        }
    }

    iterate(): Iterable<ITrigger> {
        return this.triggerList.values();
    }

    push(trigger: ITrigger): void {
        this.triggerList.push(trigger);
    }

    unshift(trigger: ITrigger): void {
        this.triggerList.unshift(trigger);
    }

    concat(...others: ITriggerCollection[]): ITriggerCollection {
        const merged = [...this.triggerList];
        for (const other of others) {
            merged.push(...other.iterate());
        }
        return new TriggerCollection(merged);
    }
}
