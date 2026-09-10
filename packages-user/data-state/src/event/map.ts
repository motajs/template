import { IBlockEventEnv } from '@user/data-system';
import {
    IDeleteBlockEventParam,
    IMoveBlockEventParam,
    ISetBlockEventParam
} from './types';
import { isNil } from 'lodash-es';
import { logger } from '@motajs/common';
import { IGameMap, IMapLayer } from '@user/data-base';
import { appendMoveSteps } from './hero';

/**
 * 通过环境参量获取可能的地图对象
 * @param env 事件环境变量
 */
export function getPossibleMap(env: IBlockEventEnv): IGameMap | null {
    if (env.map) return env.map;
    if (env.layer) return env.layer.map;

    const map = env.state.maps.getMap(env.heroFloor);
    if (map) return map;

    return null;
}

/** 通过环境参量获取可能的事件图层 */
export function getPossibleLayer(env: IBlockEventEnv): IMapLayer | null {
    if (env.layer) return env.layer;

    const map = getPossibleMap(env);
    if (map?.eventLayer) return map.eventLayer;

    return null;
}

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
