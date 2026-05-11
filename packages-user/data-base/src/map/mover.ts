import { ITileLocator, logger } from '@motajs/common';
import {
    getFaceMovement,
    ObjectMover,
    ObjectMoveStep,
    ObjectMoveStepType
} from '../common';
import { IDynamicTile } from './types';

//#region 动态图块

const enum DynamicMoveCode {
    /** 正常执行 */
    Success
}

export class DynamicTileMover extends ObjectMover<IDynamicTile> {
    constructor(public readonly tile: IDynamicTile) {
        super();
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
            case ObjectMoveStepType.Dir: {
                const { x, y } = getFaceMovement(step.move);
                tile.setFaceDirection(step.move);
                locator.x += x;
                locator.y += y;
                break;
            }
            case ObjectMoveStepType.DirFace: {
                const { x, y } = getFaceMovement(step.move);
                tile.setFaceDirection(step.face);
                locator.x += x;
                locator.y += y;
                break;
            }
            case ObjectMoveStepType.Face: {
                tile.setFaceDirection(step.value);
                break;
            }
            case ObjectMoveStepType.Special: {
                const { x, y } = getFaceMovement(this.moveDirection);
                tile.setFaceDirection(this.faceDirection);
                locator.x += x;
                locator.y += y;
                break;
            }
        }
        return Promise.resolve(locator);
    }
}

//#endregion
