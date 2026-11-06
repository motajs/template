import { build, Plugin } from 'vite';
import { RollupOutput } from 'rollup';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
    dataIsolationPlugin,
    removeReplayDecorators,
    replayDecoratorPlugin
} from '../build-plugin';

const tempDirs: string[] = [];

/** 创建独立的临时构建根目录，并登记以便用例结束后统一清理 */
async function createRoot() {
    const root = await mkdtemp(join(tmpdir(), 'mota-data-isolation-'));
    tempDirs.push(root);
    return root;
}

/** 在临时根目录下写入文件，必要时创建父目录，返回写入后的绝对路径 */
async function writeRootFile(root: string, name: string, content: string) {
    const file = join(root, name);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, content, 'utf8');
    return file;
}

/** 探测构建的配置 */
interface IProbeBuildOptions {
    /** 临时构建根目录 */
    readonly root: string;
    /** 入口文件绝对路径 */
    readonly entry: string;
    /** 参与构建的插件列表 */
    readonly plugins: Plugin[];
}

/** 以库模式 ESM 执行一次真实的 vite 构建，返回全部 chunk 代码 */
async function buildProbe(options: IProbeBuildOptions) {
    const result = (await build({
        configFile: false,
        root: options.root,
        logLevel: 'silent',
        build: {
            write: false,
            minify: false,
            copyPublicDir: false,
            lib: {
                entry: options.entry,
                formats: ['es'],
                fileName: 'probe'
            }
        },
        plugins: options.plugins
    })) as RollupOutput | RollupOutput[];
    const outputs = Array.isArray(result) ? result : [result];
    return outputs
        .flatMap(v => v.output)
        .filter(v => v.type === 'chunk')
        .map(v => v.code)
        .join('\n');
}

type TransformHook = (code: string, id: string) => { code: string } | null;

/** 取出插件 transform 钩子的可调用形式，兼容对象式钩子 */
function getTransform(plugin: Plugin): TransformHook {
    const hook: unknown = plugin.transform;
    if (typeof hook === 'function') {
        return hook as TransformHook;
    }
    return (hook as { handler: TransformHook }).handler;
}

/** 以数据端库模式 ESM 配置执行一次真实的 vite 构建 */
function buildFixture(root: string, entry: string) {
    return build({
        configFile: false,
        root,
        logLevel: 'silent',
        build: {
            write: false,
            minify: false,
            copyPublicDir: false,
            lib: {
                entry,
                formats: ['es'],
                fileName: 'data'
            }
        },
        plugins: [dataIsolationPlugin()]
    });
}

/** 执行构建并返回错误信息，构建成功时返回空字符串 */
async function getBuildError(root: string, entry: string) {
    try {
        await buildFixture(root, entry);
    } catch (e) {
        return String(e);
    }
    return '';
}

/** 录像装饰器探测源码：工厂函数本地定义且不导出，两个方法各带一种装饰器并返回唯一字面量 */
const PROBE_SOURCE = `
function shouldReplay(message: string) {
    return function (method: unknown) {
        return method;
    };
}
function ignoreReplay(_msg: string) {
    return function (method: unknown) {
        return method;
    };
}
export class Probe {
    @shouldReplay('replay probe')
    replayProbe(): string {
        return 'mota_replay_probe';
    }
    @ignoreReplay('ignore probe')
    ignoreProbe(): string {
        return 'mota_ignore_probe';
    }
}
`;

afterEach(async () => {
    const dirs = tempDirs.splice(0);
    await Promise.all(
        dirs.map(dir => rm(dir, { recursive: true, force: true }))
    );
});

describe('dataIsolationPlugin', () => {
    // 直接引入 vue 说明符的数据端模块必须被插件拒绝
    it('rejects a render-side specifier', async () => {
        const root = await createRoot();
        const entry = await writeRootFile(root, 'entry.ts', "import 'vue';\n");

        const message = await getBuildError(root, entry);

        expect(message).toContain('[mota-data-isolation]');
        expect(message).toContain('matched: vue');
        expect(message).toContain(
            'data-side build must not depend on render-side'
        );
    });

    // 相对引入的 src/client 渲染目录必须按解析路径被 moduleParsed 拒绝
    it('rejects a resolved src/client module', async () => {
        const root = await createRoot();
        await writeRootFile(
            root,
            'src/client/ui/fake.ts',
            'export const fake = 1;\n'
        );
        const entry = await writeRootFile(
            root,
            'entry.ts',
            "import './src/client/ui/fake';\n"
        );

        const message = await getBuildError(root, entry);

        expect(message).toContain('[mota-data-isolation]');
        expect(message).toContain('matched: src/client');
    });

    // 相对引入的 packages-user/client-* 必须按解析路径被 moduleParsed 拒绝
    it('rejects a resolved packages-user client package', async () => {
        const root = await createRoot();
        await writeRootFile(
            root,
            'packages-user/client-modules/fake.ts',
            'export const fake = 1;\n'
        );
        const entry = await writeRootFile(
            root,
            'entry.ts',
            "import './packages-user/client-modules/fake';\n"
        );

        const message = await getBuildError(root, entry);

        expect(message).toContain('[mota-data-isolation]');
        expect(message).toContain('matched: packages-user/client-');
    });

    // 纯数据端依赖必须通过构建并产出 ESM 代码
    it('passes a pure data-side graph and emits ESM', async () => {
        const root = await createRoot();
        await writeRootFile(
            root,
            'packages-user/data-common/fake.ts',
            'export const value = 1;\n'
        );
        const entry = await writeRootFile(
            root,
            'entry.ts',
            "export { value } from './packages-user/data-common/fake';\n"
        );

        const result = (await buildFixture(root, entry)) as
            | RollupOutput
            | RollupOutput[];
        const outputs = Array.isArray(result) ? result : [result];
        const code = outputs
            .flatMap(v => v.output)
            .filter(v => v.type === 'chunk')
            .map(v => v.code)
            .join('\n');

        expect(code).toContain('export');
    });
});

