import {
    DirectionMapper,
    IDirectionDescriptor,
    IDirectionMapper,
    InternalDirectionGroup,
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
import {
    IPathGraph,
    IPathGraphEdge,
    IPathGraphNode,
    IPathfindingGraphBuilder
} from './types';

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

    build(): IPathGraph {
        const layer = this.layer;
        if (isNil(layer)) {
            logger.warn(173);
            return { width: 0, height: 0, nodes: new Map() };
        }

        const width = layer.width;
        const height = layer.height;
        const floorId = this.resolveFloorId();
        const state = layer.state;
        const blocks: (ILayerLocation | null)[] = new Array(
            width * height
        ).fill(null);

        // 收集图内全部图块作为图节点
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (!layer.inMap(x, y)) continue;
                const loc = layer.getLocationData(x, y);
                if (!loc) continue;
                blocks[y * width + x] = loc;
            }
        }

        const terminals: Set<number> = new Set();
        const adjacency: Map<number, IPathGraphEdge[]> = new Map();
        const dirs: IDirectionDescriptor[] = [...this.mapper.map(this.group)];

        // 逐节点判定邻域边可行性
        for (let index = 0; index < blocks.length; index++) {
            const block = blocks[index];
            if (!block) continue;
            const x = index % width;
            const y = Math.floor(index / width);
            const edges: IPathGraphEdge[] = [];
            for (const desc of dirs) {
                const dir = directionOf(desc.x, desc.y);
                if (dir === FaceDirection.Unknown) continue;
                const nx = x + desc.x;
                const ny = y + desc.y;
                if (!layer.inMap(nx, ny)) continue;
                const next = blocks[ny * width + nx];
                if (!next) continue;
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
                if (this.predicate.shouldHit(handler)) {
                    terminals.add(ny * width + nx);
                }
                edges.push({ dir, to: ny * width + nx });
            }
            adjacency.set(index, edges);
        }

        const nodes: Map<number, IPathGraphNode> = new Map();
        for (let index = 0; index < blocks.length; index++) {
            const block = blocks[index];
            if (!block) continue;
            nodes.set(index, {
                index,
                x: index % width,
                y: Math.floor(index / width),
                block,
                terminal: terminals.has(index),
                edges: adjacency.get(index) ?? []
            });
        }
        return { width, height, nodes };
    }
}
