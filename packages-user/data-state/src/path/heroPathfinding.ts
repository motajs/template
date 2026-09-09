import { ITileLocator } from '@motajs/common';
import {
    IHeroMoveTopImpl,
    IHeroState,
    IMapLayer,
    IMapState,
    IPassPredicate
} from '@user/data-base';
import { IHeroAttr, IObjectMovable, IObjectMover } from '@user/data-common';
import {
    IPathfinder,
    IPathfindingController,
    IPathfindingStep,
    IPathfindingSystem,
    PathCostFunction,
    PathFallbackPolicy,
    PathfindingSystem
} from '@user/data-system';
import { IStateSystem } from '@user/data-system';

interface IHeroPathfindingState extends IStateSystem {
    readonly hero: IHeroState<IHeroAttr>;
}

interface IHeroPathfinding extends IPathfindingSystem {}

export class HeroPathfinding implements IHeroPathfinding {
    readonly state: IHeroPathfindingState;
    readonly finder: IPathfinder;

    private readonly system: PathfindingSystem;

    constructor(state: IHeroPathfindingState, topImpl: IHeroMoveTopImpl) {
        this.state = state;
        this.system = new PathfindingSystem(state);
        this.finder = this.system.finder;
        this.system.useMover(state.hero.location.mover);
        this.finder.useMapState(state.maps);
        this.finder.usePassPredicate(topImpl.predicate());
        this.bindCurrentLayer();
    }

    private bindCurrentLayer(): void {
        const floorId = this.state.hero.location.floorId;
        const map = floorId ? this.state.maps.getMap(floorId) : null;
        const layer: IMapLayer | null = map?.eventLayer ?? null;
        this.finder.useMapLayer(layer);
    }

    useMover(mover: IObjectMover<IObjectMovable> | null): void {
        this.system.useMover(mover);
    }

    useFallbackPolicy(policy: PathFallbackPolicy | null): void {
        this.system.useFallbackPolicy(policy);
    }

    getPath(target: ITileLocator): IPathfindingStep[] {
        this.bindCurrentLayer();
        return this.system.getPath(target);
    }

    moveTo(target: ITileLocator): IPathfindingController | null {
        this.bindCurrentLayer();
        return this.system.moveTo(target);
    }

    teleportTo(target: ITileLocator): IPathfindingController | null {
        this.bindCurrentLayer();
        return this.system.teleportTo(target);
    }

    interrupt(): Promise<void> {
        return this.system.interrupt();
    }

    useMapState(maps: IMapState | null): void {
        this.finder.useMapState(maps);
    }

    useMapLayer(layer: IMapLayer | null): void {
        this.finder.useMapLayer(layer);
    }

    useCostFunction(cost: PathCostFunction | null): void {
        this.finder.useCostFunction(cost);
    }

    usePassPredicate(predicate: IPassPredicate | null): void {
        this.finder.usePassPredicate(predicate);
    }
}
