import { ITileLocator, logger } from '@motajs/common';
import {
    IFaceHandler,
    ILocationIndexer,
    MapLocIndexer
} from '@user/data-common';
import {
    ILayerLocation,
    IMapLayer,
    IPassCheckHandler,
    IPassPredicate
} from '@user/data-base';
import {
    IMapGraph,
    IPathGraphEdge,
    IPathGraphNode,
    IMapGraphBuilder,
    PathCostFunction
} from './types';

export class MapGraphBuilder implements IMapGraphBuilder {
    /** 绑定的地图图层，图节点来源 */
    private layer: IMapLayer | null = null;
    /** 注入的损失函数，未注入时每格损失 1 */
    private cost: PathCostFunction | null = null;
    /** 注入的通行性谓词，用于判定边的可行性与终端节点 */
    private predicate: IPassPredicate | null = null;
    /** 邻域方向组别 */
    private face: IFaceHandler<number> | null = null;

    /** 坐标索引器 */
    indexer: ILocationIndexer;

    constructor() {
        this.indexer = new MapLocIndexer();
    }

    useMapLayer(layer: IMapLayer | null): void {
        this.layer = layer;
        if (layer) {
            this.indexer.setWidth(layer.width);
        }
    }

    useCostFunction(cost: PathCostFunction | null): void {
        this.cost = cost;
    }

    usePassPredicate(predicate: IPassPredicate | null): void {
        this.predicate = predicate;
    }

    useFaceHandler(face: IFaceHandler<number> | null): void {
        this.face = face;
    }

    /**
     * 获取进入指定位置节点的损失
     * @param block 位置信息
     */
    private resolveCost(block: ILayerLocation): number {
        if (this.cost) {
            return this.cost(block);
        } else {
            return 1;
        }
    }

    build(start: ITileLocator): IMapGraph | null {
        const layer = this.layer;
        const face = this.face;
        const predicate = this.predicate;
        if (!layer) {
            logger.warn(173, 'IMapLayer');
            return null;
        }
        if (!predicate) {
            logger.warn(173, 'IPassPredicate');
            return null;
        }
        if (!face) {
            logger.warn(173, 'IFaceHandler');
            return null;
        }
        if (!layer.inMap(start.x, start.y)) {
            logger.warn(183);
            return null;
        }

        const indexer = this.indexer;
        const { width, height, state } = layer;

        const terminals: Set<number> = new Set();
        const adjacency: Map<number, IPathGraphEdge[]> = new Map();
        const mapped: Set<number> = new Set();
        const startIndex = indexer.locaterToIndex(start);
        adjacency.set(startIndex, []);

        // 以起始位置为中心 BFS，仅沿可通行有向边扩展，不可达区域不入图
        const queue: ITileLocator[] = [start];
        let head = 0;
        while (head < queue.length) {
            const { x, y } = queue[head++]!;
            const index = indexer.locToIndex(x, y);
            const edges: IPathGraphEdge[] = [];
            for (const [dir, desc] of face.mapMovement()) {
                // 如果连接原地，那么应该忽略，避免陷入死循环
                if (desc.x === 0 && desc.y === 0) continue;
                const nx = x + desc.x;
                const ny = y + desc.y;
                if (!layer.inMap(nx, ny)) continue;

                const nextIndex = indexer.locToIndex(nx, ny);
                const next: ITileLocator = { x: nx, y: ny };
                const handler: IPassCheckHandler = {
                    currLoc: { x, y },
                    nextLoc: next,
                    direction: dir,
                    map: layer.map,
                    state
                };

                if (!predicate.canPass(handler)) continue;
                if (predicate.shouldHit(handler)) {
                    terminals.add(nextIndex);
                }

                edges.push({ dir, to: nextIndex });
                if (!mapped.has(nextIndex)) {
                    mapped.add(nextIndex);
                    queue.push(next);
                }
            }
            adjacency.set(index, edges);
        }

        const nodes: Map<number, IPathGraphNode> = new Map();
        for (const index of mapped) {
            const { x, y } = indexer.indexToLocator(index);
            const block = layer.getLocationData(x, y)!;
            nodes.set(index, {
                x,
                y,
                cost: this.resolveCost(block),
                terminal: terminals.has(index),
                edges: adjacency.get(index) ?? []
            });
        }
        return { width, height, nodes };
    }
}
