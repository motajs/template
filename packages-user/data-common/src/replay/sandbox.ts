import {
    Hookable,
    HookController,
    IHookController,
    logger
} from '@motajs/common';
import {
    IReplayArray,
    IReplayReadStream,
    IReplaySandbox,
    IReplaySandboxHooks,
    IReplaySystem
} from './types';

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

    async step(): Promise<boolean> {
        if (!this.pausing || !this.playing || this.ended) return false;
        if (this.reader.expired) {
            logger.warn(156);
            return false;
        }
        const next = this.reader.read();
        if (!next) {
            this.ending = true;
            return false;
        }
        const command = this.system.getCommand(next.command);
        if (!command) {
            logger.warn(157, next.command.toString());
            return false;
        }
        const success = await command.execute(next);
        if (!success) {
            logger.warn(
                158,
                next.command.toString(),
                JSON.stringify(next.params)
            );
            return false;
        }
        await Promise.all(this.forEachHook(hook => hook.onStep?.(next)));
        return true;
    }
}
