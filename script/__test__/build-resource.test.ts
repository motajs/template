import {
    mkdtemp,
    mkdir,
    readFile,
    rm,
    stat,
    writeFile
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildContent } from '../build-resource';

const tempDirs: string[] = [];

/** 创建独立的临时 fixture 根目录，并登记以便用例结束后统一清理 */
async function createRoot() {
    const root = await mkdtemp(join(tmpdir(), 'mota-content-filter-'));
    tempDirs.push(root);
    return root;
}

/** 在 fixture 的源目录下写入文件，必要时创建父目录 */
async function writeSource(
    root: string,
    name: string,
    content: string | Buffer
) {
    const file = join(root, 'src', name);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, content);
    return file;
}

/** 以空字符集执行一次 content 构建 */
function buildFixture(root: string) {
    return buildContent({
        sourceDir: join(root, 'src'),
        outputDir: join(root, 'out'),
        chars: ''
    });
}

/** 读取输出目录中的文本文件 */
function readOutput(root: string, name: string) {
    return readFile(join(root, 'out', name), 'utf-8');
}

/** 判断输出目录中是否存在指定文件 */
async function outputExists(root: string, name: string) {
    try {
        await stat(join(root, 'out', name));
        return true;
    } catch {
        return false;
    }
}

afterEach(async () => {
    const dirs = tempDirs.splice(0);
    await Promise.all(
        dirs.map(dir => rm(dir, { recursive: true, force: true }))
    );
});

describe('buildContent', () => {
    // 根目录的 jsonc 必须去掉整行注释并压成纯 JSON，后缀保持不变
    it('minifies a root jsonc file', async () => {
        const root = await createRoot();
        await writeSource(
            root,
            'core.jsonc',
            '// Type: IGameCore\n// --- SYSTEM PREFIX END --- //\n{ "floorId": "MT0" }\n'
        );

        const stats = await buildFixture(root);
        const output = await readOutput(root, 'core.jsonc');

        expect(JSON.parse(output)).toEqual({ floorId: 'MT0' });
        expect(output).not.toContain('//');
        expect(stats.jsonc).toBe(1);
    });

    // 根目录即使出现 .list.jsonc 也必须全量输出，根调用显式跳过清单过滤
    it('keeps every root file even when a root list exists', async () => {
        const root = await createRoot();
        await writeSource(root, '.list.jsonc', '["core"]\n');
        await writeSource(root, 'core.jsonc', '{ "value": 1 }\n');
        await writeSource(root, 'other.jsonc', '{ "value": 2 }\n');

        await buildFixture(root);

        expect(await outputExists(root, 'core.jsonc')).toBe(true);
        expect(await outputExists(root, 'other.jsonc')).toBe(true);
        expect(await outputExists(root, '.list.jsonc')).toBe(true);
    });

    // defaults 目录即使存在 .list.jsonc 也必须全量输出并压缩
    it('keeps every defaults file even when a defaults list exists', async () => {
        const root = await createRoot();
        await writeSource(root, 'defaults/.list.jsonc', '["env"]\n');
        await writeSource(
            root,
            'defaults/env.jsonc',
            '// Type: env\n{ "value": 1 }\n'
        );
        await writeSource(root, 'defaults/other.jsonc', '{ "value": 2 }\n');

        await buildFixture(root);

        expect(await outputExists(root, 'defaults/env.jsonc')).toBe(true);
        expect(await outputExists(root, 'defaults/other.jsonc')).toBe(true);
        expect(await outputExists(root, 'defaults/.list.jsonc')).toBe(true);
        expect(await readOutput(root, 'defaults/other.jsonc')).not.toContain(
            '//'
        );
        expect(
            JSON.parse(await readOutput(root, 'defaults/.list.jsonc'))
        ).toEqual(['env']);
    });

    // maps 清单带注释时先剥离注释，再按清单保留文件并剔除未引用文件
    it('filters a maps directory by its list', async () => {
        const root = await createRoot();
        await writeSource(
            root,
            'maps/.list.jsonc',
            '// Type: string[], without .jsonc suffix\n// --- SYSTEM PREFIX END --- //\n["keep"]\n'
        );
        await writeSource(root, 'maps/keep.jsonc', '{ "value": "keep" }\n');
        await writeSource(root, 'maps/drop.jsonc', '{ "value": "drop" }\n');

        await buildFixture(root);

        expect(await outputExists(root, 'maps/keep.jsonc')).toBe(true);
        expect(await outputExists(root, 'maps/drop.jsonc')).toBe(false);
        expect(await outputExists(root, 'maps/.list.jsonc')).toBe(true);
        const list = await readOutput(root, 'maps/.list.jsonc');
        expect(list).not.toContain('//');
        expect(JSON.parse(list)).toEqual(['keep']);
    });

    // texture 清单是对象形态且使用完整文件名，命中文件按字节原样拷贝
    it('filters a texture directory by object list and full file name', async () => {
        const root = await createRoot();
        await writeSource(
            root,
            'texture/.list.jsonc',
            '{"textures":[{"type":"grid","source":"a.png"}]}\n'
        );
        const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x01, 0x02]);
        await writeSource(root, 'texture/a.png', bytes);
        await writeSource(root, 'texture/b.png', Buffer.from([0x03]));

        await buildFixture(root);

        expect(await outputExists(root, 'texture/a.png')).toBe(true);
        expect(await outputExists(root, 'texture/b.png')).toBe(false);
        const output = await readFile(join(root, 'out', 'texture', 'a.png'));
        expect(Buffer.compare(output, bytes)).toBe(0);
    });

    // font 清单按完整文件名保留，未引用文件被剔除
    it('filters a font directory by its list', async () => {
        const root = await createRoot();
        await writeSource(root, 'font/.list.jsonc', '["ok.fake"]\n');
        await writeSource(root, 'font/ok.fake', 'ok');
        await writeSource(root, 'font/skip.fake', 'skip');

        await buildFixture(root);

        expect(await outputExists(root, 'font/ok.fake')).toBe(true);
        expect(await outputExists(root, 'font/skip.fake')).toBe(false);
    });

    // 没有清单的非 defaults 子文件夹必须全量输出
    it('keeps every file in a sub directory without a list', async () => {
        const root = await createRoot();
        await writeSource(
            root,
            'extra/free.jsonc',
            '// Type: free\n{ "value": 1 }\n'
        );
        await writeSource(root, 'extra/free.txt', 'free');

        await buildFixture(root);

        expect(await outputExists(root, 'extra/free.txt')).toBe(true);
        expect(await readOutput(root, 'extra/free.jsonc')).not.toContain('//');
    });

    // 根目录的非 jsonc 文件按原样拷贝
    it('copies a root non-jsonc file verbatim', async () => {
        const root = await createRoot();
        const source = 'export const item = 1;\n';
        await writeSource(root, 'item.ts', source);

        await buildFixture(root);

        expect(await readOutput(root, 'item.ts')).toBe(source);
    });

    // 统计结果必须与实际输出文件数一致
    it('reports stats matching the emitted files', async () => {
        const root = await createRoot();
        await writeSource(root, 'core.jsonc', '{ "value": 1 }\n');
        await writeSource(root, 'maps/.list.jsonc', '["keep"]\n');
        await writeSource(root, 'maps/keep.jsonc', '{ "value": 2 }\n');
        await writeSource(root, 'maps/drop.jsonc', '{ "value": 3 }\n');

        const stats = await buildFixture(root);

        expect(stats.files).toBe(3);
        expect(stats.jsonc).toBe(3);
        expect(stats.fonts).toBe(0);
    });
});
