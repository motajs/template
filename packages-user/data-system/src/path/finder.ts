import { InternalDirectionGroup, ITileLocator, logger } from '@motajs/common';
import {
    ILayerLocation,
    IMapLayer,
    IMapState,
    IPassPredicate,
    IStateBase
} from '@user/data-base';
import { isNil } from 'lodash-es';
import { PathfindingGraphBuilder } from './graph';
import {
    IPathfinder,
    IPathfindingStep,
    IPathGraph,
    PathCostFunction
} from './types';

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

    useMapState(maps: IMapState | null): void {
        this.maps = maps;
    }

    useMapLayer(layer: IMapLayer | null): void {
        this.layer = layer;
    }

    useCostFunction(cost: PathCostFunction | null): void {
        this.cost = cost;
    }

    usePassPredicate(predicate: IPassPredicate | null): void {
        this.predicate = predicate;
    }

    useDirGroup(group: number): void {
        this.group = group;
    }

    /**
     * 获取进入指定位置节点的损失，损失值非有限数或负数时
     * 告警并按默认损失 1 处理
     * @param block 位置信息
     */
    private getNodeCost(block: ILayerLocation): number {
        if (!this.cost) return 1;
        const value = this.cost(block);
        if (!Number.isFinite(value) || value < 0) {
            logger.warn(174);
            return 1;
        }
        return value;
    }

    /**
     * 在有向图上执行最小损失搜索，
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
     * 地图状态或图层未绑定、坐标越界等非法输入下告警并返回空数组，
     * 目标不可达时同样返回空数组
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
}
