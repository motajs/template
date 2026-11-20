import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { deflateSync, inflateSync } from 'node:zlib';

/** 已解码的图像数据，统一为 8 位 RGBA 通道 */
interface IPngImage {
    /** 图像宽度 */
    width: number;
    /** 图像高度 */
    height: number;
    /** 逐行逐像素的 RGBA 数据 */
    data: Buffer;
}

/** 一张拆分后的目标图及其对应的图块数字列表 */
interface ISplitSheet {
    /** 目标文件名 */
    name: string;
    /** 图像数据 */
    image: IPngImage;
    /** 按目标图内顺序排列的图块数字 */
    nums: number[];
}

/** 一个源素材的拆分配置 */
interface ISplitGroup {
    /** 源素材名，不含扩展名 */
    source: string;
    /** 图块类别名，用于从 icons 中取源行序 */
    cls: string;
    /** 目标文件名前缀 */
    prefix: string;
    /** 目标文件名起始序号 */
    start: number;
    /** 拆分模式，单帧网格或行动画 */
    mode: 'grid' | 'rowAnimate';
    /** 每帧像素宽度 */
    frameWidth: number;
    /** 每帧像素高度 */
    frameHeight: number;
}

/** `texture/.list.jsonc` 的条目结构 */
interface ITextureListEntry {
    /** 条目判别字段 */
    type: string;
    /** 图像源 */
    source: string;
    /** 图块数字映射 */
    map?: number[];
    /** 每帧像素宽度 */
    width?: number;
    /** 每帧像素高度 */
    height?: number;
    /** 自动元件标识符或 tileset 标识符对象 */
    identifier?: number | { index: number; alias: string };
    /** 自动元件类型 */
    autotileType?: number;
    /** tileset 单元宽度 */
    cellWidth?: number;
    /** tileset 单元高度 */
    cellHeight?: number;
}

const PROJECT_DIR = 'public/project';
const OUTPUT_DIR = 'src/content/texture';
const PREFIX_MARK = '// --- SYSTEM PREFIX END --- //';

/** CRC32 查表 */
const CRC_TABLE: number[] = buildCrcTable();

/** 构建 CRC32 查表 */
function buildCrcTable(): number[] {
    const table: number[] = [];
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        table[n] = c >>> 0;
    }
    return table;
}

/** 计算缓冲区 CRC32 */
function crc32(buf: Buffer): number {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
        c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
}

/** Paeth 反滤镜辅助函数 */
function paeth(a: number, b: number, c: number): number {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    if (pa <= pb && pa <= pc) {
        return a;
    }
    if (pb <= pc) {
        return b;
    }
    return c;
}

/** 构造一个 PNG 数据块 */
function pngChunk(type: string, data: Buffer): Buffer {
    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body), 0);
    return Buffer.concat([length, body, crc]);
}

/** 解码 PNG 为 8 位 RGBA 图像，仅支持非隔行 8 位 */
function decodePng(buf: Buffer): IPngImage {
    if (buf.readUInt32BE(0) !== 0x89504e47) {
        throw new Error('not a png');
    }
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    const bitDepth = buf[24];
    const colorType = buf[25];
    const interlace = buf[28];
    if (interlace !== 0) {
        throw new Error('interlaced png unsupported');
    }
    if (bitDepth !== 8) {
        throw new Error('bit depth ' + bitDepth + ' unsupported');
    }
    let pos = 8;
    const idatParts: Buffer[] = [];
    let palette: Buffer | null = null;
    let trns: Buffer | null = null;
    while (pos < buf.length) {
        const length = buf.readUInt32BE(pos);
        const type = buf.toString('ascii', pos + 4, pos + 8);
        const data = buf.subarray(pos + 8, pos + 8 + length);
        pos += 12 + length;
        if (type === 'PLTE') {
            palette = data;
        } else if (type === 'tRNS') {
            trns = data;
        } else if (type === 'IDAT') {
            idatParts.push(data);
        } else if (type === 'IEND') {
            break;
        }
    }
    const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 3 ? 1 : 0;
    if (channels === 0) {
        throw new Error('color type ' + colorType + ' unsupported');
    }
    const raw = inflateSync(Buffer.concat(idatParts));
    const stride = width * channels;
    const pixels = Buffer.alloc(height * stride);
    let prev = Buffer.alloc(stride);
    for (let y = 0; y < height; y++) {
        const filter = raw[y * (stride + 1)];
        const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
        const cur = Buffer.alloc(stride);
        for (let x = 0; x < stride; x++) {
            const a = x >= channels ? cur[x - channels] : 0;
            const b = prev[x];
            const c = x >= channels ? prev[x - channels] : 0;
            let v = line[x];
            if (filter === 1) {
                v = (v + a) & 0xff;
            } else if (filter === 2) {
                v = (v + b) & 0xff;
            } else if (filter === 3) {
                v = (v + ((a + b) >> 1)) & 0xff;
            } else if (filter === 4) {
                v = (v + paeth(a, b, c)) & 0xff;
            }
            cur[x] = v;
        }
        cur.copy(pixels, y * stride);
        prev = cur;
    }
    const data = Buffer.alloc(width * height * 4);
    if (colorType === 6) {
        pixels.copy(data);
    } else if (colorType === 2) {
        for (let i = 0; i < width * height; i++) {
            data[i * 4] = pixels[i * 3];
            data[i * 4 + 1] = pixels[i * 3 + 1];
            data[i * 4 + 2] = pixels[i * 3 + 2];
            data[i * 4 + 3] = 255;
        }
    } else {
        for (let i = 0; i < width * height; i++) {
            const index = pixels[i];
            data[i * 4] = palette![index * 3];
            data[i * 4 + 1] = palette![index * 3 + 1];
            data[i * 4 + 2] = palette![index * 3 + 2];
            data[i * 4 + 3] = trns && index < trns.length ? trns[index] : 255;
        }
    }
    return { width, height, data };
}