describe('removeReplayDecorators', () => {
    // 方法上方的 @shouldReplay 调用装饰器必须被整段删除，类与方法保持原样
    it('removes a shouldReplay decorator', () => {
        const code = [
            'export class Sample {',
            "    @shouldReplay('should be replayed')",
            '    run(): void {}',
            '}'
        ].join('\n');

        const output = removeReplayDecorators(code, 'sample.ts');

        expect(output).not.toContain('@shouldReplay');
        expect(output).toContain('run(): void {}');
        expect(output).toContain('export class Sample');
    });

    // 方法上方的 @ignoreReplay 调用装饰器同样必须被整段删除
    it('removes an ignoreReplay decorator', () => {
        const code = [
            'export class Sample {',
            "    @ignoreReplay('async content')",
            '    run(): void {}',
            '}'
        ].join('\n');

        const output = removeReplayDecorators(code, 'sample.ts');

        expect(output).not.toContain('@ignoreReplay');
        expect(output).toContain('run(): void {}');
    });

    // 参数含双引号、逗号与嵌套括号时也必须整段删除，不残留括号或字符串碎片
    it('removes a decorator with quoted and nested arguments', () => {
        const code = [
            'export class Sample {',
            '    @shouldReplay("a (nested) call, with \'quotes\'")',
            '    run(): void {}',
            '}'
        ].join('\n');

        const output = removeReplayDecorators(code, 'sample.ts');

        expect(output).not.toContain('@shouldReplay');
        expect(output).not.toContain('nested');
        expect(output).not.toContain('quotes');
        expect(output).toContain('run(): void {}');
    });

    // 字符串字面量中出现的同名文本不得被删除
    it('keeps the same text inside string literals', () => {
        const code = [
            'export const message = "@shouldReplay inside a string";',
            'export class Sample {',
            '    run(): void {}',
            '}'
        ].join('\n');

        const output = removeReplayDecorators(code, 'sample.ts');

        expect(output).toBe(code);
        expect(output).toContain('@shouldReplay inside a string');
    });

    // 注释中出现的同名文本不得被删除
    it('keeps the same text inside comments', () => {
        const code = [
            '// @shouldReplay is applied here in the real source',
            'export class Sample {',
            '    run(): void {}',
            '}'
        ].join('\n');

        const output = removeReplayDecorators(code, 'sample.ts');

        expect(output).toBe(code);
        expect(output).toContain('@shouldReplay is applied');
    });
});

describe('replayDecoratorPlugin', () => {
    // 插件必须跳过 node_modules 与非 TypeScript 文件，只改写项目自身的源码
    it('skips node_modules and non-TypeScript files', async () => {
        const root = await createRoot();
        const transform = getTransform(replayDecoratorPlugin());
        const code = [
            'export class Sample {',
            "    @shouldReplay('should be replayed')",
            '    run(): void {}',
            '}'
        ].join('\n');

        expect(
            transform(code, join(root, 'node_modules', 'dep', 'a.ts'))
        ).toBeNull();
        expect(transform(code, join(root, 'src', 'a.css'))).toBeNull();

        const result = transform(code, join(root, 'src', 'a.ts'));
        expect(result).not.toBeNull();
        expect(result!.code).not.toContain('@shouldReplay');
    });

    // 对照构建证明 token 在未处理时确实存在，实验构建证明只删装饰器而未删类与方法
    it('strips decorators in a real build without dropping class members', async () => {
        const root = await createRoot();
        const entry = await writeRootFile(root, 'probe.ts', PROBE_SOURCE);

        const control = await buildProbe({ root, entry, plugins: [] });
        expect(control).toContain('shouldReplay');
        expect(control).toContain('ignoreReplay');
        expect(control).toContain('mota_replay_probe');
        expect(control).toContain('mota_ignore_probe');
        expect(control).toContain('replayProbe');
        expect(control).toContain('ignoreProbe');

        const stripped = await buildProbe({
            root,
            entry,
            plugins: [replayDecoratorPlugin()]
        });
        expect(stripped).not.toContain('shouldReplay');
        expect(stripped).not.toContain('ignoreReplay');
        expect(stripped).toContain('mota_replay_probe');
        expect(stripped).toContain('mota_ignore_probe');
        expect(stripped).toContain('replayProbe');
        expect(stripped).toContain('ignoreProbe');
    });
});
