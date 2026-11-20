// 测试动画解析器的 v2 二进制读取、失败日志与错误码、字段校验与帧包围盒 / 原点计算
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
// 仓库根类型检查未加载 Node 类型，静态闸门用例需要读取解析器源码
// @ts-expect-error 此处缺少 node:fs 的模块声明，仅测试环境使用
import { readFileSync } from 'node:fs';

interface IFakeBitmap {
    width: number;
    height: number;
    close: ReturnType<typeof vi.fn>;
}

interface ITestBitmap {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface ITestFrame {
    objects?: unknown;
    sound?: unknown;
}

interface ITestMeta {
    ratio: number;
    blend: number;
    bitmaps: ITestBitmap[];
    frame: ITestFrame[];
}

interface ISprite {
    width: number;
    height: number;
}

// 每个错误码在 logger.json 中占用的参数数量，用于校验调用点 arity
const ERROR_PARAM_COUNTS: Record<number, number> = {
    82: 1,
    83: 0,
    84: 0,
    85: 1,
    86: 1,
    87: 1,
    88: 2,
    89: 1,
    90: 0,
    91: 2,
    92: 3,
    93: 1,
    94: 3,
    95: 1,
    96: 1
};

// 记录解析器输出的错误码与错误参数
const loggerMock = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn() }));

// 控制假纹理构造器是否抛错，用于覆盖纹理创建失败的 91 号路径
const renderState = vi.hoisted(() => ({ failTexture: false }));

// 用假纹理替换渲染包，避免包根的模块加载期循环依赖
const renderMock = vi.hoisted(() => {
    class FakeTexture {
        source: unknown;

        constructor(source: unknown) {
            if (renderState.failTexture) {
                throw new Error('texture failed');
            }
            this.source = source;
        }
    }
    class FakeCanvas2D {}
    return { FakeTexture, FakeCanvas2D };
});

vi.mock('@motajs/common', () => ({ logger: loggerMock }));

vi.mock('@motajs/render', () => ({
    Texture: renderMock.FakeTexture,
    MotaOffscreenCanvas2D: renderMock.FakeCanvas2D
}));

import {
    AnimationBlendMode,
    IAnimationParsedData,
    parseRenderAnimation
} from '../index';

const DEFAULT_SPRITES: ISprite[] = [{ width: 32, height: 32 }];

// 构造只提供解析器所需字段的假位图
function mockBitmap(width: number, height: number): IFakeBitmap {
    const bitmap: IFakeBitmap = { width, height, close: vi.fn() };
    vi.stubGlobal(
        'createImageBitmap',
        vi.fn(async () => bitmap)
    );
    return bitmap;
}

// 构造一份合法的默认元数据
function makeMeta(overrides: Partial<ITestMeta> = {}): ITestMeta {
    return {
        ratio: 1,
        blend: 0,
        bitmaps: [{ x: 0, y: 0, width: 32, height: 32 }],
        frame: [{ objects: [[0, 0, 0, 100, 255]] }],
        ...overrides
    };
}

// 按 v2 布局拼装动画二进制
function buildAnimation(
    meta: unknown,
    sprites: ISprite[] = DEFAULT_SPRITES
): ArrayBuffer {
    const metaBytes = new TextEncoder().encode(JSON.stringify(meta));
    const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46]);
    const imageDataSize = 4 + sprites.length * 8 + webp.length;
    const buffer = new ArrayBuffer(16 + imageDataSize + metaBytes.length);
    const view = new DataView(buffer);
    view.setUint32(0, 0x414e494d, false);
    view.setUint32(4, 2, true);
    view.setUint32(8, imageDataSize, true);
    view.setUint32(12, metaBytes.length, true);
    view.setUint32(16, sprites.length, true);
    sprites.forEach((sprite, index) => {
        view.setUint32(20 + index * 8, sprite.width, true);
        view.setUint32(24 + index * 8, sprite.height, true);
    });
    const bytes = new Uint8Array(buffer);
    bytes.set(webp, 20 + sprites.length * 8);
    bytes.set(metaBytes, 16 + imageDataSize);
    return buffer;
}

