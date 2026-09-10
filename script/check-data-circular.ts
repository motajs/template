import madge from 'madge';
import { relative, resolve } from 'node:path';

const root = process.cwd();
const entries = [
    'packages-user/data-common/src/index.ts',
    'packages-user/data-base/src/index.ts',
    'packages-user/data-system/src/index.ts',
    'packages-user/data-state/src/index.ts',
    'packages/common/src/index.ts'
];
const dataPrefixes = [
    'packages-user/data-common/',
    'packages-user/data-base/',
    'packages-user/data-system/',
    'packages-user/data-state/'
];

function toRelativePath(file: string): string {
    const absolute = resolve(root, file);
    return relative(root, absolute).replaceAll('\\', '/');
}

function isInScope(cycle: readonly string[]): boolean {
    return cycle.some(file => {
        const normalized = file.replaceAll('\\', '/');
        return (
            normalized.includes('packages/common/') ||
            dataPrefixes.some(prefix => normalized.includes(prefix))
        );
    });
}

const graph = await madge(entries, {
    baseDir: root,
    tsConfig: resolve(root, 'tsconfig.json'),
    fileExtensions: ['ts', 'tsx'],
    detectiveOptions: { ts: { skipTypeImports: false } }
});
const cycles = graph.circular() as readonly (readonly string[])[];
const inScope = cycles.filter(isInScope);
const outsideScope = cycles.filter(cycle => !isInScope(cycle));

console.log(
    `Circular diagnostics: ${cycles.length} total, ${inScope.length} in-scope, ${outsideScope.length} outside scope`
);
for (const [index, cycle] of inScope.entries()) {
    console.log(`IN-SCOPE CYCLE ${index + 1}:`);
    console.log(cycle.map(toRelativePath).join(' -> '));
}
for (const [index, cycle] of outsideScope.entries()) {
    console.log(`OUTSIDE-SCOPE CYCLE ${index + 1}:`);
    console.log(cycle.map(toRelativePath).join(' -> '));
}

if (inScope.length > 0) {
    console.error(
        'Circular gate failed: four-package, common/data-common, or transitive common cycles remain'
    );
    process.exit(1);
}

console.log(
    'Circular gate passed: four data packages and the transitive common boundary are acyclic'
);
