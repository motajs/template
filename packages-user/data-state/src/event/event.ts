import { BuiltInFunction } from '@motajs/anon-tokyo';
import {
    IBlockEventEnv,
    IBlockEventParam,
    IGameEventInvocation
} from '@user/data-system';
import { IGameEventStore } from '@user/data-common';
import { IInsertEventEventParam, IInsertEventsEventParam } from './types';

export class EventInsertEvents implements BuiltInFunction<
    IInsertEventsEventParam,
    IBlockEventEnv
> {
    name: string = 'insertEvents';

    async func(param: IInsertEventsEventParam, env: IBlockEventEnv) {
        if (param.ids.length === 0) return;

        const store = env.state.eventStore;
        const invocations = this.collectInvocations(param.ids, env, store);
        if (invocations.length === 0) return;
        await env.system.executor.execute<void>(invocations, { custom: {} });
    }

    /**
     * 过滤存在的事件 id 并构造临时事件调用
     */
    private collectInvocations(
        ids: readonly string[],
        env: IBlockEventEnv,
        store: IGameEventStore
    ): IGameEventInvocation[] {
        const invocations: IGameEventInvocation[] = [];
        for (const id of ids) {
            if (store.getEvent<IBlockEventParam, IBlockEventEnv, void>(id)) {
                invocations.push({ id, env });
            }
        }
        return invocations;
    }
}

export class EventInsertEvent implements BuiltInFunction<
    IInsertEventEventParam,
    IBlockEventEnv
> {
    name: string = 'insertEvent';

    async func(param: IInsertEventEventParam, env: IBlockEventEnv) {
        if (param.length === 0) return;

        await env.system.executor.interpreter.exec(param, { custom: {} }, env);
    }
}
