import { ITrigger, ITriggerCollection, ITriggerHandler } from './types';

export class TriggerCollection<
    TEnemy = unknown,
    THero = unknown
> implements ITriggerCollection<TEnemy, THero> {
    /** 当前集合内部维护的触发器列表 */
    private readonly triggerList: ITrigger<TEnemy, THero>[];

    constructor(triggers: Iterable<ITrigger<TEnemy, THero>>) {
        this.triggerList = [...triggers];
    }

    count(): number {
        return this.triggerList.length;
    }

    async trigger(handler: ITriggerHandler<TEnemy, THero>): Promise<void> {
        for (const trigger of this.triggerList) {
            await trigger.trigger(handler);
        }
    }

    async *triggerIter(
        handler: ITriggerHandler<TEnemy, THero>
    ): AsyncGenerator<
        ITrigger<TEnemy, THero>,
        void,
        ITriggerHandler<TEnemy, THero> | null
    > {
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

    iterate(): Iterable<ITrigger<TEnemy, THero>> {
        return this.triggerList.values();
    }

    push(trigger: ITrigger<TEnemy, THero>): void {
        this.triggerList.push(trigger);
    }

    unshift(trigger: ITrigger<TEnemy, THero>): void {
        this.triggerList.unshift(trigger);
    }

    concat(
        ...others: ITriggerCollection<TEnemy, THero>[]
    ): ITriggerCollection<TEnemy, THero> {
        const merged = [...this.triggerList];
        for (const other of others) {
            merged.push(...other.iterate());
        }
        return new TriggerCollection(merged);
    }
}
