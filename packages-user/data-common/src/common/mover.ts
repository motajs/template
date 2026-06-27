import {
    Hookable,
    HookController,
    IHookable,
    IHookBase,
    IHookController,
    ITileLocator
} from '@motajs/common';
import { FaceDirection } from './types';
import { IFaceHandler } from './faceManager';

//#region 对象移动

export const enum ObjectMoveStepType {
    /** 绝对方向步，同步更新移动方向与朝向 */
    Dir,
    /** 绝对方向步，显式指定朝向 */
    DirFace,
    /** 速度步 */
    Speed,
    /** 纯转向步 */
    Face,
    /** 特殊步，如前进或后退 */
    Special,
    /** 动画方向步 */
    AnimDir,
    /** 传送步 */
    Teleport,
    /** 跳跃步 */
    Jump
}

export const enum ObjectSpecialStep {
    /** 前进 */
    Forward,
    /** 后退 */
    Backward
}

export const enum ObjectAnimDirection {
    /** 正向播放动画 */
    Forward,
    /** 反向播放动画 */
    Backward
}

export interface IObjectMovable {
    /** 当前横坐标 */
    readonly x: number;
    /** 当前纵坐标 */
    readonly y: number;

    /**
     * 设置对象位置
     * @param x 横坐标
     * @param y 纵坐标
     */
    setPos(x: number, y: number): void;

    /**
     * 获取当前朝向
     */
    getCurrentFaceDirection(): FaceDirection;
}

export interface IObjectMoveStepDir {
    /** 步骤类型 */
    type: ObjectMoveStepType.Dir;
    /** 本步移动方向 */
    move: FaceDirection;
}

export interface IObjectMoveStepDirFace {
    /** 步骤类型 */
    type: ObjectMoveStepType.DirFace;
    /** 本步移动方向 */
    move: FaceDirection;
    /** 本步显式朝向 */
    face: FaceDirection;
}

export interface IObjectMoveStepSpeed {
    /** 步骤类型 */
    type: ObjectMoveStepType.Speed;
    /** 后续移动的每格耗时，单位为 ms */
    value: number;
}

export interface IObjectMoveStepFace {
    /** 步骤类型 */
    type: ObjectMoveStepType.Face;
    /** 要设置的朝向 */
    value: FaceDirection;
}

export interface IObjectMoveStepSpecial {
    /** 步骤类型 */
    type: ObjectMoveStepType.Special;
    /** 特殊步方向 */
    direction: ObjectSpecialStep;
}

export interface IObjectMoveAnimDir {
    /** 步骤类型 */
    type: ObjectMoveStepType.AnimDir;
    /** 动画播放方向 */
    dir: ObjectAnimDirection;
}

export interface IObjectMoveTP {
    /** 步骤类型 */
    type: ObjectMoveStepType.Teleport;
    /** 目标横坐标 */
    x: number;
    /** 目标纵坐标 */
    y: number;
    /** 是否相对模式 */
    rel: boolean;
}

export interface IObjectMoveJump {
    /** 步骤类型 */
    type: ObjectMoveStepType.Jump;
    /** 目标横坐标 */
    x: number;
    /** 目标纵坐标 */
    y: number;
    /** 是否相对模式 */
    rel: boolean;
}

export type ObjectMoveStep =
    | IObjectMoveStepDir
    | IObjectMoveStepDirFace
    | IObjectMoveStepSpeed
    | IObjectMoveStepFace
    | IObjectMoveStepSpecial
    | IObjectMoveAnimDir
    | IObjectMoveTP
    | IObjectMoveJump;

export interface IMoverController {
    /** 本次移动是否已经全部完成 */
    done: boolean;
    /** 当本次移动结束时兑现 */
    onEnd: Promise<void>;

    /**
     * 向当前移动队列末尾追加步骤
     * @param steps 要追加的步骤列表
     */
    push(...steps: ObjectMoveStep[]): void;

    /**
     * 在当前步移动之后立刻插入指定步，顺序为参数传入的顺序
     * @param steps 要插入的步骤列表
     */
    insert(...steps: ObjectMoveStep[]): void;

    /**
     * 停止当前移动，在当前步骤完成后兑现
     */
    stop(): Promise<void>;
}

