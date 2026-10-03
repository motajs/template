import {
    FaceDirection,
    IReplayStepHandler,
    IReplayCommand,
    ReplayParamValue,
    ReplayCommandResult,
    ReplayCommandType
} from '@user/data-common';
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

    abstract readonly type: ReplayCommandType;

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
            return ReplayCommandResult.Failed;
        }

        return parameter.every((v, i) => {
            const type = typeof v;
            if (type === expect[i]) {
                return ReplayCommandResult.Success;
            } else {
                logger.error(2002, command, i.toString(), expect[i], type);
                return ReplayCommandResult.Failed;
            }
        });
    }

    /**
     * 执行录像步，已进行必要的参数校验，内部仅包含录像逻辑，不必包含参数校验
     * @param step 当前录像步信息
     */
    abstract wrappedExecute(
        step: IReplayStepHandler
    ): Promise<ReplayCommandResult>;

    execute(step: IReplayStepHandler): Promise<ReplayCommandResult> {
        if (!this.assertParameter(this.name, step.params, this.paramTypes)) {
            return Promise.resolve(ReplayCommandResult.Failed);
        } else {
            return this.wrappedExecute(step);
        }
    }
}

//#endregion

//#region 移动指令

export class ReplayMove extends BaseReplayCommand implements IReplayCommand {
    readonly type: ReplayCommandType = ReplayCommandType.Active;

    protected readonly name: string = 'move';
    protected readonly paramTypes: readonly string[] = [];

    constructor(
        state: IStateSystem,
        private readonly direction: FaceDirection
    ) {
        super(state);
    }

    async wrappedExecute(): Promise<ReplayCommandResult> {
        // Parameter: []
        const mover = this.state.hero.location.mover;
        if (mover.moving) {
            logger.error(2003);
            return ReplayCommandResult.Failed;
        }
        mover.step(this.direction);

        return ReplayCommandResult.Success;
    }

    async finalize(): Promise<ReplayCommandResult> {
        const mover = this.state.hero.location.mover;
        const controller = mover.start();
        if (!controller) {
            logger.error(2004);
            return ReplayCommandResult.Failed;
        }
        await controller.onEnd;
        return ReplayCommandResult.Success;
    }
}

//#endregion

//#region 瞬移指令

export class ReplayTeleport
    extends BaseReplayCommand
    implements IReplayCommand
{
    readonly type: ReplayCommandType = ReplayCommandType.Active;

    protected readonly name: string = 'teleport';
    protected readonly paramTypes: readonly string[] = ['number', 'number'];

    async wrappedExecute(
        step: IReplayStepHandler
    ): Promise<ReplayCommandResult> {
        // Parameter: [int16 x, int16 y]
        const [x, y] = step.params as [number, number];
        const result = this.state.pathfinding.teleportTo({ x, y });
        if (!result) {
            logger.error(2005, x.toString(), y.toString());
            return ReplayCommandResult.Failed;
        }
        await result.controller.onEnd;
        return ReplayCommandResult.Success;
    }
}

//#endregion

//#region 使用物品指令

export class ReplayUseItem extends BaseReplayCommand implements IReplayCommand {
    readonly type: ReplayCommandType = ReplayCommandType.Active;

    protected readonly name: string = 'use-item';
    protected readonly paramTypes: readonly string[] = ['number'];

    async wrappedExecute(
        step: IReplayStepHandler
    ): Promise<ReplayCommandResult> {
        // Parameter: [int16 item]
        const item = step.params[0] as number;
        if (!this.state.hero.items.useItem(item)) {
            logger.error(2006, item.toString());
            return ReplayCommandResult.Failed;
        }
        return ReplayCommandResult.Success;
    }
}

//#endregion

//#region 装备指令

export class ReplayEquip extends BaseReplayCommand implements IReplayCommand {
    readonly type: ReplayCommandType = ReplayCommandType.Active;

    protected readonly name: string = 'equip';
    protected readonly paramTypes: readonly string[] = [
        'number',
        'number',
        'ReplayCommandResult'
    ];

    async wrappedExecute(
        step: IReplayStepHandler
    ): Promise<ReplayCommandResult> {
        // Parameter: [int16 uid, int8 slot, bool autoUnload]
        const [uid, slot, autoUnload] = step.params as [
            number,
            number,
            boolean
        ];
        const equipment = this.state.hero.equip;
        equipment.equip(uid, slot, autoUnload);
        if (equipment.getEquipped(slot) !== uid) {
            logger.error(2007, uid.toString(), slot.toString());
            return ReplayCommandResult.Failed;
        }
        return ReplayCommandResult.Success;
    }
}

//#endregion

//#region 卸下装备指令

export class ReplayUnequip extends BaseReplayCommand implements IReplayCommand {
    readonly type: ReplayCommandType = ReplayCommandType.Active;

    protected readonly name: string = 'unequip';
    protected readonly paramTypes: readonly string[] = ['number'];

    async wrappedExecute(
        step: IReplayStepHandler
    ): Promise<ReplayCommandResult> {
        // Parameter: [int8 slot]
        const slot = step.params[0] as number;
        const equipment = this.state.hero.equip;
        equipment.unequip(slot);
        if (equipment.getEquipped(slot) !== void 0) {
            logger.error(2008, slot.toString());
            return ReplayCommandResult.Failed;
        }
        return ReplayCommandResult.Success;
    }
}

//#endregion
