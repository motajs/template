import { build, loadConfigFromFile, mergeConfig, UserConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import { resolve } from 'path';
import { copy, emptyDir, ensureDir } from 'fs-extra';
import { readdir, readFile, stat } from 'fs/promises';
import { dataIsolationPlugin } from './build-plugin';
import { buildContent } from './build-resource';
import { formatSize } from './utils';

/** 打包调试 */
const DEBUG_BUILD = false;
/** 录像验证调试 */
const DEBUG_REPLAY = false;

const ansi = {
    clear: '\x1b[2J\x1b[0f'
};

const distDir = resolve(process.cwd(), 'dist');
const tempDir = resolve(process.cwd(), '_temp');

const enum ProgressStatus {
    Success,
    Fail,
    Working,
    Warn
}

/**
 * 输出构建步骤
 * @param step 步骤数
 * @param final 最后一步的状态
 */
function logProgress(step: number, final: ProgressStatus) {
    const list = [
        `1. 构建前准备`,
        `2. 构建渲染端`,
        `3. 构建数据端`,
        `4. 处理 content`,
        `5. 收尾`
    ];

    const str = list.reduce((prev, curr, idx) => {
        if (idx > step) {
            return prev;
        } else if (idx === step) {
            switch (final) {
                case ProgressStatus.Fail:
                    return prev + `❌  ${curr}\r\n错误信息：\r\n`;
                case ProgressStatus.Success:
                    return prev + `✅  ${curr}\r\n`;
                case ProgressStatus.Working:
                    return prev + `🔄  ${curr}\r\n`;
                case ProgressStatus.Warn:
                    return prev + `⚠️   ${curr}\r\n`;
            }
        } else {
            return prev + `✅  ${curr}\r\n`;
        }
    }, '');

    process.stdout.write(ansi.clear);
    process.stdout.write(str);
}

/**
 * 构建渲染端代码，以 index.html 为默认入口输出到 dist
 * @param outDir 输出目录
 */
async function buildClient(outDir: string) {
    const configFile = resolve(process.cwd(), 'vite.config.ts');
    const config = await loadConfigFromFile(
        { command: 'build', mode: 'production' },
        configFile
    );
    const resolved = mergeConfig(config?.config ?? {}, {
        plugins: [
            legacy({
                targets: [
                    'Chrome >= 56',
                    'Firefox >= 51',
                    'Edge >= 79',
                    'Safari >= 15',
                    'Opera >= 43'
                ],
                polyfills: true,
                renderModernChunks: false
            })
        ],
        build: {
            outDir,
            copyPublicDir: false,
            emptyOutDir: false,
            minify: !DEBUG_BUILD,
            rollupOptions: {
                external: ['@wasm-audio-decoders/opus-ml'],
                output: {
                    format: 'es',
                    entryFileNames: '[name].[hash].js',
                    chunkFileNames: 'chunks/[name].[hash].js',
                    assetFileNames: 'assets/[name].[hash][extname]',
                    manualChunks: {
                        antdv: ['ant-design-vue', '@ant-design/icons-vue'],
                        audio: [
                            'codec-parser',
                            'opus-decoder',
                            'ogg-opus-decoder',
                            '@wasm-audio-decoders/ogg-vorbis'
                        ]
                    }
                }
            }
        }
    } satisfies UserConfig);

    return build({
        ...resolved,
        configFile: false
    });
}

/**
 * 以库模式构建数据端代码，入口产物固定为 dist/data.js
 * @param outDir 输出目录
 * @param entry 数据端入口文件
 */
async function buildData(outDir: string, entry: string) {
    const configFile = resolve(process.cwd(), 'vite.config.ts');
    const config = await loadConfigFromFile(
        { command: 'build', mode: 'production' },
        configFile
    );
    const resolved = mergeConfig(config?.config ?? {}, {
        plugins: [dataIsolationPlugin()],
        build: {
            outDir,
            copyPublicDir: false,
            emptyOutDir: false,
            minify: !DEBUG_REPLAY,
            lib: {
                entry,
                fileName: 'data',
                formats: ['es']
            },
            rollupOptions: {
                output: {
                    entryFileNames: 'data.js',
                    chunkFileNames: 'data/[name].[hash].js',
                    assetFileNames: 'data/[name].[hash][extname]'
                }
            }
        }
    } satisfies UserConfig);

    return build({
        ...resolved,
        configFile: false
    });
}

/**
 * 递归收集目录下的文件
 * @param dir 待遍历目录
 * @param output 收集结果
 * @param extension 需要保留的扩展名
 * @param ignored 需要跳过的目录
 */
async function collectFiles(
    dir: string,
    output: string[],
    extension: string,
    ignored: string[] = []
) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = resolve(dir, entry.name);
        if (entry.isDirectory()) {
            if (ignored.includes(full)) continue;
            await collectFiles(full, output, extension, ignored);
        } else if (entry.name.endsWith(extension)) {
            output.push(full);
        }
    }
}

/**
 * 收集渲染端产物与 content 中出现的全部字符，用于字体子集化
 */
async function getAllChars(): Promise<string> {
    const chars = new Set<string>();
    const files: string[] = [];

    await collectFiles(distDir, files, '.js', [
        resolve(distDir, 'data'),
        resolve(distDir, 'content')
    ]);
    await collectFiles(resolve(process.cwd(), 'src/content'), files, '.jsonc');

    for (const file of files) {
        const text = await readFile(file, 'utf-8');
        for (const char of text) chars.add(char);
    }

    return [...chars].join('');
}

/**
 * 递归统计目录体积
 * @param dir 待统计目录
 */
async function getDirectorySize(dir: string): Promise<number> {
    const entries = await readdir(dir, { withFileTypes: true });
    let total = 0;
    for (const entry of entries) {
        const full = resolve(dir, entry.name);
        if (entry.isDirectory()) {
            total += await getDirectorySize(full);
        } else {
            total += (await stat(full)).size;
        }
    }
    return total;
}

async function buildGame() {
    logProgress(0, ProgressStatus.Working);

    await ensureDir(distDir);
    await ensureDir(tempDir);
    await emptyDir(distDir);
    await emptyDir(tempDir);

    logProgress(1, ProgressStatus.Working);

    await buildClient(distDir);

    logProgress(2, ProgressStatus.Working);

    await buildData(distDir, resolve(process.cwd(), 'src/data.ts'));

    logProgress(3, ProgressStatus.Working);

    const chars = await getAllChars();
    const content = await buildContent({
        sourceDir: resolve(process.cwd(), 'src/content'),
        outputDir: resolve(distDir, 'content'),
        chars
    });

    logProgress(4, ProgressStatus.Working);

    await copy(resolve(process.cwd(), 'LICENSE'), resolve(distDir, 'LICENSE'));

    logProgress(4, ProgressStatus.Success);

    const dataStats = await stat(resolve(distDir, 'data.js'));
    const totalSize = await getDirectorySize(distDir);

    process.stdout.write(`✅  构建已完成！\r\n`);
    process.stdout.write(
        `数据端入口：data.js（${formatSize(dataStats.size)}）\r\n`
    );
    process.stdout.write(
        `content：${content.files} 个文件，其中 ${content.jsonc} 个 jsonc、${content.fonts} 个字体\r\n`
    );
    process.stdout.write(`dist 体积：${formatSize(totalSize)}\r\n`);
    process.stdout.write(`游戏已经输出至 dist 文件夹\r\n`);
}

// Execute
buildGame().catch(reason => {
    process.stderr.write(String(reason));
    process.exit(1);
});
