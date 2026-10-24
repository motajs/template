import { ICoreState } from '@user/data-state';
import {
    IBlockEventParam,
    IGameEventExecutorHooks,
    IGameEventInvocation
} from '@user/data-system';

export class MainGameEventExecutorHooks implements IGameEventExecutorHooks {
    constructor(readonly state: ICoreState) {}

    onBeforeExecuteEvent(
        events: IGameEventInvocation[],
        param: IBlockEventParam
    ): void {
        // 删除下面这两行注释开始编写你自己的事件执行前钩子
        void events;
        void param;
    }

    onAfterExecuteEvent(
        events: IGameEventInvocation[],
        param: IBlockEventParam,
        returns: unknown
    ): void {
        // 删除下面这三行注释开始编写你自己的事件执行后钩子
        void events;
        void param;
        void returns;
    }
}
