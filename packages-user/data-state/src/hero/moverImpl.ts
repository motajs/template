import { ITileLocator } from '@motajs/common';
import {
    BlockEventType,
    IBlockEventEnv,
    IBlockEventParam,
    IGameEventInvocation,
    IHeroMoveTopHandler,
    IHeroMoveTopImpl,
    IMapState,
    IPassCheckHandler,
    IPassPredicate,
    IReadonlyTileBase
} from '@user/data-base';
import { EventTrigger, FaceDirection, PassBit } from '@user/data-common';
import { IGameEventExecutor, IStateSystem } from '@user/data-system';
import { isNil } from 'lodash-es';

interface IEventSource {
    readonly priority: number;
    readonly id: string;
    readonly type: BlockEventType;
    readonly tile: IReadonlyTileBase | null;
}

interface IDefaultHeroPassPredicate extends IPassPredicate {}

class DefaultHeroPassPredicate implements IDefaultHeroPassPredicate {
    constructor(private readonly maps: IMapState) {}

    private directionToPassBit(dir: FaceDirection): number {
        switch (dir) {
            case FaceDirection.Up:
                return PassBit.Up;
            case FaceDirection.Right:
                return PassBit.Right;
            case FaceDirection.Down:
                return PassBit.Down;
            case FaceDirection.Left:
                return PassBit.Left;
            default:
                return 0;
        }
    }

    private oppositeDirection(dir: FaceDirection): FaceDirection {
        switch (dir) {
            case FaceDirection.Up:
                return FaceDirection.Down;
            case FaceDirection.Right:
                return FaceDirection.Left;
            case FaceDirection.Down:
                return FaceDirection.Up;
            case FaceDirection.Left:
                return FaceDirection.Right;
            case FaceDirection.LeftUp:
                return FaceDirection.RightDown;
            case FaceDirection.RightUp:
                return FaceDirection.LeftDown;
            case FaceDirection.LeftDown:
                return FaceDirection.RightUp;
            case FaceDirection.RightDown:
                return FaceDirection.LeftUp;
            default:
                return FaceDirection.Unknown;
        }
    }

    canPass(handler: IPassCheckHandler): boolean {
        const { currLoc, nextLoc, direction, floorId } = handler;
        if (isNil(floorId)) return false;

        if (
            direction === FaceDirection.LeftDown ||
            direction === FaceDirection.LeftUp ||
            direction === FaceDirection.RightDown ||
            direction === FaceDirection.RightUp
        ) {
            return true;
        }

        const map = this.maps.getMap(floorId);
        if (!map) return false;
        const event = map.eventLayer;
        if (!event) return false;

        const { x, y } = currLoc;
        const { x: nx, y: ny } = nextLoc;
        const leaveMask = this.directionToPassBit(direction);
        const enterMask = this.directionToPassBit(
            this.oppositeDirection(direction)
        );
        let canLeave = true;
        let canEnter = true;

        const curr = event.getLocationData(x, y);
        const next = event.getLocationData(nx, ny);
        const currRaw = curr?.static?.raw();
        const nextRaw = next?.static?.raw();
        if (currRaw) canLeave = !!(leaveMask & currRaw.pass.outPass);
        if (nextRaw) canEnter = !!(enterMask & nextRaw.pass.inPass);
        if (!canLeave || !canEnter) return false;

        for (const layer of map.layerList) {
            if (layer === event) continue;
            const curr = layer.getLocationData(x, y);
            const next = layer.getLocationData(nx, ny);
            let canLeave = true;
            let canEnter = true;
            const currRaw = curr?.static?.raw();
            const nextRaw = next?.static?.raw();
            if (currRaw?.pass.onlyEvents) {
                canLeave = !!(leaveMask & currRaw.pass.outPass);
            }
            if (nextRaw?.pass.onlyEvents) {
                canEnter = !!(enterMask & nextRaw.pass.inPass);
            }
            if (!canLeave || !canEnter) return false;
        }

        return true;
    }

