import { ITileLocator, IFaceHandler } from '@motajs/common';
import {
    IDataBaseExtended,
    ILayerLocation,
    IMapLayer,
    IPassPredicate
} from '@user/data-base';
import {
    ILocationHelper,
    IMoverController,
    IObjectMovable,
    IObjectMover
} from '@user/data-common';

export interface IPathGraphEdge {
    /** 本条边对应的移动方向 */
    readonly dir: number;
    /** 边指向的节点索引，值为 y * width + x */
    readonly to: number;
}

export interface IPathGraphNode {
    /** 节点横坐标 */
    readonly x: number;
    /** 节点纵坐标 */
    readonly y: number;
    /** 进入该节点的损失，构建图时由损失函数计算 */
    readonly cost: number;
    /** 该节点是否仅可作为路径终点，不可作为中间节点 */
    readonly terminal: boolean;
    /** 该节点的全部出边 */
    readonly edges: readonly IPathGraphEdge[];
}

export interface IMapGraph {
    /** 图宽度 */
    readonly width: number;
    /** 图高度 */
    readonly height: number;
    /** 图内全部节点，键为节点索引 */
    readonly nodes: ReadonlyMap<number, IPathGraphNode>;
}

export interface IMapGraphBuilder {
    /** 地图坐标索引器 */
    readonly indexer: ILocationHelper;

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
     * 设置邻域使用的方向控制对象
     * @param face 方向控制对象
     */
    useFaceHandler(face: IFaceHandler<number> | null): void;

    /**
     * 以起始位置为中心构建有向图：沿可通行有向边 BFS 扩展，
     * 仅包含从起始位置可达的节点。图层未绑定或起始位置越界时告警并返回空图
     * @param start BFS 起始位置
     */
    build(start: ITileLocator): IMapGraph | null;
}

export interface IPathfindingStep {
    /** 移动方向 */
    readonly dir: number;
    /** 这一步的出发位置 */
    readonly from: Readonly<ITileLocator>;
    /** 这一步移动到的位置 */
    readonly to: Readonly<ITileLocator>;
}

export interface IPathfindingController {
    /** 移动控制器对象 */
    readonly controller: Readonly<IMoverController>;
    /** 寻路路径 */
    readonly path: IPathfindingResult;
}

/**
 * 寻路损失函数，损失值仅与指定位置的图块有关，与移动方式等无关
 * @param block 指定坐标的位置信息
 */
export type PathCostFunction = (block: ILayerLocation) => number;

export const enum PathfindingStatus {
    /** 成功寻找到路径 */
    Success,
    /** 寻路输入不合法 */
    InvalidInput,
    /** 无法找到合理路径到达目标点 */
    NoPath,
    /** 目标点就在寻路起始位置脚下 */
    TargetUnder
}

export interface IPathfindingResult {
    /** 当前的寻路结果状态 */
    readonly status: PathfindingStatus;
    /** 寻路结果，只有寻路状态为 `PathfindingStatus.Success` 时此数组才不为空 */
    readonly path: readonly IPathfindingStep[];
}

export interface IPathFinder extends IDataBaseExtended {
    /**
     * 绑定构建有向图所用的地图图层，通常绑定事件层
     * @param layer 地图图层对象
     */
    useMapLayer(layer: IMapLayer | null): void;

    /**
     * 设置自定义损失函数，默认每格损失 1
     * @param cost 损失函数
     */
    useCostFunction(cost: PathCostFunction | null): void;

    /**
     * 设置通行性谓词，用于通行性判断，默认均不可通行
     * @param predicate 通行性谓词
     */
    usePassPredicate(predicate: IPassPredicate | null): void;

    /**
     * 设置邻域使用的方向控制对象
     * @param face 方向控制对象
     */
    useFaceHandler(face: IFaceHandler<number>): void;

    /**
     * 在当前状态下执行寻路操作，若返回空数组，表示寻路目标不可达，或输入参数错误，或寻路目标为当前勇士脚下
     * @param start 寻路起始位置
     * @param target 寻路目标位置
     */
    find(start: ITileLocator, target: ITileLocator): IPathfindingResult;
}

/**
 * 瞬移回退策略函数，若返回 `true`，表示当前操作不允许瞬移，必须逐步寻路
 * @param path 完整路径列表
 */
export type PathFallbackPolicy = (path: readonly IPathfindingStep[]) => boolean;

export interface IPathfindingSystem extends IDataBaseExtended {
    /** 寻路求解器 */
    readonly finder: IPathFinder;

    /**
     * 绑定寻路移动器，可绑定勇士或任意 `IObjectMover`，如动态图块移动器
     * @param mover 移动对象的移动器
     */
    useMover(mover: IObjectMover<IObjectMovable> | null): void;

    /**
     * 设置瞬移回退策略，默认必定回退为逐步寻路
     * @param policy 回退策略函数
     */
    useFallbackPolicy(policy: PathFallbackPolicy | null): void;

    /**
     * 仅获取从当前位置至目标位置的最小损失路径，不产生任何移动
     * @param target 目标坐标
     */
    getPath(target: ITileLocator): IPathfindingResult;

    /**
     * 逐步寻路至目标位置，触发途经事件
     * @param target 目标坐标
     * @returns 移动控制器。无法寻路、无路径或已有移动进行中时返回 `null`
     */
    moveTo(target: ITileLocator): IPathfindingController | null;

    /**
     * 瞬移至目标位置。瞬移前经回退策略判定，判定需要回退则自动退为逐步寻路
     * @param target 目标坐标
     * @returns 移动控制器；无法寻路、无路径或已有移动进行中时返回 `null`
     */
    teleportTo(target: ITileLocator): IPathfindingController | null;

    /**
     * 打断当前自动寻路。新的方向输入或新的寻路调用可随时打断并接管
     */
    interrupt(): Promise<void>;
}
