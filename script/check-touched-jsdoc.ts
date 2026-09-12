import { readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import ts from 'typescript';

type DeclarationKind = 'constructor' | 'function' | 'method';

interface IInventoryEntry {
    readonly file: string;
    readonly symbol: string;
    readonly kind: DeclarationKind;
    readonly line: number;
    readonly exempt: boolean;
    readonly hasMultilineJsDoc: boolean;
}

function toDisplayPath(file: string): string {
    return relative(process.cwd(), resolve(file)).replaceAll('\\', '/');
}

function hasMultilineJsDoc(node: ts.Node, source: ts.SourceFile): boolean {
    const ranges = ts.getLeadingCommentRanges(source.text, node.getFullStart());
    if (!ranges || ranges.length === 0) return false;
    const range = ranges[ranges.length - 1];
    const comment = source.text.slice(range.pos, range.end);
    if (!comment.startsWith('/**')) return false;
    if (!/^\/\*\*\r?\n/.test(comment)) return false;
    return /\r?\n\s*\*\/$/.test(comment);
}

function createEntry(
    file: string,
    symbol: string,
    kind: DeclarationKind,
    node: ts.Node,
    source: ts.SourceFile,
    exempt: boolean
): IInventoryEntry {
    const position = source.getLineAndCharacterOfPosition(
        node.getStart(source)
    );
    return {
        file,
        symbol,
        kind,
        line: position.line + 1,
        exempt,
        hasMultilineJsDoc: hasMultilineJsDoc(node, source)
    };
}

function collectEntries(
    file: string,
    source: ts.SourceFile
): IInventoryEntry[] {
    const entries: IInventoryEntry[] = [];
    for (const statement of source.statements) {
        if (ts.isFunctionDeclaration(statement) && statement.name) {
            entries.push(
                createEntry(
                    file,
                    statement.name.text,
                    'function',
                    statement,
                    source,
                    false
                )
            );
            continue;
        }
        if (!ts.isClassDeclaration(statement) || !statement.name) continue;
        const owner = statement.name.text;
        for (const member of statement.members) {
            if (ts.isConstructorDeclaration(member)) {
                entries.push(
                    createEntry(
                        file,
                        `${owner}.constructor`,
                        'constructor',
                        member,
                        source,
                        true
                    )
                );
                continue;
            }
            if (
                ts.isMethodDeclaration(member) ||
                ts.isGetAccessorDeclaration(member) ||
                ts.isSetAccessorDeclaration(member)
            ) {
                entries.push(
                    createEntry(
                        file,
                        `${owner}.${member.name.getText(source)}`,
                        'method',
                        member,
                        source,
                        false
                    )
                );
            }
        }
    }
    return entries;
}

function readEntries(file: string): IInventoryEntry[] {
    const text = readFileSync(file, 'utf8');
    const source = ts.createSourceFile(
        file,
        text,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS
    );
    return collectEntries(toDisplayPath(file), source);
}

function report(entries: readonly IInventoryEntry[]): number {
    console.log(`Touched JSDoc inventory: ${entries.length} declarations`);
    for (const entry of entries) {
        const status = entry.exempt
            ? 'EXEMPT'
            : entry.hasMultilineJsDoc
              ? 'MULTILINE'
              : 'MISSING';
        console.log(
            `INVENTORY ${entry.file}:${entry.line} ${entry.symbol} [${entry.kind}] ${status}`
        );
    }

    const constructors = entries.filter(entry => entry.exempt);
    if (constructors.length > 0) {
        console.log(
            `Constructors explicitly exempt from JSDoc: ${constructors
                .map(entry => entry.symbol)
                .join(', ')}`
        );
    }

    const violations = entries.filter(
        entry => !entry.exempt && !entry.hasMultilineJsDoc
    );
    if (violations.length > 0) {
        console.error(
            'check-touched-jsdoc failed: multiline JSDoc missing for'
        );
        for (const violation of violations) {
            console.error(
                `  ${violation.file}:${violation.line} ${violation.symbol} [${violation.kind}]`
            );
        }
        return 1;
    }

    console.log(
        'check-touched-jsdoc passed: every non-constructor declaration has multiline JSDoc'
    );
    return 0;
}

function main(): void {
    const files = process.argv.slice(2);
    if (files.length === 0) {
        console.error(
            'Usage: pnpm exec tsx script/check-touched-jsdoc.ts <file...>'
        );
        process.exit(1);
    }
    const entries = files.flatMap(readEntries);
    if (report(entries) !== 0) process.exit(1);
}

try {
    main();
} catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(2);
}
