import { IFacedTileLocator, logger } from '@motajs/common';
import {
    FaceDirection,
    IDataCommon,
    IFaceHandler,
    SaveCompression
} from '@user/data-common';
import { HeroLocation } from './location';
import { HeroRendering } from './rendering';
import {
    IHeroFollower,
    IHeroFollowerSave,
    IHeroFollowersController,
    IHeroLocation,
    IHeroRendering
} from './types';
import { isNil } from 'lodash-es';

export class HeroFollower implements IHeroFollower {
    readonly num: number;
    readonly state: IDataCommon;
    readonly rendering: IHeroRendering;
    readonly location: IHeroLocation;

    /** 所属的跟随者控制器，用于获取相邻跟随者 */
    private readonly controller: IHeroFollowersController;

    constructor(
        num: number | string,
        loc: IFacedTileLocator,
        faceHandler: IFaceHandler<FaceDirection>,
        controller: IHeroFollowersController
    ) {
        const state = controller.state;
        if (typeof num === 'string') {
            const n = state.tileStore.idToNumber(num);
            if (isNil(n)) {
                logger.warn(142);
                this.num = 0;
            } else {
                this.num = n;
            }
        } else {
            this.num = num;
        }
        this.state = state;
        this.rendering = new HeroRendering(state);
        this.location = new HeroLocation(state, loc, faceHandler);
        this.controller = controller;
    }

    next(): IHeroFollower | null {
        const all = this.controller.getAllFollowers();
        const myIndex = all.indexOf(this);
        if (myIndex === -1) return null;
        return this.controller.getFollower(myIndex + 1);
    }

    last(): IHeroFollower | null {
        const all = this.controller.getAllFollowers();
        const myIndex = all.indexOf(this);
        if (myIndex === -1) return null;
        return this.controller.getFollower(myIndex - 1);
    }

    saveState(compression: SaveCompression): IHeroFollowerSave {
        return {
            rendering: this.rendering.saveState(compression),
            location: this.location.saveState(compression)
        };
    }

    loadState(state: IHeroFollowerSave, compression: SaveCompression): void {
        this.rendering.loadState(state.rendering, compression);
        this.location.loadState(state.location, compression);
    }
}
