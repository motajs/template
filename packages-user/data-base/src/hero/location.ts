import { IFacedTileLocator } from '@motajs/common';
import { FaceDirection, IDataCommon, IFaceHandler } from '@user/data-common';
import { HeroMover } from './mover';
import { IHeroLocation, IHeroLocationSave, IHeroMover } from './types';

export class HeroLocation implements IHeroLocation {
    x: number;
    y: number;

    readonly state: IDataCommon;
    readonly mover: IHeroMover<this>;

    constructor(
        state: IDataCommon,
        loc: IFacedTileLocator,
        faceHandler: IFaceHandler<FaceDirection>
    ) {
        this.state = state;
        this.x = loc.x;
        this.y = loc.y;
        const mover = new HeroMover(this, faceHandler);
        mover.faceDirection = loc.direction;
        this.mover = mover;
    }

    setPos(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    getCurrentFaceDirection(): FaceDirection {
        return this.mover.faceDirection;
    }

    saveState(): IHeroLocationSave {
        return {
            x: this.x,
            y: this.y,
            direction: this.mover.faceDirection
        };
    }

    loadState(state: IHeroLocationSave): void {
        this.x = state.x;
        this.y = state.y;
        this.mover.face(state.direction).start();
    }
}
