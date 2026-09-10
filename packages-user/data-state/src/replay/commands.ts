import {
    FaceDirection,
    IReplayStepHandler,
    IReplaySystem
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

async function moveHero(
    state: IReplayCommandState,
    direction: FaceDirection,
    step: IReplayStepHandler
): Promise<boolean> {
    if (step.params.length !== 0) return false;
    const mover = state.hero.location.mover;
    if (mover.moving) return false;
    mover.step(direction);
    const controller = mover.start();
    if (!controller) return false;
    await controller.onEnd;
    return true;
}

async function moveToPoint(
    state: IReplayCommandState,
    step: IReplayStepHandler
): Promise<boolean> {
    if (step.params.length !== 2) return false;
    const x = step.params[0];
    const y = step.params[1];
    if (!isNumber(x) || !isNumber(y)) return false;
    const result = state.pathfinding.moveTo({ x, y });
    if (!result) return false;
    await result.controller.onEnd;
    return true;
}

function useItem(
    state: IReplayCommandState,
    step: IReplayStepHandler
): Promise<boolean> {
    if (step.params.length !== 1) return Promise.resolve(false);
    const item = step.params[0];
    if (!isItem(item)) return Promise.resolve(false);
    return Promise.resolve(state.hero.items.useItem(item));
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

function equip(
    state: IReplayCommandState,
    step: IReplayStepHandler
): Promise<boolean> {
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
    const slotIndex = resolveSlot(state, slot);
    if (slotIndex === null) return Promise.resolve(false);
    if (state.hero.equip.getEquipped(slotIndex) === uid) {
        return Promise.resolve(true);
    }
    if (state.hero.equip.canEquipTo(uid, slot) === EquipStatus.CannotEquip) {
        return Promise.resolve(false);
    }
    state.hero.equip.equip(uid, slot, autoUnload);
    return Promise.resolve(state.hero.equip.getEquipped(slotIndex) === uid);
}

function unequip(
    state: IReplayCommandState,
    step: IReplayStepHandler
): Promise<boolean> {
    if (step.params.length !== 1) return Promise.resolve(false);
    const slot = step.params[0];
    if (!isNumber(slot) || !Number.isInteger(slot) || slot < 0) {
        return Promise.resolve(false);
    }
    if (state.hero.equip.getEquipped(slot) === undefined) {
        return Promise.resolve(false);
    }
    state.hero.equip.unequip(slot);
    return Promise.resolve(state.hero.equip.getEquipped(slot) === undefined);
}

function createMoveCommand(
    state: IReplayCommandState,
    direction: FaceDirection
) {
    return {
        execute: (step: IReplayStepHandler): Promise<boolean> =>
            moveHero(state, direction, step)
    };
}

/** 创建按稳定 enum 顺序排列的默认 replay command items */
export function createReplayCommandItems(
    state: IReplayCommandState
): ReadonlyArray<IReplayCommandItem> {
    return [
        {
            code: ReplayCommandCode.Up,
            command: createMoveCommand(state, FaceDirection.Up)
        },
        {
            code: ReplayCommandCode.Right,
            command: createMoveCommand(state, FaceDirection.Right)
        },
        {
            code: ReplayCommandCode.Down,
            command: createMoveCommand(state, FaceDirection.Down)
        },
        {
            code: ReplayCommandCode.Left,
            command: createMoveCommand(state, FaceDirection.Left)
        },
        {
            code: ReplayCommandCode.AutoPathfindToPoint,
            command: { execute: step => moveToPoint(state, step) }
        },
        {
            code: ReplayCommandCode.UseItem,
            command: { execute: step => useItem(state, step) }
        },
        {
            code: ReplayCommandCode.Equip,
            command: { execute: step => equip(state, step) }
        },
        {
            code: ReplayCommandCode.Unequip,
            command: { execute: step => unequip(state, step) }
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
