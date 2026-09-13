import { BuiltInFunction } from '@motajs/anon-tokyo';
import { IBlockEventEnv } from '@user/data-system';
import {
    IRemoveBlockEventParam,
    IMoveBlockEventParam,
    ISetBlockEventParam
} from './types';
import { isNil } from 'lodash-es';
import { logger } from '@motajs/common';
import { getPossibleLayer } from './utils';

export class EventSetBlock implements BuiltInFunction<
    ISetBlockEventParam,
    IBlockEventEnv
> {
    name: string = 'setBlock';

    func(param: ISetBlockEventParam, env: IBlockEventEnv) {
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
}

export class EventMoveBlock implements BuiltInFunction<
    IMoveBlockEventParam,
    IBlockEventEnv
> {
    name: string = 'moveBlock';

    async func(param: IMoveBlockEventParam, env: IBlockEventEnv) {
        const layer = getPossibleLayer(env);
        if (!layer) return;

        const { x, y, keepEvent } = param;
        const dynamic = layer.transferToDynamic(x, y, keepEvent);
        if (!dynamic) return;

        dynamic.mover.push(param.steps);
        const controller = dynamic.mover.start();
        if (!controller) return;
        await controller.onEnd;

        if (param.safe) {
            layer.transferToStaticIfSafe(dynamic, keepEvent);
        } else {
            layer.transferToStatic(dynamic, keepEvent);
        }
    }
}

export class EventRemoveBlock implements BuiltInFunction<
    IRemoveBlockEventParam,
    IBlockEventEnv
> {
    name: string = 'removeBlock';

    async func(param: IRemoveBlockEventParam, env: IBlockEventEnv) {
        const layer = getPossibleLayer(env);
        if (!layer || !layer.inMap(param.x, param.y)) return;

        if (param.dynamic) {
            const dynamics = [...layer.getDynamicTilesAt(param.x, param.y)];
            await Promise.all(dynamics.map(tile => layer.deleteDynamic(tile)));
        }

        layer.removeBlock(param.x, param.y);
    }
}
