import {
    IHeroMoveTopHandler,
    IHeroMoveTopImpl,
    IMapStore,
    IStateBase
} from '@user/data-base';
import { FaceDirection, PassBit } from '@user/data-common';
import { ITriggerCollector, ITriggerHandler } from '@user/data-system';
import { isNil } from 'lodash-es';

export class DefaultHeroMoveTopImpl implements IHeroMoveTopImpl {
    /** 地图存储对象 */
    private readonly maps: IMapStore;

    constructor(
        private readonly state: IStateBase,
        private readonly collector: ITriggerCollector
    ) {
        this.maps = state.maps;
    }

    //#region 通行性判断

    /**
     * 将朝向转换为对应的通行性位掩码。
     * @param dir 朝向
     */
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

    inBound(x: number, y: number, floorId: string | undefined): boolean {
        if (isNil(floorId)) return false;
        const layerState = this.maps.getLayerState(floorId);
        if (!layerState) return false;
        const { width, height } = layerState;
        return x >= 0 && y >= 0 && x < width && y < height;
    }

    canPass(handler: IHeroMoveTopHandler): boolean {
        const { currLoc, nextLoc, direction, floorId, face } = handler;
        if (isNil(floorId)) return false;

        // 四角朝向直接判定为可通行
        if (
            direction === FaceDirection.LeftDown ||
            direction === FaceDirection.LeftUp ||
            direction === FaceDirection.RightDown ||
            direction === FaceDirection.RightUp
        ) {
            return true;
        }

        const map = this.maps.getLayerState(floorId);
        if (!map) return false;
        const event = map.eventLayer;
        if (!event) return false;

        const { x, y } = currLoc;
        const { x: nx, y: ny } = nextLoc;

        const opposite = face.opposite(direction);
        const leaveMask = this.directionToPassBit(direction);
        const enterMask = this.directionToPassBit(opposite);

        let canLeave = true;
        let canEnter = true;

        // 判断事件层
        const curr = event.getLocationData(x, y);
        const next = event.getLocationData(nx, ny);
        if (curr && curr.raw) {
            canLeave = !!(leaveMask & curr.raw.pass.outPass);
        }
        if (next && next.raw) {
            canEnter = !!(enterMask & next.raw.pass.inPass);
        }

        if (!canLeave || !canEnter) return false;

        // 判断其他层
        for (const layer of map.layerList) {
            if (layer === event) continue;
            const curr = layer.getLocationData(x, y);
            const next = layer.getLocationData(nx, ny);
            let canLeave = true;
            let canEnter = true;
            if (curr && curr.raw && curr.raw.pass.onlyEvents) {
                canLeave = !!(leaveMask & curr.raw.pass.outPass);
            }
            if (next && next.raw && next.raw.pass.onlyEvents) {
                canEnter = !!(enterMask & next.raw.pass.inPass);
            }
            if (!canLeave || !canEnter) return false;
        }

        return true;
    }

    shouldHit(handler: IHeroMoveTopHandler): boolean {
        const { nextLoc, floorId } = handler;
        if (isNil(floorId)) return false;
        const layerState = this.maps.getLayerState(floorId);
        if (!layerState) return false;
        const eventLayer = layerState.eventLayer;
        if (!eventLayer) return false;

        const { x: nx, y: ny } = nextLoc;

        const next = eventLayer.getLocationData(nx, ny);
        if (!next || !next.raw) return false;
        return !next.raw.eventPass;
    }

    //#endregion

    //#region 触发器行为

    async hit(handler: IHeroMoveTopHandler): Promise<void> {
        if (isNil(handler.floorId)) return;

        const map = this.maps.getLayerState(handler.floorId);
        if (!map) return;
        const event = map.eventLayer;
        if (!event) return;

        const { x, y } = handler.nextLoc;
        const triggers = this.collector.collect(x, y, event);

        const triggerHandler: ITriggerHandler = {
            state: this.state,
            layer: map,
            mapLayer: event,
            locator: handler.nextLoc
        };

        return triggers.trigger(triggerHandler);
    }

    //#endregion
}
