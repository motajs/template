import {
    Hookable,
    HookController,
    IHookController,
    logger
} from '@motajs/common';
import {
    IReplayArray,
    IReplayPassiveHandler,
    IReplayReadStream,
    IReplaySandbox,
    IReplaySandboxHooks,
    IReplayStepHandler,
    IReplaySystem,
    ReplayCommandResult,
    ReplayCommandType
} from './types';

interface IReplayStepResult {
    /** 录像是否播放成功 */
    readonly success: boolean;
    /**
     * 当前正在播放的录像步，注意如果是 finalize 失败，
     * 那么这里也应是还未播放的那个本来应该播放的录像步，而不是需要 finalize 的录像步
     */
    readonly step: IReplayStepHandler | null;
}

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

    /** 录像的流式读取器 */
    private reader: Readonly<IReplayReadStream>;

    /** 上一个主动录像步指令 */
    private last: number = -1;

    /** 等待下一步播放的录像步，包括主动和被动 */
    private appendingStep: IReplayStepHandler | null = null;

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

    setSpeed(speed: number): void {
        this.speed = speed;
        this.forEachHook(hook => hook.onSpeedSet?.(speed));
    }

    getReplayed(): number {
        return this.reader.index;
    }

    //#region 录像步

    getPassive(): IReplayPassiveHandler | null {
        const curr = this.appendingStep;
        if (!curr) {
            logger.error(73);
            return null;
        }
        const command = this.system.getCommand(curr.command);
        if (!command) {
            logger.warn(157, curr.command.toString());
            return null;
        }
        if (command.type === ReplayCommandType.Active) {
            logger.error(73);
            return null;
        }

        const handler: IReplayPassiveHandler = {
            step: curr,
            next: async status => {
                const result = this.checkReplayStatus(status, 'passive');
                if (result) {
                    this.appendingStep = this.reader.read();
                    await Promise.all(
                        this.forEachHook(hook => hook.onStep?.(curr))
                    );
                }
            }
        };
        return handler;
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

    private async replayStep(): Promise<IReplayStepResult> {
        if (!this.playing || this.ended) {
            return {
                step: null,
                success: false
            };
        }
        if (this.reader.expired) {
            logger.warn(156);
            return {
                step: null,
                success: false
            };
        }
        const curr = this.appendingStep;

        // 当录像步已经放完时，对最后一个录像步进行 finalize 处理
        if (!curr) {
            const ne = await this.finalizeLast();
            const success = this.checkReplayStatus(ne, 'finalize');
            if (success) {
                this.last = -1;
                this.ending = true;
            }
            return {
                step: null,
                success: false
            };
        }

        const command = this.system.getCommand(curr.command);
        if (!command) {
            logger.warn(157, curr.command.toString());
            return {
                step: null,
                success: false
            };
        }

        // 如果当前录像步是被动录像步，说明它没有在上一个主动录像步期间完成，则忽略并进入后续播放
        if (command.type !== ReplayCommandType.Active) {
            logger.warn(194, curr.command.toString(), this.last.toString());
            this.appendingStep = this.reader.read();
            return {
                step: curr,
                success: true
            };
        }

        // 如果当前录像步指令与上一个主动录像步不同，那么进行 finalize 后处理
        if (curr.command !== this.last) {
            const ne = await this.finalizeLast();
            const success = this.checkReplayStatus(ne, 'finalize');
            if (!success) {
                return {
                    step: curr,
                    success: false
                };
            }
        }
        this.last = curr.command;

        // 在执行前获取下一个录像步，因为被动录像步一定会在其紧跟着的前面的主动录像步中进行读取，
        // 所以在此时必须确定下一个录像步是什么，这样 `getPassive` 才能判断是否真的是被动录像步。
        this.appendingStep = this.reader.read();

        // 然后执行当前录像步，此时一定是主动录像步，可以直接调
        const status = await command.execute(curr);

        const success = this.checkReplayStatus(
            status,
            command.type === ReplayCommandType.Active ? 'execute' : 'passive'
        );

        return {
            step: curr,
            success
        };
    }

    //#endregion

    //#region 录像控制

    /**
     * 开始录像重播循环
     */
    private async startReplayLoop() {
        if (this.ended || this.pausing) return;
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
            const res = await this.replayStep();
            if (!res.success) break;
            await Promise.all(
                this.forEachHook(hook => hook.onStep?.(res.step!))
            );
        }
        if (this.ending) {
            this.ended = true;
            this.forEachHook(hook => hook.onStopReplay?.());
        }
    }

    play(): void {
        if (this.playing || this.ended) return;
        this.pausing = false;
        this.playing = true;
        if (!this.appendingStep && !this.reader.expired) {
            this.appendingStep = this.reader.read();
        }
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

    async step(): Promise<boolean> {
        if (
            this.playing &&
            !this.appendingStep &&
            !this.reader.expired &&
            !this.ended
        ) {
            this.appendingStep = this.reader.read();
        }
        const res = await this.replayStep();
        if (res.success) {
            await Promise.all(
                this.forEachHook(hook => hook.onStep?.(res.step!))
            );
        }
        return res.success;
    }

    //#endregion
}