// 按 v2 布局拼装动画二进制，元数据使用原始字符串以便构造非法 JSON
function buildRawAnimation(
    rawMeta: string,
    sprites: ISprite[] = DEFAULT_SPRITES
): ArrayBuffer {
    const metaBytes = new TextEncoder().encode(rawMeta);
    const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46]);
    const imageDataSize = 4 + sprites.length * 8 + webp.length;
    const buffer = new ArrayBuffer(16 + imageDataSize + metaBytes.length);
    const view = new DataView(buffer);
    view.setUint32(0, 0x414e494d, false);
    view.setUint32(4, 2, true);
    view.setUint32(8, imageDataSize, true);
    view.setUint32(12, metaBytes.length, true);
    view.setUint32(16, sprites.length, true);
    sprites.forEach((sprite, index) => {
        view.setUint32(20 + index * 8, sprite.width, true);
        view.setUint32(24 + index * 8, sprite.height, true);
    });
    const bytes = new Uint8Array(buffer);
    bytes.set(webp, 20 + sprites.length * 8);
    bytes.set(metaBytes, 16 + imageDataSize);
    return buffer;
}

// 断言解析成功并收窄返回值类型，供全部成功用例复用
async function parseOk(buffer: ArrayBuffer): Promise<IAnimationParsedData> {
    const data = await parseRenderAnimation(buffer);
    expect(data).not.toBeNull();
    if (!data) {
        throw new Error('parseRenderAnimation returned null');
    }
    return data;
}

// 断言解析失败：返回 null、只输出一次指定错误码，且实参数量与该码占位符一致
async function expectFailure(buffer: ArrayBuffer, code: number): Promise<void> {
    const data = await parseRenderAnimation(buffer);
    expect(data).toBeNull();
    expect(loggerMock.error).toHaveBeenCalledTimes(1);
    expect(loggerMock.error.mock.calls[0][0]).toBe(code);
    expect(
        loggerMock.error.mock.calls[0].length === ERROR_PARAM_COUNTS[code] + 1
    ).toBe(true);
}

// 提取指定顶层函数的函数体，供静态闸门检查
function extractFunctionBody(source: string, name: string): string {
    const start = source.indexOf('function ' + name);
    if (start < 0) {
        return '';
    }
    let depth = 0;
    let started = false;
    for (let i = start; i < source.length; i++) {
        const char = source[i];
        if (char === '{') {
            depth += 1;
            started = true;
        } else if (char === '}') {
            depth -= 1;
            if (started && depth === 0) {
                return source.slice(start, i + 1);
            }
        }
    }
    return '';
}

beforeEach(() => {
    loggerMock.error.mockClear();
    loggerMock.warn.mockClear();
    renderState.failTexture = false;
    mockBitmap(32, 32);
});

afterAll(() => {
    vi.unstubAllGlobals();
});

