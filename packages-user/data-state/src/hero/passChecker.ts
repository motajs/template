import { ITileLocator } from '@motajs/common';
import { FaceDirection, PassBit } from '@user/data-common';
import { IHeroState, IStateBase, ITerrainPassChecker } from '@user/data-base';
import { isNil } from 'lodash-es';

export class DefaultPassChecker implements ITerrainPassChecker {
    constructor(
        readonly state: IStateBase,
        readonly hero: IHeroState<unknown>
    ) {}

    canPass(
        locator: ITileLocator,
        direction: FaceDirection,
        floorId: string | undefined
    ): boolean {
        if (isNil(floorId)) return false;
        if (
            direction === FaceDirection.LeftDown ||
            direction === FaceDirection.LeftUp ||
            direction === FaceDirection.RightDown ||
            direction === FaceDirection.RightUp
        ) {
            return true;
        }

        const layerState = this.state.maps.getLayerState(floorId);
        if (!layerState) return false;
        const eventLayer = layerState.eventLayer;
        if (!eventLayer) return false;

        const { x, y } = locator;
        const face = this.hero.location.mover.faceHandler;
        const { x: dx, y: dy } = face.movement(direction);
        const nx = x + dx;
        const ny = y + dy;
        const opposite = face.opposite(direction);
        const leaveMask = this.directionToPassBit(direction);
        const enterMask = this.directionToPassBit(opposite);

        let canLeave = true;
        let canEnter = true;

        const eventCurr = eventLayer.getLocationData(x, y);
        const eventNext = eventLayer.getLocationData(nx, ny);
        if (eventCurr && eventCurr.raw) {
            canLeave = !!(leaveMask & eventCurr.raw.pass.outPass);
        }
        if (eventNext && eventNext.raw) {
            canEnter = !!(enterMask & eventNext.raw.pass.inPass);
        }

        if (!canLeave || !canEnter) return false;

        for (const layer of layerState.layerList) {
            if (layer === eventLayer) continue;
            const curr = layer.getLocationData(x, y);
            const next = layer.getLocationData(nx, ny);
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
}
