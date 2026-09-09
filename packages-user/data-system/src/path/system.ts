import { InternalDirectionGroup, ITileLocator, logger } from '@motajs/common';
import { IObjectMovable, IObjectMover } from '@user/data-common';
import {
    ILayerLocation,
    IMapLayer,
    IMapState,
    IPassPredicate,
    IStateBase
} from '@user/data-base';
import { isNil } from 'lodash-es';
import { IPathGraph, PathfindingGraphBuilder } from './graph';
import {
    IPathfinder,
    IPathfindingController,
    IPathfindingStep,
    IPathfindingSystem,
    PathCostFunction,
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

//#region 寻路求解器

/**
 * 寻路求解器，在动态构建的有向图上执行最小损失搜索。
 * 损失函数与通行性谓词均为可注入槽位，未注入损失函数时每格损失 1，
 * 未注入谓词时所有边均不可通行
 */
export class PathfindingFinder implements IPathfinder {
    /** 当前对象对应的数据层对象 */
    readonly state: IStateBase;

    /** 绑定的地图状态对象，用于解析楼层 id */
    private maps: IMapState | null = null;
    /** 绑定的地图图层，图节点来源 */
    private layer: IMapLayer | null = null;
    /** 注入的通行性谓词，用于判定边可行性与终端节点 */
    private predicate: IPassPredicate | null = null;
    /** 注入的损失函数，未注入时每格损失 1 */
    private cost: PathCostFunction | null = null;
    /** 邻域方向组别，默认四正交方向 */
    private group: number = InternalDirectionGroup.Dir4;

    constructor(state: IStateBase) {
        this.state = state;
    }

    /**
     * 绑定寻路所用的地图状态对象
     * @param maps 地图状态对象，传入 `null` 解绑
     */
    useMapState(maps: IMapState | null): void {
        this.maps = maps;
    }

    /**
     * 绑定构建有向图所用的地图图层
     * @param layer 地图图层对象，传入 `null` 解绑
     */
    useMapLayer(layer: IMapLayer | null): void {
        this.layer = layer;
    }

    /**
     * 设置自定义损失函数
     * @param cost 损失函数，传入 `null` 恢复默认
     */
    useCostFunction(cost: PathCostFunction | null): void {
        this.cost = cost;
    }

    /**
     * 设置通行性谓词
     * @param predicate 通行性谓词，传入 `null` 恢复默认
     */
    usePassPredicate(predicate: IPassPredicate | null): void {
        this.predicate = predicate;
    }

    /**
     * 设置寻路使用的朝向组
     * @param group 朝向组
     */
    useDirGroup(group: number): void {
        this.group = group;
    }

    /**
     * 在当前绑定状态下执行寻路，返回损失最小的步骤序列。
     * 地图状态或图层未绑定、坐标越界等非法输入下告警并返回空数组；
     * 目标不可达时同样返回空数组
     * @param start 寻路起始位置
     * @param target 寻路目标位置
     */
    find(start: ITileLocator, target: ITileLocator): IPathfindingStep[] {
        const maps = this.maps;
        const layer = this.layer;
        if (isNil(maps) || isNil(layer)) {
            logger.warn(173);
            return [];
        }
        if (
            !layer.inMap(start.x, start.y) ||
            !layer.inMap(target.x, target.y)
        ) {
            logger.warn(173);
            return [];
        }

        // 数据端状态可变，每次寻路动态构建图，不做缓存
        const builder = new PathfindingGraphBuilder();
        builder.useMapState(maps);
        builder.useMapLayer(layer);
        builder.usePassPredicate(this.predicate);
        builder.useDirGroup(this.group);
        const graph = builder.build();
        return this.search(graph, start, target);
    }

    /**
     * 在有向图上执行 Dijkstra 最小损失搜索，
     * 终端节点仅可作为路径终点，不可作为中间节点
     * @param graph 寻路有向图
     * @param start 寻路起始位置
     * @param target 寻路目标位置
     */
    private search(
        graph: IPathGraph,
        start: ITileLocator,
        target: ITileLocator
    ): IPathfindingStep[] {
        const startIndex = start.y * graph.width + start.x;
        const targetIndex = target.y * graph.width + target.x;
        if (startIndex === targetIndex) return [];
        if (!graph.nodes.has(startIndex) || !graph.nodes.has(targetIndex)) {
            return [];
        }

        const dist: Map<number, number> = new Map();
        const prev: Map<number, IPathfindingStep> = new Map();
        const visited: Set<number> = new Set();
        dist.set(startIndex, 0);

        while (true) {
            let currIndex = -1;
            let currDist = Infinity;
            for (const [index, value] of dist) {
                if (!visited.has(index) && value < currDist) {
                    currIndex = index;
                    currDist = value;
                }
            }
            if (currIndex === -1) return [];
            if (currIndex === targetIndex) break;
            visited.add(currIndex);
            const node = graph.nodes.get(currIndex);
            if (!node || node.terminal) continue;
            for (const edge of node.edges) {
                if (visited.has(edge.to)) continue;
                const next = graph.nodes.get(edge.to);
                if (!next) continue;
                if (next.terminal && edge.to !== targetIndex) continue;
                const total = currDist + this.getNodeCost(next.block);
                const known = dist.get(edge.to);
                if (isNil(known) || total < known) {
                    dist.set(edge.to, total);
                    prev.set(edge.to, {
                        dir: edge.dir,
                        from: { x: node.x, y: node.y },
                        to: { x: next.x, y: next.y }
                    });
                }
            }
        }

        const steps: IPathfindingStep[] = [];
        let curr = targetIndex;
        while (curr !== startIndex) {
            const step = prev.get(curr);
            if (!step) return [];
            steps.push(step);
            curr = step.from.y * graph.width + step.from.x;
        }
        steps.reverse();
        return steps;
    }

    /**
     * 获取进入指定位置节点的损失，非有限数或负数时
     * 告警并按默认损失 1 处理，保证搜索的非负权不变式
     * @param block 位置信息
     */
    private getNodeCost(block: ILayerLocation): number {
        const cost = this.cost;
        if (!cost) return 1;
        const value = cost(block);
        if (!Number.isFinite(value) || value < 0) {
            logger.warn(174);
            return 1;
        }
        return value;
    }
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
    useMovable(movable: IObjectMovable | null): void {
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
        const policy = this.policy;
        if (isNil(policy) || policy(path)) {
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
