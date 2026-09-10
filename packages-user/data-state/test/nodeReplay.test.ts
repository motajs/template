import { describe, expect, it } from 'vitest';
import { IReplayCommand, ReplayParamValue } from '@user/data-common';
import { ReplaySystem } from '../../data-common/src/replay/system';
import {
    IReplayVerifierRuntime,
    IReplayVerifierSnapshot,
    verifyReplay
} from '../../../script/test-data-node';

enum TestCommandOutcome {
    Success,
    False,
    Throw
}

interface ITestStep {
    readonly code: number;
    readonly params: readonly ReplayParamValue[];
}

interface ITestHarnessOptions {
    readonly steps: readonly ITestStep[];
    readonly commands: ReadonlyMap<number, IReplayCommand>;
    readonly actual?: IReplayVerifierSnapshot;
}

interface ITestHarness {
    readonly runtime: IReplayVerifierRuntime;
    readonly calls: number[];
    readonly finished: () => boolean;
}

interface ITestLayerSnapshot {
    readonly zIndex: number;
    readonly matrix: Uint32Array;
}

interface ITestFloorSnapshot {
    readonly floorId: string;
    readonly layers: readonly ITestLayerSnapshot[];
}

interface ITestExpectedSnapshot {
    readonly hero: {
        name: string;
        hp: number;
        hpmax: number;
        atk: number;
        def: number;
        mdef: number;
        mana: number;
        manamax: number;
        money: number;
        exp: number;
    };
    readonly maps: readonly ITestFloorSnapshot[];
}

interface IVerifierDiagnostic {
    readonly index: number;
    readonly code: number;
    readonly params: readonly ReplayParamValue[];
    readonly reason: string;
    readonly message: string;
}

function createSnapshot(): ITestExpectedSnapshot {
    const layer: ITestLayerSnapshot = {
        zIndex: 20,
        matrix: new Uint32Array([1, 2])
    };
    const floor: ITestFloorSnapshot = {
        floorId: 'F1',
        layers: [layer]
    };
    return {
        hero: {
            name: '',
            hp: 1,
            hpmax: 0,
            atk: 0,
            def: 0,
            mdef: 0,
            mana: 0,
            manamax: 0,
            money: 0,
            exp: 0
        },
        maps: [floor]
    };
}

function createCommand(
    outcome: TestCommandOutcome,
    calls: number[],
    message: string = 'test command failure'
): IReplayCommand {
    return {
        execute: async step => {
            calls.push(step.index);
            if (outcome === TestCommandOutcome.Throw) {
                throw new Error(message);
            }
            return outcome === TestCommandOutcome.Success;
        }
    };
}

function createHarness(options: ITestHarnessOptions): ITestHarness {
    const replay = new ReplaySystem();
    for (const step of options.steps) {
        replay.record(step.code, ...step.params);
    }
    for (const [code, command] of options.commands) {
        replay.registerCommand(code, command);
    }
    const calls: number[] = [];
    const sandbox = { ended: false };
    let cursor = 0;
    const runtime: IReplayVerifierRuntime = {
        route: replay.route,
        expected: createSnapshot(),
        sandbox,
        getCommand: code => replay.getCommand(code),
        step: async () => {
            const step = replay.route.get(cursor++);
            const command = replay.getCommand(step.command);
            if (!command) return false;
            return command.execute(step);
        },
        finish: async () => {
            sandbox.ended = true;
        },
        snapshot: () => options.actual ?? createSnapshot()
    };
    return {
        runtime,
        calls,
        finished: () => sandbox.ended
    };
}

async function expectDiagnostic(
    runtime: IReplayVerifierRuntime
): Promise<IVerifierDiagnostic> {
    let failure: unknown = null;
    try {
        await verifyReplay(runtime);
    } catch (error) {
        failure = error;
    }
    expect(failure).not.toBeNull();
    expect(failure).toMatchObject({
        index: expect.any(Number),
        code: expect.any(Number),
        params: expect.any(Array),
        reason: expect.any(String)
    });
    return failure as IVerifierDiagnostic;
}

