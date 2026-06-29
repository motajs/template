import { ITileLocator } from '@motajs/common';
import {
    FaceDirection,
    IFaceHandler,
    IMoverController,
    ObjectMoveStep,
    ObjectMover,
    ObjectMoveType,
    IDataCommon
} from '@user/data-common';
import {
    HeroMoveCode,
    IHeroHitAction,
    IHeroHitHandler,
    IHeroLocation,
    IHeroMover,
    IHeroMoverConfig,
    IPassCheckerHandler,
    ITerrainPassChecker
} from './types';
import { isNil } from 'lodash-es';

export class HeroMover<T extends IHeroLocation>
    extends ObjectMover<T>
    implements IHeroMover<T>
{
    readonly state: IDataCommon;

    /** 本次移动是否不记录进路线系统 */
    private noRoute: boolean = false;
    /** 本次移动是否忽略地形碰撞检测 */
    private ignoreTerrain: boolean = false;
    /** 本次移动是否在特定时机触发自动存档 */
    private autoSave: boolean = false;

    /** 地形通行判定器 */
    private terrainChecker: ITerrainPassChecker | null = null;
    /** 撞击行为对象 */
    private hitAction: IHeroHitAction | null = null;

    constructor(
        readonly tile: T,
        faceHandler: IFaceHandler<FaceDirection>
    ) {
        super(faceHandler);
        this.state = tile.state;
    }

    config(config: Readonly<IHeroMoverConfig>): this {
        if (!isNil(config.noRoute)) {
            this.noRoute = config.noRoute;
        }
        if (!isNil(config.ignoreTerrain)) {
            this.ignoreTerrain = config.ignoreTerrain;
        }
        if (!isNil(config.autoSave)) {
            this.autoSave = config.autoSave;
        }
        return this;
    }

    getConfig(): Readonly<IHeroMoverConfig> {
        return {
            noRoute: this.noRoute,
            ignoreTerrain: this.ignoreTerrain,
            autoSave: this.autoSave
        };
    }

    useTerrainChecker(checker: ITerrainPassChecker | null): void {
        this.terrainChecker = checker;
    }

    useHitAction(action: IHeroHitAction | null): void {
        this.hitAction = action;
    }

    /**
     * 创建通行性检查信息对象
     * @param curr 勇士所在位置
     * @param dir 勇士移动方向
     * @param floorId 当前楼层 id
     */
    private createPassHandler(
        curr: ITileLocator,
        dir: FaceDirection,
        floorId: string | undefined
    ): IPassCheckerHandler {
        const { x, y } = this.faceHandler.movement(dir);
        const nx = curr.x + x;
        const ny = curr.y + y;
        return {
            currLoc: curr,
            nextLoc: { x: nx, y: ny },
            direction: dir,
            floorId,
            face: this.faceHandler,
            state: this.state
        };
    }

    /**
     * 创建撞击行为信息对象
     * @param curr 勇士所在位置
     * @param dir 勇士移动方向
     * @param floorId 当前楼层 id
     */
    private createHitHandler(
        curr: ITileLocator,
        dir: FaceDirection,
        floorId: string | undefined
    ): IHeroHitHandler {
        const { x, y } = this.faceHandler.movement(dir);
        const nx = curr.x + x;
        const ny = curr.y + y;
        return {
            currLoc: curr,
            nextLoc: { x: nx, y: ny },
            direction: dir,
            floorId,
            state: this.state
        };
    }

    protected async onMoveStart(): Promise<void> {}

    protected async onMoveEnd(): Promise<void> {}

    protected async onStepStart(
        step: Readonly<ObjectMoveStep>,
        tile: IHeroLocation
    ): Promise<number> {
        if (!this.terrainChecker) return HeroMoveCode.CannotMove;

        const type = step.type;

        if (
            type === ObjectMoveType.Dir ||
            type === ObjectMoveType.DirFace ||
            type === ObjectMoveType.Special
        ) {
            const dir = this.moveDirection;
            const handler = this.createPassHandler(tile, dir, tile.floorId);
            const { x: nx, y: ny } = handler.nextLoc;
            const inBound = this.terrainChecker.inBound(nx, ny, tile.floorId);
            // 目标点不在地图内
            if (!inBound) return HeroMoveCode.CannotMove;

            if (this.ignoreTerrain) {
                return HeroMoveCode.Step;
            } else {
                const canPass = this.terrainChecker.canPass(handler);
                if (canPass) {
                    const hit = this.terrainChecker.shouldHit(handler);
                    if (hit) return HeroMoveCode.Hit;
                    else return HeroMoveCode.Step;
                } else {
                    return HeroMoveCode.CannotMove;
                }
            }
        }

        // 跳跃和瞬移仅需要进行边界判断
        if (type === ObjectMoveType.Jump || type === ObjectMoveType.Teleport) {
            const nx = step.rel ? tile.x + step.x : step.x;
            const ny = step.rel ? tile.y + step.y : step.y;
            if (this.ignoreTerrain) {
                return HeroMoveCode.Step;
            } else {
                if (this.terrainChecker.inBound(nx, ny, tile.floorId)) {
                    return HeroMoveCode.Step;
                } else {
                    return HeroMoveCode.Stop;
                }
            }
        }

        return HeroMoveCode.Step;
    }

    protected async onStepEnd(
        code: number,
        step: Readonly<ObjectMoveStep>,
        tile: IHeroLocation,
        controller: Readonly<IMoverController>
    ): Promise<ITileLocator> {
        const type = step.type;

        // 不能移动或停止
        if (code === HeroMoveCode.CannotMove || code === HeroMoveCode.Stop) {
            // 这里不能 await，因为其 Promise 会在当前步结束后兑现，如果 await 就会卡住
            controller.stop();
            return { x: tile.x, y: tile.y };
        }

        // 撞击时也使用当前位置，同时处理撞击行为
        if (code === HeroMoveCode.Hit) {
            // 执行撞击行为
            if (this.hitAction) {
                const dir = this.moveDirection;
                const handler = this.createHitHandler(tile, dir, tile.floorId);
                await this.hitAction.hit(handler);
            }
            // 这里同样不能 await
            controller.stop();
            return { x: tile.x, y: tile.y };
        }

        // 正常移动
        if (code === HeroMoveCode.Step) {
            if (
                type === ObjectMoveType.Teleport ||
                type === ObjectMoveType.Jump
            ) {
                // 瞬移行为
                if (step.rel) {
                    return { x: tile.x + step.x, y: tile.y + step.y };
                } else {
                    return { x: step.x, y: step.y };
                }
            } else if (
                type === ObjectMoveType.Dir ||
                type === ObjectMoveType.DirFace ||
                type === ObjectMoveType.Special
            ) {
                // 移动行为
                const { x, y } = this.faceHandler.movement(this.moveDirection);
                const nx = tile.x + x;
                const ny = tile.y + y;
                return { x: nx, y: ny };
            } else {
                // 其他行为
                return { x: tile.x, y: tile.y };
            }
        }

        return { x: tile.x, y: tile.y };
    }
}
