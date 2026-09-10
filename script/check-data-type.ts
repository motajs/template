import { spawnSync } from 'node:child_process';
import { isAbsolute, relative, resolve } from 'node:path';

const root = process.cwd();
const dataPackages = [
    'packages-user/data-common/',
    'packages-user/data-base/',
    'packages-user/data-system/',
    'packages-user/data-state/'
];

interface ITypeDiagnostic {
    readonly file: string;
    readonly line: number;
    readonly column: number;
    readonly code: string;
    readonly message: string;
}

function toRelativePath(file: string): string {
    const absolute = isAbsolute(file) ? file : resolve(root, file);
    return relative(root, absolute).replaceAll('\\', '/');
}

function isDataPath(file: string): boolean {
    const normalized = toRelativePath(file);
    return dataPackages.some(prefix => normalized.startsWith(prefix));
}

function parseDiagnostics(output: string): {
    readonly diagnostics: readonly ITypeDiagnostic[];
    readonly unparsed: readonly string[];
} {
    const diagnostics: ITypeDiagnostic[] = [];
    const unparsed: string[] = [];
    const pattern =
        /^(.*?\.(?:ts|tsx|vue))\((\d+),(\d+)\): error (TS\d+): (.*)$/;

    for (const line of output.split(/\r?\n/)) {
        if (!line.includes('error TS')) continue;
        const match = pattern.exec(line);
        if (!match) {
            unparsed.push(line);
            continue;
        }
        diagnostics.push({
            file: toRelativePath(match[1]),
            line: Number(match[2]),
            column: Number(match[3]),
            code: match[4],
            message: match[5]
        });
    }

    return { diagnostics, unparsed };
}

const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const result = spawnSync(
    command,
    ['exec', 'vue-tsc', '--noEmit', '--pretty', 'false'],
    { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' }
);

if (result.error) {
    console.error(
        `type gate could not execute vue-tsc: ${result.error.message}`
    );
    process.exit(1);
}

const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
const { diagnostics, unparsed } = parseDiagnostics(output);
const inScope = diagnostics.filter(diagnostic => isDataPath(diagnostic.file));
const outsideScope = diagnostics.filter(
    diagnostic => !isDataPath(diagnostic.file)
);

console.log(
    `Type diagnostics: ${diagnostics.length} total, ${inScope.length} in-scope, ${outsideScope.length} outside scope`
);
for (const diagnostic of inScope) {
    console.log(
        `IN-SCOPE ${diagnostic.file}:${diagnostic.line}:${diagnostic.column} ${diagnostic.code}: ${diagnostic.message}`
    );
}
for (const diagnostic of outsideScope) {
    console.log(
        `OUTSIDE-SCOPE ${diagnostic.file}:${diagnostic.line}:${diagnostic.column} ${diagnostic.code}: ${diagnostic.message}`
    );
}

if (unparsed.length > 0) {
    console.error('Unparsed TypeScript diagnostics; failing closed:');
    for (const line of unparsed) console.error(line);
    process.exit(1);
}

if (inScope.length > 0) {
    console.error('Type gate failed on in-scope data-package diagnostics');
    process.exit(1);
}

console.log('Type gate passed: zero in-scope data-package diagnostics');
