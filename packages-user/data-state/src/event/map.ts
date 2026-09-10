import { IBlockEventEnv } from '@user/data-system';
import { ISetBlockEventParam } from './types';
import { isNil } from 'lodash-es';
import { logger } from '@motajs/common';
import { IGameMap } from '@user/data-base';

/**
 * 通过环境参量获取可能的地图对象
 * @param env 事件环境变量
 */
function getPossibleMap(env: IBlockEventEnv): IGameMap | null {
    if (env.map) return env.map;
    if (env.layer) return env.layer.map;

    const map = env.state.maps.getMap(env.heroFloor);
    if (map) return map;

    return null;
}

export function eventSetBlock(
    param: ISetBlockEventParam,
    env: IBlockEventEnv
): void {
    const map = getPossibleMap(env);
    if (!map) return;

    const layer = map.eventLayer;
    if (!layer) return;

    const num = env.state.tileStore.num(param.tile);
    if (isNil(num)) {
        logger.warn(1001);
        return;
    }

    return layer.setBlock(num, param.x, param.y);
}
