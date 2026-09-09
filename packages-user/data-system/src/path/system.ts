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

//#region 移动器识别

/**
 * 携带移动器的移动对象，动态图块等真实移动对象均满足此结构
 */
export interface IMovableWithMover extends IObjectMovable {
    /** 移动器对象 */
    readonly mover: IObjectMover<IObjectMovable>;
}

/**
 * 判断移动对象是否携带移动器
 * @param movable 移动对象
 */
function hasMover(movable: IObjectMovable): movable is IMovableWithMover {
    return 'mover' in movable;
}

//#endregion

//#region 寻路系统

/**
 * 寻路系统，绑定移动对象后提供仅取路径、逐步寻路与瞬移寻路入口。
 * 瞬移前经回退策略判定，判定需要回退或未注入策略时
 * 自动退为逐步寻路
 */
export class PathfindingSystem implements IPathfindingSystem {
    /** 寻路求解器 */
    readonly finder: IPathfinder;

    /** 绑定的移动对象 */
    private movable: IObjectMovable | null = null;
    /** 注入的瞬移回退策略，未注入时必定回退为逐步寻路 */
    private policy: PathFallbackPolicy | null = null;
    /** 最近一次寻路移动的控制器包装 */
    private current: IPathfindingController | null = null;

    constructor(readonly state: IStateBase) {
        this.finder = new PathfindingFinder(state);
    }

    /**
     * 绑定寻路移动对象，可绑定勇士位置或任意动态图块
     * @param movable 移动对象，传入 `null` 解绑
     */
    useMover(movable: IObjectMovable | null): void {
        this.movable = movable;
    }

    /**
     * 设置瞬移回退策略，传入 `null` 恢复默认必定逐步
     * @param policy 回退策略函数
     */
    useFallbackPolicy(policy: PathFallbackPolicy | null): void {
        this.policy = policy;
    }

    /**
     * 仅获取从当前位置至目标位置的最小损失路径，不产生任何移动。
     * 未绑定移动对象时告警并返回空数组
     * @param target 目标坐标
     */
    getPath(target: ITileLocator): IPathfindingStep[] {
        const movable = this.movable;
        if (isNil(movable)) {
            logger.warn(173);
            return [];
        }
        return this.finder.find({ x: movable.x, y: movable.y }, target);
    }

    /**
     * 逐步寻路至目标位置，触发途经事件。
     * 无法寻路、无路径或已有移动进行中时返回 `null`
     * @param target 目标坐标
     */
    moveTo(target: ITileLocator): IPathfindingController | null {
        const path = this.getPath(target);
        if (path.length === 0) return null;
        return this.startMove(path, false);
    }

    /**
     * 瞬移至目标位置。瞬移前经回退策略判定，
     * 判定需要回退则自动退为逐步寻路；
     * 无法寻路、无路径或已有移动进行中时返回 `null`
     * @param target 目标坐标
     */
    teleportTo(target: ITileLocator): IPathfindingController | null {
        const path = this.getPath(target);
        if (path.length === 0) return null;
        if (isNil(this.policy) || this.policy(path)) {
            return this.startMove(path, false);
        }
        return this.startMove(path, true);
    }

    /**
     * 打断当前自动寻路。新的方向输入或新的寻路调用可随时打断并接管，
     * 接管时序由 03 计划的接线定义，此处仅停止进行中的移动
     */
    async interrupt(): Promise<void> {
        const current = this.current;
        this.current = null;
        if (current && !current.controller.done) {
            await current.controller.stop();
        }
    }

    /**
     * 按指定移动方式启动寻路移动，返回控制器包装。
     * 对象未携带移动器或已有移动进行中时返回 `null`
     * @param path 寻路步骤序列
     * @param teleport 是否瞬移
     */
    private startMove(
        path: readonly IPathfindingStep[],
        teleport: boolean
    ): IPathfindingController | null {
        const movable = this.movable;
        if (!movable) return null;
        const current = this.current;
        if (current && !current.controller.done) return null;
        if (!hasMover(movable)) return null;
        const mover = movable.mover;

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
}

//#endregion
