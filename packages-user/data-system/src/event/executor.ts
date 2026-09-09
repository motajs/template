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

    /**
     * 折叠事件的原始返回值
     * @param mode 折叠模式
     * @param results 原始返回值
     */
    private reduceResults(mode: EventReduceMode, results: any[]): any {
        if (mode === EventReduceMode.OrReduce) {
            return results.reduce((prev, curr) => {
                if (typeof curr !== 'boolean') {
                    logger.warn(172, String(curr));
                }
                return prev || curr;
            }, false);
        } else if (mode === EventReduceMode.AndReduce) {
            return results.reduce((prev, curr) => {
                if (typeof curr !== 'boolean') {
                    logger.warn(172, String(curr));
                }
                return prev && curr;
            }, true);
        } else {
            return results;
        }
    }

    async execute<R = void>(
        events: IGameEventInvocation[],
        param: IBlockEventParam
    ): Promise<R> {
        // 事件执行
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
            results.push(result);

            // 执行模式
            if (this.mode === EventExecuteMode.CutIfFalsy && !result) {
                break;
            } else if (this.mode === EventExecuteMode.CutIfTruthy && result) {
                break;
            }
        }

        return this.reduceResults(this.reduce, results);
    }
}
