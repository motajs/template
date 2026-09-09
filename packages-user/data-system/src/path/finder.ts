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

interface IDistanceHeapEntry {
    /** 条目的键值，堆中键值最小的条目最先取出 */
    key: number;
    /** 条目携带的值 */
    value: number;
}

class DistanceHeap {
    private readonly entries: IDistanceHeapEntry[] = [];
    private size: number = 0;

    /**
     * 将指定位置的条目逐层上浮至其键值不再大于父条目的位置
     * @param index 条目所在位置
     */
    private siftUp(index: number): void {
        while (index > 0) {
            const parent = (index - 1) >> 1;
            if (this.entries[parent]!.key <= this.entries[index]!.key) break;
            const temp = this.entries[parent]!;
            this.entries[parent] = this.entries[index]!;
            this.entries[index] = temp;
            index = parent;
        }
    }

    /**
     * 将指定位置的条目逐层下沉至其键值不再大于子条目的位置
     * @param index 条目所在位置
     */
    private siftDown(index: number): void {
        while (true) {
            const left = index * 2 + 1;
            const right = left + 1;
            let smallest = index;
            if (
                left < this.size &&
                this.entries[left]!.key < this.entries[smallest]!.key
            ) {
                smallest = left;
            }
            if (
                right < this.size &&
                this.entries[right]!.key < this.entries[smallest]!.key
            ) {
                smallest = right;
            }
            if (smallest === index) break;
            const temp = this.entries[smallest]!;
            this.entries[smallest] = this.entries[index]!;
            this.entries[index] = temp;
            index = smallest;
        }
    }

    /**
     * 插入一个键值条目，键值相同的条目按插入先后取出
     * @param key 条目的键值
     * @param value 条目携带的值
     */
    push(key: number, value: number): void {
        this.entries[this.size] = { key, value };
        this.siftUp(this.size);
        this.size++;
    }

    /**
     * 取出键值最小的条目，堆为空时返回 `null`
     */
    pop(): IDistanceHeapEntry | null {
        if (this.size === 0) return null;
        const top = this.entries[0]!;
        this.size--;
        if (this.size > 0) {
            this.entries[0] = this.entries[this.size]!;
            this.siftDown(0);
        }
        return top;
    }
}

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
     * 获取进入指定位置节点的损失，损失值不是有限数字或为负数时告警并按损失 1 处理
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
     * 在有向图上执行最小损失搜索，终端节点仅可作为路径终点，不可作为中间节点
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
        const heap: DistanceHeap = new DistanceHeap();
        heap.push(0, startIndex);

        while (true) {
            const entry = heap.pop();
            if (!entry) return [];
            if (visited.has(entry.value)) continue;
            const currIndex = entry.value;
            const currDist = entry.key;
            // 取出的条目可能已过期，仅当其键值与当前最小损失一致时才有效
            if (currDist !== dist.get(currIndex)) continue;
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
                    heap.push(total, edge.to);
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
