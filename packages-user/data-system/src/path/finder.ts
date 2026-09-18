import { ITileLocator, logger, IFaceHandler } from '@motajs/common';
import { IMapLayer, IPassPredicate, IStateBase } from '@user/data-base';
import { isNil } from 'lodash-es';
import { MapGraphBuilder } from './graph';
import {
    IPathFinder,
    IPathfindingStep,
    IMapGraph,
    PathCostFunction,
    IMapGraphBuilder,
    IPathfindingResult,
    PathfindingStatus
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

export class PathFinder implements IPathFinder {
    /** 当前对象对应的数据层对象 */
    readonly state: IStateBase;

    /** 当前寻路对象使用的图构建器 */
    private readonly graph: IMapGraphBuilder = new MapGraphBuilder();

    constructor(state: IStateBase) {
        this.state = state;
    }

    useMapLayer(layer: IMapLayer | null): void {
        if (layer) {
            if (layer.state !== this.state) {
                logger.warn(182, 'IMapLayer', 'IPathFinder');
                return;
            }
        }
        this.graph.useMapLayer(layer);
    }

    useCostFunction(cost: PathCostFunction | null): void {
        this.graph.useCostFunction(cost);
    }

    usePassPredicate(predicate: IPassPredicate | null): void {
        this.graph.usePassPredicate(predicate);
    }

    useFaceHandler(handler: IFaceHandler<number>): void {
        this.graph.useFaceHandler(handler);
    }

    /**
     * 在有向图上执行最小损失搜索，终端节点仅可作为路径终点，不可作为中间节点
     * @param graph 寻路有向图
     * @param start 寻路起始位置
     * @param target 寻路目标位置
     */
    private search(
        graph: IMapGraph,
        start: ITileLocator,
        target: ITileLocator
    ): IPathfindingStep[] {
        const indexer = this.graph.indexer;
        const startIndex = indexer.locaterToIndex(start);
        const targetIndex = indexer.locaterToIndex(target);
        if (startIndex === targetIndex) return [];
        if (!graph.nodes.has(startIndex) || !graph.nodes.has(targetIndex)) {
            return [];
        }

        const heap = new DistanceHeap();
        const dist: Map<number, number> = new Map();
        const prev: Map<number, IPathfindingStep> = new Map();
        const visited: Set<number> = new Set();

        dist.set(startIndex, 0);
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
                const total = currDist + next.cost;
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
            curr = indexer.locaterToIndex(step.from);
        }
        steps.reverse();
        return steps;
    }

    find(start: ITileLocator, target: ITileLocator): IPathfindingResult {
        if (start.x === target.x && start.y === target.y) {
            return { status: PathfindingStatus.TargetUnder, path: [] };
        }
        const graph = this.graph.build(start);
        if (!graph) {
            return { status: PathfindingStatus.InvalidInput, path: [] };
        }
        const path = this.search(graph, start, target);
        if (path.length === 0) {
            return { status: PathfindingStatus.NoPath, path };
        } else {
            return { status: PathfindingStatus.Success, path };
        }
    }
}
