import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import {
    IReplayArray,
    IReplayCommand,
    IReplaySandbox,
    IReplayStepHandler,
    IReplaySystem,
    IHeroAttr,
    ReplayParamValue
} from '@user/data-common';
import { CoreState } from '../packages-user/data-state/src/core.ts';

interface IClosedLoopLayerSnapshot {
    readonly zIndex: number;
    readonly matrix: Uint32Array;
}

interface IClosedLoopFloorSnapshot {
    readonly floorId: string;
    readonly layers: readonly IClosedLoopLayerSnapshot[];
}

interface IClosedLoopExpectedSnapshot {
    readonly hero: IHeroAttr;
    readonly maps: readonly IClosedLoopFloorSnapshot[];
}

interface IClosedLoopFixture {
    readonly state: CoreState;
    readonly replay: IReplaySystem;
    readonly route: IReplayArray;
    readonly sandbox: IReplaySandbox;
    readonly expected: IClosedLoopExpectedSnapshot;
}

interface IClosedLoopModule {
    createClosedLoopFixture(): IClosedLoopFixture;
}

const require = createRequire(import.meta.url);

interface IReplayVerifierSandbox {
    readonly ended: boolean;
}

interface IManualReplaySandbox extends IReplaySandbox {
    pausing: boolean;
    playing: boolean;
}

export interface IReplayVerifierSnapshot {
    readonly hero: IHeroAttr;
    readonly maps: readonly IClosedLoopFloorSnapshot[];
}

export interface IReplayVerifierRuntime {
    readonly route: IReplayArray;
    readonly expected: IClosedLoopExpectedSnapshot;
    readonly sandbox: IReplayVerifierSandbox;
    getCommand(code: number): IReplayCommand | null;
    step(): Promise<boolean>;
    finish(): Promise<void>;
    snapshot(): IReplayVerifierSnapshot;
}

class ReplayVerifierError extends Error {
    readonly index: number;
    readonly code: number;
    readonly params: readonly ReplayParamValue[];
    readonly reason: string;

    constructor(
        index: number,
        code: number,
        params: readonly ReplayParamValue[],
        reason: string
    ) {
        const copiedParams = Array.from(params);
        super(
            `Replay verifier divergence: index=${index}; code=${code}; params=${formatReplayParams(copiedParams)}; reason=${reason}`
        );
        this.index = index;
        this.code = code;
        this.params = copiedParams;
        this.reason = reason;
    }
}

function formatThrownReason(error: unknown): string {
    if (error instanceof Error) return error.message;
    return Object.prototype.toString.call(error);
}

function createDiagnostic(
    step: IReplayStepHandler | null,
    index: number,
    reason: string
): ReplayVerifierError {
    return new ReplayVerifierError(
        index,
        step?.command ?? 0,
        step?.params ?? [],
        reason
    );
}

function getLastStep(route: IReplayArray): IReplayStepHandler | null {
    return route.length === 0 ? null : route.get(route.length - 1);
}

function compareHero(expected: IHeroAttr, actual: IHeroAttr): string | null {
    const expectedKeys = Object.keys(expected);
    const actualKeys = Object.keys(actual);
    if (expectedKeys.length !== actualKeys.length) {
        return `hero attribute key count differs: expected ${expectedKeys.length}, actual ${actualKeys.length}`;
    }
    for (const key of expectedKeys) {
        if (!Object.hasOwn(actual, key)) {
            return `hero attribute ${key} is missing`;
        }
        const expectedValue = expected[key as keyof IHeroAttr];
        const actualValue = actual[key as keyof IHeroAttr];
        if (!Object.is(expectedValue, actualValue)) {
            return `hero attribute ${key} differs: expected ${String(expectedValue)}, actual ${String(actualValue)}`;
        }
    }
    return null;
}

function compareMaps(
    expected: readonly IClosedLoopFloorSnapshot[],
    actual: readonly IClosedLoopFloorSnapshot[]
): string | null {
    if (expected.length !== actual.length) {
        return `map floor count differs: expected ${expected.length}, actual ${actual.length}`;
    }
    for (let floorIndex = 0; floorIndex < expected.length; floorIndex++) {
        const expectedFloor = expected[floorIndex];
        const actualFloor = actual[floorIndex];
        if (expectedFloor.floorId !== actualFloor.floorId) {
            return `map floor ${floorIndex} differs: expected ${expectedFloor.floorId}, actual ${actualFloor.floorId}`;
        }
        if (expectedFloor.layers.length !== actualFloor.layers.length) {
            return `map floor ${expectedFloor.floorId} layer count differs: expected ${expectedFloor.layers.length}, actual ${actualFloor.layers.length}`;
        }
        for (
            let layerIndex = 0;
            layerIndex < expectedFloor.layers.length;
            layerIndex++
        ) {
            const expectedLayer = expectedFloor.layers[layerIndex];
            const actualLayer = actualFloor.layers[layerIndex];
            if (expectedLayer.zIndex !== actualLayer.zIndex) {
                return `map floor ${expectedFloor.floorId} layer ${layerIndex} z-index differs: expected ${expectedLayer.zIndex}, actual ${actualLayer.zIndex}`;
            }
            if (expectedLayer.matrix.length !== actualLayer.matrix.length) {
                return `map floor ${expectedFloor.floorId} layer ${expectedLayer.zIndex} length differs: expected ${expectedLayer.matrix.length}, actual ${actualLayer.matrix.length}`;
            }
            for (let cell = 0; cell < expectedLayer.matrix.length; cell++) {
                const expectedValue = expectedLayer.matrix[cell];
                const actualValue = actualLayer.matrix[cell];
                if (expectedValue !== actualValue) {
                    return `map floor ${expectedFloor.floorId} layer ${expectedLayer.zIndex} index ${cell} differs: expected ${expectedValue}, actual ${actualValue}`;
                }
            }
        }
    }
    return null;
}

