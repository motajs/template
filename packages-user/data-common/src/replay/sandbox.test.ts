// 测试 ReplaySandbox 播放器的步进、收尾与播放控制
import { logger } from '@motajs/common';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { ReplaySystem } from './system';
import { IReplayCommand, IReplaySandbox, IReplayStepHandler } from './types';

vi.hoisted(() => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
});

afterEach(() => {
    vi.restoreAllMocks();
});

afterAll(() => {
    vi.unstubAllGlobals();
});

interface IManualReplaySandbox extends IReplaySandbox {
    playing: boolean;
    pausing: boolean;
}

// 构造一个可注入执行与收尾行为的录像命令
function createCommand(
    execute: (step: IReplayStepHandler) => Promise<boolean>,
    notExecuted?: () => Promise<boolean>
): IReplayCommand {
    return notExecuted ? { execute, notExecuted } : { execute };
}

// 用录像系统构造一个可手动驱动的录像沙箱
function createSandbox(system: ReplaySystem): IManualReplaySandbox {
    return system.createReplaySandbox({
        route: system.route,
        reseter: { reset: () => {} }
    }) as IManualReplaySandbox;
}

// 将沙箱置为手动步进的播放状态
function start(sandbox: IManualReplaySandbox): void {
    sandbox.playing = true;
    sandbox.pausing = false;
}

// 有界等待播放结束，避免不终止的播放循环挂起测试
async function waitForEnded(sandbox: IReplaySandbox): Promise<void> {
    for (let index = 0; index < 1000 && !sandbox.ended; index++) {
        await new Promise<void>(resolve => setTimeout(resolve, 0));
    }
}

// 生成一个可外部兑现的异步结果
function createDeferred() {
    return Promise.withResolvers<boolean>();
}

describe('ReplaySandbox stepping', () => {
    // 验证 step 执行下一步、触发 onStep 钩子并返回 true
    it('steps one command and dispatches the step hook', async () => {
        const executed: number[] = [];
        const system = new ReplaySystem();
        system.registerCommand(
            1,
            createCommand(async step => {
                executed.push(step.index);
                return true;
            })
        );
        system.record(1, 5);
        const sandbox = createSandbox(system);
        const stepped: IReplayStepHandler[] = [];
        sandbox
            .addHook({
                onStep: async step => {
                    stepped.push(step);
                }
            })
            .load();
        start(sandbox);

        await expect(sandbox.step()).resolves.toBe(true);

        expect(executed).toEqual([1]);
        expect(stepped).toHaveLength(1);
        expect(stepped[0].command).toBe(1);
        expect(sandbox.getReplayed()).toBe(1);
    });

    // 验证执行失败的命令触发告警码 158 并停止后续步骤
    it('warns code 158 and stops when a command returns false', async () => {
        const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        const executed: number[] = [];
        const system = new ReplaySystem();
        system.registerCommand(
            1,
            createCommand(async () => {
                executed.push(1);
                return false;
            })
        );
        system.registerCommand(
            2,
            createCommand(async () => {
                executed.push(2);
                return true;
            })
        );
        system.record(1);
        system.record(2);
        const sandbox = createSandbox(system);
        start(sandbox);

        await expect(sandbox.step()).resolves.toBe(false);

        expect(executed).toEqual([1]);
        expect(warn).toHaveBeenCalledWith(158, '1', '[]');
        expect(sandbox.getReplayed()).toBe(1);
    });

    // 验证未知指令触发告警码 157 并返回 false
    it('warns code 157 for an unknown command', async () => {
        const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        const system = new ReplaySystem();
        system.record(9);
        const sandbox = createSandbox(system);
        start(sandbox);

        await expect(sandbox.step()).resolves.toBe(false);

        expect(warn).toHaveBeenCalledWith(157, '9');
    });

    // 验证切换指令时先成功收尾上一步再执行下一步
    it('finalizes the previous command before executing a different one', async () => {
        const order: string[] = [];
        const system = new ReplaySystem();
        system.registerCommand(
            1,
            createCommand(
                async () => {
                    order.push('exec1');
                    return true;
                },
                async () => {
                    order.push('fin1');
                    return true;
                }
            )
        );
        system.registerCommand(
            2,
            createCommand(async () => {
                order.push('exec2');
                return true;
            })
        );
        system.record(1);
        system.record(2);
        const sandbox = createSandbox(system);
        start(sandbox);

        await expect(sandbox.step()).resolves.toBe(true);
        await expect(sandbox.step()).resolves.toBe(true);

        expect(order).toEqual(['exec1', 'fin1', 'exec2']);
    });

    // 验证 notExecuted 收尾失败触发告警码 175 并停止
    it('warns code 175 when notExecuted fails', async () => {
        const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        const system = new ReplaySystem();
        system.registerCommand(
            1,
            createCommand(
                async () => true,
                async () => false
            )
        );
        system.registerCommand(
            2,
            createCommand(async () => true)
        );
        system.record(1);
        system.record(2);
        const sandbox = createSandbox(system);
        start(sandbox);

        await expect(sandbox.step()).resolves.toBe(true);
        await expect(sandbox.step()).resolves.toBe(false);

        expect(warn).toHaveBeenCalledWith(175, '1');
    });

    // 验证读取流过期时触发告警码 156 并返回 false
    it('warns code 156 when the read stream expired', async () => {
        const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        const system = new ReplaySystem();
        system.registerCommand(
            1,
            createCommand(async () => true)
        );
        system.record(1);
        const sandbox = createSandbox(system);
        start(sandbox);
        system.route.add(1, []);

        await expect(sandbox.step()).resolves.toBe(false);

        expect(warn).toHaveBeenCalledWith(156);
    });

    // 验证沙箱从指定起始索引开始读取并正确报告已播放步数
    it('starts from the configured index and counts replayed steps', async () => {
        const executed: number[] = [];
        const system = new ReplaySystem();
        system.registerCommand(
            1,
            createCommand(async step => {
                executed.push(step.index);
                return true;
            })
        );
        system.record(1);
        system.record(1);
        system.record(1);
        const sandbox = system.createReplaySandbox({
            route: system.route,
            reseter: { reset: () => {} },
            startIndex: 2
        }) as IManualReplaySandbox;
        start(sandbox);

        expect(sandbox.getReplayed()).toBe(2);
        await expect(sandbox.step()).resolves.toBe(true);
        expect(executed).toEqual([3]);
    });
});

