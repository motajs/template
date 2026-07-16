import {
    Hookable,
    HookController,
    IHookController,
    logger
} from '@motajs/common';
import {
    IReplayArray,
    IReplayCommand,
    IReplaySandbox,
    IReplaySandboxConfig,
    IReplaySystem,
    IReplaySystemHook,
    ReplayCommandWidth,
    ReplayParamValue
} from './types';
import { ReplayArray } from './array';
import { ReplaySandbox } from './sandbox';

export class ReplaySystem
    extends Hookable<IReplaySystemHook>
    implements IReplaySystem
{
    replaying: boolean = false;
    sandbox: IReplaySandbox | null = null;
    route: IReplayArray;

    /** 所有注册的指令 */
    private readonly commands: Map<number, IReplayCommand> = new Map();

    constructor() {
        super();
        this.route = new ReplayArray({
            initCommandLength: 1000,
            initParamLength: 10000,
            commandExpandMultiplier: 1.2,
            paramExpandMultiplier: 1.2,
            commandWidth: ReplayCommandWidth.Uint8,
            commandMaxLength: 1_000_000,
            paramMaxLength: 10_000_000
        });
    }

    protected createController(
        hook: Partial<IReplaySystemHook>
    ): IHookController<IReplaySystemHook> {
        return new HookController(this, hook);
    }

    registerCommand(code: number, command: IReplayCommand): void {
        if (this.commands.has(code)) {
            logger.warn(163);
            return;
        }
        this.commands.set(code, command);
    }

    getCommand(code: number): IReplayCommand | null {
        return this.commands.get(code) ?? null;
    }

    record(code: number, ...params: ReplayParamValue[]): void {
        this.route.add(code, params);
        this.forEachHook(hook =>
            hook.onRecordCommand?.(code, this.route.length, params)
        );
    }

    createReplaySandbox(
        config: Readonly<IReplaySandboxConfig>
    ): IReplaySandbox {
        config.reseter.reset(config.save);
        const sandbox = new ReplaySandbox(
            config.route,
            this,
            config.startIndex ?? 0
        );
        this.sandbox = sandbox;
        this.forEachHook(hook => hook.onCreateSandbox?.(sandbox));
        return sandbox;
    }

    releaseSandbox(): void {
        this.sandbox?.stop();
        this.sandbox = null;
    }
}