export function formatReplayParams(
    params: readonly ReplayParamValue[]
): string {
    return `[${params.map(formatReplayParam).join(', ')}]`;
}

function formatReplayParam(param: ReplayParamValue): string {
    switch (typeof param) {
        case 'bigint':
            return `${param.toString()}n`;
        case 'string':
            return JSON.stringify(param);
        case 'number':
            if (Object.is(param, -0)) return '-0';
            if (Number.isNaN(param)) return 'NaN';
            if (param === Infinity) return 'Infinity';
            if (param === -Infinity) return '-Infinity';
            return param.toString();
        default:
            return param ? 'true' : 'false';
    }
}

export async function verifyReplay(
    runtime: IReplayVerifierRuntime
): Promise<void> {
    for (let index = 0; index < runtime.route.length; index++) {
        const step = runtime.route.get(index);
        const command = runtime.getCommand(step.command);
        if (!command) {
            throw createDiagnostic(
                step,
                index,
                `unknown replay command code ${step.command}`
            );
        }
        let success: boolean;
        try {
            success = await runtime.step();
        } catch (error) {
            throw createDiagnostic(
                step,
                index,
                `command threw: ${formatThrownReason(error)}`
            );
        }
        if (!success) {
            throw createDiagnostic(step, index, 'command returned false');
        }
    }

    const lastStep = getLastStep(runtime.route);
    try {
        await runtime.finish();
    } catch (error) {
        throw createDiagnostic(
            lastStep,
            lastStep?.index ?? 0,
            `replay did not reach normal end: ${formatThrownReason(error)}`
        );
    }
    if (!runtime.sandbox.ended) {
        throw createDiagnostic(
            lastStep,
            lastStep?.index ?? 0,
            'replay did not reach normal end'
        );
    }

    const actual = runtime.snapshot();
    const heroReason = compareHero(runtime.expected.hero, actual.hero);
    if (heroReason) {
        throw createDiagnostic(lastStep, lastStep?.index ?? 0, heroReason);
    }
    const mapReason = compareMaps(runtime.expected.maps, actual.maps);
    if (mapReason) {
        throw createDiagnostic(lastStep, lastStep?.index ?? 0, mapReason);
    }
}

function captureMaps(state: CoreState): readonly IClosedLoopFloorSnapshot[] {
    const floors: IClosedLoopFloorSnapshot[] = [];
    for (const [floorId, map] of state.maps.iterateAllMaps()) {
        const layers: IClosedLoopLayerSnapshot[] = [];
        for (const layer of map.layerList) {
            layers.push({
                zIndex: layer.zIndex,
                matrix: new Uint32Array(layer.getMapData())
            });
        }
        layers.sort((first, second) => first.zIndex - second.zIndex);
        floors.push({ floorId, layers });
    }
    return floors;
}

async function waitForEnded(sandbox: IReplaySandbox): Promise<void> {
    for (let index = 0; index < 1000 && !sandbox.ended; index++) {
        await new Promise<void>(resolvePromise =>
            setTimeout(resolvePromise, 0)
        );
    }
    if (!sandbox.ended) throw new Error('replay did not reach normal end');
}

function createRuntime(fixture: IClosedLoopFixture): IReplayVerifierRuntime {
    const sandbox = fixture.sandbox as IManualReplaySandbox;
    sandbox.pausing = false;
    sandbox.playing = true;
    return {
        route: fixture.route,
        expected: fixture.expected,
        sandbox,
        getCommand: (code: number) => fixture.replay.getCommand(code),
        step: () => sandbox.step(),
        finish: async () => {
            sandbox.playing = false;
            sandbox.pausing = true;
            sandbox.play();
            await waitForEnded(sandbox);
        },
        snapshot: () => ({
            hero: fixture.state.hero.attribute.toStructured(),
            maps: captureMaps(fixture.state)
        })
    };
}

export async function runNodeReplayVerifier(): Promise<void> {
    const closedLoopModule =
        require('../packages-user/data-state/test/fixtures/closed-loop.ts') as IClosedLoopModule;
    const fixture = closedLoopModule.createClosedLoopFixture();
    await verifyReplay(createRuntime(fixture));
}

const isMainModule =
    process.argv[1] !== undefined &&
    import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMainModule) {
    runNodeReplayVerifier()
        .then(() => {
            process.stdout.write('Node replay verifier passed\n');
        })
        .catch(error => {
            const message =
                error instanceof Error ? error.message : String(error);
            process.stderr.write(`${message}\n`);
            process.exitCode = 1;
        });
}