/** 编码 8 位 RGBA 图像为非隔行 PNG */
function encodePng(image: IPngImage): Buffer {
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(image.width, 0);
    ihdr.writeUInt32BE(image.height, 4);
    ihdr[8] = 8;
    ihdr[9] = 6;
    const stride = image.width * 4;
    const raw = Buffer.alloc(image.height * (stride + 1));
    for (let y = 0; y < image.height; y++) {
        raw[y * (stride + 1)] = 0;
        image.data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
    }
    const compressed = deflateSync(raw, { level: 9 });
    return Buffer.concat([
        signature,
        pngChunk('IHDR', ihdr),
        pngChunk('IDAT', compressed),
        pngChunk('IEND', Buffer.alloc(0))
    ]);
}

/** 将一个矩形像素块从源图复制到目标图 */
function blit(
    dst: Buffer,
    dstWidth: number,
    src: Buffer,
    srcWidth: number,
    sx: number,
    sy: number,
    w: number,
    h: number,
    dx: number,
    dy: number
): void {
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const si = ((sy + y) * srcWidth + sx + x) * 4;
            const di = ((dy + y) * dstWidth + dx + x) * 4;
            src.copy(dst, di, si, si + 4);
        }
    }
}

/** 读取 public/project 下的 `var X = {...}` 数据文件 */
function readProjectObject(file: string): Record<string, any> {
    const text = readFileSync(file, 'utf8');
    return JSON.parse(text.slice(text.indexOf('=') + 1));
}

/** 读取 src/content 下带前缀标记的 jsonc 文件 */
function readPrefixedJson(file: string): any {
    const text = readFileSync(file, 'utf8');
    return JSON.parse(text.split(PREFIX_MARK)[1]);
}

/** 按 4 列网格裁剪单帧素材 */
function buildGridSheets(
    source: IPngImage,
    group: ISplitGroup,
    idsByRow: string[],
    idToNum: Map<string, number>
): ISplitSheet[] {
    const cols = 4;
    const per = cols * 4;
    const cw = group.frameWidth;
    const ch = group.frameHeight;
    const srcCols = source.width / cw;
    const srcRows = source.height / ch;
    const ids: string[] = [];
    for (let y = 0; y < srcRows; y++) {
        for (let x = 0; x < srcCols; x++) {
            ids.push(idsByRow[y]);
        }
    }
    const sheets: ISplitSheet[] = [];
    const sheetCount = Math.ceil(ids.length / per);
    for (let i = 0; i < sheetCount; i++) {
        const count = Math.min(per, ids.length - i * per);
        const rows = Math.ceil(count / cols);
        const image: IPngImage = {
            width: cols * cw,
            height: rows * ch,
            data: Buffer.alloc(cols * cw * rows * ch * 4)
        };
        const nums: number[] = [];
        for (let k = 0; k < count; k++) {
            const global = i * per + k;
            const sx = (global % srcCols) * cw;
            const sy = Math.floor(global / srcCols) * ch;
            blit(
                image.data,
                image.width,
                source.data,
                source.width,
                sx,
                sy,
                cw,
                ch,
                (k % cols) * cw,
                Math.floor(k / cols) * ch
            );
            nums.push(idToNum.get(ids[global])!);
        }
        sheets.push({ name: group.prefix + (group.start + i) + '.png', image, nums });
    }
    return sheets;
}