describe('ReplaySandbox playback control', () => {
    // 验证 play 依次执行全部步骤并在结束时置位 ended
    it('plays through every step and marks the sandbox ended', async () => {
        const order: number[] = [];
        const system = new ReplaySystem();
        system.registerCommand(
            1,
            createCommand(async step => {
                order.push(step.index);
                return true;
            })
        );
        system.record(1);
        system.record(1);
        const sandbox = createSandbox(system);
        const startHook = vi.fn();
        sandbox.addHook({ onStartReplay: startHook }).load();

        sandbox.play();
        await waitForEnded(sandbox);

        expect(startHook).toHaveBeenCalledTimes(1);
        expect(sandbox.playing).toBe(true);
        expect(sandbox.ended).toBe(true);
        expect(order).toEqual([1, 2]);
    });

    // 验证已在播放时再次 play 不重复触发 onStartReplay
    it('does not restart an already playing sandbox', async () => {
        const system = new ReplaySystem();
        const deferred = createDeferred();
        system.registerCommand(
            1,
            createCommand(() => deferred.promise)
        );
        system.record(1);
        const sandbox = createSandbox(system);
        const startHook = vi.fn();
        sandbox.addHook({ onStartReplay: startHook }).load();

        sandbox.play();
        sandbox.play();
        deferred.resolve(true);
        await waitForEnded(sandbox);

        expect(startHook).toHaveBeenCalledTimes(1);
    });

    // 验证播放结束后再次 play 是空操作
    it('ignores play after the replay ended', async () => {
        const system = new ReplaySystem();
        system.registerCommand(
            1,
            createCommand(async () => true)
        );
        system.record(1);
        const sandbox = createSandbox(system);
        const startHook = vi.fn();
        sandbox.addHook({ onStartReplay: startHook }).load();

        sandbox.play();
        await waitForEnded(sandbox);
        sandbox.play();

        expect(sandbox.ended).toBe(true);
        expect(startHook).toHaveBeenCalledTimes(1);
    });

    // 验证 pause 在暂停点兑现且 resume 从暂停点继续执行
    it('pauses at the next step boundary and resumes', async () => {
        const order: number[] = [];
        const first = createDeferred();
        const system = new ReplaySystem();
        system.registerCommand(
            1,
            createCommand(step => {
                order.push(step.index);
                return step.index === 1 ? first.promise : Promise.resolve(true);
            })
        );
        system.record(1);
        system.record(1);
        const sandbox = createSandbox(system);
        const pauseHook = vi.fn();
        const resumeHook = vi.fn();
        sandbox
            .addHook({
                onPauseReplay: pauseHook,
                onResumeReplay: resumeHook
            })
            .load();

        sandbox.play();
        const paused = sandbox.pause();
        first.resolve(true);
        await paused;

        expect(pauseHook).toHaveBeenCalledTimes(1);
        expect(sandbox.pausing).toBe(true);
        expect(order).toEqual([1]);

        sandbox.resume();
        await waitForEnded(sandbox);

        expect(resumeHook).toHaveBeenCalledTimes(1);
        expect(sandbox.ended).toBe(true);
        expect(order).toEqual([1, 2]);
    });

    // 验证 stop 先暂停播放并触发 onStopReplay
    it('pauses and dispatches onStopReplay on stop', async () => {
        const first = createDeferred();
        const system = new ReplaySystem();
        system.registerCommand(
            1,
            createCommand(() => first.promise)
        );
        system.record(1);
        const sandbox = createSandbox(system);
        const pauseHook = vi.fn();
        const stopHook = vi.fn();
        sandbox
            .addHook({
                onPauseReplay: pauseHook,
                onStopReplay: stopHook
            })
            .load();

        sandbox.play();
        const stopped = sandbox.stop();
        first.resolve(true);
        await stopped;

        expect(pauseHook).toHaveBeenCalledTimes(1);
        expect(stopHook).toHaveBeenCalledTimes(1);
        expect(sandbox.pausing).toBe(true);
    });

    // 验证 play 遇到过期读取流时告警码 156 且不进入播放
    it('warns code 156 when playing with an expired stream', async () => {
        const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        const system = new ReplaySystem();
        system.registerCommand(
            1,
            createCommand(async () => true)
        );
        system.record(1);
        const sandbox = createSandbox(system);
        system.route.add(1, []);

        sandbox.play();
        await new Promise<void>(resolve => setTimeout(resolve, 0));

        expect(warn).toHaveBeenCalledWith(156);
        expect(sandbox.ended).toBe(false);
    });

    // 验证 setSpeed 触发 onSpeedSet 并更新播放倍率
    it('dispatches onSpeedSet when the speed changes', () => {
        const system = new ReplaySystem();
        const sandbox = createSandbox(system);
        const speedHook = vi.fn();
        sandbox.addHook({ onSpeedSet: speedHook }).load();

        sandbox.setSpeed(2);

        expect(sandbox.speed).toBe(2);
        expect(speedHook).toHaveBeenCalledWith(2);
    });
});
