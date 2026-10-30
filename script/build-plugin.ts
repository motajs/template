import { Plugin } from 'vite';
import { ModuleInfo } from 'rollup';
import ts from 'typescript';

/** 数据端构建中禁止出现的渲染端模块说明符，第一项为匹配规则，第二项为报错时的命中标记 */
const SPECIFIER_BANS: ReadonlyArray<readonly [RegExp, string]> = [
    [/^@user\/client-/, '@user/client-'],
    [/^@user\/entry-client(?:\/|$)/, '@user/entry-client'],
    [/^@motajs\/render(?:[/-]|$)/, '@motajs/render'],
    [/^@motajs\/client(?:[/-]|$)/, '@motajs/client'],
    [/^@motajs\/system(?:[/-]|$)/, '@motajs/system'],
    [/^@motajs\/audio(?:[/-]|$)/, '@motajs/audio'],
    [/^@motajs\/legacy-/, '@motajs/legacy-'],
    [/^vue(?:\/|$)/, 'vue'],
    [/^@vue\//, '@vue/'],
    [/^ant-design-vue(?:\/|$)/, 'ant-design-vue'],
    [/^@ant-design\/icons-vue(?:\/|$)/, '@ant-design/icons-vue']
];

/** 数据端构建中禁止出现的渲染端模块解析路径，第一项为匹配规则，第二项为报错时的命中标记 */
const PATH_BANS: ReadonlyArray<readonly [RegExp, string]> = [
    [/[/\\]packages-user[/\\]client-/, 'packages-user/client-'],
    [/[/\\]packages[/\\]render(?:[/\\-]|$)/, 'packages/render'],
    [/[/\\]packages[/\\]render-vue(?:[/\\-]|$)/, 'packages/render-vue'],
    [/[/\\]packages[/\\]client(?:[/\\-]|$)/, 'packages/client'],
    [/[/\\]packages[/\\]system(?:[/\\-]|$)/, 'packages/system'],
    [/[/\\]packages[/\\]audio(?:[/\\-]|$)/, 'packages/audio'],
    [/[/\\]packages[/\\]legacy-/, 'packages/legacy-'],
    [/[/\\]src[/\\]client(?:[/\\]|$)/, 'src/client'],
    [
        /[/\\]node_modules[/\\](?:vue|@vue|ant-design-vue|@ant-design)(?:[/\\]|$)/,
        'node_modules'
    ]
];

/**
 * 在禁令集合中查找命中的规则
 * @param bans 禁令集合
 * @param value 待匹配的模块说明符或解析路径
 */
function findBan(
    bans: ReadonlyArray<readonly [RegExp, string]>,
    value: string
) {
    return bans.find(ban => ban[0].test(value));
}

/**
 * 创建数据端构建的隔离检查插件，禁止数据端模块图引用任何渲染端模块。
 * 说明符经 `resolveId` 拦截，别名解析后的真实路径经 `moduleParsed` 兜底。
 */
export function dataIsolationPlugin(): Plugin {
    return {
        name: 'mota-data-isolation',
        enforce: 'pre',
        apply: 'build',
        resolveId(source, importer) {
            const ban = findBan(SPECIFIER_BANS, source);
            if (ban) {
                this.error(
                    `[mota-data-isolation] data-side build must not depend on render-side module "${source}" ` +
                        `(matched: ${ban[1]}). Importer: ${importer ?? '<entry>'}`
                );
            }
            return null;
        },
        moduleParsed(info: ModuleInfo) {
            const ban = findBan(PATH_BANS, info.id);
            if (!ban) return;
            const importers = this.getModuleInfo(info.id)!.importers;
            this.error(
                `[mota-data-isolation] data-side build must not depend on render-side module "${info.id}" ` +
                    `(matched: ${ban[1]}). Importers: ${
                        importers.length > 0 ? importers.join(', ') : '<entry>'
                    }`
            );
        }
    };
}

/** 构建时需要删除的录像装饰器名称 */
const REPLAY_DECORATORS: ReadonlyArray<string> = [
    'shouldReplay',
    'ignoreReplay'
];
/** 需要处理录像装饰器的源文件后缀 */
const SCRIPT_EXTENSIONS: ReadonlyArray<string> = ['.ts', '.tsx'];
/** 判定第三方依赖路径的 node_modules 片段 */
const NODE_MODULES_SEGMENT = /[/\\]node_modules[/\\]/;

/**
 * 删除源码中所有录像装饰器的应用，只按装饰器节点的文本范围切片，不会误删字符串与注释。
 * @param code 源码文本
 * @param fileName 源码文件名，用于确定脚本种类
 */
export function removeReplayDecorators(code: string, fileName: string): string {
    const kind = fileName.endsWith('.tsx')
        ? ts.ScriptKind.TSX
        : ts.ScriptKind.TS;
    const sourceFile = ts.createSourceFile(
        fileName,
        code,
        ts.ScriptTarget.Latest,
        true,
        kind
    );
    const ranges: Array<[number, number]> = [];
    const stack: ts.Node[] = [sourceFile];

    while (stack.length > 0) {
        const node = stack.pop()!;
        if (ts.canHaveDecorators(node)) {
            const decorators = ts.getDecorators(node);
            if (decorators) {
                for (const decorator of decorators) {
                    const expression = decorator.expression;
                    const target = ts.isCallExpression(expression)
                        ? expression.expression
                        : expression;
                    if (
                        ts.isIdentifier(target) &&
                        REPLAY_DECORATORS.includes(target.text)
                    ) {
                        ranges.push([
                            decorator.getStart(sourceFile),
                            decorator.getEnd()
                        ]);
                    }
                }
            }
        }
        ts.forEachChild(node, child => {
            stack.push(child);
        });
    }

    if (ranges.length === 0) return code;

    let result = code;
    ranges.sort((a, b) => b[0] - a[0]);
    for (const [start, end] of ranges) {
        result = result.slice(0, start) + result.slice(end);
    }
    return result;
}

/**
 * 创建删除录像装饰器的构建插件，仅处理项目自身的 TypeScript 源码，跳过第三方依赖。
 */
export function replayDecoratorPlugin(): Plugin {
    return {
        name: 'mota-replay-decorator',
        enforce: 'pre',
        apply: 'build',
        transform(code, id) {
            const fileName = id.split('?')[0];
            if (NODE_MODULES_SEGMENT.test(fileName)) return null;
            const matched = SCRIPT_EXTENSIONS.some(extension =>
                fileName.endsWith(extension)
            );
            if (!matched) return null;
            const result = removeReplayDecorators(code, fileName);
            if (result === code) return null;
            return { code: result, map: null };
        }
    };
}
