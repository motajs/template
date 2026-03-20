import JSZip from 'jszip';
import { RequiredData, RequiredIconsData } from './types';
import { Stats } from 'fs';
import { readdir, readFile, stat } from 'fs/promises';
import { resolve } from 'path';
import { fileHash } from './utils';

export const enum CompressedUsage {
    // ---- 系统加载内容，不可更改
    Font,
    Image,
    Sound,
    Tileset,
    Autotile,
    Material,
    Animate
}

export const enum LoadDataType {
    ArrayBuffer,
    Uint8Array,
    Blob,
    Text,
    JSON
}

export interface ResourceInfo {
    readonly name: string;
    readonly readAs: LoadDataType;
    readonly usage: CompressedUsage;
    readonly stats: Stats;
}

export interface SplittedResource {
    readonly byteLength: number;
    readonly resource: JSZip;
    readonly buffer: Uint8Array;
    readonly fileName: string;
    readonly content: Readonly<ResourceInfo>[];
}

interface ResourceContent extends ResourceInfo {
    readonly content: string | Buffer | Uint8Array;
    readonly exceed: boolean;
}

interface ResourcePath {
    readonly name: string;
    readonly path: string;
    readonly usage: CompressedUsage;
}

function getTypeByUsage(usage: CompressedUsage): LoadDataType {
    switch (usage) {
        case CompressedUsage.Animate:
            return LoadDataType.Text;
        case CompressedUsage.Autotile:
        case CompressedUsage.Image:
        case CompressedUsage.Tileset:
        case CompressedUsage.Material:
            return LoadDataType.Blob;
        case CompressedUsage.Font:
        case CompressedUsage.Sound:
            return LoadDataType.ArrayBuffer;
    }
}

function getZipFolderByUsage(usage: CompressedUsage): string {
    switch (usage) {
        case CompressedUsage.Image:
            return 'image';
        case CompressedUsage.Tileset:
            return 'tileset';
        case CompressedUsage.Autotile:
            return 'autotile';
        case CompressedUsage.Material:
            return 'material';
        case CompressedUsage.Font:
            return 'font';
        case CompressedUsage.Sound:
            return 'sound';
        case CompressedUsage.Animate:
            return 'animate';
    }
}

function readFileOfType(path: string, type: LoadDataType) {
    if (type === LoadDataType.Text) {
        return readFile(path, 'utf-8');
    } else {
        return readFile(path);
    }
}

async function compressFiles(files: ResourceContent[]) {
    const zip = new JSZip();
    files.forEach(v => {
        const dir = `${getZipFolderByUsage(v.usage)}/${v.name}`;
        zip.file(dir, v.content);
    });
    const buffer = await zip.generateAsync({
        type: 'uint8array',
        compression: 'DEFLATE',
        compressionOptions: {
            level: 9
        }
    });

    const hash = fileHash(buffer);
    const name = `resource.${hash}.h5data`;

    const resource: SplittedResource = {
        byteLength: buffer.byteLength,
        buffer: buffer,
        resource: zip,
        fileName: name,
        content: files
    };

    return resource;
}

export async function splitResource(
    data: RequiredData,
    icons: RequiredIconsData,
    base: string,
    fontsDir: string,
    limit: number
) {
    const result: SplittedResource[] = [];

    // 获取所有需要分块的资源
    const { animates, fonts, images, sounds, tilesets } = data.main;
    const autotiles = Object.keys(icons.autotile);
    const materials = await readdir(resolve(base, 'project/materials'));

    const paths: ResourcePath[] = [
        ...animates.map<ResourcePath>(v => ({
            name: `${v}.animate`,
            path: resolve(base, 'project/animates', `${v}.animate`),
            usage: CompressedUsage.Animate
        })),
        ...fonts.map<ResourcePath>(v => ({
            name: v,
            path: resolve(fontsDir, v),
            usage: CompressedUsage.Font
        })),
        ...images.map<ResourcePath>(v => ({
            name: v,
            path: resolve(base, 'project/images', v),
            usage: CompressedUsage.Image
        })),
        ...sounds.map<ResourcePath>(v => ({
            name: v,
            path: resolve(base, 'project/sounds', v),
            usage: CompressedUsage.Sound
        })),
        ...tilesets.map<ResourcePath>(v => ({
            name: v,
            path: resolve(base, 'project/tilesets', v),
            usage: CompressedUsage.Tileset
        })),
        ...autotiles.map<ResourcePath>(v => ({
            name: `${v}.png`,
            path: resolve(base, 'project/autotiles', `${v}.png`),
            usage: CompressedUsage.Autotile
        })),
        ...materials.map<ResourcePath>(v => ({
            name: v,
            path: resolve(base, 'project/materials', v),
            usage: CompressedUsage.Material
        }))
    ];

    const files = await Promise.all(
        paths.map(async ({ path, usage, name }) => {
            const stats = await stat(path);
            if (!stats.isFile()) {
                return Promise.reject(
                    new ReferenceError(
                        `Expected resource is a file, but get directory.`
                    )
                );
            }
            const type = getTypeByUsage(usage);
            const content = await readFileOfType(path, type);
            const info: ResourceContent = {
                readAs: type,
                name,
                usage,
                stats,
                content,
                exceed: stats.size > limit
            };
            return info;
        })
    );

    // 从小到大排序，这样的话可以尽量减小资源分块文件数量
    files.sort((a, b) => a.stats.size - b.stats.size);

    let index = 0;
    while (index < files.length) {
        let total = 0;
        const start = index;
        let i = index;
        for (; i < files.length; i++) {
            const file = files[i];
            if (file.exceed) {
                if (i === index) i = index + 1;
                break;
            } else {
                total += file.stats.size;
            }
            if (total > limit) {
                break;
            }
        }
        index = i;
        const toZip = files.slice(start, index);
        result.push(await compressFiles(toZip));
    }

    return result;
}
