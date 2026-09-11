import {
    FaceDirection,
    IReplayStepHandler,
    IReplaySystem,
    IReplayCommand,
    shouldReplay
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

interface IReplayCommandEntrances {
    /** 执行一个方向的勇士移动 */
    moveHero(direction: FaceDirection): boolean;

    /** 执行一次指定目标点的自动寻路移动 */
    moveToPoint(x: number, y: number): boolean;

    /** 执行既有勇士道具使用入口 */
    useItem(item: number | string): boolean;

    /** 执行既有勇士装备入口 */
    equip(
        uid: number,
        slot: number | string,
        slotIndex: number,
        autoUnload: boolean | undefined
    ): boolean;

    /** 执行既有勇士卸下装备入口 */
    unequip(slot: number): boolean;
}

class ReplayCommandEntrances implements IReplayCommandEntrances {
    constructor(private readonly state: IReplayCommandState) {
        this.moveHero = shouldReplay('replay command: move hero')(
            this.moveHero,
            {
                name: 'moveHero'
            } as ClassMethodDecoratorContext<
                ReplayCommandEntrances,
                (
                    this: ReplayCommandEntrances,
                    direction: FaceDirection
                ) => boolean
            >
        );
        this.moveToPoint = shouldReplay('replay command: pathfind hero')(
            this.moveToPoint,
            {
                name: 'moveToPoint'
            } as ClassMethodDecoratorContext<
                ReplayCommandEntrances,
                (this: ReplayCommandEntrances, x: number, y: number) => boolean
            >
        );
        this.useItem = shouldReplay('replay command: use item')(this.useItem, {
            name: 'useItem'
        } as ClassMethodDecoratorContext<
            ReplayCommandEntrances,
            (this: ReplayCommandEntrances, item: number | string) => boolean
        >);
        this.equip = shouldReplay('replay command: equip item')(this.equip, {
            name: 'equip'
        } as ClassMethodDecoratorContext<
            ReplayCommandEntrances,
            (
                this: ReplayCommandEntrances,
                uid: number,
                slot: number | string,
                slotIndex: number,
                autoUnload: boolean | undefined
            ) => boolean
        >);
        this.unequip = shouldReplay('replay command: unequip item')(
            this.unequip,
            {
                name: 'unequip'
            } as ClassMethodDecoratorContext<
                ReplayCommandEntrances,
                (this: ReplayCommandEntrances, slot: number) => boolean
            >
        );
    }

    moveHero(direction: FaceDirection): boolean {
        const mover = this.state.hero.location.mover;
        if (mover.moving) return false;
        mover.step(direction);
        const controller = mover.start();
        if (!controller) return false;
        return true;
    }

    moveToPoint(x: number, y: number): boolean {
        const result = this.state.pathfinding.moveTo({ x, y });
        if (!result) return false;
        return true;
    }

    useItem(item: number | string): boolean {
        return this.state.hero.items.useItem(item);
    }

    equip(
        uid: number,
        slot: number | string,
        slotIndex: number,
        autoUnload: boolean | undefined
    ): boolean {
        if (this.state.hero.equip.getEquipped(slotIndex) === uid) return true;
        if (
            this.state.hero.equip.canEquipTo(uid, slot) ===
            EquipStatus.CannotEquip
        ) {
            return false;
        }
        this.state.hero.equip.equip(uid, slot, autoUnload);
        return this.state.hero.equip.getEquipped(slotIndex) === uid;
    }

    unequip(slot: number): boolean {
        if (this.state.hero.equip.getEquipped(slot) === undefined) {
            return false;
        }
        this.state.hero.equip.unequip(slot);
        return this.state.hero.equip.getEquipped(slot) === undefined;
    }
}

function createMoveCommand(
    entries: IReplayCommandEntrances,
    direction: FaceDirection
): IReplayCommand {
    return {
        execute: (step: IReplayStepHandler): Promise<boolean> => {
            if (step.params.length !== 0) return Promise.resolve(false);
            return Promise.resolve(entries.moveHero(direction));
        }
    };
}

/** 创建按稳定 enum 顺序排列的默认 replay command items */
export function createReplayCommandItems(
    state: IReplayCommandState
): ReadonlyArray<IReplayCommandItem> {
    const entries = new ReplayCommandEntrances(state);
    return [
        {
            code: ReplayCommandCode.Up,
            command: createMoveCommand(entries, FaceDirection.Up)
        },
        {
            code: ReplayCommandCode.Right,
            command: createMoveCommand(entries, FaceDirection.Right)
        },
        {
            code: ReplayCommandCode.Down,
            command: createMoveCommand(entries, FaceDirection.Down)
        },
        {
            code: ReplayCommandCode.Left,
            command: createMoveCommand(entries, FaceDirection.Left)
        },
        {
            code: ReplayCommandCode.AutoPathfindToPoint,
            command: {
                execute: step => {
                    if (step.params.length !== 2) return Promise.resolve(false);
                    const x = step.params[0];
                    const y = step.params[1];
                    if (!isNumber(x) || !isNumber(y)) {
                        return Promise.resolve(false);
                    }
                    return Promise.resolve(entries.moveToPoint(x, y));
                }
            }
        },
        {
            code: ReplayCommandCode.UseItem,
            command: {
                execute: step => {
                    if (step.params.length !== 1) return Promise.resolve(false);
                    const item = step.params[0];
                    if (!isItem(item)) return Promise.resolve(false);
                    return Promise.resolve(entries.useItem(item));
                }
            }
        },
        {
            code: ReplayCommandCode.Equip,
            command: {
                execute: step => {
                    if (step.params.length < 2 || step.params.length > 3) {
                        return Promise.resolve(false);
                    }
                    const uid = step.params[0];
                    const slot = step.params[1];
                    const autoUnload = step.params[2];
                    if (
                        !isNumber(uid) ||
                        !Number.isInteger(uid) ||
                        !isSlot(slot)
                    ) {
                        return Promise.resolve(false);
                    }
                    if (autoUnload !== undefined && !isBoolean(autoUnload)) {
                        return Promise.resolve(false);
                    }
                    const slotIndex = resolveSlot(state, slot);
                    if (slotIndex === null) return Promise.resolve(false);
                    return Promise.resolve(
                        entries.equip(uid, slot, slotIndex, autoUnload)
                    );
                }
            }
        },
        {
            code: ReplayCommandCode.Unequip,
            command: {
                execute: step => {
                    if (step.params.length !== 1) {
                        return Promise.resolve(false);
                    }
                    const slot = step.params[0];
                    if (
                        !isNumber(slot) ||
                        !Number.isInteger(slot) ||
                        slot < 0
                    ) {
                        return Promise.resolve(false);
                    }
                    return Promise.resolve(entries.unequip(slot));
                }
            }
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
