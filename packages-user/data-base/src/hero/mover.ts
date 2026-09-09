import { ITileLocator, logger } from '@motajs/common';
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
    IHeroLocation,
    IHeroMover,
    IHeroMoverConfig,
    IHeroMoveTopHandler,
    IHeroMoveTopImpl
} from './types';
import { isNil } from 'lodash-es';

export class HeroMover<T extends IHeroLocation>
    extends ObjectMover<T>
    implements IHeroMover<T>
{
    readonly state: IDataCommon;

    /** 是否不记录进路线系统 */
    private noRoute: boolean = false;
    /** 是否忽略地形碰撞检测 */
    private ignoreTerrain: boolean = false;
    /** 是否在特定时机触发自动存档 */
    private autoSave: boolean = false;
    /** 是否允许到达地图外 */
    private allowOutBound: boolean = false;

    /** 勇士移动顶层实现对象 */
    private topImpl: IHeroMoveTopImpl | null = null;

    constructor(
        readonly tile: T,
        faceHandler: IFaceHandler<FaceDirection>
    ) {
        super(faceHandler, tile.getCurrentFaceDirection());
        this.state = tile.state;
    }

    config(config: Partial<IHeroMoverConfig>): this {
        if (!isNil(config.noRoute)) {
            this.noRoute = config.noRoute;
        }
        if (!isNil(config.ignoreTerrain)) {
            this.ignoreTerrain = config.ignoreTerrain;
        }
        if (!isNil(config.autoSave)) {
            this.autoSave = config.autoSave;
        }
        if (!isNil(config.allowOutBound)) {
            this.allowOutBound = config.allowOutBound;
        }
        return this;
    }

    getConfig(): Readonly<IHeroMoverConfig> {
        return {
            noRoute: this.noRoute,
            ignoreTerrain: this.ignoreTerrain,
            autoSave: this.autoSave,
            allowOutBound: this.allowOutBound
        };
    }

    useTopImplementation(impl: IHeroMoveTopImpl | null): void {
        this.topImpl = impl;
    }

    /**
     * 创建顶层信息对象
     * @param curr 勇士所在位置
     * @param dir 勇士移动方向
     * @param floorId 当前楼层 id
     */
    private createHandler(
        curr: ITileLocator,
        step: Readonly<ObjectMoveStep>,
        floorId: string | undefined
    ): IHeroMoveTopHandler {
        switch (step.type) {
            case ObjectMoveType.Dir:
            case ObjectMoveType.DirFace:
            case ObjectMoveType.Special: {
                const { x, y } = this.faceHandler.movement(this.moveDirection);
                const nx = curr.x + x;
                const ny = curr.y + y;
                return {
                    currLoc: { x: curr.x, y: curr.y },
                    nextLoc: { x: nx, y: ny },
                    direction: this.moveDirection,
                    floorId,
                    face: this.faceHandler,
                    state: this.state
                };
            }
            case ObjectMoveType.Jump:
            case ObjectMoveType.Teleport: {
                const nx = step.rel ? curr.x + step.x : step.x;
                const ny = step.rel ? curr.y + step.y : step.y;
                return {
                    currLoc: { x: curr.x, y: curr.y },
                    nextLoc: { x: nx, y: ny },
                    direction: this.moveDirection,
                    floorId,
                    face: this.faceHandler,
                    state: this.state
                };
            }
            case ObjectMoveType.AnimDir:
            case ObjectMoveType.Face:
            case ObjectMoveType.Speed: {
                return {
                    currLoc: { x: curr.x, y: curr.y },
                    nextLoc: { x: curr.x, y: curr.y },
                    direction: this.moveDirection,
                    floorId,
                    face: this.faceHandler,
                    state: this.state
                };
            }
        }
    }

    /**
     * 根据当前位置及要移动至的位置创建信息对象
     * @param curr 当前位置
     * @param next 移动至的位置
     * @param floorId 楼层 id
     */
    private createHandlerFromLoc(
        curr: ITileLocator,
        next: ITileLocator,
        floorId: string | undefined
    ): IHeroMoveTopHandler {
        return {
            currLoc: { x: curr.x, y: curr.y },
            nextLoc: { x: next.x, y: next.y },
            direction: this.moveDirection,
            floorId,
            face: this.faceHandler,
            state: this.state
        };
    }

    protected async onMoveStart(): Promise<void> {
        if (!this.topImpl) {
            logger.warn(144);
        }
    }

    protected async onMoveEnd(): Promise<void> {}

    protected async onStepStart(
        step: Readonly<ObjectMoveStep>,
        tile: IHeroLocation
    ): Promise<number> {
        if (!this.topImpl) return HeroMoveCode.Stop;

        const type = step.type;
        const handler = this.createHandler(tile, step, tile.floorId);

        // 边界判断
        const { x: nx, y: ny } = handler.nextLoc;
        const inBound = this.topImpl.inBound(nx, ny, handler.floorId);
        if (!this.allowOutBound && !inBound) return HeroMoveCode.CannotMove;

        // 移动步判断
        if (
            type === ObjectMoveType.Dir ||
            type === ObjectMoveType.DirFace ||
            type === ObjectMoveType.Special
        ) {
            if (this.ignoreTerrain) {
                return HeroMoveCode.Step;
            } else {
                const canPass = this.topImpl.canPass(handler);
                if (canPass) {
                    const hit = this.topImpl.shouldHit(handler);
                    if (hit) return HeroMoveCode.Hit;
                    else return HeroMoveCode.Step;
                } else {
                    return HeroMoveCode.CannotMove;
                }
            }
        }

        // 跳跃和瞬移
        if (type === ObjectMoveType.Jump || type === ObjectMoveType.Teleport) {
            if (this.ignoreTerrain) {
                return HeroMoveCode.Step;
            } else {
                if (inBound) {
                    return HeroMoveCode.Step;
                } else {
                    return HeroMoveCode.Stop;
                }
            }
        }

        // 其他的一律可以直接执行
        return HeroMoveCode.Step;
    }

    protected async onStepEnd(
        code: number,
        step: Readonly<ObjectMoveStep>,
        tile: IHeroLocation,
        controller: Readonly<IMoverController>
    ): Promise<ITileLocator> {
        if (!this.topImpl) return { x: tile.x, y: tile.y };

        const trigger = !this.ignoreTerrain;

        const handler = this.createHandler(tile, step, tile.floorId);

        if (code === HeroMoveCode.CannotMove) {
            if (trigger) {
                await this.topImpl.cannotEnter(handler);
            }
            // 这里不能 await，因为其 Promise 会在当前步结束后兑现，如果 await 就会卡住
            controller.stop();
            return { x: tile.x, y: tile.y };
        }

        if (code === HeroMoveCode.Stop) {
            controller.stop();
            return { x: tile.x, y: tile.y };
        }

        if (code === HeroMoveCode.Hit) {
            if (trigger) {
                await this.topImpl.hit(handler);
            }
            controller.stop();
            return { x: tile.x, y: tile.y };
        }

        if (code === HeroMoveCode.Step) {
            return handler.nextLoc;
        }

        return { x: tile.x, y: tile.y };
    }

    protected async onStepSettled(
        before: ITileLocator,
        curr: ITileLocator,
        tile: T
    ): Promise<void> {
        if (!this.topImpl) return;

        const handler = this.createHandlerFromLoc(before, curr, tile.floorId);

        const trigger = !this.ignoreTerrain;

        if (trigger) {
            await this.topImpl.leave(handler);
            await this.topImpl.enter(handler);
        }
    }
}
