import {
    DirectionMapper,
    IDirectionDescriptor,
    IDirectionMapper,
    InternalDirectionGroup,
    ITileLocator,
    logger
} from '@motajs/common';
import { FaceDirection } from '@user/data-common';
import {
    ILayerLocation,
    IMapLayer,
    IMapState,
    IPassCheckHandler,
    IPassPredicate
} from '@user/data-base';
import { isNil } from 'lodash-es';
import { PathCostFunction } from './types';

export interface IPathGraphEdge {
    /** 本条边对应的移动方向 */
    readonly dir: FaceDirection;
    /** 边指向的节点索引，值为 y * width + x */
    readonly to: number;
}

export interface IPathGraphNode {
    /** 节点索引，值为 y * width + x */
    readonly index: number;
    /** 节点横坐标 */
    readonly x: number;
    /** 节点纵坐标 */
    readonly y: number;
    /** 节点对应的位置信息 */
    readonly block: ILayerLocation;
    /** 进入该节点的损失，构建图时由损失函数计算 */
    readonly cost: number;
    /** 该节点是否仅可作为路径终点，不可作为中间节点 */
    readonly terminal: boolean;
    /** 该节点的全部出边 */
    readonly edges: readonly IPathGraphEdge[];
}

export interface IPathGraph {
    /** 图宽度 */
    readonly width: number;
    /** 图高度 */
    readonly height: number;
    /** 图内全部节点，键为节点索引 */
    readonly nodes: ReadonlyMap<number, IPathGraphNode>;
}

export interface IPathfindingGraphBuilder {
    /**
     * 绑定地图状态对象，用于解析图层所属楼层 id
     * @param maps 地图状态对象
     */
    useMapState(maps: IMapState | null): void;

    /**
     * 绑定构建有向图所用的地图图层
     * @param layer 地图图层对象
     */
    useMapLayer(layer: IMapLayer | null): void;

    /**
     * 设置构建图时使用的损失函数，未注入时每格损失 1
     * @param cost 损失函数
     */
    useCostFunction(cost: PathCostFunction | null): void;

    /**
     * 注入判定边可行性的通行性谓词
     * @param predicate 通行性谓词
     */
    usePassPredicate(predicate: IPassPredicate | null): void;

    /**
     * 设置邻域使用的方向组
     * @param group 朝向组
     */
    useDirGroup(group: number): void;

    /**
     * 以起始位置为中心构建有向图：沿可通行有向边 BFS 扩展，
     * 仅包含从起始位置可达的节点。图层未绑定或起始位置越界时告警并返回空图
     * @param start BFS 起始位置
     */
    build(start: ITileLocator): IPathGraph;
}

/**
 * 将方向描述器的坐标增量解析为对应的朝向
 * @param x 横坐标增量
 * @param y 纵坐标增量
 */
function directionOf(x: number, y: number): FaceDirection {
    if (x === 0 && y === -1) return FaceDirection.Up;
    if (x === 0 && y === 1) return FaceDirection.Down;
    if (x === -1 && y === 0) return FaceDirection.Left;
    if (x === 1 && y === 0) return FaceDirection.Right;
    if (x === -1 && y === -1) return FaceDirection.LeftUp;
    if (x === 1 && y === -1) return FaceDirection.RightUp;
    if (x === -1 && y === 1) return FaceDirection.LeftDown;
    if (x === 1 && y === 1) return FaceDirection.RightDown;
    return FaceDirection.Unknown;
}

export class PathfindingGraphBuilder implements IPathfindingGraphBuilder {
    /** 绑定的地图状态对象，用于解析图层所属楼层 id */
    private maps: IMapState | null = null;
    /** 绑定的地图图层，图节点来源 */
    private layer: IMapLayer | null = null;
    /** 注入的损失函数，未注入时每格损失 1 */
    private cost: PathCostFunction | null = null;
    /** 注入的通行性谓词，用于判定边的可行性与终端节点 */
    private predicate: IPassPredicate | null = null;
    /** 邻域方向组别，默认四正交方向 */
    private group: number = InternalDirectionGroup.Dir4;

    /** 方向组解析对象 */
    private readonly mapper: IDirectionMapper = new DirectionMapper();

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
     * 解析绑定图层所属的楼层 id
     * @returns 楼层 id，无法解析时为 `undefined`
     */
    private resolveFloorId(): string | undefined {
        const maps = this.maps;
        const layer = this.layer;
        if (!maps || !layer) return undefined;
        for (const [floorId, map] of maps.iterateAllMaps()) {
            if (map === layer.map) return floorId;
        }
        return undefined;
    }

    /**
     * 获取进入指定位置节点的损失，损失值为 NaN 或负数时告警并按损失 1 处理，
     * Infinity 为合法损失值
     * @param block 位置信息
     */
    private resolveCost(block: ILayerLocation): number {
        if (!this.cost) return 1;
        const value = this.cost(block);
        if (Number.isNaN(value) || value < 0) {
            logger.warn(174);
            return 1;
        }
        return value;
    }

    build(start: ITileLocator): IPathGraph {
        const layer = this.layer;
        if (isNil(layer) || !layer.inMap(start.x, start.y)) {
            logger.warn(173);
            return { width: 0, height: 0, nodes: new Map() };
        }

        const width = layer.width;
        const height = layer.height;
        const floorId = this.resolveFloorId();
        const state = layer.state;
        const dirs: IDirectionDescriptor[] = [...this.mapper.map(this.group)];

        const terminals: Set<number> = new Set();
        const adjacency: Map<number, IPathGraphEdge[]> = new Map();
        const blocks: Map<number, ILayerLocation> = new Map();
        const startIndex = start.y * width + start.x;
        blocks.set(startIndex, layer.getLocationData(start.x, start.y)!);
        adjacency.set(startIndex, []);

        // 以起始位置为中心 BFS，仅沿可通行有向边扩展，不可达区域不入图
        const queue: number[] = [startIndex];
        let head = 0;
        while (head < queue.length) {
            const index = queue[head++]!;
            const block = blocks.get(index)!;
            const x = index % width;
            const y = Math.floor(index / width);
            const edges: IPathGraphEdge[] = [];
            for (const desc of dirs) {
                const dir = directionOf(desc.x, desc.y);
                if (dir === FaceDirection.Unknown) continue;
                const nx = x + desc.x;
                const ny = y + desc.y;
                if (!layer.inMap(nx, ny)) continue;
                const next = layer.getLocationData(nx, ny)!;
                const handler: IPassCheckHandler = {
                    currLoc: block.locator,
                    nextLoc: next.locator,
                    direction: dir,
                    floorId,
                    state
                };
                if (isNil(this.predicate) || !this.predicate.canPass(handler)) {
                    continue;
                }
                const nextIndex = ny * width + nx;
                if (this.predicate.shouldHit(handler)) {
                    terminals.add(nextIndex);
                }
                edges.push({ dir, to: nextIndex });
                if (!blocks.has(nextIndex)) {
                    blocks.set(nextIndex, next);
                    adjacency.set(nextIndex, []);
                    queue.push(nextIndex);
                }
            }
            adjacency.set(index, edges);
        }

        const nodes: Map<number, IPathGraphNode> = new Map();
        for (const [index, block] of blocks) {
            nodes.set(index, {
                index,
                x: index % width,
                y: Math.floor(index / width),
                block,
                cost: this.resolveCost(block),
                terminal: terminals.has(index),
                edges: adjacency.get(index) ?? []
            });
        }
        return { width, height, nodes };
    }
}
