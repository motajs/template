import { ITileLocator, logger } from '@motajs/common';
import {
    getFaceMovement,
    ObjectMover,
    ObjectMoveStep,
    ObjectMoveType
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

    protected onStepEnd(
        code: number,
        step: ObjectMoveStep,
        tile: IDynamicTile
    ): Promise<ITileLocator> {
        if (code !== DynamicMoveCode.Success) {
            logger.warn(126, 'DynamicMoveCode.Success (0)', code.toString());
            return Promise.resolve({ x: tile.x, y: tile.y });
        }
        const locator: ITileLocator = {
            x: tile.x,
            y: tile.y
        };
        switch (step.type) {
            case ObjectMoveType.Dir: {
                const { x, y } = getFaceMovement(step.move);
                tile.setFaceDirection(step.move);
                locator.x += x;
                locator.y += y;
                break;
            }
            case ObjectMoveType.DirFace: {
                const { x, y } = getFaceMovement(step.move);
                tile.setFaceDirection(step.face);
                locator.x += x;
                locator.y += y;
                break;
            }
            case ObjectMoveType.Face: {
                tile.setFaceDirection(step.value);
                break;
            }
            case ObjectMoveType.Special: {
                const { x, y } = getFaceMovement(this.moveDirection);
                tile.setFaceDirection(this.faceDirection);
                locator.x += x;
                locator.y += y;
                break;
            }
            case ObjectMoveType.Teleport:
            case ObjectMoveType.Jump: {
                const { x, y, rel } = step;
                tile.setFaceDirection(this.faceDirection);
                if (rel) {
                    locator.x += x;
                    locator.y += y;
                } else {
                    locator.x = x;
                    locator.y = y;
                }
                break;
            }
        }
        return Promise.resolve(locator);
    }

    protected onStepSettled(): Promise<void> {
        return Promise.resolve();
    }
}
