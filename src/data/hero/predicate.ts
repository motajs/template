import { IPassCheckHandler, IPassPredicate } from '@user/data-base';
import { FaceDirection, FaceGroup, PassBit } from '@user/data-common';
import { IStateSystem } from '@user/data-system';

export interface DefaultPassPredicate extends IPassPredicate {}

export class DefaultPassPredicateImpl implements DefaultPassPredicate {
    constructor(readonly state: IStateSystem) {}

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

    canPass(handler: IPassCheckHandler): boolean {
        const { currLoc, nextLoc, direction, map } = handler;
        const face = this.state.faceManager.get(FaceGroup.Dir4);
        if (!face) return false;

        const degraded = face.degrade(direction);
        if (degraded === FaceDirection.Unknown) return false;

        if (!map) return false;
        const event = map.eventLayer;
        if (!event) return false;

        const { x, y } = currLoc;
        const { x: nx, y: ny } = nextLoc;
        const leaveMask = this.directionToPassBit(direction);
        const enterMask = this.directionToPassBit(face.opposite(direction));
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
        const { nextLoc, map } = handler;
        if (!map) return false;
        const event = map.eventLayer;
        if (!event) return false;
        const next = event.getLocationData(nextLoc.x, nextLoc.y);
        const nextRaw = next?.static?.raw();
        return !!nextRaw && !nextRaw.eventPass;
    }
}