describe('parseRenderAnimation success', () => {
    // 正常解析返回纹理、位图、帧与混合模式
    it('parses a valid v2 animation', async () => {
        const bitmap = mockBitmap(32, 32);
        const data = await parseOk(buildAnimation(makeMeta()));

        expect(data.texture.source).toBe(bitmap);
        expect(data.bitmaps).toEqual([{ x: 0, y: 0, width: 32, height: 32 }]);
        expect(data.frames.length).toBe(1);
        expect(data.blend).toBe(AnimationBlendMode.Normal);
    });

    // blend 为 1 时映射为加算混合
    it('maps blend 1 to the add mode', async () => {
        const data = await parseOk(buildAnimation(makeMeta({ blend: 1 })));

        expect(data.blend).toBe(AnimationBlendMode.Add);
    });

    // ratio 被折入对象的缩放比例
    it('folds ratio into the object scale', async () => {
        const meta = makeMeta({
            ratio: 2,
            frame: [{ objects: [[0, 0, 0, 50, 255]] }]
        });
        const data = await parseOk(buildAnimation(meta));

        expect(data.frames[0].objects[0].scale).toBe(100);
    });

    // 无旋转的 32x32 对象得到 32x32 帧与 16,16 原点
    it('computes the frame box without rotation', async () => {
        const data = await parseOk(buildAnimation(makeMeta()));
        const frame = data.frames[0];

        expect(frame.width).toBe(32);
        expect(frame.height).toBe(32);
        expect(frame.originX).toBe(16);
        expect(frame.originY).toBe(16);
    });

    // 45 度旋转后得到 46x46 帧与约 22.627 的原点
    it('computes the frame box with a 45 degree rotation', async () => {
        const meta = makeMeta({
            frame: [{ objects: [[0, 0, 0, 100, 255, 0, 45]] }]
        });
        const data = await parseOk(buildAnimation(meta));
        const frame = data.frames[0];

        expect(frame.width).toBe(46);
        expect(frame.height).toBe(46);
        expect(frame.originX).toBeCloseTo(22.627, 3);
        expect(frame.originY).toBeCloseTo(22.627, 3);
    });

    // 多个对象的包围盒取并集
    it('unions the boxes of multiple objects', async () => {
        mockBitmap(64, 32);
        const meta = makeMeta({
            bitmaps: [
                { x: 0, y: 0, width: 32, height: 32 },
                { x: 32, y: 0, width: 32, height: 32 }
            ],
            frame: [
                {
                    objects: [
                        [0, 0, 0, 100, 255],
                        [1, 100, 0, 100, 255]
                    ]
                }
            ]
        });
        const data = await parseOk(
            buildAnimation(meta, [
                { width: 32, height: 32 },
                { width: 32, height: 32 }
            ])
        );
        const frame = data.frames[0];

        expect(frame.width).toBe(132);
        expect(frame.height).toBe(32);
        expect(frame.originX).toBe(16);
        expect(frame.originY).toBe(16);
    });

    // 空帧得到 1x1 帧与 0,0 原点
    it('returns an empty 1x1 frame without objects', async () => {
        const data = await parseOk(buildAnimation(makeMeta({ frame: [{}] })));
        const frame = data.frames[0];

        expect(frame.objects).toEqual([]);
        expect(frame.width).toBe(1);
        expect(frame.height).toBe(1);
        expect(frame.originX).toBe(0);
        expect(frame.originY).toBe(0);
    });

    // 镜像不改变轴对齐包围盒
    it('keeps the frame box unchanged when mirrored', async () => {
        const meta = makeMeta({
            frame: [{ objects: [[0, 0, 0, 100, 255, 1]] }]
        });
        const data = await parseOk(buildAnimation(meta));
        const frame = data.frames[0];

        expect(frame.objects[0].mirror).toBe(1);
        expect(frame.width).toBe(32);
        expect(frame.height).toBe(32);
    });

    // 音效字段被保留且中文名按 UTF-8 正确解码
    it('preserves sound fields including Chinese names', async () => {
        const meta = makeMeta({
            frame: [
                {
                    sound: [{ name: '攻击音效', volume: 0.5, pitch: 1.2 }]
                }
            ]
        });
        const data = await parseOk(buildAnimation(meta));

        expect(data.frames[0].sound).toEqual([
            { name: '攻击音效', volume: 0.5, pitch: 1.2 }
        ]);
    });

    // 只提供 5 个元素的元组时镜像与旋转取默认值 0
    it('defaults mirror and rotate for a 5 element tuple', async () => {
        const meta = makeMeta({
            frame: [{ objects: [[0, 0, 0, 100, 255]] }]
        });
        const data = await parseOk(buildAnimation(meta));
        const object = data.frames[0].objects[0];

        expect(object.mirror).toBe(0);
        expect(object.rotate).toBe(0);
        expect(data.frames[0].width).toBe(32);
    });

    // 成功解析不会关闭解码得到的位图
    it('does not close the decoded bitmap', async () => {
        const bitmap = mockBitmap(32, 32);
        await parseOk(buildAnimation(makeMeta()));

        expect(bitmap.close).not.toHaveBeenCalled();
    });
});

describe('parseRenderAnimation header failures', () => {
    // 缓冲区短于头部长度时返回 null 并记录 82
    it('reports a too short buffer', async () => {
        await expectFailure(buildAnimation(makeMeta()).slice(0, 10), 82);
    });

    // 签名字节不匹配时返回 null 并记录 83
    it('reports an invalid signature', async () => {
        const signature = new DataView(buildAnimation(makeMeta()));
        signature.setUint32(0, 0, false);
        await expectFailure(signature.buffer as ArrayBuffer, 83);
    });

    // 版本号不受支持时返回 null 并记录 84
    it('reports an unsupported version', async () => {
        const version = new DataView(buildAnimation(makeMeta()));
        version.setUint32(4, 3, true);
        await expectFailure(version.buffer as ArrayBuffer, 84);
    });

    // 总长度与头部字段不符时返回 null 并记录 82
    it('reports a total length mismatch', async () => {
        const total = new DataView(buildAnimation(makeMeta()));
        total.setUint32(8, total.getUint32(8, true) + 1, true);
        await expectFailure(total.buffer as ArrayBuffer, 82);
    });

    // imageDataSize 小 4 时返回 null 并记录 82
    it('reports an invalid imageDataSize', async () => {
        const imageSize = new DataView(buildAnimation(makeMeta()));
        imageSize.setUint32(8, 3, true);
        await expectFailure(imageSize.buffer as ArrayBuffer, 82);
    });

    // metaDataSize 为 0 时返回 null 并记录 82
    it('reports an invalid metaDataSize', async () => {
        const metaSize = new DataView(buildAnimation(makeMeta()));
        metaSize.setUint32(12, 0, true);
        await expectFailure(metaSize.buffer as ArrayBuffer, 82);
    });
});

