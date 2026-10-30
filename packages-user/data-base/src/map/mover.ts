import { ITileLocator, logger } from '@motajs/common';
import {
    FaceGroup,
    ObjectMover,
    ObjectMoveStep,
    ObjectMoveType,
    shouldReplay
} from '@user/data-common';
import { IDynamicTile } from './types';
import { DYNAMIC_MOVER_FACE } from '../shared';

const enum DynamicMoveCode {
    /** 正常执行 */
    Success
}

export class DynamicTileMover extends ObjectMover<IDynamicTile> {
    constructor(public readonly tile: IDynamicTile) {
        const face = tile.state.faceManager;
        super(face.get(DYNAMIC_MOVER_FACE)!, tile.getCurrentFaceDirection());
    }

    protected onMoveStart(): Promise<void> {
        return Promise.resolve();
    }

    protected onMoveEnd(): Promise<void> {
        return Promise.resolve();
    }

    protected onStepStart(): Promise<number> {
        return Promise.resolve(DynamicMoveCode.Success);
    }

    @shouldReplay('Dynamic tile moving step should be replayed.')
    protected async onStepEnd(
        code: number,
        step: ObjectMoveStep,
        tile: IDynamicTile
    ): Promise<ITileLocator> {
        if (code !== DynamicMoveCode.Success) {
            logger.warn(126, 'DynamicMoveCode.Success (0)', code.toString());
            return { x: tile.x, y: tile.y };
        }
        const handler = tile.state.faceManager.get(FaceGroup.Dir8);
        if (!handler) {
            logger.warn(192);
            return { x: tile.x, y: tile.y };
        }
        switch (step.type) {
            case ObjectMoveType.Dir:
            case ObjectMoveType.DirFace:
            case ObjectMoveType.Special: {
                const { x, y } = handler.movement(this.moveDirection);
                tile.setFaceDirection(this.faceDirection);
                return { x: tile.x + x, y: tile.y + y };
            }
            case ObjectMoveType.Face: {
                tile.setFaceDirection(step.value);
                return { x: tile.x, y: tile.y };
            }
            case ObjectMoveType.Teleport:
            case ObjectMoveType.Jump: {
                const { x, y, rel } = step;
                tile.setFaceDirection(this.faceDirection);
                const nx = rel ? tile.x + x : x;
                const ny = rel ? tile.y + y : y;
                return { x: nx, y: ny };
            }
            default: {
                return { x: tile.x, y: tile.y };
            }
        }
    }

    protected onStepSettled(): Promise<void> {
        return Promise.resolve();
    }
}