export interface IObjectMoverHooks<T extends IObjectMovable> extends IHookBase {
    /**
     * 当移动开始时触发
     * @param tile 移动器绑定的图块
     * @param mover 当前移动器
     */
    onMoveStart?(tile: T, mover: IObjectMover<T>): Promise<void>;

    /**
     * 当移动结束时触发
     * @param tile 移动器绑定的图块
     * @param mover 当前移动器
     */
    onMoveEnd?(tile: T, mover: IObjectMover<T>): Promise<void>;

    /**
     * 当单步移动开始前触发，此时对象坐标仍为移动前坐标
     * @param code 当前步移动代码
     * @param step 当前步骤
     * @param tile 移动器绑定的图块
     * @param mover 当前移动器
     */
    onStepStart?(
        code: number,
        step: ObjectMoveStep,
        tile: T,
        mover: IObjectMover<T>
    ): Promise<void>;

    /**
     * 当单步移动结束后触发，此时对象坐标已更新为移动后坐标
     * @param code 当前步移动代码
     * @param step 当前步骤
     * @param tile 移动器绑定的图块
     * @param mover 当前移动器
     */
    onStepEnd?(
        code: number,
        step: ObjectMoveStep,
        tile: T,
        mover: IObjectMover<T>
    ): Promise<void>;
}

export interface IObjectMover<T extends IObjectMovable> extends IHookable<
    IObjectMoverHooks<T>
> {
    /** 当前是否正在移动 */
    readonly moving: boolean;
    /** 当前绑定的对象 */
    readonly tile: T;
    /** 当前朝向 */
    readonly faceDirection: FaceDirection;
    /** 当前移动方向 */
    readonly moveDirection: FaceDirection;
    /** 当前动画播放方向 */
    readonly currAnimDir: ObjectAnimDirection;
    /** 当前移动速度，单位毫秒 */
    readonly currentSpeed: number;

    /**
     * 添加一个瞬移步，到这一步时目标将会瞬移至指定位置
     * @param x 瞬移目标横坐标
     * @param y 瞬移目标纵坐标
     * @param rel 是否使用相对模式，相对模式下目标位置为当前位置加上前两个参数
     */
    tp(x: number, y: number, rel?: boolean): this;

    /**
     * 添加一个跳跃步，目标将会跳跃至指定位置
     * @param x 跳跃目标横坐标
     * @param y 跳跃目标纵坐标
     * @param rel 是否使用相对模式，相对模式下目标位置为当前位置加上前两个参数
     */
    jump(x: number, y: number, rel?: boolean): this;

    /**
     * 追加若干个绝对方向步，并同步更新移动方向与朝向
     * @param dir 移动方向
     * @param count 追加次数，默认 1
     */
    step(dir: FaceDirection, count?: number): this;

    /**
     * 追加若干个绝对方向步，移动方向与朝向分别指定
     * @param move 移动方向
     * @param face 朝向方向
     * @param count 追加次数，默认 1
     */
    stepFace(move: FaceDirection, face: FaceDirection, count?: number): this;

    /**
     * 追加若干个前进步，沿当前移动方向移动
     * @param count 追加次数，默认 1
     */
    forward(count?: number): this;

    /**
     * 追加若干个后退步，沿当前移动方向的反方向移动
     * @param count 追加次数，默认 1
     */
    backward(count?: number): this;

    /**
     * 设置后续移动速度
     * @param value 每格耗时，单位为 ms
     */
    speed(value: number): this;

    /**
     * 追加一个纯转向步骤
     * @param dir 目标朝向
     */
    face(dir: FaceDirection): this;

    /**
     * 设置后续步骤的动画播放方向
     * @param dir 动画播放方向
     */
    animDir(dir: ObjectAnimDirection): this;

    /**
     * 清空尚未执行的步骤队列
     */
    clear(): this;

    /**
     * 开始执行当前计划队列
     * @returns 若当前已在移动，则返回 `null`
     */
    start(): Readonly<IMoverController> | null;
}

//#endregion

//#region 移动基类