describe('parseRenderAnimation sprite failures', () => {
    // sprite 数量为 0 时返回 null 并记录 85
    it('reports a zero sprite count', async () => {
        const zeroCount = new DataView(buildAnimation(makeMeta()));
        zeroCount.setUint32(16, 0, true);
        await expectFailure(zeroCount.buffer as ArrayBuffer, 85);
    });

    // sprite 宽度为 0 时返回 null 并记录 86
    it('reports a zero sprite width', async () => {
        const zeroWidth = new DataView(buildAnimation(makeMeta()));
        zeroWidth.setUint32(20, 0, true);
        await expectFailure(zeroWidth.buffer as ArrayBuffer, 86);
    });

    // sprite 高度为 0 时返回 null 并记录 86
    it('reports a zero sprite height', async () => {
        const zeroHeight = new DataView(buildAnimation(makeMeta()));
        zeroHeight.setUint32(24, 0, true);
        await expectFailure(zeroHeight.buffer as ArrayBuffer, 86);
    });

    // sprite 尺寸表超出 imageDataSize 时返回 null 并记录 85
    it('reports a sprite table beyond imageDataSize', async () => {
        const overflow = new DataView(buildAnimation(makeMeta()));
        overflow.setUint32(16, 100, true);
        await expectFailure(overflow.buffer as ArrayBuffer, 85);
    });
});

describe('parseRenderAnimation bitmap failures', () => {
    // bitmaps 不是数组时返回 null 并记录 87
    it('reports a non array bitmap list', async () => {
        await expectFailure(
            buildAnimation({ ...makeMeta(), bitmaps: 'x' }),
            87
        );
    });

    // 位图数量与 sprite 数量不一致时返回 null 并记录 87
    it('reports a bitmap count mismatch', async () => {
        await expectFailure(
            buildAnimation(makeMeta(), [
                { width: 32, height: 32 },
                { width: 32, height: 32 }
            ]),
            87
        );
    });

    // 位图项不是对象时返回 null 并记录 88
    it('reports a non object bitmap item', async () => {
        await expectFailure(
            buildAnimation({ ...makeMeta(), bitmaps: [42] }),
            88
        );
    });

    // 位图 x 非数字时返回 null 并记录 88
    it('reports a non numeric bitmap x', async () => {
        await expectFailure(
            buildAnimation(
                makeMeta({ bitmaps: [{ x: NaN, y: 0, width: 32, height: 32 }] })
            ),
            88
        );
    });

    // 位图 y 非数字时返回 null 并记录 88
    it('reports a non numeric bitmap y', async () => {
        await expectFailure(
            buildAnimation(
                makeMeta({ bitmaps: [{ x: 0, y: NaN, width: 32, height: 32 }] })
            ),
            88
        );
    });

    // 位图 width 非数字时返回 null 并记录 88
    it('reports a non numeric bitmap width', async () => {
        await expectFailure(
            buildAnimation(
                makeMeta({ bitmaps: [{ x: 0, y: 0, width: NaN, height: 32 }] })
            ),
            88
        );
    });

    // 位图 height 非数字时返回 null 并记录 88
    it('reports a non numeric bitmap height', async () => {
        await expectFailure(
            buildAnimation(
                makeMeta({ bitmaps: [{ x: 0, y: 0, width: 32, height: NaN }] })
            ),
            88
        );
    });

    // 位图 x 为负时返回 null 并记录 88
    it('reports a negative bitmap x', async () => {
        await expectFailure(
            buildAnimation(
                makeMeta({ bitmaps: [{ x: -1, y: 0, width: 32, height: 32 }] })
            ),
            88
        );
    });

    // 位图 y 为负时返回 null 并记录 88
    it('reports a negative bitmap y', async () => {
        await expectFailure(
            buildAnimation(
                makeMeta({ bitmaps: [{ x: 0, y: -1, width: 32, height: 32 }] })
            ),
            88
        );
    });

    // 位图宽度为 0 时返回 null 并记录 88
    it('reports a zero bitmap width', async () => {
        await expectFailure(
            buildAnimation(
                makeMeta({ bitmaps: [{ x: 0, y: 0, width: 0, height: 32 }] })
            ),
            88
        );
    });

    // 位图高度为 0 时返回 null 并记录 88
    it('reports a zero bitmap height', async () => {
        await expectFailure(
            buildAnimation(
                makeMeta({ bitmaps: [{ x: 0, y: 0, width: 32, height: 0 }] })
            ),
            88
        );
    });

    // 解码后位图越界时返回 null、关闭位图并记录索引 0 的 89
    it('reports bitmaps outside the decoded image and closes it', async () => {
        const bitmap = mockBitmap(16, 16);

        await expectFailure(buildAnimation(makeMeta()), 89);
        expect(bitmap.close).toHaveBeenCalled();
        expect(loggerMock.error.mock.calls[0][1]).toBe('0');
    });
});

