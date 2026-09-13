import {
    FaceDirection,
    IReplayStepHandler,
    IReplaySystem,
    IReplayCommand,
    ReplayParamValue
} from '@user/data-common';
import { EquipStatus } from '@user/data-base';
import {
    IReplayCommandItem,
    IReplayCommandRegistry,
    IReplayCommandState,
    ReplayCommandCode,
    REPLAY_COMMAND_ORDER
} from './types';
import { IStateSystem } from '@user/data-system';
import { logger } from '@motajs/common';

/**
 * 判断未知值是否为有限数值
 */
function isNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

/**
 * 判断未知值是否为可用的道具编号或道具 id
 */
function isItem(value: unknown): value is number | string {
    return isNumber(value) || typeof value === 'string';
}

/**
 * 判断未知值是否为布尔值
 */
function isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
}

/**
 * 判断未知值是否为可用的装备槽位编号或槽位 id
 */
function isSlot(value: unknown): value is number | string {
    return isNumber(value) || typeof value === 'string';
}

/**
 * 将槽位编号或槽位 id 解析为装备槽位索引
 */
function resolveSlot(
    state: IReplayCommandState,
    slot: number | string
): number | null {
    if (typeof slot === 'number') {
        return Number.isInteger(slot) && slot >= 0 ? slot : null;
    }
    const index = state.hero.equip.slots.indexOf(slot);
    return index < 0 ? null : index;
}

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

export class ReplayUseItemCommand implements IReplayCommand {
    constructor(private readonly state: IStateSystem) {}

    /**
     * 使用指定道具并返回现有状态接口的结果
     */
    private useItem(item: number | string): boolean {
        return this.state.hero.items.useItem(item);
    }

    /**
     * 校验录像步参数并执行一次道具使用
     */
    execute(step: IReplayStepHandler): Promise<boolean> {
        if (step.params.length !== 1) return Promise.resolve(false);
        const item = step.params[0];
        if (!isItem(item)) return Promise.resolve(false);
        return Promise.resolve(this.useItem(item));
    }
}

//#endregion

//#region 装备指令

export class ReplayEquipCommand implements IReplayCommand {
    constructor(private readonly state: IStateSystem) {}

    /**
     * 将指定装备穿到目标槽位并返回是否穿装成功
     */
    private equip(
        uid: number,
        slot: number | string,
        autoUnload: boolean | undefined
    ): boolean {
        const equipment = this.state.hero.equip;
        const slotIndex = resolveSlot(this.state, slot);
        if (slotIndex === null) return false;
        if (equipment.getEquipped(slotIndex) === uid) return true;
        if (equipment.canEquipTo(uid, slot) === EquipStatus.CannotEquip) {
            return false;
        }
        equipment.equip(uid, slot, autoUnload);
        return equipment.getEquipped(slotIndex) === uid;
    }

    /**
     * 校验录像步参数并执行一次装备穿装
     */
    execute(step: IReplayStepHandler): Promise<boolean> {
        if (step.params.length < 2 || step.params.length > 3) {
            return Promise.resolve(false);
        }
        const uid = step.params[0];
        const slot = step.params[1];
        const autoUnload = step.params[2];
        if (!isNumber(uid) || !Number.isInteger(uid) || !isSlot(slot)) {
            return Promise.resolve(false);
        }
        if (autoUnload !== undefined && !isBoolean(autoUnload)) {
            return Promise.resolve(false);
        }
        const slotIndex = resolveSlot(this.state, slot);
        if (slotIndex === null) return Promise.resolve(false);
        return Promise.resolve(this.equip(uid, slot, autoUnload));
    }
}

//#endregion

//#region 卸下装备指令

export class ReplayUnequipCommand implements IReplayCommand {
    constructor(private readonly state: IStateSystem) {}

    /**
     * 卸下指定槽位的装备并返回是否卸下成功
     */
    private unequip(slot: number): boolean {
        const equipment = this.state.hero.equip;
        if (equipment.getEquipped(slot) === undefined) return false;
        equipment.unequip(slot);
        return equipment.getEquipped(slot) === undefined;
    }

    /**
     * 校验录像步参数并执行一次装备卸下
     */
    execute(step: IReplayStepHandler): Promise<boolean> {
        if (step.params.length !== 1) return Promise.resolve(false);
        const slot = step.params[0];
        if (!isNumber(slot) || !Number.isInteger(slot) || slot < 0) {
            return Promise.resolve(false);
        }
        return Promise.resolve(this.unequip(slot));
    }
}

//#endregion

/**
 * 创建按稳定 enum 顺序排列的默认 replay command items
 */
export function createReplayCommandItems(
    state: IStateSystem
): ReadonlyArray<IReplayCommandItem> {
    return [
        {
            code: ReplayCommandCode.Up,
            command: new ReplayMoveCommand(state, FaceDirection.Up)
        },
        {
            code: ReplayCommandCode.Right,
            command: new ReplayMoveCommand(state, FaceDirection.Right)
        },
        {
            code: ReplayCommandCode.Down,
            command: new ReplayMoveCommand(state, FaceDirection.Down)
        },
        {
            code: ReplayCommandCode.Left,
            command: new ReplayMoveCommand(state, FaceDirection.Left)
        },
        {
            code: ReplayCommandCode.AutoPathfindToPoint,
            command: new ReplayTeleportCommand(state)
        },
        {
            code: ReplayCommandCode.UseItem,
            command: new ReplayUseItemCommand(state)
        },
        {
            code: ReplayCommandCode.Equip,
            command: new ReplayEquipCommand(state)
        },
        {
            code: ReplayCommandCode.Unequip,
            command: new ReplayUnequipCommand(state)
        }
    ];
}

/**
 * 按 top-level stable code 注册 command，并在注册前拒绝重复项
 */
export function registerReplayCommandItems(
    replay: IReplaySystem | IReplayCommandRegistry,
    items: ReadonlyArray<IReplayCommandItem>
): void {
    if (items.length !== REPLAY_COMMAND_ORDER.length) {
        throw new Error(
            'Replay command registry must contain exactly eight items'
        );
    }
    const codes = new Set<number>();
    for (let index = 0; index < items.length; index++) {
        const item = items[index];
        if (codes.has(item.code)) {
            throw new Error(`Duplicate replay command code: ${item.code}`);
        }
        if (item.code !== REPLAY_COMMAND_ORDER[index]) {
            throw new Error(`Replay command order mismatch at index ${index}`);
        }
        if (replay.getCommand(item.code)) {
            throw new Error(
                `Replay command code already registered: ${item.code}`
            );
        }
        codes.add(item.code);
    }
    for (const item of items) {
        replay.registerCommand(item.code, item.command);
    }
}
