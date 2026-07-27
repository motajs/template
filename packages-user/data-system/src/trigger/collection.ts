import {
    ITrigger,
    ITriggerCollection,
    ITriggerHandler,
    TriggerType
} from './types';

export class TriggerCollection implements ITriggerCollection {
    /** 当前集合内部维护的触发器列表 */
    private readonly triggerList: ITrigger[];

    constructor(triggers: Iterable<ITrigger>) {
        this.triggerList = [...triggers];
    }

    count(): number {
        return this.triggerList.length;
    }

    async trigger(
        condition: TriggerType,
        handler: ITriggerHandler
    ): Promise<void> {
        for (const trigger of this.triggerList) {
            await this.dispatch(trigger, condition, handler);
        }
    }

    async *triggerIter(
        condition: TriggerType,
        handler: ITriggerHandler
    ): AsyncGenerator<ITrigger, void, ITriggerHandler | null> {
        let currentHandler = handler;
        for (const trigger of this.triggerList) {
            await this.dispatch(trigger, condition, currentHandler);
            const nextHandler = yield trigger;
            if (nextHandler) {
                currentHandler = nextHandler;
            } else {
                currentHandler = handler;
            }
        }
    }

    /**
     * 根据触发条件将请求分发给对应方法
     * @param trigger 触发器实例
     * @param condition 触发条件
     * @param handler 触发上下文
     */
    private dispatch(
        trigger: ITrigger,
        condition: TriggerType,
        handler: ITriggerHandler
    ): Promise<void> {
        switch (condition) {
            case TriggerType.Enter:
                return trigger.onEnter(handler);
            case TriggerType.Leave:
                return trigger.onLeave(handler);
            case TriggerType.Hit:
                return trigger.onHit(handler);
            case TriggerType.CannotEnter:
                return trigger.onCannotEnter(handler);
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