describe('parseRenderAnimation metadata failures', () => {
    // 元数据为 JSON 数字原语时返回 null 并记录 95
    it('reports numeric primitive metadata', async () => {
        await expectFailure(buildRawAnimation('42'), 95);
        expect(loggerMock.error.mock.calls[0][1]).toBe('not-object');
    });

    // 元数据为 JSON null 时返回 null 并记录 95
    it('reports null metadata', async () => {
        await expectFailure(buildRawAnimation('null'), 95);
        expect(loggerMock.error.mock.calls[0][1]).toBe('not-object');
    });

    // 元数据为 JSON 数字 0 时返回 null 并记录 95
    it('reports zero metadata', async () => {
        await expectFailure(buildRawAnimation('0'), 95);
        expect(loggerMock.error.mock.calls[0][1]).toBe('not-object');
    });

    // 元数据为 JSON false 时返回 null 并记录 95
    it('reports boolean metadata', async () => {
        await expectFailure(buildRawAnimation('false'), 95);
        expect(loggerMock.error.mock.calls[0][1]).toBe('not-object');
    });

    // 元数据为 JSON 空字符串时返回 null 并记录 95
    it('reports string metadata', async () => {
        await expectFailure(buildRawAnimation('""'), 95);
        expect(loggerMock.error.mock.calls[0][1]).toBe('not-object');
    });

    // 元数据不是合法 JSON 时返回 null 并记录 95
    it('reports invalid metadata JSON', async () => {
        await expectFailure(buildRawAnimation('{'), 95);
        expect(loggerMock.error.mock.calls[0][1]).toBe('invalid-json');
    });

    // frame 不是数组时返回 null 并记录 90
    it('reports a non array frame list', async () => {
        await expectFailure(buildAnimation({ ...makeMeta(), frame: 'x' }), 90);
    });

    // 帧项不是对象时返回 null 并记录 91
    it('reports a non object frame item', async () => {
        await expectFailure(buildAnimation({ ...makeMeta(), frame: [42] }), 91);
    });

    // objects 存在但不是数组时返回 null 并记录 91
    it('reports a non array objects field', async () => {
        await expectFailure(
            buildAnimation(makeMeta({ frame: [{ objects: 'x' }] })),
            91
        );
    });

    // 对象项不是数组元组时返回 null 并记录 92
    it('reports a non array object tuple', async () => {
        await expectFailure(
            buildAnimation(makeMeta({ frame: [{ objects: [42] }] })),
            92
        );
    });

    // 元组只有 4 个元素时返回 null 并记录 92
    it('reports a short object tuple', async () => {
        await expectFailure(
            buildAnimation(
                makeMeta({ frame: [{ objects: [[0, 0, 0, 100]] }] })
            ),
            92
        );
    });

    // 元组有 8 个元素时返回 null 并记录 92
    it('reports a long object tuple', async () => {
        await expectFailure(
            buildAnimation(
                makeMeta({
                    frame: [{ objects: [[0, 0, 0, 100, 255, 0, 0, 0]] }]
                })
            ),
            92
        );
    });

    // sound 存在但不是数组时返回 null 并记录 91
    it('reports a non array sound field', async () => {
        await expectFailure(
            buildAnimation(makeMeta({ frame: [{ sound: 'x' }] })),
            91
        );
    });
});

