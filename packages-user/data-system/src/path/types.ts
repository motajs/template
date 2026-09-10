import { ITileLocator } from '@motajs/common';
import {
    IDataBaseExtended,
    ILayerLocation,
    IMapLayer,
    IMapState,
    IPassPredicate
} from '@user/data-base';
import {
    FaceDirection,
    IMoverController,
    IObjectMovable
} from '@user/data-common';

export interface IPathfindingStep {
    /** 移动方向 */
    readonly dir: FaceDirection;
    /** 这一步的出发位置 */
    readonly from: Readonly<ITileLocator>;
    /** 这一步移动到的位置 */
    readonly to: Readonly<ITileLocator>;
}

export interface IPathfindingController {
    /** 移动控制器对象 */
    readonly controller: Readonly<IMoverController>;
    /** 寻路路径 */
    readonly path: readonly IPathfindingStep[];
}

/**
 * 寻路损失函数，损失值仅与指定位置的图块有关，与移动方式等无关
 * @param block 指定坐标的位置信息
 */
export type PathCostFunction = (block: ILayerLocation) => number;

/**
 * 瞬移回退策略函数，若返回 `true`，表示当前操作不允许瞬移，必须逐步寻路
 * @param path 完整路径列表
 */
export type PathFallbackPolicy = (path: readonly IPathfindingStep[]) => boolean;

export interface IPathfinder extends IDataBaseExtended {
    /**
     * 绑定寻路所用的地图状态对象，用于获取楼层与事件层信息，未绑定时寻路告警并返回空路径
     * @param maps 地图状态对象
     */
    useMapState(maps: IMapState | null): void;

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
     * 设置寻路使用的朝向组
     * @param group 朝向组
     */
    useDirGroup(group: number): void;

    /**
     * 在当前状态下执行寻路操作
     * @param start 寻路起始位置
     * @param target 寻路目标位置
     */
    find(start: ITileLocator, target: ITileLocator): IPathfindingStep[];
}

export interface IPathfindingSystem extends IDataBaseExtended {
    /** 寻路求解器 */
    readonly finder: IPathfinder;

    /**
     * 绑定寻路移动对象，可绑定勇士位置或任意 `IObjectMovable`，如动态图块
     * @param movable 移动对象
     */
    useMovable(movable: IObjectMovable | null): void;

    /**
     * 设置瞬移回退策略，默认必定回退为逐步寻路
     * @param policy 回退策略函数
     */
    useFallbackPolicy(policy: PathFallbackPolicy | null): void;

    /**
     * 仅获取从当前位置至目标位置的最小损失路径，不产生任何移动
     * @param target 目标坐标
     */
    getPath(target: ITileLocator): IPathfindingStep[];

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