/** 按每行一块裁剪多帧素材 */
function buildRowAnimateSheets(
    source: IPngImage,
    group: ISplitGroup,
    idsByRow: string[],
    idToNum: Map<string, number>
): ISplitSheet[] {
    const fw = group.frameWidth;
    const fh = group.frameHeight;
    const frameCols = source.width / fw;
    const blocks = source.height / fh;
    const per = 4;
    const sheets: ISplitSheet[] = [];
    const sheetCount = Math.ceil(blocks / per);
    for (let i = 0; i < sheetCount; i++) {
        const count = Math.min(per, blocks - i * per);
        const image: IPngImage = {
            width: frameCols * fw,
            height: count * fh,
            data: Buffer.alloc(frameCols * fw * count * fh * 4)
        };
        const nums: number[] = [];
        for (let j = 0; j < count; j++) {
            const blockRow = i * per + j;
            blit(
                image.data,
                image.width,
                source.data,
                source.width,
                0,
                blockRow * fh,
                source.width,
                fh,
                0,
                j * fh
            );
            nums.push(idToNum.get(idsByRow[blockRow])!);
        }
        sheets.push({ name: group.prefix + (group.start + i) + '.png', image, nums });
    }
    return sheets;
}

const tileArr = readPrefixedJson('src/content/tile.jsonc') as Array<{ num: number; id: string }>;
const idToNum = new Map<string, number>();
for (const tile of tileArr) {
    idToNum.set(tile.id, tile.num);
}

const icons = readProjectObject(PROJECT_DIR + '/icons.js');

const groups: ISplitGroup[] = [
    { source: 'terrains', cls: 'terrains', prefix: 'terrains', start: 0, mode: 'grid', frameWidth: 32, frameHeight: 32 },
    { source: 'animates', cls: 'animates', prefix: 'terrainsAnim', start: 0, mode: 'rowAnimate', frameWidth: 32, frameHeight: 32 },
    { source: 'items', cls: 'items', prefix: 'items', start: 0, mode: 'grid', frameWidth: 32, frameHeight: 32 },
    { source: 'enemys', cls: 'enemys', prefix: 'enemy', start: 0, mode: 'rowAnimate', frameWidth: 32, frameHeight: 32 },
    { source: 'enemy48', cls: 'enemy48', prefix: 'enemy', start: 19, mode: 'rowAnimate', frameWidth: 32, frameHeight: 48 },
    { source: 'npcs', cls: 'npcs', prefix: 'npc', start: 0, mode: 'rowAnimate', frameWidth: 32, frameHeight: 32 },
    { source: 'npc48', cls: 'npc48', prefix: 'npc', start: 4, mode: 'rowAnimate', frameWidth: 32, frameHeight: 48 }
];

const textures: ITextureListEntry[] = [];

for (const group of groups) {
    const iconsMap = icons[group.cls] as Record<string, number>;
    const source = decodePng(readFileSync(PROJECT_DIR + '/materials/' + group.source + '.png'));
    const srcRows = source.height / group.frameHeight;
    const idsByRow: string[] = new Array(srcRows);
    for (const id of Object.keys(iconsMap)) {
        idsByRow[iconsMap[id]] = id;
    }
    for (let r = 0; r < srcRows; r++) {
        if (!idsByRow[r]) {
            throw new Error('missing id for ' + group.source + ' row ' + r);
        }
    }
    const sheets =
        group.mode === 'grid'
            ? buildGridSheets(source, group, idsByRow, idToNum)
            : buildRowAnimateSheets(source, group, idsByRow, idToNum);
    for (const sheet of sheets) {
        writeFileSync(OUTPUT_DIR + '/' + sheet.name, encodePng(sheet.image));
        textures.push({
            type: group.mode,
            source: sheet.name,
            map: sheet.nums,
            width: group.frameWidth,
            height: group.frameHeight
        });
    }
}

const autotiles: Array<[string, string]> = [
    ['autotile.png', 'autotile'],
    ['autotile1.png', 'autotile1'],
    ['autotile2.png', 'autotile2'],
    ['autotile3.png', 'autotile3']
];
for (const autotile of autotiles) {
    const file = autotile[0];
    const id = autotile[1];
    copyFileSync(PROJECT_DIR + '/autotiles/' + file, OUTPUT_DIR + '/' + file);
    textures.push({
        type: 'autotile',
        source: file,
        identifier: idToNum.get(id),
        autotileType: 1
    });
}

copyFileSync(PROJECT_DIR + '/tilesets/magictower.png', OUTPUT_DIR + '/magictower.png');
textures.push({
    type: 'tileset',
    source: 'magictower.png',
    identifier: { index: 0, alias: 'magictower' },
    cellWidth: 32,
    cellHeight: 32
});

writeFileSync(
    'src/content/texture/.list.jsonc',
    '// Type: type define required\n' + PREFIX_MARK + '\n' + JSON.stringify({ textures }, null, 4) + '\n'
);

console.log('OK generated split sheets: ' + textures.filter((t) => t.map).length + ', autotiles: 4, tileset: 1');