describe('parseRenderAnimation object failures', () => {
    // 对象位图索引越界时返回 null 并记录 92
    it('reports an out of range object index', async () => {
        await expectFailure(
            buildAnimation(
                makeMeta({ frame: [{ objects: [[1, 0, 0, 100, 255]] }] })
            ),
            92
        );
    });

    // 对象位图索引不是整数时返回 null 并记录 92
    it('reports a non integer object index', async () => {
        await expectFailure(
            buildAnimation(
                makeMeta({ frame: [{ objects: [[0.5, 0, 0, 100, 255]] }] })
            ),
            92
        );
    });

    // 对象横坐标非法时返回 null 并记录帧索引 / 对象索引 / 原因的 92
    it('reports an invalid object x', async () => {
        await expectFailure(
            buildAnimation(
                makeMeta({
                    frame: [{ objects: [[0, NaN, 0, 100, 255, 0, 0]] }]
                })
            ),
            92
        );
        expect(loggerMock.error.mock.calls[0][1]).toBe('0');
        expect(loggerMock.error.mock.calls[0][2]).toBe('0');
        expect(loggerMock.error.mock.calls[0][3]).toBe('invalid-x');
    });

    // 对象纵坐标非法时返回 null 并记录 92
    it('reports an invalid object y', async () => {
        await expectFailure(
            buildAnimation(
                makeMeta({
                    frame: [{ objects: [[0, 0, NaN, 100, 255, 0, 0]] }]
                })
            ),
            92
        );
    });

    // 对象缩放为 0 时返回 null 并记录 92
    it('reports a zero object scale', async () => {
        await expectFailure(
            buildAnimation(
                makeMeta({ frame: [{ objects: [[0, 0, 0, 0, 255, 0, 0]] }] })
            ),
            92
        );
    });

    // 对象缩放非法时返回 null 并记录 92
    it('reports an invalid object scale', async () => {
        await expectFailure(
            buildAnimation(
                makeMeta({ frame: [{ objects: [[0, 0, 0, NaN, 255, 0, 0]] }] })
            ),
            92
        );
    });

    // 对象不透明度越界时返回 null 并记录 92
    it('reports an out of range object opacity', async () => {
        await expectFailure(
            buildAnimation(
                makeMeta({ frame: [{ objects: [[0, 0, 0, 100, 300, 0, 0]] }] })
            ),
            92
        );
    });

    // 对象不透明度非法时返回 null 并记录 92
    it('reports an invalid object opacity', async () => {
        await expectFailure(
            buildAnimation(
                makeMeta({ frame: [{ objects: [[0, 0, 0, 100, NaN, 0, 0]] }] })
            ),
            92
        );
    });

    // 对象镜像方向非法时返回 null 并记录 92
    it('reports an invalid object mirror', async () => {
        await expectFailure(
            buildAnimation(
                makeMeta({
                    frame: [{ objects: [[0, 0, 0, 100, 255, NaN, 0]] }]
                })
            ),
            92
        );
    });

    // 对象旋转角度非法时返回 null 并记录 92
    it('reports an invalid object rotate', async () => {
        await expectFailure(
            buildAnimation(
                makeMeta({
                    frame: [{ objects: [[0, 0, 0, 100, 255, 0, NaN]] }]
                })
            ),
            92
        );
    });
});

describe('parseRenderAnimation ratio and blend failures', () => {
    // ratio 为 0 时返回 null 并记录 93
    it('reports a zero ratio', async () => {
        await expectFailure(buildAnimation(makeMeta({ ratio: 0 })), 93);
    });

    // ratio 为负数时返回 null 并记录 93
    it('reports a negative ratio', async () => {
        await expectFailure(buildAnimation(makeMeta({ ratio: -1 })), 93);
    });

    // ratio 非数字时返回 null 并记录 93
    it('reports a non numeric ratio', async () => {
        await expectFailure(buildAnimation(makeMeta({ ratio: NaN })), 93);
    });

    // blend 为 2 时返回 null 并记录 93
    it('reports an unsupported blend value', async () => {
        await expectFailure(buildAnimation(makeMeta({ blend: 2 })), 93);
    });

    // blend 为负数时返回 null 并记录 93
    it('reports a negative blend value', async () => {
        await expectFailure(buildAnimation(makeMeta({ blend: -1 })), 93);
    });

    // blend 非数字时返回 null 并记录 93
    it('reports a non numeric blend value', async () => {
        await expectFailure(buildAnimation(makeMeta({ blend: NaN })), 93);
    });
});

