import {
    IHeroMoveTopHandler,
    IHeroMoveTopImpl,
    IMapState,
    IPassPredicate
} from '@user/data-base';
import { EventTrigger } from '@user/data-common';
import { IGameEventExecutor, IStateSystem } from '@user/data-system';
import { DefaultPassPredicate, DefaultPassPredicateImpl } from './predicate';
import { isNil } from 'lodash-es';

export class DefaultHeroMoveTopImpl implements IHeroMoveTopImpl {
    /** 地图存储对象 */
    private readonly maps: IMapState;
    /** 游戏事件执行器 */
    private readonly executor: IGameEventExecutor;
    /** 勇士移动使用的通行性谓词 */
    private readonly passPredicate: DefaultPassPredicate;

    constructor(private readonly state: IStateSystem) {
        this.maps = state.maps;
        this.executor = state.eventSystem.executor;
        this.passPredicate = new DefaultPassPredicateImpl(this.state);
    }

    //#region 通行性判断

    inBound(x: number, y: number, floorId: string | undefined): boolean {
        if (isNil(floorId)) return false;
        const layerState = this.maps.getMap(floorId);
        if (!layerState) return false;
        const { width, height } = layerState;
        return x >= 0 && y >= 0 && x < width && y < height;
    }

    predicate(): IPassPredicate {
        return this.passPredicate;
    }

    //#endregion

    //#region 事件触发行为

    /**
     * 统一收集、排序并执行指定位置的点事件与图块事件。
     * @param trigger 事件触发条件
     * @param handler 移动信息对象
     * @param x 收集横坐标
     * @param y 收集纵坐标
     */
    private async commonTrigger(
        trigger: EventTrigger,
        handler: IHeroMoveTopHandler,
        x: number,
        y: number
    ): Promise<void> {
        if (isNil(handler.floorId)) return Promise.resolve();

        const map = this.maps.getMap(handler.floorId);
        if (!map) return Promise.resolve();
        const event = map.eventLayer;
        if (!event) return Promise.resolve();

        const system = this.state.eventSystem;
        const invocations = system.collectEvent(event, trigger, x, y);

        await this.executor.execute<void>(invocations, { custom: {} });
    }

    async enter(handler: IHeroMoveTopHandler): Promise<void> {
        const { x, y } = handler.nextLoc;
        return this.commonTrigger(EventTrigger.OnEnter, handler, x, y);
    }

    async leave(handler: IHeroMoveTopHandler): Promise<void> {
        const { x, y } = handler.currLoc;
        return this.commonTrigger(EventTrigger.OnLeave, handler, x, y);
    }

    async hit(handler: IHeroMoveTopHandler): Promise<void> {
        const { x, y } = handler.nextLoc;
        return this.commonTrigger(EventTrigger.OnTouch, handler, x, y);
    }

    /**
     * 新事件触发器没有无法进入的对应项，保留空实现以满足移动接口
     */
    async cannotEnter(): Promise<void> {
        return Promise.resolve();
    }

    //#endregion
}
