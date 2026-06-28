import { ITileLocator } from '@motajs/common';
import {
    FaceDirection,
    getFaceMovement,
    IFaceHandler,
    IMoverController,
    ObjectMoveStep,
    ObjectMover,
    ObjectMoveStepType
} from '@user/data-common';
import {
    HeroMoveCode,
    IHeroLocation,
    IHeroMover,
    IHeroMoverConfig,
    ITerrainPassChecker
} from './types';
import { isNil } from 'lodash-es';

export class HeroMover<T extends IHeroLocation>
    extends ObjectMover<T>
    implements IHeroMover<T>
{
    /** 本次移动是否不记录进路线系统 */
    private noRoute: boolean = false;
    /** 本次移动是否忽略地形碰撞检测 */
    private ignoreTerrain: boolean = false;
    /** 本次移动是否在特定时机触发自动存档 */
    private autoSave: boolean = false;
    /** 自定义地形通行判定器 */
    private terrainChecker: ITerrainPassChecker | null = null;

    constructor(
        readonly tile: T,
        faceHandler: IFaceHandler<FaceDirection>
    ) {
        super(faceHandler);
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

    protected async onMoveStart(
        _tile: IHeroLocation,
        _controller: Readonly<IMoverController>
    ): Promise<void> {}

    protected async onMoveEnd(
        _tile: IHeroLocation,
        _controller: Readonly<IMoverController>
    ): Promise<void> {}

    protected async onStepStart(
        step: ObjectMoveStep,
        tile: IHeroLocation,
        controller: Readonly<IMoverController>
    ): Promise<number> {
        const type = step.type;

        if (
            type !== ObjectMoveStepType.Dir &&
            type !== ObjectMoveStepType.DirFace &&
            type !== ObjectMoveStepType.Special
        ) {
            return HeroMoveCode.Step;
        }

        if (!this.ignoreTerrain) {
            const result = this.checkTerrain(tile, controller);
            if (result !== HeroMoveCode.Step) return result;
        }

        if (this.autoSave) {
            // TODO: 检查当前步是否需要触发自动存档（如进入/离开地图伤害区域）
        }

        return HeroMoveCode.Step;
    }

    protected async onStepEnd(
        code: number,
        step: ObjectMoveStep,
        tile: IHeroLocation,
        controller: Readonly<IMoverController>
    ): Promise<ITileLocator> {
        const type = step.type;

        const isMovementStep =
            type === ObjectMoveStepType.Dir ||
            type === ObjectMoveStepType.DirFace ||
            type === ObjectMoveStepType.Special;

        if (
            !isMovementStep &&
            type !== ObjectMoveStepType.Teleport &&
            type !== ObjectMoveStepType.Jump
        ) {
            return { x: tile.x, y: tile.y };
        }

        if (code === HeroMoveCode.CannotMove || code === HeroMoveCode.Hit) {
            void controller.stop();
            // TODO: 处理撞击图块逻辑
            return { x: tile.x, y: tile.y };
        }

        if (code === HeroMoveCode.Stop) {
            void controller.stop();
            // TODO: 清除自动寻路
            return { x: tile.x, y: tile.y };
        }

        if (type === ObjectMoveStepType.Teleport) {
            return this.calcPos(tile, step.x, step.y, step.rel);
        }

        if (type === ObjectMoveStepType.Jump) {
            return this.calcPos(tile, step.x, step.y, step.rel);
        }

        const offset = getFaceMovement(this.moveDirection);
        const nx = tile.x + offset.x;
        const ny = tile.y + offset.y;

        // TODO: 路线记录
        // TODO: 中毒伤害处理
        // TODO: 步数累计

        return { x: nx, y: ny };
    }

    /**
     * 计算传送 / 跳跃的目标坐标
     * @param tile 当前所在图块
     * @param x 目标横坐标或偏移量
     * @param y 目标纵坐标或偏移量
     * @param rel 是否使用相对模式
     */
    private calcPos(
        tile: IHeroLocation,
        x: number,
        y: number,
        rel: boolean
    ): ITileLocator {
        if (rel) {
            return { x: tile.x + x, y: tile.y + y };
        }
        return { x, y };
    }

    /**
     * 检测当前移动方向前方一格的地形是否可通行
     */
    private checkTerrain(
        tile: IHeroLocation,
        _controller: Readonly<IMoverController>
    ): HeroMoveCode {
        if (!this.terrainChecker) return HeroMoveCode.CannotMove;
        const locator: ITileLocator = { x: tile.x, y: tile.y };
        const pass = this.terrainChecker.canPass(
            locator,
            this.moveDirection,
            tile.floorId
        );
        return pass ? HeroMoveCode.Step : HeroMoveCode.CannotMove;
    }
}