describe('parseRenderAnimation sound failures', () => {
    // 音效名称为空时返回 null 并记录帧索引 / 音效索引 / 原因的 94
    it('reports an empty sound name', async () => {
        await expectFailure(
            buildAnimation(makeMeta({ frame: [{ sound: [{ name: '' }] }] })),
            94
        );
        expect(loggerMock.error.mock.calls[0][1]).toBe('0');
        expect(loggerMock.error.mock.calls[0][2]).toBe('0');
        expect(loggerMock.error.mock.calls[0][3]).toBe('invalid-name');
    });

    // 音效名称非字符串时返回 null 并记录 94
    it('reports a non string sound name', async () => {
        await expectFailure(
            buildAnimation(makeMeta({ frame: [{ sound: [{ name: 1 }] }] })),
            94
        );
    });

    // 音效音量非法时返回 null 并记录 94
    it('reports an invalid sound volume', async () => {
        await expectFailure(
            buildAnimation(
                makeMeta({
                    frame: [{ sound: [{ name: '音效', volume: NaN }] }]
                })
            ),
            94
        );
    });

    // 音效音高非法时返回 null 并记录 94
    it('reports an invalid sound pitch', async () => {
        await expectFailure(
            buildAnimation(
                makeMeta({ frame: [{ sound: [{ name: '音效', pitch: NaN }] }] })
            ),
            94
        );
    });

    // 音效项不是对象时返回 null 并记录 94
    it('reports a non object sound item', async () => {
        await expectFailure(
            buildAnimation(makeMeta({ frame: [{ sound: [42] }] })),
            94
        );
    });
});

describe('parseRenderAnimation decode failures', () => {
    // 图像解码抛错时返回 null 并记录 96
    it('reports a decode failure', async () => {
        vi.stubGlobal(
            'createImageBitmap',
            vi.fn(async () => {
                throw new Error('decode failed');
            })
        );

        await expectFailure(buildAnimation(makeMeta()), 96);
        expect(loggerMock.error.mock.calls[0][1]).toBe('decode-failed');
    });

    // 纹理创建抛错时关闭位图、返回 null 并记录 96
    it('reports a texture failure and closes the bitmap', async () => {
        renderState.failTexture = true;
        const bitmap = mockBitmap(32, 32);

        await expectFailure(buildAnimation(makeMeta()), 96);
        expect(loggerMock.error.mock.calls[0][1]).toBe('texture-failed');
        expect(bitmap.close).toHaveBeenCalled();
    });
});