export abstract class ObjectMover<T extends IObjectMovable>
    extends Hookable<IObjectMoverHooks<T>>
    implements IObjectMover<T>
{
    abstract readonly tile: T;

    /** 尚未开始执行的移动步骤队列 */
    protected readonly moveQueue: Readonly<ObjectMoveStep>[] = [];

    /** 当前是否正在移动 */
    moving: boolean = false;
    /** 当前朝向 */
    faceDirection: FaceDirection = FaceDirection.Unknown;
    /** 当前移动方向 */
    moveDirection: FaceDirection = FaceDirection.Unknown;
    /** 当前动画播放方向 */
    currAnimDir: ObjectAnimDirection = ObjectAnimDirection.Forward;
    /** 当前移动速度，单位毫秒 */
    currentSpeed: number = 100;

    /** 是否调用了 `IMoverController.stop` 接口 */
    private shouldStop: boolean = false;

    /** 朝向处理 */
    private readonly faceHandler: IFaceHandler<FaceDirection>;

    constructor(faceHandler: IFaceHandler<FaceDirection>) {
        super();
        this.faceHandler = faceHandler;
    }

    protected createController(
        hook: Partial<IObjectMoverHooks<T>>
    ): IHookController<IObjectMoverHooks<T>> {
        return new HookController(this, hook);
    }

    /**
     * 当移动开始时执行
     * @param tile 移动图块
     * @param controller 移动控制器
     */
    protected abstract onMoveStart(
        tile: T,
        controller: Readonly<IMoverController>
    ): Promise<void>;

    /**
     * 当移动结束时触发
     * @param tile 移动图块
     * @param controller 移动控制器
     */
    protected abstract onMoveEnd(
        tile: T,
        controller: Readonly<IMoverController>
    ): Promise<void>;

    /**
     * 当单步移动开始时触发，返回移动代码，此移动代码将会传递至 {@link onStepEnd}
     * @param step 当前移动步对象
     * @param tile 移动图块
     * @param controller 移动控制器
     */
    protected abstract onStepStart(
        step: ObjectMoveStep,
        tile: T,
        controller: Readonly<IMoverController>
    ): Promise<number>;

    /**
     * 当单步移动结束时触发，返回坐标对象代表这一步移动结果
     * @param code 移动代码，由 {@link onStepStart} 返回值传递而来
     * @param step 当前移动步对象
     * @param tile 移动图块
     * @param controller 移动控制器
     */
    protected abstract onStepEnd(
        code: number,
        step: ObjectMoveStep,
        tile: T,
        controller: Readonly<IMoverController>
    ): Promise<ITileLocator>;

    /**
     * 向计划队列末尾追加一个步骤
     * @param step 要追加的步骤
     */
    protected pushStep(step: Readonly<ObjectMoveStep>): void {
        this.moveQueue.push(step);
    }

    /**
     * 获取当前应当作为相对移动基准的方向
     */
    private getCurrentDirection(): FaceDirection {
        if (this.moveDirection !== FaceDirection.Unknown) {
            return this.moveDirection;
        } else {
            return this.faceDirection;
        }
    }

    /**
     * 根据步骤内容预先同步移动器内部状态
     * @param step 当前步骤
     */
    private prepareStep(step: ObjectMoveStep): void {
        switch (step.type) {
            case ObjectMoveStepType.Dir:
                this.moveDirection = step.move;
                this.faceDirection = step.move;
                break;
            case ObjectMoveStepType.DirFace:
                this.moveDirection = step.move;
                this.faceDirection = step.face;
                break;
            case ObjectMoveStepType.Face:
                this.faceDirection = step.value;
                break;
            case ObjectMoveStepType.Special: {
                const dir = this.getCurrentDirection();
                if (step.direction === ObjectSpecialStep.Backward) {
                    const opposite = this.faceHandler.opposite(dir);
                    this.moveDirection = opposite;
                    this.faceDirection = opposite;
                } else {
                    this.moveDirection = dir;
                    this.faceDirection = dir;
                }
                break;
            }
            case ObjectMoveStepType.AnimDir:
                this.currAnimDir = step.dir;
                break;
            case ObjectMoveStepType.Speed:
                this.currentSpeed = step.value;
                break;
        }
    }

    tp(x: number, y: number, rel: boolean = false): this {
        this.pushStep({
            type: ObjectMoveStepType.Teleport,
            x,
            y,
            rel
        });
        return this;
    }

    jump(x: number, y: number, rel: boolean = false): this {
        this.pushStep({
            type: ObjectMoveStepType.Jump,
            x,
            y,
            rel
        });
        return this;
    }

    step(dir: FaceDirection, count: number = 1): this {
        for (let i = 0; i < count; i++) {
            this.pushStep({
                type: ObjectMoveStepType.Dir,
                move: dir
            });
        }
        return this;
    }

    stepFace(
        move: FaceDirection,
        face: FaceDirection,
        count: number = 1
    ): this {
        for (let i = 0; i < count; i++) {
            this.pushStep({
                type: ObjectMoveStepType.DirFace,
                move,
                face
            });
        }
        return this;
    }

    forward(count: number = 1): this {
        for (let i = 0; i < count; i++) {
            this.pushStep({
                type: ObjectMoveStepType.Special,
                direction: ObjectSpecialStep.Forward
            });
        }
        return this;
    }

    backward(count: number = 1): this {
        for (let i = 0; i < count; i++) {
            this.pushStep({
                type: ObjectMoveStepType.Special,
                direction: ObjectSpecialStep.Backward
            });
        }
        return this;
    }

    speed(value: number): this {
        this.pushStep({
            type: ObjectMoveStepType.Speed,
            value
        });
        return this;
    }

    face(dir: FaceDirection): this {
        this.pushStep({
            type: ObjectMoveStepType.Face,
            value: dir
        });
        return this;
    }

    animDir(dir: ObjectAnimDirection): this {
        this.pushStep({
            type: ObjectMoveStepType.AnimDir,
            dir
        });
        return this;
    }

    clear(): this {
        this.moveQueue.length = 0;
        return this;
    }

    /**
     * 开始移动流程
     * @param queue 移动队列
     */
    private async moveProgress(
        queue: ObjectMoveStep[],
        controller: Readonly<IMoverController>
    ) {
        // 移动开始
        await this.onMoveStart(this.tile, controller);
        await Promise.all(
            this.forEachHook(hook => {
                return hook.onMoveStart?.(this.tile, this);
            })
        );

        // 移动流程
        while (queue.length > 0) {
            const step = queue.shift();
            if (!step || !this.moving || this.shouldStop) break;
            this.prepareStep(step);
            const code = await this.onStepStart(step, this.tile, controller);
            const stepStartHooks = this.forEachHook(hook =>
                hook.onStepStart?.(code, step, this.tile, this)
            );
            await Promise.all(stepStartHooks);
            const loc = await this.onStepEnd(code, step, this.tile, controller);
            this.tile.setPos(loc.x, loc.y);
            const stepEndHooks = this.forEachHook(hook =>
                hook.onStepEnd?.(code, step, this.tile, this)
            );
            await Promise.all(stepEndHooks);
        }

        // 移动结束
        await this.onMoveEnd(this.tile, controller);
        const moveEndHooks = this.forEachHook(hook =>
            hook.onMoveEnd?.(this.tile, this)
        );
        await Promise.all(moveEndHooks);
    }

    start(): IMoverController | null {
        if (this.moving) return null;

        const queue = this.moveQueue.slice();
        this.clear();
        this.shouldStop = false;

        this.faceDirection = this.tile.getCurrentFaceDirection();
        this.moveDirection = FaceDirection.Unknown;

        const { promise, resolve } = Promise.withResolvers<void>();

        const controller: IMoverController = {
            done: false,
            onEnd: promise,
            push: (...steps: ObjectMoveStep[]) => {
                if (!this.moving || this.shouldStop || controller.done) {
                    return;
                }
                queue.push(...steps);
            },
            insert: (...steps: ObjectMoveStep[]) => {
                if (!this.moving || this.shouldStop || controller.done) {
                    return;
                }
                queue.unshift(...steps);
            },
            stop: () => {
                this.shouldStop = true;
                return controller.onEnd;
            }
        };

        this.moving = true;
        const moving = this.moveProgress(queue, controller);
        moving.then(() => {
            this.moving = false;
            controller.done = true;
            resolve();
        });

        return controller;
    }
}

//#endregion
