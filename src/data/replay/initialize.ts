import { FaceDirection, ReplayCode } from '@user/data-common';
import { ICoreState } from '@user/data-state';
import {
    ReplayEquip,
    ReplayMove,
    ReplayTeleport,
    ReplayUnequip,
    ReplayUseItem
} from './commands';

/**
 * 初始化录像指令
 * @param state 数据端主对象
 */
export function initializeReplay(state: ICoreState) {
    const replay = state.replaySystem;

    const up = new ReplayMove(state, FaceDirection.Up);
    const right = new ReplayMove(state, FaceDirection.Right);
    const down = new ReplayMove(state, FaceDirection.Down);
    const left = new ReplayMove(state, FaceDirection.Left);
    const teleport = new ReplayTeleport(state);
    const useItem = new ReplayUseItem(state);
    const equip = new ReplayEquip(state);
    const unequip = new ReplayUnequip(state);

    replay.registerCommand(ReplayCode.Up, up);
    replay.registerCommand(ReplayCode.Right, right);
    replay.registerCommand(ReplayCode.Down, down);
    replay.registerCommand(ReplayCode.Left, left);
    replay.registerCommand(ReplayCode.Teleport, teleport);
    replay.registerCommand(ReplayCode.UseItem, useItem);
    replay.registerCommand(ReplayCode.Equip, equip);
    replay.registerCommand(ReplayCode.Unequip, unequip);
}
