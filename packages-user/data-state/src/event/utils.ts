import { IGameMap, IMapLayer } from '@user/data-base';
import { IBlockEventEnv } from '@user/data-system';

/**
 * 通过环境参量获取可能的地图对象
 */
export function getPossibleMap(env: IBlockEventEnv): IGameMap | null {
    if (env.map) return env.map;
    if (env.layer) return env.layer.map;

    const map = env.state.maps.getMap(env.heroFloor);
    if (map) return map;

    return null;
}

/**
 * 通过环境参量获取可能的事件图层
 */
export function getPossibleLayer(env: IBlockEventEnv): IMapLayer | null {
    if (env.layer) return env.layer;

    const map = getPossibleMap(env);
    if (map?.eventLayer) return map.eventLayer;

    return null;
}
