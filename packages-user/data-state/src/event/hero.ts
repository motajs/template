import { BuiltInFunction } from '@motajs/anon-tokyo';
import { IBlockEventEnv } from '@user/data-system';
import {
    IMoveHeroEventParam,
    IStepHeroEventParam,
    ITouchFrontEventParam
} from './types';
import { getPossibleLayer } from './utils';

export class EventMoveHero implements BuiltInFunction<
    IMoveHeroEventParam,
    IBlockEventEnv
> {
    name: string = 'moveHero';

    async func(param: IMoveHeroEventParam, env: IBlockEventEnv) {
        const mover = env.state.hero.location.mover;
        if (mover.moving) return;

        mover.push([...param.steps]);
        const controller = mover.start();
        if (!controller) return;
        await controller.onEnd;
    }
}

export class EventStepHero implements BuiltInFunction<
    IStepHeroEventParam,
    IBlockEventEnv
> {
    name: string = 'stepHero';

    async func(_param: IStepHeroEventParam, env: IBlockEventEnv) {
        const mover = env.state.hero.location.mover;
        if (mover.moving) return;

        mover.forward(1);
        const controller = mover.start();
        if (!controller) return;
        await controller.onEnd;
    }
}

export class EventTouchFront implements BuiltInFunction<
    ITouchFrontEventParam,
    IBlockEventEnv
> {
    name: string = 'touchFront';

    async func(_param: ITouchFrontEventParam, env: IBlockEventEnv) {
        const layer = getPossibleLayer(env);
        if (!layer) return;

        const mover = env.state.hero.location.mover;

        if (mover.moving) return;
        mover.forward();
        const controller = mover.start();
        if (!controller) return;
        await controller.onEnd;
    }
}
