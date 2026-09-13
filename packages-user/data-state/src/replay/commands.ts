import {
    FaceDirection,
    IReplayStepHandler,
    IReplayCommand,
    ReplayParamValue
} from '@user/data-common';
import { EquipStatus } from '@user/data-base';
import { IStateSystem } from '@user/data-system';
import { logger } from '@motajs/common';

//#region 指令基类

export abstract class BaseReplayCommand implements IReplayCommand {
    /** 当前的状态对象 */
    protected readonly state: IStateSystem;

    /** 此录像步的字符串名称 */
    protected abstract readonly name: string;
    /** 预期的参数类型列表 */
    protected abstract readonly paramTypes: readonly string[];

    constructor(state: IStateSystem) {
        this.state = state;
    }

    /**
     * 判断指令参数是否符合预期
     * @param command 指令的名称
     * @param parameter 指令读取到的参数列表
     * @param expect 指令的预期参数列表
     */
    protected assertParameter(
        command: string,
        parameter: readonly ReplayParamValue[],
        expect: readonly string[]
    ) {
        if (parameter.length !== expect.length) {
            const e = expect.length.toString();
            const p = parameter.length.toString();
            logger.error(2001, command, e, p);
            return false;
        }

        return parameter.every((v, i) => {
            const type = typeof v;
            if (type === expect[i]) {
                return true;
            } else {
                logger.error(2002, command, i.toString(), expect[i], type);
                return false;
            }
        });
    }

    /**
     * 执行录像步，已进行必要的参数校验，内部仅包含录像逻辑，不必包含参数校验
     * @param step 当前录像步信息
     */
    abstract wrappedExecute(step: IReplayStepHandler): Promise<boolean>;

    execute(step: IReplayStepHandler): Promise<boolean> {
        if (!this.assertParameter(this.name, step.params, this.paramTypes)) {
            return Promise.resolve(false);
        } else {
            return this.wrappedExecute(step);
        }
    }
}

//#endregion

//#region 移动指令

export class ReplayMoveCommand
    extends BaseReplayCommand
    implements IReplayCommand
{
    protected readonly name: string = 'move';
    protected readonly paramTypes: readonly string[] = [];

    constructor(
        state: IStateSystem,
        private readonly direction: FaceDirection
    ) {
        super(state);
    }

    async wrappedExecute(): Promise<boolean> {
        // Parameter: []
        const mover = this.state.hero.location.mover;
        if (mover.moving) {
            logger.error(2003);
            return false;
        }
        mover.step(this.direction);

        return true;
    }

    async notExecuted(): Promise<boolean> {
        const mover = this.state.hero.location.mover;
        const controller = mover.start();
        if (!controller) {
            logger.error(2004);
            return false;
        }
        await controller.onEnd;
        return true;
    }
}

//#endregion

//#region 瞬移指令

export class ReplayTeleportCommand
    extends BaseReplayCommand
    implements IReplayCommand
{
    protected readonly name: string = 'teleport';
    protected readonly paramTypes: readonly string[] = ['number', 'number'];

    async wrappedExecute(step: IReplayStepHandler): Promise<boolean> {
        // Parameter: [int16 x, int16 y]
        const [x, y] = step.params as [number, number];
        const result = this.state.pathfinding.teleportTo({ x, y });
        if (!result) {
            logger.error(2005, x.toString(), y.toString());
            return false;
        }
        await result.controller.onEnd;
        return true;
    }
}

//#endregion

//#region 使用物品指令

export class ReplayUseItemCommand
    extends BaseReplayCommand
    implements IReplayCommand
{
    protected readonly name: string = 'use-item';
    protected readonly paramTypes: readonly string[] = ['number'];

    async wrappedExecute(step: IReplayStepHandler): Promise<boolean> {
        // Parameter: [int16 item]
        const item = step.params[0] as number;
        if (!this.state.hero.items.useItem(item)) {
            logger.error(2006, item.toString());
            return false;
        }
        return true;
    }
}

//#endregion

//#region 装备指令

export class ReplayEquipCommand
    extends BaseReplayCommand
    implements IReplayCommand
{
    protected readonly name: string = 'equip';
    protected readonly paramTypes: readonly string[] = [
        'number',
        'number',
        'boolean'
    ];

    async wrappedExecute(step: IReplayStepHandler): Promise<boolean> {
        // Parameter: [int16 uid, int8 slot, bool autoUnload]
        const [uid, slot, autoUnload] = step.params as [
            number,
            number,
            boolean
        ];
        const equipment = this.state.hero.equip;
        if (equipment.getEquipped(slot) === uid) {
            return true;
        }
        if (equipment.canEquipTo(uid, slot) === EquipStatus.CannotEquip) {
            logger.error(2007, uid.toString(), slot.toString());
            return false;
        }
        equipment.equip(uid, slot, autoUnload);
        if (equipment.getEquipped(slot) !== uid) {
            logger.error(2008, uid.toString(), slot.toString());
            return false;
        }
        return true;
    }
}

//#endregion

//#region 卸下装备指令

export class ReplayUnequipCommand
    extends BaseReplayCommand
    implements IReplayCommand
{
    protected readonly name: string = 'unequip';
    protected readonly paramTypes: readonly string[] = ['number'];

    async wrappedExecute(step: IReplayStepHandler): Promise<boolean> {
        // Parameter: [int8 slot]
        const slot = step.params[0] as number;
        const equipment = this.state.hero.equip;
        if (equipment.getEquipped(slot) === undefined) {
            logger.error(2009, slot.toString());
            return false;
        }
        equipment.unequip(slot);
        if (equipment.getEquipped(slot) !== undefined) {
            logger.error(2010, slot.toString());
            return false;
        }
        return true;
    }
}

//#endregion
