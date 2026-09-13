import { BuiltInFunction } from '@motajs/anon-tokyo';
import { IBlockEventEnv } from '@user/data-system';
import {
    IDeleteBlockEventParam,
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
        if (!layer || !layer.inMap(param.x, param.y)) return;
        if (!layer.getTile(param.x, param.y)) return;

        const dynamic = layer.transferToDynamic(param.x, param.y);
        if (!dynamic) return;

        if (dynamic.mover.moving) return;
        dynamic.mover.push([...param.steps]);
        const controller = dynamic.mover.start();
        if (!controller) return;
        await controller.onEnd;

        if (param.safe) {
            layer.transferToStaticIfSafe(dynamic);
        } else {
            layer.transferToStatic(dynamic);
        }
    }
}

export class EventDeleteBlock implements BuiltInFunction<
    IDeleteBlockEventParam,
    IBlockEventEnv
> {
    name: string = 'deleteBlock';

    async func(param: IDeleteBlockEventParam, env: IBlockEventEnv) {
        const layer = getPossibleLayer(env);
        if (!layer || !layer.inMap(param.x, param.y)) return;

        const dynamics = [...layer.getDynamicTilesAt(param.x, param.y)];
        await Promise.all(dynamics.map(tile => layer.deleteDynamic(tile)));
        if (layer.getTile(param.x, param.y)) {
            layer.setBlock(0, param.x, param.y);
        }
    }
}
