import { IMapState, IPassCheckHandler, IPassPredicate } from '@user/data-base';
import { FaceDirection, PassBit } from '@user/data-common';
import { isNil } from 'lodash-es';

export interface DefaultPassPredicate extends IPassPredicate {}

export class DefaultPassPredicateImpl implements DefaultPassPredicate {
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
