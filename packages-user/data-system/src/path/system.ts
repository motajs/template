import { ITileLocator, logger } from '@motajs/common';
import { IObjectMovable, IObjectMover, shouldReplay } from '@user/data-common';
import { IStateBase } from '@user/data-base';
import { PathFinder } from './finder';
import {
    IPathFinder,
    IPathfindingController,
    IPathfindingResult,
    IPathfindingSystem,
    PathFallbackPolicy,
    PathfindingStatus
} from './types';

export class PathfindingSystem implements IPathfindingSystem {
    /** 寻路求解器 */
    readonly finder: IPathFinder;

    /** 当前绑定的移动器 */
    private mover: IObjectMover<IObjectMovable> | null = null;
    /** 注入的瞬移回退策略，未注入时必定回退为逐步寻路 */
    private policy: PathFallbackPolicy | null = null;
    /** 最近一次寻路移动的控制器包装 */
    private current: IPathfindingController | null = null;

    constructor(readonly state: IStateBase) {
        this.finder = new PathFinder(state);
    }

    useMover(mover: IObjectMover<IObjectMovable> | null): void {
        this.mover = mover;
    }

    useFallbackPolicy(policy: PathFallbackPolicy | null): void {
        this.policy = policy;
    }

    getPath(target: ITileLocator): IPathfindingResult {
        const mover = this.mover;
        if (!mover) {
            logger.warn(173);
            return {
                status: PathfindingStatus.InvalidInput,
                path: []
            };
        }
        const tile = mover.tile;
        return this.finder.find({ x: tile.x, y: tile.y }, target);
    }

    /**
     * 按指定移动方式启动寻路移动，返回控制器包装。已有移动进行中时返回 `null`
     * @param path 寻路步骤序列
     * @param teleport 是否瞬移
     */
    private startMove(
        path: IPathfindingResult,
        teleport: boolean
    ): IPathfindingController | null {
        const mover = this.mover;
        if (!mover) return null;
        const current = this.current;
        if (current && !current.controller.done) return null;

        const array = path.path;

        if (teleport) {
            const last = array.at(-1)!;
            mover.tp(last.to.x, last.to.y);
        } else {
            for (const step of array) {
                mover.step(step.dir);
            }
        }

        const controller = mover.start();
        if (!controller) return null;
        const result: IPathfindingController = { controller, path };
        this.current = result;
        return result;
    }

    @shouldReplay('Moving hero by path finding system should be replayed.')
    moveTo(target: ITileLocator): IPathfindingController | null {
        const path = this.getPath(target);
        if (path.status !== PathfindingStatus.Success) return null;
        return this.startMove(path, false);
    }

    @shouldReplay('Teleporting hero by path finding system should be replayed.')
    teleportTo(target: ITileLocator): IPathfindingController | null {
        const path = this.getPath(target);
        if (path.status !== PathfindingStatus.Success) return null;
        if (!this.policy || this.policy(path.path)) {
            return this.startMove(path, false);
        } else {
            return this.startMove(path, true);
        }
    }

    async interrupt(): Promise<void> {
        const current = this.current;
        this.current = null;
        if (current && !current.controller.done) {
            await current.controller.stop();
        }
    }
}