    shouldHit(handler: IPassCheckHandler): boolean {
        const { nextLoc, floorId } = handler;
        if (isNil(floorId)) return false;
        const map = this.maps.getMap(floorId);
        if (!map) return false;
        const eventLayer = map.eventLayer;
        if (!eventLayer) return false;
        const next = eventLayer.getLocationData(nextLoc.x, nextLoc.y);
        const nextRaw = next?.static?.raw();
        return !!nextRaw && !nextRaw.eventPass;
    }
}

export class DefaultHeroMoveTopImpl implements IHeroMoveTopImpl {
    /** 地图存储对象 */
    private readonly maps: IMapState;
    /** 游戏事件执行器 */
    private readonly executor: IGameEventExecutor;
    /** 勇士移动使用的通行性谓词 */
    private readonly passPredicate: IPassPredicate;

    constructor(state: IStateSystem) {
        this.maps = state.maps;
        this.executor = state.eventSystem.executor;
        this.passPredicate = new DefaultHeroPassPredicate(this.maps);
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
     * @param heroLoc 触发事件时勇士的位置
     * @param x 收集横坐标
     * @param y 收集纵坐标
     */
    private async commonTrigger(
        trigger: EventTrigger,
        handler: IHeroMoveTopHandler,
        heroLoc: ITileLocator,
        x: number,
        y: number
    ): Promise<void> {
        if (isNil(handler.floorId)) return Promise.resolve();

        const map = this.maps.getMap(handler.floorId);
        if (!map) return Promise.resolve();
        const event = map.eventLayer;
        if (!event) return Promise.resolve();

        const point = event.getPointEvent(x, y);
        const loc = event.getLocationData(x, y);
        const pointSources: IEventSource[] = [];
        const tileSources: IEventSource[] = [];
        if (point) {
            for (const [priority, id] of point) {
                pointSources.push({
                    priority,
                    id,
                    type: BlockEventType.PointEvent,
                    tile: null
                });
            }
        }
        if (loc) {
            for (const [priority, id] of loc.static.tileEvent().get()) {
                tileSources.push({
                    priority,
                    id,
                    type: BlockEventType.TileEvent,
                    tile: loc.static
                });
            }
            for (const tile of loc.dynamics) {
                for (const [priority, id] of tile.tileEvent().get()) {
                    tileSources.push({
                        priority,
                        id,
                        type: BlockEventType.TileEvent,
                        tile
                    });
                }
            }
        }
        pointSources.sort((a, b) => b.priority - a.priority);
        tileSources.sort((a, b) => b.priority - a.priority);

        const param: IBlockEventParam = { custom: {} };
        const invocations: IGameEventInvocation[] = [];
        for (const source of [...pointSources, ...tileSources]) {
            const env: IBlockEventEnv = {
                state: handler.state,
                type: source.type,
                trigger,
                heroLocator: heroLoc,
                triggerLocator: { x, y },
                tile: source.tile,
                layer: event,
                map
            };
            invocations.push({ id: source.id, env });
        }

        await this.executor.execute<void>(invocations, param);
    }

    async enter(handler: IHeroMoveTopHandler): Promise<void> {
        const { x, y } = handler.nextLoc;
        return this.commonTrigger(
            EventTrigger.OnEnter,
            handler,
            handler.nextLoc,
            x,
            y
        );
    }

    async leave(handler: IHeroMoveTopHandler): Promise<void> {
        const { x, y } = handler.currLoc;
        return this.commonTrigger(
            EventTrigger.OnLeave,
            handler,
            handler.currLoc,
            x,
            y
        );
    }

    async hit(handler: IHeroMoveTopHandler): Promise<void> {
        const { x, y } = handler.nextLoc;
        return this.commonTrigger(
            EventTrigger.OnTouch,
            handler,
            handler.currLoc,
            x,
            y
        );
    }

    /**
     * 新事件触发器没有无法进入的对应项，保留空实现以满足移动接口
     */
    async cannotEnter(): Promise<void> {
        return Promise.resolve();
    }

    //#endregion
}
