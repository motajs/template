import { BuiltInFunction } from 'anon-tokyo';
import { IBlockEventEnv } from '@user/data-system';
import { IHeroLocation, IHeroMover } from '@user/data-base';
import {
    IMoverController,
    IObjectMovable,
    IObjectMover,
    ObjectMoveStep,
    ObjectMoveType,
    ObjectSpecialStep
} from '@user/data-common';
import {
    EventBuiltinName,
    IMoveHeroEventParam,
    IMoveHeroStepEventParam
} from './types';

type HeroEventBuiltinHandler<TParam> = (
    param: TParam,
    env: IBlockEventEnv
) => void | Promise<void>;

function createHeroEventBuiltin<TParam>(
    name: EventBuiltinName,
    handler: HeroEventBuiltinHandler<TParam>
): BuiltInFunction {
    return { name, func: handler as BuiltInFunction['func'] };
}

/** 启动勇士移动并等待其完整结束 */
export function appendMoveSteps<T extends IObjectMovable>(
    mover: IObjectMover<T>,
    steps: readonly ObjectMoveStep[]
): void {
    for (const step of steps) {
        switch (step.type) {
            case ObjectMoveType.Dir:
                mover.step(step.move);
                break;
            case ObjectMoveType.DirFace:
                mover.stepFace(step.move, step.face);
                break;
            case ObjectMoveType.Speed:
                mover.speed(step.value);
                break;
            case ObjectMoveType.Face:
                mover.face(step.value);
                break;
            case ObjectMoveType.Special:
                if (step.direction === ObjectSpecialStep.Forward) {
                    mover.forward();
                } else {
                    mover.backward();
                }
                break;
            case ObjectMoveType.AnimDir:
                mover.animDir(step.dir);
                break;
            case ObjectMoveType.Teleport:
                mover.tp(step.x, step.y, step.rel);
                break;
            case ObjectMoveType.Jump:
                mover.jump(step.x, step.y, step.rel);
                break;
        }
    }
}

/** 启动勇士移动并等待其完整结束 */
async function startHeroMove(
    mover: IHeroMover<IHeroLocation>,
    steps: readonly ObjectMoveStep[]
): Promise<void> {
    if (mover.moving) return;
    appendMoveSteps(mover, steps);
    const controller: Readonly<IMoverController> | null = mover.start();
    if (!controller) return;
    await controller.onEnd;
}

/** 获取可以执行移动的勇士移动器 */
function getHeroMover(env: IBlockEventEnv): IHeroMover<IHeroLocation> | null {
    const hero = env.state.hero;
    if (!hero) return null;
    return hero.location.mover;
}

/** 按指定移动序列移动勇士 */
export async function eventMoveHero(
    param: IMoveHeroEventParam,
    env: IBlockEventEnv
): Promise<void> {
    const mover = getHeroMover(env);
    if (!mover) return;
    await startHeroMove(mover, param.steps);
}

/** 让勇士沿当前朝向移动一步 */
export async function eventMoveHeroStep(
    _param: IMoveHeroStepEventParam,
    env: IBlockEventEnv
): Promise<void> {
    const mover = getHeroMover(env);
    if (!mover) return;
    if (mover.moving) return;
    mover.forward(1);
    const controller = mover.start();
    if (!controller) return;
    await controller.onEnd;
}

/** 创建勇士控制事件的内建函数注册项 */
export function createHeroEventBuiltinRegistrations(): ReadonlyArray<BuiltInFunction> {
    return [
        createHeroEventBuiltin(EventBuiltinName.MoveHero, eventMoveHero),
        createHeroEventBuiltin(EventBuiltinName.MoveHeroStep, eventMoveHeroStep)
    ];
}
