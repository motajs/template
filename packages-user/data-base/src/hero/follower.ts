import {
    Hookable,
    HookController,
    IFacedTileLocator,
    IHookController,
    logger
} from '@motajs/common';
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
    IHeroFollowersControllerHooks,
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
            num: this.num,
            rendering: this.rendering.saveState(compression),
            location: this.location.saveState(compression)
        };
    }

    loadState(state: IHeroFollowerSave, compression: SaveCompression): void {
        this.rendering.loadState(state.rendering, compression);
        this.location.loadState(state.location, compression);
    }
}

export class HeroFollowersController
    extends Hookable<IHeroFollowersControllerHooks>
    implements IHeroFollowersController
{
    readonly state: IDataCommon;
    /** 跟随者列表 */
    private readonly followers: HeroFollower[] = [];
    /** 勇士位置对象，用于获取聚集目标位置 */
    private readonly heroLocation: IHeroLocation;
    /** 朝向处理器，传递给新创建的跟随者 */
    private readonly faceHandler: IFaceHandler<FaceDirection>;

    constructor(
        state: IDataCommon,
        heroLocation: IHeroLocation,
        faceHandler: IFaceHandler<FaceDirection>
    ) {
        super();
        this.state = state;
        this.heroLocation = heroLocation;
        this.faceHandler = faceHandler;
    }

    protected createController(
        hook: Partial<IHeroFollowersControllerHooks>
    ): IHookController<IHeroFollowersControllerHooks> {
        return new HookController(this, hook);
    }

    addFollower(num: number | string): IHeroFollower {
        const loc: IFacedTileLocator = {
            x: this.heroLocation.x,
            y: this.heroLocation.y,
            direction: this.heroLocation.mover.faceDirection
        };
        const follower = new HeroFollower(num, loc, this.faceHandler, this);
        this.followers.push(follower);
        const index = this.followers.length - 1;
        this.forEachHook(hook => {
            hook.onAddFollower?.(follower, index);
        });
        return follower;
    }

    getFollower(index: number): IHeroFollower | null {
        return this.followers[index] ?? null;
    }

    *getFollowersById(
        num: number | string
    ): IterableIterator<[number, IHeroFollower]> {
        const store = this.state.tileStore;
        const target = typeof num === 'string' ? store.idToNumber(num)! : num;
        for (let i = 0; i < this.followers.length; i++) {
            if (this.followers[i].num === target) {
                yield [i, this.followers[i]];
            }
        }
    }

    getAllFollowers(): IHeroFollower[] {
        return this.followers.slice();
    }

    async removeFollower(index: number): Promise<void> {
        const removed = this.followers.splice(index, 1);
        if (removed.length > 0) {
            this.forEachHook(hook => {
                hook.onRemoveFollower?.(removed[0], index);
            });
        }
    }

    async removeAllFollowers(): Promise<void> {
        const snapshot = this.followers.slice();
        this.followers.length = 0;
        this.forEachHook(hook => {
            snapshot.forEach((v, i) => {
                hook.onRemoveFollower?.(v, i);
            });
        });
    }

    async gatherFollowers(): Promise<void> {
        const { x, y, mover } = this.heroLocation;

        for (let i = 0; i < this.followers.length; i++) {
            const follower = this.followers[i];
            follower.location.mover.clear();

            let skip = false;
            for (let j = i - 1; j >= 0; j--) {
                const dir = this.followers[j].location.mover.moveDirection;
                if (dir === FaceDirection.Unknown) {
                    follower.location.mover.clear();
                    follower.location.mover.tp(x, y);
                    follower.location.mover.face(mover.faceDirection);
                    skip = true;
                    break;
                } else {
                    follower.location.mover.step(dir);
                }
            }

            if (!skip) {
                follower.location.mover.step(mover.moveDirection);
            }
        }

        const controllers = this.followers.map(
            v => v.location.mover.start()?.onEnd
        );
        await Promise.all(controllers);
        this.forEachHook(hook => {
            hook.onGatherFollowers?.(false);
        });
    }

    gatherFollowersSync(): void {
        const { x, y } = this.heroLocation;
        const dir = this.heroLocation.mover.faceDirection;
        for (const follower of this.followers) {
            const mover = follower.location.mover;
            mover.setPos(x, y);
            mover.setFaceDir(dir);
        }
        this.forEachHook(hook => {
            hook.onGatherFollowers?.(true);
        });
    }
}