describe('Node replay verifier', () => {
    // 验证固定成功路径在正常结束后比较完整勇士属性与所有地图矩阵
    it('accepts a successful replay after end-only snapshot comparison', async () => {
        const calls: number[] = [];
        const command = createCommand(TestCommandOutcome.Success, calls);
        const harness = createHarness({
            steps: [{ code: 0, params: [] }],
            commands: new Map([[0, command]])
        });

        await verifyReplay(harness.runtime);

        expect(calls).toEqual([0]);
        expect(harness.finished()).toBe(true);
    });

    // 验证未知命令在首个索引立即抛出并使用确定性安全参数展示
    it('throws the first unknown-command diagnostic without executing a step', async () => {
        const harness = createHarness({
            steps: [{ code: 99, params: [1, 'safe', true, 2n] }],
            commands: new Map()
        });

        const failure = await expectDiagnostic(harness.runtime);

        expect(failure.index).toBe(0);
        expect(failure.code).toBe(99);
        expect(failure.params).toEqual([1, 'safe', true, 2n]);
        expect(failure.reason).toContain('unknown replay command code 99');
        expect(failure.message).toContain('params=[1, "safe", true, 2n]');
        expect(harness.finished()).toBe(false);
    });

    // 验证 false 结果在首个索引停止且不会执行后续录像指令
    it('throws on a false command result and stops before later commands', async () => {
        const calls: number[] = [];
        const first = createCommand(TestCommandOutcome.False, calls);
        const second = createCommand(TestCommandOutcome.Success, calls);
        const harness = createHarness({
            steps: [
                { code: 5, params: [7] },
                { code: 6, params: [] }
            ],
            commands: new Map([
                [5, first],
                [6, second]
            ])
        });

        const failure = await expectDiagnostic(harness.runtime);

        expect(failure.index).toBe(0);
        expect(failure.code).toBe(5);
        expect(failure.params).toEqual([7]);
        expect(failure.reason).toBe('command returned false');
        expect(calls).toEqual([0]);
        expect(harness.finished()).toBe(false);
    });

    // 验证 command throw 在首个索引停止并保留原始参数与可读原因
    it('throws on a command exception and does not execute later commands', async () => {
        const calls: number[] = [];
        const first = createCommand(TestCommandOutcome.Throw, calls, 'boom');
        const second = createCommand(TestCommandOutcome.Success, calls);
        const harness = createHarness({
            steps: [
                { code: 6, params: ['first'] },
                { code: 7, params: ['later'] }
            ],
            commands: new Map([
                [6, first],
                [7, second]
            ])
        });

        const failure = await expectDiagnostic(harness.runtime);

        expect(failure.index).toBe(0);
        expect(failure.code).toBe(6);
        expect(failure.params).toEqual(['first']);
        expect(failure.reason).toBe('command threw: boom');
        expect(calls).toEqual([0]);
        expect(harness.finished()).toBe(false);
    });

    // 验证勇士完整属性差异只在录像正常结束后报告
    it('reports a hero snapshot mismatch only after normal end', async () => {
        const calls: number[] = [];
        const actual = createSnapshot();
        actual.hero.hp = 2;
        const harness = createHarness({
            steps: [{ code: 0, params: [] }],
            commands: new Map([
                [0, createCommand(TestCommandOutcome.Success, calls)]
            ]),
            actual
        });

        const failure = await expectDiagnostic(harness.runtime);

        expect(failure.index).toBe(0);
        expect(failure.code).toBe(0);
        expect(failure.reason).toContain('hero attribute hp differs');
        expect(calls).toEqual([0]);
        expect(harness.finished()).toBe(true);
    });

    // 验证所有地图图层矩阵差异只在录像正常结束后报告
    it('reports a map matrix mismatch only after normal end', async () => {
        const calls: number[] = [];
        const actual = createSnapshot();
        actual.maps[0].layers[0].matrix[1] = 9;
        const harness = createHarness({
            steps: [{ code: 0, params: [] }],
            commands: new Map([
                [0, createCommand(TestCommandOutcome.Success, calls)]
            ]),
            actual
        });

        const failure = await expectDiagnostic(harness.runtime);

        expect(failure.index).toBe(0);
        expect(failure.code).toBe(0);
        expect(failure.reason).toContain(
            'map floor F1 layer 20 index 1 differs'
        );
        expect(calls).toEqual([0]);
        expect(harness.finished()).toBe(true);
    });
});
