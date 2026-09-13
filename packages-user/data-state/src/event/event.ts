import { BuiltInFunction } from '@motajs/anon-tokyo';
import {
    IBlockEventEnv,
    IBlockEventParam,
    IGameEventInvocation
} from '@user/data-system';
import { IGameEventStore } from '@user/data-common';
import { IInsertEventEventParam, IInsertEventsEventParam } from './types';
import { enterEventInsert, exitEventInsert, getEventExecutor } from './utils';

export class EventInsertEvents implements BuiltInFunction<
    IInsertEventsEventParam,
    IBlockEventEnv
> {
    name: string = 'insertEvents';

    async func(param: IInsertEventsEventParam, env: IBlockEventEnv) {
        if (param.ids.length === 0) return;

        const executor = getEventExecutor(env);
        if (!executor) return;
        const store = env.state.eventStore;
        if (!store) return;

        if (!enterEventInsert(env)) return;
        try {
            const invocations = this.collectInvocations(param.ids, env, store);
            if (invocations.length === 0) return;
            await executor.execute<void>(invocations, { custom: {} });
        } finally {
            exitEventInsert(env);
        }
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
            if (
                !id ||
                !store.getEvent<IBlockEventParam, IBlockEventEnv, void>(id)
            ) {
                continue;
            }
            invocations.push({ id, env });
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

        const executor = getEventExecutor(env);
        if (!executor) return;

        if (!enterEventInsert(env)) return;
        try {
            await executor.interpreter.exec(param, { custom: {} }, env);
        } finally {
            exitEventInsert(env);
        }
    }
}
