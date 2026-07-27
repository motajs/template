import { IFacedTileLocator, logger } from '@motajs/common';
import {
    IHeroChangeFloorInfo,
    IHeroState,
    IMapLayer,
    IMapState,
    IStateBase
} from '@user/data-base';
import {
    ChangeFloorPos,
    ChangeFloorTarget,
    ChangeFloorType,
    FaceDirection,
    IChangeFloorData,
    IHeroAttr
} from '@user/data-common';
import {
    BaseTrigger,
    ITrigger,
    ITriggerCollection,
    ITriggerHandler,
    TriggerCollection
} from '@user/data-system';
import { isNil } from 'lodash-es';

export const enum TriggerType {
    /** 楼层切换触发器 */
    ChangeFloor
}

export class ChangeFloorTrigger extends BaseTrigger implements ITrigger {
    readonly type: number = TriggerType.ChangeFloor;
    readonly priority: number = 10;

    constructor(
        state: IStateBase,
        readonly maps: IMapState,
        readonly hero: IHeroState<IHeroAttr>
    ) {
        super(state);
    }

    /**
     * 获取楼层切换的目标楼层
     * @param data 楼层切换数据
     */
    private getFloorTarget(data: IChangeFloorData): string | undefined {
        if (data.floorType === ChangeFloorType.Specified) {
            if (isNil(data.targetFloor)) {
                logger.warn(165);
                return void 0;
            }
            return data.targetFloor;
        } else {
            if (isNil(data.relatedFloor)) {
                logger.warn(166);
                return void 0;
            }
            const curr = this.hero.location.floorId;
            if (isNil(curr)) {
                logger.warn(167);
                return void 0;
            }
            const index = this.maps.maps.indexOf(curr);
            if (index === -1) {
                logger.warn(168);
                return void 0;
            }
            if (data.relatedFloor === ChangeFloorTarget.Next) {
                const next = this.maps.maps[index + 1];
                if (isNil(next)) {
                    logger.warn(169);
                    return void 0;
                }
                return next;
            } else {
                const next = this.maps.maps[index - 1];
                if (isNil(next)) {
                    logger.warn(169);
                    return void 0;
                }
            }
        }
    }

    private getPosTarget(
        data: IChangeFloorData,
        layer: IMapLayer
    ): IFacedTileLocator | undefined {
        if (data.posType === ChangeFloorType.Specified) {
            if (!data.targetPos) {
                logger.warn(165);
                return void 0;
            }
            return data.targetPos;
        } else {
            if (isNil(data.relatedPos)) {
                logger.warn(166);
                return void 0;
            }
            const { x, y, floorId } = this.hero.location;
            if (isNil(floorId)) {
                logger.warn(167);
                return void 0;
            }
            const { width, height } = layer;
            switch (data.relatedPos) {
                case ChangeFloorPos.Stand:
                    return {
                        direction: FaceDirection.Unknown,
                        x,
                        y
                    };
                case ChangeFloorPos.SymmetryX:
                    return {
                        direction: FaceDirection.Unknown,
                        x: width - x - 1,
                        y
                    };
                case ChangeFloorPos.SymmetryY:
                    return {
                        direction: FaceDirection.Unknown,
                        x,
                        y: height - y - 1
                    };
                case ChangeFloorPos.CentralSymmetry:
                    return {
                        direction: FaceDirection.Unknown,
                        x: width - x - 1,
                        y: height - y - 1
                    };
            }
        }
    }

    /**
     * 触发楼层切换
     * @param handler 触发信息对象
     */
    private async trigger(handler: ITriggerHandler): Promise<void> {
        if (!handler.layer || !handler.locator || !handler.mapLayer) {
            logger.warn(164);
            return;
        }
        const { x, y } = handler.locator;
        const data = handler.mapLayer.getLocationData(x, y);
        if (!data || !data.block.changeFloor) return;
        const floor = this.getFloorTarget(data.block.changeFloor);
        const pos = this.getPosTarget(data.block.changeFloor, handler.mapLayer);
        if (isNil(floor) || isNil(pos)) return;
        const hero = handler.state.hero;
        const isUnknown = pos.direction === FaceDirection.Unknown;
        const defaults = hero.location.mover.faceDirection;
        const info: IHeroChangeFloorInfo = {
            target: floor,
            x: pos.x,
            y: pos.y,
            face: isUnknown ? defaults : pos.direction
        };
        return handler.state.hero.changeFloor(info);
    }

    collection(): ITriggerCollection {
        return new TriggerCollection([this]);
    }

    onEnter(handler: ITriggerHandler): Promise<void> {
        return this.trigger(handler);
    }

    onHit(handler: ITriggerHandler): Promise<void> {
        return this.trigger(handler);
    }

    onLeave(): Promise<void> {
        return Promise.resolve();
    }

    onCannotEnter(): Promise<void> {
        return Promise.resolve();
    }
}
