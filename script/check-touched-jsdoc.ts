// 门禁：检查「显式传入的文件」中的非构造器声明是否带多行 JSDoc。
//
// 背景：本脚本由 Phase 03 Plan 03-19 引入，只用于校验本次修正触及的 replay/event
// 文件，不是仓库级 lint，也未接入 CI / pre-commit，仅由 verify 命令按文件名显式调用。
//
// 检查范围：
// - 只盘点顶层 function 声明与类的方法 / getter / setter。
// - 不盘点 interface 成员、类型别名、枚举、类属性、对象字面量及箭头函数成员。
// - 判定只看声明前是否存在多行 /** ... */（开符号单独占行、结束符号单独占行）。
//
// 重要：本脚本不读取注释内容，也不判断注释是否正确、过时或重复。MISSING 只表示
// 「缺少多行 JSDoc」这一格式问题，与已有注释的内容无关。修复 MISSING 时不得删除、
// 改写或降级任何已有注释：应补一段多行 JSDoc；若确属继承 / implements 而来的 API，
// 则依赖 hasBaseMember 的豁免规则（对应 dev.md「继承或 implements 而来的 API 不应
// 重复添加 jsDoc」）。
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

// dev.md：继承或 implements 而来的 API 在实现处不应重复添加 JSDoc，
// 其说明由源头负责；外部库（如 @motajs/anon-tokyo）的源头不在本仓库检查范围内
function hasBaseMember(
    classDecl: ts.ClassDeclaration,
    memberName: string,
    checker: ts.TypeChecker
): boolean {
    for (const clause of classDecl.heritageClauses ?? []) {
        for (const typeNode of clause.types) {
            const baseType = checker.getTypeAtLocation(typeNode);
            if (baseType.getProperty(memberName)) return true;
        }
    }
    return false;
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
    source: ts.SourceFile,
    checker: ts.TypeChecker | null
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
                const name = member.name.getText(source);
                const inherited = checker
                    ? hasBaseMember(statement, name, checker)
                    : false;
                entries.push(
                    createEntry(
                        file,
                        `${owner}.${name}`,
                        'method',
                        member,
                        source,
                        inherited
                    )
                );
            }
        }
    }
    return entries;
}

function createCheckedProgram(files: readonly string[]): ts.Program | null {
    try {
        const configPath = ts.findConfigFile(
            process.cwd(),
            ts.sys.fileExists,
            'tsconfig.json'
        );
        if (!configPath) return null;
        const config = ts.readConfigFile(configPath, ts.sys.readFile);
        if (config.error) return null;
        const parsed = ts.parseJsonConfigFileContent(
            config.config,
            ts.sys,
            process.cwd()
        );
        return ts.createProgram(
            files.map(file => resolve(file)),
            parsed.options
        );
    } catch {
        return null;
    }
}

function readEntries(
    file: string,
    program: ts.Program | null,
    checker: ts.TypeChecker | null
): IInventoryEntry[] {
    const source =
        program?.getSourceFile(resolve(file)) ??
        ts.createSourceFile(
            file,
            readFileSync(file, 'utf8'),
            ts.ScriptTarget.Latest,
            true,
            ts.ScriptKind.TS
        );
    return collectEntries(toDisplayPath(file), source, checker);
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
            `Declarations exempt from JSDoc (constructor or inherited): ${constructors
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
        console.error(
            '  注意：MISSING 仅表示缺少多行 JSDoc，与注释内容无关；修复时不得删除或改写已有注释'
        );
        return 1;
    }

    console.log(
        'check-touched-jsdoc passed: every non-exempt declaration has multiline JSDoc'
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
    const program = createCheckedProgram(files);
    const checker = program?.getTypeChecker() ?? null;
    if (!checker) {
        console.error(
            'check-touched-jsdoc warning: TypeScript program unavailable — inherited members cannot be detected'
        );
    }
    const entries = files.flatMap(file => readEntries(file, program, checker));
    if (report(entries) !== 0) process.exit(1);
}

try {
    main();
} catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(2);
}
