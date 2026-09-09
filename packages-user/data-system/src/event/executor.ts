import { logger } from '@motajs/common';
import {
    IBlockEventEnv,
    IBlockEventParam,
    IGameEventInvocation
} from '@user/data-base';
import { IGameEventStore } from '@user/data-common';
import { AnonTokyoInterpreter } from 'anon-tokyo';
import { EventExecuteMode, EventReduceMode, IGameEventExecutor } from './types';

export class EventExecutor implements IGameEventExecutor {
    mode: EventExecuteMode = EventExecuteMode.Normal;
    reduce: EventReduceMode = EventReduceMode.NoReduce;

    constructor(
        readonly interpreter: AnonTokyoInterpreter,
        private readonly storeRef: () => IGameEventStore | null
    ) {}

    setMode(mode: EventExecuteMode): void {
        this.mode = mode;
    }

    setReduce(reduce: EventReduceMode): void {
        this.reduce = reduce;
    }

    async execute<R = void>(
        events: IGameEventInvocation[],
        param: IBlockEventParam
    ): Promise<R> {
        const results: any[] = [];
        for (const invocation of events) {
            const id = invocation.id;
            const store = this.storeRef();
            if (!store) {
                logger.warn(171, id);
                continue;
            }
            const event = store.getEvent<IBlockEventParam, IBlockEventEnv, any>(
                id
            );
            if (!event) {
                logger.warn(171, id);
                continue;
            }
            if (event.trigger !== invocation.env.trigger) continue;

            const result = await event.execute(param, invocation.env);
            if (
                this.reduce !== EventReduceMode.NoReduce &&
                typeof result !== 'boolean'
            ) {
                logger.warn(172, String(result));
            }
            results.push(result);
            if (this.mode === EventExecuteMode.CutIfFalsy && !result) {
                break;
            } else if (this.mode === EventExecuteMode.CutIfTruthy && result) {
                break;
            }
        }

        let reduced: any = results;
        if (this.reduce === EventReduceMode.OrReduce) {
            reduced = false;
            for (const result of results) {
                reduced ||= result;
                if (reduced) break;
            }
        } else if (this.reduce === EventReduceMode.AndReduce) {
            reduced = true;
            for (const result of results) {
                reduced &&= result;
                if (!reduced) break;
            }
        }
        return reduced;
    }
}
