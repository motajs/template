import { BuiltInFunction } from 'anon-tokyo';
import { IBlockEventEnv } from '@user/data-system';
import {
    EventBuiltinName,
    IDeleteBlockEventParam,
    IMoveBlockEventParam,
    ISetBlockEventParam
} from './types';
import { isNil } from 'lodash-es';
import { logger } from '@motajs/common';
import { appendMoveSteps, getPossibleLayer } from './hero';

export function eventSetBlock(
    param: ISetBlockEventParam,
    env: IBlockEventEnv
): void {
    const layer = getPossibleLayer(env);
    if (!layer) return;

    if (!layer.inMap(param.x, param.y)) return;

    const num = env.state.tileStore.num(param.tile);
    if (isNil(num)) {
        logger.warn(1001);
        return;
    }

    layer.setBlock(num, param.x, param.y);
}

/** 将动态图块移动完成后还原为静态图块 */
export async function eventMoveBlock(
    param: IMoveBlockEventParam,
    env: IBlockEventEnv
): Promise<void> {
    const layer = getPossibleLayer(env);
    if (!layer || !layer.inMap(param.x, param.y)) return;
    if (!layer.getTile(param.x, param.y)) return;

    const dynamic = layer.transferToDynamic(param.x, param.y);
    if (!dynamic) return;

    if (dynamic.mover.moving) return;
    appendMoveSteps(dynamic.mover, param.steps);
    const controller = dynamic.mover.start();
    if (!controller) return;
    await controller.onEnd;

    if (param.safe) {
        layer.transferToStaticIfSafe(dynamic);
    } else {
        layer.transferToStatic(dynamic);
    }
}

/** 删除目标坐标的静态图块和动态图块 */
export async function eventDeleteBlock(
    param: IDeleteBlockEventParam,
    env: IBlockEventEnv
): Promise<void> {
    const layer = getPossibleLayer(env);
    if (!layer || !layer.inMap(param.x, param.y)) return;

    const dynamics = [...layer.getDynamicTilesAt(param.x, param.y)];
    await Promise.all(dynamics.map(tile => layer.deleteDynamic(tile)));
    if (layer.getTile(param.x, param.y)) {
        layer.setBlock(0, param.x, param.y);
    }
}

export class SetBlockEventRegistration implements BuiltInFunction {
    readonly name: EventBuiltinName.SetBlock = EventBuiltinName.SetBlock;
    readonly func: BuiltInFunction['func'] =
        eventSetBlock as BuiltInFunction['func'];
}

export class MoveBlockEventRegistration implements BuiltInFunction {
    readonly name: EventBuiltinName.MoveBlock = EventBuiltinName.MoveBlock;
    readonly func: BuiltInFunction['func'] =
        eventMoveBlock as BuiltInFunction['func'];
}

export class DeleteBlockEventRegistration implements BuiltInFunction {
    readonly name: EventBuiltinName.DeleteBlock = EventBuiltinName.DeleteBlock;
    readonly func: BuiltInFunction['func'] =
        eventDeleteBlock as BuiltInFunction['func'];
}
