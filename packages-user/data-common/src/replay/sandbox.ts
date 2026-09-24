import {
    Hookable,
    HookController,
    IHookController,
    logger
} from '@motajs/common';
import {
    IReplayArray,
    IReplayCommand,
    IReplayPassiveHandler,
    IReplayReadStream,
    IReplaySandbox,
    IReplaySandboxHooks,
    IReplayStepHandler,
    IReplaySystem,
    ReplayCommandResult,
    ReplayCommandType
} from './types';
import { isNil } from 'lodash-es';

export class ReplaySandbox
    extends Hookable<IReplaySandboxHooks>
    implements IReplaySandbox
{
    pausing: boolean = true;
    speed: number = 1;
    ended: boolean = false;
    playing: boolean = false;

    /** 下一步是否需要暂停播放 */
    private needPause: boolean = false;
    /** 当前录像是否播放完毕 */
    private ending: boolean = false;

    /** 暂停 `Promise` 的 `resolve` 函数 */
    private pauseResolve: () => void = () => {};

    /** 被动录像步兑现函数 */
    private passiveResolve: (status: ReplayCommandResult) => void = () => {};
    /** 下一步被动录像步的 `StepHandler`，注意不是 `PassiveHandler` */
    private passiveHandler: IReplayStepHandler | null = null;

    /** 录像的流式读取器 */
    private reader: Readonly<IReplayReadStream>;

    /** 上一步播放的指令 */
    private last: number = -1;

    constructor(
        readonly route: IReplayArray,
        readonly system: IReplaySystem,
        startIndex: number
    ) {
        super();
        this.reader = route.createReadStream(startIndex);
    }

    protected createController(
        hook: Partial<IReplaySandboxHooks>
    ): IHookController<IReplaySandboxHooks> {
        return new HookController(this, hook);
    }

    getPassive(): IReplayPassiveHandler | null {
        if (!this.passiveHandler) {
            logger.error(73);
            return null;
        }
        const handler: IReplayPassiveHandler = {
            step: this.passiveHandler,
            next: status => {
                this.passiveResolve(status);
            }
        };
        return handler;
    }

    setSpeed(speed: number): void {
        this.speed = speed;
        this.forEachHook(hook => hook.onSpeedSet?.(speed));
    }

    getReplayed(): number {
        return this.reader.index;
    }

    /**
     * 开始录像重播循环
     */
    private async startReplayLoop() {
        if (this.ended) return;
        if (this.reader.expired) {
            logger.warn(156);
            return;
        }
        while (true) {
            if (this.needPause && !this.pausing) {
                this.pausing = true;
                this.needPause = false;
                this.pauseResolve();
                this.forEachHook(hook => hook.onPauseReplay?.());
                break;
            }
            if (this.reader.expired) {
                logger.warn(156);
                break;
            }
            const success = await this.step();
            if (!success) break;
        }
        if (this.ending) {
            this.ended = true;
        }
    }

    play(): void {
        if (this.playing || this.ended) return;
        this.pausing = false;
        this.playing = true;
        this.forEachHook(hook => hook.onStartReplay?.());
        this.startReplayLoop();
    }

    pause(): Promise<void> {
        if (this.pausing || this.ended || !this.playing) {
            return Promise.resolve();
        }
        const { promise, resolve } = Promise.withResolvers<void>();
        this.pauseResolve = resolve;
        this.needPause = true;
        return promise;
    }

    resume(): void {
        if (!this.pausing || !this.playing || this.ended) return;
        this.pausing = false;
        this.forEachHook(hook => hook.onResumeReplay?.());
        this.startReplayLoop();
    }

    async stop(): Promise<void> {
        if (this.pausing || this.ended || !this.playing) return;
        await this.pause();
        this.forEachHook(hook => hook.onStopReplay?.());
    }

    /**
     * 触发上一步指令的连续步骤后处理
     */
    private async finalizeLast(): Promise<ReplayCommandResult> {
        if (this.last === -1) return ReplayCommandResult.Success;
        const last = this.system.getCommand(this.last);
        if (!last) {
            logger.warn(157, this.last.toString());
            return ReplayCommandResult.Failed;
        }
        return last.finalize?.() ?? ReplayCommandResult.Success;
    }

    /**
     * 执行下一个录像步
     * @param command 录像步对象
     * @param next 录像步参数
     */
    private async executeCommand(
        command: IReplayCommand,
        next: IReplayStepHandler
    ): Promise<ReplayCommandResult> {
        if (command.type === ReplayCommandType.Passive) {
            // 被动录像步
            const { promise, resolve } =
                Promise.withResolvers<ReplayCommandResult>();
            this.passiveResolve = resolve;
            const status = await promise;
            if (isNil(status)) {
                logger.error(71);
                return ReplayCommandResult.Failed;
            } else {
                return status;
            }
        } else {
            // 主动录像步
            const status = command.execute(next);
            return status;
        }
    }

    /**
     * 检查录像执行状态，进行适当的控制台输出
     * @param status 录像执行状态
     * @param method 录像步执行方法，可填 `active` `passive` `finalize`
     */
    private checkReplayStatus(
        status: ReplayCommandResult,
        method: string
    ): boolean {
        if (status === ReplayCommandResult.Success) return true;
        else if (status === ReplayCommandResult.Failed) {
            logger.error(72, method);
            return false;
        } else {
            logger.log(
                `Ignored replay error with a Ignored status returned by ${method} command.`
            );
            return true;
        }
    }

    async step(): Promise<boolean> {
        if (!this.playing || this.ended) return false;
        if (this.reader.expired) {
            logger.warn(156);
            return false;
        }
        const next = this.reader.read();

        // finalize 执行
        if (!next || next.command !== this.last) {
            const ne = await this.finalizeLast();
            const success = this.checkReplayStatus(ne, 'finalize');
            if (success) {
                if (!next) {
                    this.last = -1;
                    this.ending = true;
                    return false;
                }
            } else {
                return false;
            }
        }
        this.last = next.command;

        // 获取指令本身
        const command = this.system.getCommand(next.command);
        if (!command) {
            logger.warn(157, next.command.toString());
            return false;
        }

        const status = await this.executeCommand(command, next);
        const success = this.checkReplayStatus(
            status,
            command.type === ReplayCommandType.Active ? 'execute' : 'passive'
        );
        if (success) {
            await Promise.all(this.forEachHook(hook => hook.onStep?.(next)));
            return true;
        } else {
            return false;
        }
    }
}
