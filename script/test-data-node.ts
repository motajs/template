import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
    IHeroAttr,
    IReplayArray,
    IReplayCommand,
    IReplaySandbox,
    IReplaySystem
} from '@user/data-common';
import { CoreState } from '../packages-user/data-state/src/core.ts';

interface IReplayVerifierLayerSnapshot {
    readonly zIndex: number;
    readonly matrix: Uint32Array;
}

interface IReplayVerifierFloorSnapshot {
    readonly floorId: string;
    readonly layers: readonly IReplayVerifierLayerSnapshot[];
}

interface IReplayVerifierExpectedSnapshot {
    readonly hero: IHeroAttr;
    readonly maps: readonly IReplayVerifierFloorSnapshot[];
}

interface IReplayVerifierSnapshot {
    readonly hero: IHeroAttr;
    readonly maps: readonly IReplayVerifierFloorSnapshot[];
}

interface IReplayVerifierRuntime {
    readonly route: IReplayArray;
    readonly expected: IReplayVerifierExpectedSnapshot;
    readonly sandbox: { readonly ended: boolean };
    getCommand(code: number): IReplayCommand | null;
    step(): Promise<boolean>;
    finish(): Promise<void>;
    snapshot(): IReplayVerifierSnapshot;
}

interface IVerifierModule {
    verifyReplay(runtime: IReplayVerifierRuntime): Promise<void>;
}

interface IClosedLoopFixture {
    readonly state: CoreState;
    readonly replay: IReplaySystem;
    readonly route: IReplayArray;
    readonly sandbox: IReplaySandbox;
    readonly expected: IReplayVerifierExpectedSnapshot;
}

interface IClosedLoopModule {
    createClosedLoopFixture(): IClosedLoopFixture;
}

interface IManualReplaySandbox extends IReplaySandbox {
    pausing: boolean;
    playing: boolean;
}

const require = createRequire(import.meta.url);
const verifierModule =
    require('../packages-user/data-state/test/replayVerifier.ts') as IVerifierModule;

function captureMaps(
    state: CoreState
): readonly IReplayVerifierFloorSnapshot[] {
    const floors: IReplayVerifierFloorSnapshot[] = [];
    for (const [floorId, map] of state.maps.iterateAllMaps()) {
        const layers: IReplayVerifierLayerSnapshot[] = [];
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
    await verifierModule.verifyReplay(createRuntime(fixture));
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
