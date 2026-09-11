import madge from 'madge';
import { pathToFileURL } from 'node:url';
import { relative, resolve } from 'node:path';

const root = process.cwd();
const entries = [
    'packages-user/data-common/src/index.ts',
    'packages-user/data-base/src/index.ts',
    'packages-user/data-system/src/index.ts',
    'packages-user/data-state/src/index.ts',
    'packages/common/src/index.ts'
];
const compatibilityPrefixes = [
    'packages-user/data-state/src/legacy/',
    'packages-user/client-modules/'
];
const approvedPrefixes = [
    'packages-user/data-common/',
    'packages-user/data-base/',
    'packages-user/data-system/',
    'packages/common/'
];

export type CircularCycle = readonly string[];

export interface CycleClassification {
    normalizedCycle: CircularCycle;
    compatibilityOnly: boolean;
    approvedScope: boolean;
    inScope: boolean;
}

export type FixtureName =
    | 'legacy-only'
    | 'client-only'
    | 'legacy-data'
    | 'legacy-common';

interface FixtureCycles {
    readonly [name: string]: readonly CircularCycle[];
}

const fixtureCycles: FixtureCycles = {
    'legacy-only': [
        [
            'packages-user/data-state/src/legacy/map.ts',
            'packages-user/data-state/src/legacy/move.ts'
        ]
    ],
    'client-only': [
        [
            'packages-user/client-modules/map.ts',
            'packages-user/client-modules/render.ts'
        ]
    ],
    'legacy-data': [
        [
            'packages-user/data-state/src/legacy/move.ts',
            'packages-user/data-base/src/hero/state.ts'
        ]
    ],
    'legacy-common': [
        [
            'packages-user/data-state/src/legacy/move.ts',
            'packages/common/src/utils/types.ts'
        ]
    ]
};

function normalizePath(file: string): string {
    return file.replaceAll('\\', '/').replace(/^\.\//, '');
}

function isCompatibilityPath(file: string): boolean {
    return compatibilityPrefixes.some(prefix => file.startsWith(prefix));
}

function isApprovedPath(file: string): boolean {
    if (file.startsWith('packages-user/data-state/')) {
        return !file.startsWith('packages-user/data-state/src/legacy/');
    }
    return approvedPrefixes.some(prefix => file.startsWith(prefix));
}

export function classifyCycle(cycle: CircularCycle): CycleClassification {
    const normalizedCycle = cycle.map(normalizePath);
    const compatibilityOnly = normalizedCycle.every(isCompatibilityPath);
    const approvedScope = normalizedCycle.some(isApprovedPath);
    return {
        normalizedCycle,
        compatibilityOnly,
        approvedScope,
        inScope: !compatibilityOnly && approvedScope
    };
}

export function isInScope(cycle: CircularCycle): boolean {
    return classifyCycle(cycle).inScope;
}

function toRelativePath(file: string): string {
    const absolute = resolve(root, file);
    return relative(root, absolute).replaceAll('\\', '/');
}

function reportCycles(cycles: readonly CircularCycle[]): number {
    const classifications = cycles.map(classifyCycle);
    const inScope = classifications.filter(
        classification => classification.inScope
    );
    const outsideScope = classifications.filter(
        classification => !classification.inScope
    );

    console.log(
        `Circular diagnostics: ${cycles.length} total, ${inScope.length} in-scope, ${outsideScope.length} outside scope`
    );
    for (const [index, classification] of inScope.entries()) {
        console.log(`IN-SCOPE CYCLE ${index + 1}:`);
        console.log(
            classification.normalizedCycle.map(toRelativePath).join(' -> ')
        );
    }
    for (const [index, classification] of outsideScope.entries()) {
        console.log(`OUTSIDE-SCOPE CYCLE ${index + 1}:`);
        console.log(
            classification.normalizedCycle.map(toRelativePath).join(' -> ')
        );
    }

    if (inScope.length > 0) {
        console.error(
            'Circular gate failed: four-package, common/data-common, or transitive common cycles remain'
        );
        return 1;
    }

    console.log(
        'Circular gate passed: four data packages and the transitive common boundary are acyclic'
    );
    return 0;
}

function parseFixture(args: readonly string[]): FixtureName | undefined {
    if (args.length === 0) {
        return undefined;
    }
    if (args.length !== 2 || args[0] !== '--fixture') {
        throw new Error(
            'Usage: pnpm exec tsx script/check-data-circular.ts [--fixture <legacy-only|client-only|legacy-data|legacy-common>]'
        );
    }
    const fixture = args[1];
    if (!Object.hasOwn(fixtureCycles, fixture)) {
        throw new Error(`Unknown circular fixture: ${fixture}`);
    }
    return fixture as FixtureName;
}

async function loadRepositoryCycles(): Promise<readonly CircularCycle[]> {
    const graph = await madge(entries, {
        baseDir: root,
        tsConfig: resolve(root, 'tsconfig.json'),
        fileExtensions: ['ts', 'tsx'],
        detectiveOptions: { ts: { skipTypeImports: false } }
    });
    return graph.circular() as readonly CircularCycle[];
}

function isMainModule(): boolean {
    return process.argv[1]
        ? pathToFileURL(resolve(process.argv[1])).href === import.meta.url
        : false;
}

async function main(): Promise<void> {
    const fixture = parseFixture(process.argv.slice(2));
    const cycles = fixture
        ? fixtureCycles[fixture]
        : await loadRepositoryCycles();
    const exitCode = reportCycles(cycles);
    if (exitCode !== 0) {
        process.exit(1);
    }
}

if (isMainModule()) {
    main().catch(error => {
        console.error(error instanceof Error ? error.message : error);
        process.exit(2);
    });
}
