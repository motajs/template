import { ITileLocator, logger } from '@motajs/common';
import { IObjectMovable, IObjectMover } from '@user/data-common';
import { IStateBase } from '@user/data-base';
import { isNil } from 'lodash-es';
import { PathfindingFinder } from './finder';
import {
    IPathfinder,
    IPathfindingController,
    IPathfindingStep,
    IPathfindingSystem,
    PathFallbackPolicy
} from './types';

export class PathfindingSystem implements IPathfindingSystem {
    /** 寻路求解器 */
    readonly finder: IPathfinder;

    /** 绑定的移动器对象 */
    private mover: IObjectMover<IObjectMovable> | null = null;
    /** 注入的瞬移回退策略，未注入时必定回退为逐步寻路 */
    private policy: PathFallbackPolicy | null = null;
    /** 最近一次寻路移动的控制器包装 */
    private current: IPathfindingController | null = null;

    constructor(readonly state: IStateBase) {
        this.finder = new PathfindingFinder(state);
    }

    useMover(mover: IObjectMover<IObjectMovable> | null): void {
        this.mover = mover;
    }

    useFallbackPolicy(policy: PathFallbackPolicy | null): void {
        this.policy = policy;
    }

    /**
     * 未绑定移动器时告警并返回空数组
     * @param target 目标坐标
     */
    getPath(target: ITileLocator): IPathfindingStep[] {
        const mover = this.mover;
        if (isNil(mover)) {
            logger.warn(173);
            return [];
        }
        const tile = mover.tile;
        return this.finder.find({ x: tile.x, y: tile.y }, target);
    }

    /**
     * 按指定移动方式启动寻路移动，返回控制器包装。
     * 已有移动进行中时返回 `null`
     * @param path 寻路步骤序列
     * @param teleport 是否瞬移
     */
    private startMove(
        path: readonly IPathfindingStep[],
        teleport: boolean
    ): IPathfindingController | null {
        const mover = this.mover;
        if (!mover) return null;
        const current = this.current;
        if (current && !current.controller.done) return null;

        if (teleport) {
            const last = path[path.length - 1];
            mover.tp(last.to.x, last.to.y);
        } else {
            for (const step of path) {
                mover.step(step.dir);
            }
        }

        // 移动器移动中时启动失败，对应已有移动进行中的契约
        const controller = mover.start();
        if (!controller) return null;
        const result: IPathfindingController = { controller, path };
        this.current = result;
        return result;
    }

    moveTo(target: ITileLocator): IPathfindingController | null {
        const path = this.getPath(target);
        if (path.length === 0) return null;
        return this.startMove(path, false);
    }

    teleportTo(target: ITileLocator): IPathfindingController | null {
        const path = this.getPath(target);
        if (path.length === 0) return null;
        if (isNil(this.policy) || this.policy(path)) {
            return this.startMove(path, false);
        }
        return this.startMove(path, true);
    }

    async interrupt(): Promise<void> {
        const current = this.current;
        this.current = null;
        if (current && !current.controller.done) {
            await current.controller.stop();
        }
    }
}
