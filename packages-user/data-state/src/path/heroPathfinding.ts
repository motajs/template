import { ITileLocator, logger } from '@motajs/common';
import {
    BlockEventType,
    IBlockEventEnv,
    IBlockEventParam,
    IGameEventInvocation,
    IHeroMoveTopImpl,
    IHeroState,
    IMapLayer,
    IMapState,
    IReadonlyTileBase,
    IPassPredicate
} from '@user/data-base';
import {
    EventTrigger,
    FaceDirection,
    IHeroAttr,
    IMoverController,
    IObjectMovable,
    IObjectMover,
    ObjectMoveStep
} from '@user/data-common';
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

interface IEventSource {
    readonly priority: number;
    readonly id: string;
    readonly type: BlockEventType;
    readonly tile: IReadonlyTileBase | null;
}

interface IResolvedPath {
    readonly path: IPathfindingStep[];
    readonly adjacent: Readonly<ITileLocator> | null;
    readonly target: Readonly<ITileLocator> | null;
}

interface IHeroPathfindingController extends IMoverController {}

class HeroPathfindingController implements IHeroPathfindingController {
    private completed: boolean = false;
    private readonly completion: Promise<void>;

    constructor(
        private readonly delegate: Readonly<IMoverController>,
        afterMove: () => Promise<void>
    ) {
        this.completion = delegate.onEnd.then(async () => {
            await afterMove();
            this.completed = true;
        });
    }

    get done(): boolean {
        return this.completed;
    }

    get onEnd(): Promise<void> {
        return this.completion;
    }

    push(...steps: Readonly<ObjectMoveStep>[]): void {
        this.delegate.push(...steps);
    }

    insert(...steps: Readonly<ObjectMoveStep>[]): void {
        this.delegate.insert(...steps);
    }

    stop(): Promise<void> {
        return this.delegate.stop();
    }
}

class QueuedHeroPathfindingController implements IPathfindingController {
    private current: IPathfindingController | null = null;
    private currentPath: IPathfindingStep[] = [];
    private cancelled: boolean = false;
    private completed: boolean = false;
    private readonly completion: Promise<void>;

    constructor(start: () => Promise<IPathfindingController | null>) {
        this.completion = Promise.resolve()
            .then(start)
            .then(async result => {
                if (!result) {
                    this.completed = true;
                    return;
                }
                this.current = result;
                this.currentPath = [...result.path];
                if (this.cancelled) {
                    await result.controller.stop();
                    this.completed = true;
                    return;
                }
                await result.controller.onEnd;
                this.completed = true;
            });
    }

    get controller(): Readonly<IMoverController> {
        return this;
    }

    get path(): readonly IPathfindingStep[] {
        return this.currentPath;
    }

    get done(): boolean {
        return this.completed;
    }

    get onEnd(): Promise<void> {
        return this.completion;
    }

    isCancelled(): boolean {
        return this.cancelled;
    }

    push(...steps: Readonly<ObjectMoveStep>[]): void {
        this.current?.controller.push(...steps);
    }

    insert(...steps: Readonly<ObjectMoveStep>[]): void {
        this.current?.controller.insert(...steps);
    }

    stop(): Promise<void> {
        this.cancelled = true;
        if (this.current) return this.current.controller.stop();
        return this.completion;
    }
}

export class HeroPathfinding implements IHeroPathfinding {
    readonly state: IHeroPathfindingState;
    readonly finder: IPathfinder;

    private readonly system: PathfindingSystem;
    private active: IPathfindingController | null = null;

    constructor(state: IHeroPathfindingState, topImpl: IHeroMoveTopImpl) {
        this.state = state;
        this.system = new PathfindingSystem(state);
        this.finder = this.system.finder;
        this.system.useMover(state.hero.location.mover);
        this.finder.useMapState(state.maps);
        this.finder.usePassPredicate(topImpl.predicate());
        this.system.useFallbackPolicy(path => this.hasEvent(path));
        this.bindCurrentLayer();
    }

    private hasEvent(path: readonly IPathfindingStep[]): boolean {
        const layer = this.finderLayer();
        if (!layer) return false;
        for (const step of path) {
            const loc = layer.getLocationData(step.to.x, step.to.y);
            if (!loc) continue;
            const point = layer.getPointEvent(step.to.x, step.to.y);
            if (point && point.size > 0) return true;
            if (loc.static && loc.static.tileEvent().get().size > 0) {
                return true;
            }
            for (const tile of loc.dynamics) {
                if (tile.tileEvent().get().size > 0) return true;
            }
        }
        return false;
    }

    private finderLayer(): IMapLayer | null {
        const floorId = this.state.hero.location.floorId;
        const map = floorId ? this.state.maps.getMap(floorId) : null;
        return map?.eventLayer ?? null;
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
        return this.resolvePath(target).path;
    }

    moveTo(target: ITileLocator): IPathfindingController | null {
        if (this.isMoving()) return this.queueAfterInterrupt(target, false);
        this.bindCurrentLayer();
        const resolved = this.resolvePath(target);
        return this.startResolved(target, resolved, false);
    }

    teleportTo(target: ITileLocator): IPathfindingController | null {
        if (this.isMoving()) return this.queueAfterInterrupt(target, true);
        this.bindCurrentLayer();
        const resolved = this.resolvePath(target);
        return this.startResolved(target, resolved, true);
    }

