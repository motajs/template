import {
    FaceDirection,
    IReplayStepHandler,
    IReplaySystem,
    IReplayCommand
} from '@user/data-common';
import { EquipStatus } from '@user/data-base';
import {
    IReplayCommandItem,
    IReplayCommandRegistry,
    IReplayCommandState,
    ReplayCommandCode,
    REPLAY_COMMAND_ORDER
} from './types';

function isNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

function isItem(value: unknown): value is number | string {
    return isNumber(value) || typeof value === 'string';
}

function isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
}

function isSlot(value: unknown): value is number | string {
    return isNumber(value) || typeof value === 'string';
}

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

class ReplayDirectionCommand implements IReplayCommand {
    constructor(
        private readonly state: IReplayCommandState,
        private readonly direction: FaceDirection
    ) {}

    private async moveHero(): Promise<boolean> {
        try {
            const mover = this.state.hero.location.mover;
            if (mover.moving) return false;
            mover.step(this.direction);
            const controller = mover.start();
            if (!controller) return false;
            await controller.onEnd;
            return true;
        } catch {
            return false;
        }
    }

    execute(step: IReplayStepHandler): Promise<boolean> {
        if (step.params.length !== 0) return Promise.resolve(false);
        return this.moveHero();
    }
}

class ReplayAutoPathfindCommand implements IReplayCommand {
    constructor(private readonly state: IReplayCommandState) {}

    private async moveToPoint(x: number, y: number): Promise<boolean> {
        try {
            const result = this.state.pathfinding.moveTo({ x, y });
            if (!result) return false;
            await result.controller.onEnd;
            return true;
        } catch {
            return false;
        }
    }

    execute(step: IReplayStepHandler): Promise<boolean> {
        if (step.params.length !== 2) return Promise.resolve(false);
        const x = step.params[0];
        const y = step.params[1];
        if (!isNumber(x) || !isNumber(y)) return Promise.resolve(false);
        return this.moveToPoint(x, y);
    }
}

class ReplayUseItemCommand implements IReplayCommand {
    constructor(private readonly state: IReplayCommandState) {}

    private useItem(item: number | string): boolean {
        return this.state.hero.items.useItem(item);
    }

    execute(step: IReplayStepHandler): Promise<boolean> {
        if (step.params.length !== 1) return Promise.resolve(false);
        const item = step.params[0];
        if (!isItem(item)) return Promise.resolve(false);
        return Promise.resolve(this.useItem(item));
    }
}

class ReplayEquipCommand implements IReplayCommand {
    constructor(private readonly state: IReplayCommandState) {}

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

class ReplayUnequipCommand implements IReplayCommand {
    constructor(private readonly state: IReplayCommandState) {}

    private unequip(slot: number): boolean {
        const equipment = this.state.hero.equip;
        if (equipment.getEquipped(slot) === undefined) return false;
        equipment.unequip(slot);
        return equipment.getEquipped(slot) === undefined;
    }

    execute(step: IReplayStepHandler): Promise<boolean> {
        if (step.params.length !== 1) return Promise.resolve(false);
        const slot = step.params[0];
        if (!isNumber(slot) || !Number.isInteger(slot) || slot < 0) {
            return Promise.resolve(false);
        }
        return Promise.resolve(this.unequip(slot));
    }
}

/** 创建按稳定 enum 顺序排列的默认 replay command items */
export function createReplayCommandItems(
    state: IReplayCommandState
): ReadonlyArray<IReplayCommandItem> {
    return [
        {
            code: ReplayCommandCode.Up,
            command: new ReplayDirectionCommand(state, FaceDirection.Up)
        },
        {
            code: ReplayCommandCode.Right,
            command: new ReplayDirectionCommand(state, FaceDirection.Right)
        },
        {
            code: ReplayCommandCode.Down,
            command: new ReplayDirectionCommand(state, FaceDirection.Down)
        },
        {
            code: ReplayCommandCode.Left,
            command: new ReplayDirectionCommand(state, FaceDirection.Left)
        },
        {
            code: ReplayCommandCode.AutoPathfindToPoint,
            command: new ReplayAutoPathfindCommand(state)
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

/** 按 top-level stable code 注册 command，并在注册前拒绝重复项 */
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
