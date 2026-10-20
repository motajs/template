import { build } from 'vite';
import { RollupOutput } from 'rollup';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { dataIsolationPlugin } from './build-plugin';

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
