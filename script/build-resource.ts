import Fontmin from 'fontmin';
import { copy } from 'fs-extra';
import { mkdir, readdir, readFile, writeFile } from 'fs/promises';
import { basename, dirname, extname, join } from 'path';

/** 需要经 fontmin 做字形子集化的字体扩展名 */
const FONT_EXTENSIONS = ['.ttf', '.otf', '.woff', '.woff2'];

/** 子目录中声明保留素材的清单文件名，清单自身始终会压缩输出 */
const LIST_FILE_NAME = '.list.jsonc';

/** 永远全量输出、不参与清单过滤的素材目录名 */
const DEFAULTS_DIRECTORY = 'defaults';

export interface IContentBuildOptions {
    /** content 素材的源目录 */
    readonly sourceDir: string;
    /** content 素材的输出目录 */
    readonly outputDir: string;
    /** 参与字体子集化的全部字符 */
    readonly chars: string;
}

export interface IContentBuildStats {
    /** 处理的文件总数 */
    readonly files: number;
    /** 压缩的 jsonc 文件数 */
    readonly jsonc: number;
    /** 压缩的字体文件数 */
    readonly fonts: number;
}

interface IContentBuildCounter {
    files: number;
    jsonc: number;
    fonts: number;
}

/**
 * 将 jsonc 文本压缩为单行纯 JSON，按行去掉全部 `//` 注释与系统标记行。
 * @param text jsonc 原文
 */
export function minifyJSONC(text: string): string {
    const body = text
        .split(/\r?\n/)
        .filter(line => !line.trim().startsWith('//'))
        .join('\n');
    return JSON.stringify(JSON.parse(body));
}

/**
 * 读取清单文件并收集其中声明的全部文件标识，清单中的注释会先被去除。
 * @param listFile 清单文件路径
 */
async function readListNames(listFile: string): Promise<Set<string>> {
    const text = await readFile(listFile, 'utf-8');
    const names = new Set<string>();
    collectListedNames(JSON.parse(minifyJSONC(text)), names);
    return names;
}

/**
 * 递归收集清单值中的全部字符串标识，数字、布尔与空值会被忽略。
 * @param value 清单中的任意值
 * @param output 收集结果
 */
function collectListedNames(value: unknown, output: Set<string>): void {
    if (typeof value === 'string') {
        output.add(value);
    } else if (Array.isArray(value)) {
        for (const item of value) {
            collectListedNames(item, output);
        }
    } else if (value && typeof value === 'object') {
        for (const item of Object.values(value)) {
            collectListedNames(item, output);
        }
    }
}

/**
 * 判断文件名是否被清单保留，只支持完整文件名与去扩展名主文件名两种精确匹配。
 * @param name 待判断的文件名
 * @param names 清单声明的名称集合
 */
function isListedFile(name: string, names: Set<string>): boolean {
    if (names.has(name)) return true;
    const extension = extname(name);
    const stem = name.slice(0, name.length - extension.length);
    return names.has(stem);
}

/**
 * 将单个字体文件按给定字符集做字形子集化，输出到目标目录并保留原文件名。
 * @param source 字体源文件
 * @param target 目标文件路径
 * @param chars 参与子集化的全部字符
 */
async function compressFont(source: string, target: string, chars: string) {
    const fontmin = new Fontmin();
    const glyph = Fontmin.glyph({ text: chars });
    await fontmin.src(source).dest(dirname(target)).use(glyph).runAsync();
}

/**
 * 递归处理目录：jsonc 压缩为纯 JSON，字体做子集化，其它素材原样拷贝。
 * @param sourceDir 源目录
 * @param outputDir 输出目录
 * @param chars 参与字体子集化的全部字符
 * @param counter 统计计数器
 */
async function processDirectory(
    sourceDir: string,
    outputDir: string,
    chars: string,
    counter: IContentBuildCounter,
    isRoot: boolean = false
) {
    await mkdir(outputDir, { recursive: true });
    const entries = await readdir(sourceDir, { withFileTypes: true });
    const isDefaults = basename(sourceDir) === DEFAULTS_DIRECTORY;
    const filterEnabled = !isRoot && !isDefaults;
    const listEntry = filterEnabled
        ? entries.find(entry => entry.isFile() && entry.name === LIST_FILE_NAME)
        : undefined;
    const names = listEntry
        ? await readListNames(join(sourceDir, listEntry.name))
        : null;

    for (const entry of entries) {
        const source = join(sourceDir, entry.name);
        const target = join(outputDir, entry.name);

        if (entry.isDirectory()) {
            await processDirectory(source, target, chars, counter, false);
            continue;
        }

        if (
            names &&
            entry.name !== LIST_FILE_NAME &&
            !isListedFile(entry.name, names)
        ) {
            continue;
        }

        const extension = extname(entry.name);
        if (extension === '.jsonc') {
            const text = await readFile(source, 'utf-8');
            await writeFile(target, minifyJSONC(text), 'utf-8');
            counter.jsonc += 1;
        } else if (FONT_EXTENSIONS.includes(extension)) {
            await compressFont(source, target, chars);
            counter.fonts += 1;
        } else {
            await copy(source, target);
        }
        counter.files += 1;
    }
}

/**
 * 将 content 素材从源目录构建到输出目录，jsonc 压缩为纯 JSON，字体做子集化。
 * @param options 构建选项
 */
export async function buildContent(
    options: IContentBuildOptions
): Promise<IContentBuildStats> {
    const counter: IContentBuildCounter = { files: 0, jsonc: 0, fonts: 0 };
    await processDirectory(
        options.sourceDir,
        options.outputDir,
        options.chars,
        counter,
        true
    );

    if (counter.fonts === 0) {
        process.stdout.write('⚠️   未找到可压缩的字体文件，已跳过字体压缩\r\n');
    }

    return {
        files: counter.files,
        jsonc: counter.jsonc,
        fonts: counter.fonts
    };
}
