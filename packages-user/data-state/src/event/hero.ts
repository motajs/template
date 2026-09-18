import { BuiltInFunction } from '@motajs/anon-tokyo';
import { IBlockEventEnv } from '@user/data-system';
import { IMoveHeroEventParam, IStepHeroEventParam } from './types';

export class EventMoveHero implements BuiltInFunction<
    IMoveHeroEventParam,
    IBlockEventEnv
> {
    name: string = 'moveHero';

    async func(param: IMoveHeroEventParam, env: IBlockEventEnv) {
        const mover = env.state.hero.location.mover;
        if (mover.moving) return;

        env.state.replaySystem.disable();
        mover.push([...param.steps]);
        const controller = mover.start();
        if (!controller) return;
        await controller.onEnd;
        env.state.replaySystem.revert();
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

        env.state.replaySystem.disable();
        mover.forward(1);
        const controller = mover.start();
        if (!controller) return;
        await controller.onEnd;
        env.state.replaySystem.revert();
    }
}