    private isMoving(): boolean {
        return this.active !== null && !this.active.controller.done;
    }

    private queueAfterInterrupt(
        target: ITileLocator,
        teleport: boolean
    ): IPathfindingController {
        const queued = new QueuedHeroPathfindingController(async () => {
            await this.system.interrupt();
            if (queued.isCancelled()) return null;
            this.bindCurrentLayer();
            const resolved = this.resolvePath(target);
            return this.startResolved(target, resolved, teleport);
        });
        this.active = queued;
        return queued;
    }

    private startResolved(
        target: ITileLocator,
        resolved: IResolvedPath,
        teleport: boolean
    ): IPathfindingController | null {
        if (resolved.path.length === 0) return null;
        const destination = resolved.adjacent ?? target;
        const result = teleport
            ? this.system.teleportTo(destination)
            : this.system.moveTo(destination);
        if (!result) {
            logger.error(65);
            return null;
        }
        const wrapped =
            resolved.adjacent && resolved.target
                ? {
                      controller: new HeroPathfindingController(
                          result.controller,
                          () => this.finishAdjacentTouch(resolved)
                      ),
                      path: result.path
                  }
                : result;
        this.active = wrapped;
        void wrapped.controller.onEnd.then(() => {
            if (this.active === wrapped) this.active = null;
        });
        return wrapped;
    }

    private resolvePath(target: ITileLocator): IResolvedPath {
        const path = this.system.getPath(target);
        if (path.length > 0) {
            return { path, adjacent: null, target: null };
        }
        const layer = this.finderLayer();
        if (!layer || !this.isNoPass(layer, target)) {
            return { path: [], adjacent: null, target: null };
        }

        const start = this.state.hero.location;
        const candidates: ReadonlyArray<Readonly<ITileLocator>> = [
            { x: target.x, y: target.y - 1 },
            { x: target.x + 1, y: target.y },
            { x: target.x, y: target.y + 1 },
            { x: target.x - 1, y: target.y }
        ];
        for (const adjacent of candidates) {
            if (!layer.inMap(adjacent.x, adjacent.y)) continue;
            const adjacentPath = this.finder.find(
                { x: start.x, y: start.y },
                adjacent
            );
            if (adjacentPath.length > 0) {
                return { path: adjacentPath, adjacent, target };
            }
        }
        return { path: [], adjacent: null, target: null };
    }

    private isNoPass(layer: IMapLayer, target: ITileLocator): boolean {
        const raw = layer.getLocationData(target.x, target.y)?.static?.raw();
        if (!raw) return false;
        return (
            !raw.eventPass || raw.pass.inPass === 0 || raw.pass.outPass === 0
        );
    }

    private directionTo(target: ITileLocator): FaceDirection {
        const hero = this.state.hero.location;
        if (target.x > hero.x) return FaceDirection.Right;
        if (target.x < hero.x) return FaceDirection.Left;
        if (target.y > hero.y) return FaceDirection.Down;
        return FaceDirection.Up;
    }

    private async finishAdjacentTouch(resolved: IResolvedPath): Promise<void> {
        const adjacent = resolved.adjacent!;
        const target = resolved.target!;
        const mover = this.state.hero.location.mover;
        mover.setFaceDir(this.directionTo(target));
        await this.dispatchTouch(adjacent, target);
    }

    private async dispatchTouch(
        heroLoc: Readonly<ITileLocator>,
        target: Readonly<ITileLocator>
    ): Promise<void> {
        const layer = this.finderLayer();
        if (!layer) return;
        const pointSources: IEventSource[] = [];
        const tileSources: IEventSource[] = [];
        const point = layer.getPointEvent(target.x, target.y);
        const loc = layer.getLocationData(target.x, target.y);
        if (point) {
            for (const [priority, id] of point) {
                pointSources.push({
                    priority,
                    id,
                    type: BlockEventType.PointEvent,
                    tile: null
                });
            }
        }
        if (loc) {
            if (loc.static) {
                for (const [priority, id] of loc.static.tileEvent().get()) {
                    tileSources.push({
                        priority,
                        id,
                        type: BlockEventType.TileEvent,
                        tile: loc.static
                    });
                }
            }
            for (const tile of loc.dynamics) {
                for (const [priority, id] of tile.tileEvent().get()) {
                    tileSources.push({
                        priority,
                        id,
                        type: BlockEventType.TileEvent,
                        tile
                    });
                }
            }
        }
        pointSources.sort((a, b) => b.priority - a.priority);
        tileSources.sort((a, b) => b.priority - a.priority);
        const invocations: IGameEventInvocation[] = [];
        for (const source of [...pointSources, ...tileSources]) {
            const env: IBlockEventEnv = {
                state: this.state,
                type: source.type,
                trigger: EventTrigger.OnTouch,
                heroLocator: heroLoc,
                triggerLocator: target,
                tile: source.tile,
                layer,
                map: layer.map
            };
            invocations.push({ id: source.id, env });
        }
        if (invocations.length === 0) return;
        const param: IBlockEventParam = { custom: {} };
        await this.state.eventSystem.executor.execute<void>(invocations, param);
    }

    interrupt(): Promise<void> {
        const active = this.active;
        this.active = null;
        if (!active) return this.system.interrupt();
        return active.controller.stop().then(() => this.system.interrupt());
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
