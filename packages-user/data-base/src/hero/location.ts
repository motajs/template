import {
    Hookable,
    HookController,
    IFacedTileLocator,
    IHookController
} from '@motajs/common';
import { FaceDirection, IDataCommon, IFaceHandler } from '@user/data-common';
import { HeroMover } from './mover';
import {
    IHeroLocation,
    IHeroLocationHook,
    IHeroLocationSave,
    IHeroMover
} from './types';

export class HeroLocation
    extends Hookable<IHeroLocationHook>
    implements IHeroLocation
{
    x: number;
    y: number;
    floorId: string | undefined = undefined;

    readonly state: IDataCommon;
    readonly mover: IHeroMover<this>;

    constructor(
        state: IDataCommon,
        loc: IFacedTileLocator,
        faceHandler: IFaceHandler<FaceDirection>
    ) {
        super();
        this.state = state;
        this.x = loc.x;
        this.y = loc.y;
        const mover = new HeroMover(this, faceHandler);
        mover.faceDirection = loc.direction;
        this.mover = mover;
    }

    protected createController(
        hook: Partial<IHeroLocationHook>
    ): IHookController<IHeroLocationHook> {
        return new HookController(this, hook);
    }

    setFloor(floorId: string | undefined): void {
        this.floorId = floorId;
        this.forEachHook(hook => hook.onSetFloor?.(floorId));
    }

    setPos(x: number, y: number): void {
        this.x = x;
        this.y = y;
        this.forEachHook(hook => hook.onSetPos?.(x, y));
    }

    getCurrentFaceDirection(): FaceDirection {
        return this.mover.faceDirection;
    }

    saveState(): IHeroLocationSave {
        return {
            x: this.x,
            y: this.y,
            direction: this.mover.faceDirection,
            floorId: this.floorId
        };
    }

    loadState(state: IHeroLocationSave): void {
        this.x = state.x;
        this.y = state.y;
        this.floorId = state.floorId;
        this.mover.setFaceDir(state.direction);
    }
}