describe('parseRenderAnimation static guard', () => {
    // 解析器不得出现 throw，失败一律记录日志并返回 null
    it('keeps the parser free of throw statements', () => {
        const source = readFileSync(
            'packages/render-anim/src/parse.ts',
            'utf8'
        );

        expect(/\bthrow\b/.test(source)).toBe(false);
        expect(source.includes('@throws')).toBe(false);
        expect((source.match(/try\s*\{/g) ?? []).length).toBe(3);
        expect(/\bfinally\b/.test(source)).toBe(false);

        const compact = source.replace(/\s+/g, '');
        expect(compact).toContain('try{meta=JSON.parse(text);}catch{');
        expect(compact).toContain(
            'try{image=awaitcreateImageBitmap(webpBlob);}catch{'
        );
        expect(compact).toContain('try{texture=newTexture(image);}catch{');
        expect(compact).toContain(
            "constwebpBlob=newBlob([webpBytes],{type:'image/webp'});"
        );
        expect(compact).toContain(
            "if(!isRecord(meta)){logger.error(95,'not-object');returnnull;}returnmeta;"
        );

        const validateMeta = extractFunctionBody(source, 'validateMeta');
        const bounds = extractFunctionBody(source, 'validateBitmapBounds');
        expect(validateMeta.length).toBeGreaterThan(0);
        expect(bounds.length).toBeGreaterThan(0);
        expect(validateMeta.includes('forEach')).toBe(false);
        expect(bounds.includes('forEach')).toBe(false);

        // 越界路径必须先关闭图像再记录 89 号，且宽高仍在 close 前读取用于判定
        const closeIndex = compact.indexOf('image.close();logger.error(89,');
        expect(closeIndex).toBeGreaterThan(-1);
        const widthIndex = compact.indexOf('image.width');
        const heightIndex = compact.indexOf('image.height');
        expect(widthIndex).toBeGreaterThan(-1);
        expect(heightIndex).toBeGreaterThan(-1);
        expect(widthIndex).toBeLessThan(closeIndex);
        expect(heightIndex).toBeLessThan(closeIndex);

        // 纹理失败路径必须先关闭图像再记录 96 号
        expect(compact).toContain(
            "image.close();logger.error(96,'texture-failed');"
        );

        // 92 与 94 必须帧索引在前、对象或音效索引在后、原因最后
        expect(compact).toContain(
            'logger.error(92,frameIndex.toString(),objectIndex.toString(),'
        );
        expect(compact).toContain(
            'logger.error(94,frameIndex.toString(),i.toString(),'
        );

        // 82 到 96 全部出现在调用点，且 92 到 96 均为合法码
        for (let code = 82; code <= 96; code++) {
            const callPattern = new RegExp(
                'logger\\.error\\(\\s*' + code + '\\b'
            );
            expect(callPattern.test(source)).toBe(true);
        }

        // 每个 logger.error 实参只能是索引的 .toString() 或允许的连字符原因
        const allowedReasons = [
            'buffer-too-short',
            'length-mismatch',
            'invalid-count',
            'table-overflow',
            'not-array',
            'count-mismatch',
            'not-object',
            'invalid-x',
            'invalid-y',
            'invalid-width',
            'invalid-height',
            'objects-not-array',
            'sound-not-array',
            'not-tuple',
            'invalid-field-count',
            'invalid-index',
            'invalid-scale',
            'invalid-opacity',
            'invalid-mirror',
            'invalid-rotate',
            'invalid-ratio',
            'invalid-blend',
            'invalid-name',
            'invalid-volume',
            'invalid-pitch',
            'invalid-json',
            'decode-failed',
            'texture-failed'
        ];
        const indexPattern = /^[A-Za-z_][A-Za-z0-9_]*\.toString\(\)$/;
        const callPrefix = 'logger.error(';
        const callArgs: string[] = [];
        let scanFrom = 0;
        let callStart = source.indexOf(callPrefix, scanFrom);
        while (callStart >= 0) {
            let cursor = callStart + callPrefix.length;
            let depth = 1;
            let inString = false;
            let body = '';
            while (depth > 0 && cursor < source.length) {
                const char = source[cursor];
                if (inString) {
                    if (char === '\\') {
                        body += char + source[cursor + 1];
                        cursor += 2;
                        continue;
                    }
                    if (char === "'") {
                        inString = false;
                    }
                    body += char;
                    cursor += 1;
                    continue;
                }
                if (char === "'") {
                    inString = true;
                    body += char;
                    cursor += 1;
                    continue;
                }
                if (char === '(') {
                    depth += 1;
                } else if (char === ')') {
                    depth -= 1;
                    if (depth === 0) {
                        cursor += 1;
                        break;
                    }
                }
                body += char;
                cursor += 1;
            }
            callArgs.push(body);
            scanFrom = cursor;
            callStart = source.indexOf(callPrefix, scanFrom);
        }
        expect(callArgs.length).toBe(39);
        for (const argsText of callArgs) {
            const args: string[] = [];
            let innerDepth = 0;
            let innerString = false;
            let part = '';
            for (let index = 0; index < argsText.length; index++) {
                const char = argsText[index];
                if (innerString) {
                    if (char === '\\') {
                        part += char + (argsText[index + 1] ?? '');
                        index += 1;
                        continue;
                    }
                    if (char === "'") {
                        innerString = false;
                    }
                    part += char;
                    continue;
                }
                if (char === "'") {
                    innerString = true;
                    part += char;
                    continue;
                }
                if (char === '(') {
                    innerDepth += 1;
                } else if (char === ')') {
                    innerDepth -= 1;
                } else if (char === ',' && innerDepth === 0) {
                    args.push(part.trim());
                    part = '';
                    continue;
                }
                part += char;
            }
            if (part.trim().length > 0) {
                args.push(part.trim());
            }
            expect(/^(8[2-9]|9[0-6])$/.test(args[0])).toBe(true);
            for (const rawArg of args.slice(1)) {
                const arg = rawArg.trim();
                if (indexPattern.test(arg)) {
                    continue;
                }
                expect(arg.startsWith("'")).toBe(true);
                expect(arg.endsWith("'")).toBe(true);
                expect(allowedReasons.includes(arg.slice(1, -1))).toBe(true);
            }
        }
    });
});
