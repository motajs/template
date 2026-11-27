// 测试动画合成器的帧序列、绘制参数、单画布复用与源纹理归属
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

interface IFakeContext {
    save: any;
    restore: any;
    setTransform: any;
    scale: any;
    rotate: any;
    translate: any;
    clearRect: any;
    drawImage: any;
    setLineDash: any;
    transform: any;
    imageSmoothingEnabled: boolean;
    globalAlpha: number;
}

interface IFakeCanvasElement {
    width: number;
    height: number;
    getContext: (type: string) => IFakeContext | null;
}

interface IFakeCanvas2D {
    canvas: IFakeCanvasElement;
    ctx: IFakeContext;
    width: number;
    height: number;
    highResolution: boolean;
    antiAliasing: boolean;
    scale: number;
    setHD: (hd: boolean) => void;
    setAntiAliasing: (anti: boolean) => void;
    size: (width: number, height: number) => void;
    clear: () => void;
}

// 用假画布与假纹理替换渲染包，避免包根的模块加载期循环依赖
const fakes = vi.hoisted(() => {
    const instances: IFakeCanvas2D[] = [];
    const createContext = (): IFakeContext => ({
        save: vi.fn(),
        restore: vi.fn(),
        setTransform: vi.fn(),
        scale: vi.fn(),
        rotate: vi.fn(),
        translate: vi.fn(),
        clearRect: vi.fn(),
        drawImage: vi.fn(),
        setLineDash: vi.fn(),
        transform: vi.fn(),
        imageSmoothingEnabled: true,
        globalAlpha: 1
    });
    class FakeCanvas2D implements IFakeCanvas2D {
        canvas: IFakeCanvasElement;
        ctx: IFakeContext;
        width = 0;
        height = 0;
        highResolution = true;
        antiAliasing = true;
        scale = 1;

        constructor() {
            const ctx = createContext();
            this.ctx = ctx;
            this.canvas = { width: 0, height: 0, getContext: () => ctx };
            this.width = this.canvas.width;
            this.height = this.canvas.height;
            instances.push(this);
        }

        setHD(hd: boolean): void {
            this.highResolution = hd;
            this.size(this.width, this.height);
        }

        setAntiAliasing(anti: boolean): void {
            this.antiAliasing = anti;
            this.ctx.imageSmoothingEnabled = anti;
        }

        size(width: number, height: number): void {
            const w = Math.max(width, 1);
            const h = Math.max(height, 1);
            this.canvas.width = w;
            this.canvas.height = h;
            this.width = w;
            this.height = h;
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.scale(1, 1);
            this.ctx.imageSmoothingEnabled = this.antiAliasing;
        }

        clear(): void {
            this.ctx.save();
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }
    }
    class FakeTexture {
        source: unknown;

        constructor(source: unknown) {
            this.source = source;
        }
    }
    vi.stubGlobal('devicePixelRatio', 1);
    return { instances, FakeCanvas2D, FakeTexture };
});

vi.mock('@motajs/render', () => ({
    MotaOffscreenCanvas2D: fakes.FakeCanvas2D,
    Texture: fakes.FakeTexture
}));

import { ITexture, ITextureRenderable } from '@motajs/render';
import {
    AnimationBlendMode,
    IAnimationBitmap,
    IAnimationFrame,
    IAnimationObject,
    IAnimationParsedData,
    RenderAnimater
} from '../index';

// 构造只含测试所需字段的假纹理，并返回其释放函数
function createTexture(): {
    texture: ITexture;
    source: { name: string };
    dispose: ReturnType<typeof vi.fn>;
} {
    const source = { name: 'texture-source' };
    const dispose = vi.fn();
    const texture = { source, dispose } as unknown as ITexture;
    return { texture, source, dispose };
}

// 构造一个默认的动画对象
function makeObject(
    overrides: Partial<IAnimationObject> = {}
): IAnimationObject {
    return {
        index: 0,
        x: 0,
        y: 0,
        scale: 100,
        opacity: 255,
        mirror: 0,
        rotate: 0,
        ...overrides
    };
}

// 构造一个默认的动画帧
function makeFrame(overrides: Partial<IAnimationFrame> = {}): IAnimationFrame {
    return {
        width: 10,
        height: 20,
        originX: 0,
        originY: 0,
        objects: [],
        ...overrides
    };
}

// 构造解析后的动画数据
function makeData(
    texture: ITexture,
    frames: IAnimationFrame[],
    bitmaps: IAnimationBitmap[] = [{ x: 0, y: 0, width: 32, height: 16 }]
): IAnimationParsedData {
    return {
        texture,
        bitmaps,
        frames,
        blend: AnimationBlendMode.Normal
    };
}

// 取生成器下一帧的渲染对象
function nextValue(
    generator: Generator<ITextureRenderable, void>
): ITextureRenderable {
    const result = generator.next();
    return result.value as ITextureRenderable;
}

beforeEach(() => {
    fakes.instances.length = 0;
});

afterAll(() => {
    vi.unstubAllGlobals();
});

describe('RenderAnimater', () => {
    // once 依次产出每帧，矩形与帧尺寸一致，且两帧复用同一块画布
    it('yields every frame once with the frame rect', () => {
        const { texture } = createTexture();
        const frames = [makeFrame(), makeFrame({ width: 5, height: 6 })];
        const animater = new RenderAnimater();
        const generator = animater.once(texture, makeData(texture, frames));

        const first = nextValue(generator);
        const second = nextValue(generator);

        expect(first.rect).toEqual({ x: 0, y: 0, w: 10, h: 20 });
        expect(second.rect).toEqual({ x: 0, y: 0, w: 5, h: 6 });
        expect(fakes.instances.length).toBe(1);
        expect(first.source).toBe(fakes.instances[0].canvas);
        expect(second.source).toBe(first.source);
        expect(fakes.instances[0].highResolution).toBe(false);
        expect(fakes.instances[0].antiAliasing).toBe(false);
    });

    // 下一次 next 恢复后复用同一块画布并按新帧重设尺寸
    it('resizes the same canvas when resumed', () => {
        const { texture } = createTexture();
        const frames = [makeFrame(), makeFrame({ width: 5, height: 6 })];
        const animater = new RenderAnimater();
        const generator = animater.once(texture, makeData(texture, frames));

        nextValue(generator);
        const canvas = fakes.instances[0];
        expect(canvas.canvas.width).toBe(10);
        expect(canvas.canvas.height).toBe(20);

        nextValue(generator);
        expect(canvas.canvas.width).toBe(5);
        expect(canvas.canvas.height).toBe(6);
        expect(fakes.instances.length).toBe(1);
    });

    // 正常播放完毕时清空同一块画布并把尺寸归零
    it('clears and zeroes the canvas on normal completion', () => {
        const { texture } = createTexture();
        const animater = new RenderAnimater();
        const generator = animater.once(
            texture,
            makeData(texture, [makeFrame()])
        );

        nextValue(generator);
        const canvas = fakes.instances[0];
        const end = generator.next();

        expect(end.done).toBe(true);
        expect(canvas.ctx.clearRect).toHaveBeenCalledTimes(1);
        expect(canvas.canvas.width).toBe(0);
        expect(canvas.canvas.height).toBe(0);
    });

    // 提前 return 不清理最后一帧，保留在画布中交给垃圾回收
    it('leaves the last frame on the canvas on early return', () => {
        const { texture } = createTexture();
        const animater = new RenderAnimater();
        const generator = animater.once(
            texture,
            makeData(texture, [makeFrame()])
        );

        nextValue(generator);
        const canvas = fakes.instances[0];
        generator.return();

        expect(canvas.ctx.clearRect).not.toHaveBeenCalled();
        expect(canvas.canvas.width).toBe(10);
        expect(canvas.canvas.height).toBe(20);
    });

    // cycled 播放到最后一帧后回到第一帧且复用同一图像源
    it('loops back to the first frame when cycled', () => {
        const { texture } = createTexture();
        const frames = [makeFrame(), makeFrame({ width: 5, height: 6 })];
        const animater = new RenderAnimater();
        const generator = animater.cycled(texture, makeData(texture, frames));

        const first = nextValue(generator);
        const second = nextValue(generator);
        const third = nextValue(generator);

        expect(first.rect.w).toBe(10);
        expect(second.rect.w).toBe(5);
        expect(third.rect.w).toBe(10);
        expect(second.source).toBe(first.source);
        expect(third.source).toBe(first.source);
    });

    // 空帧产出 1x1 透明画布且不调用 drawImage
    it('yields a transparent 1x1 canvas for an empty frame', () => {
        const { texture } = createTexture();
        const animater = new RenderAnimater();
        const generator = animater.once(
            texture,
            makeData(texture, [makeFrame({ width: 1, height: 1, objects: [] })])
        );

        const renderable = nextValue(generator);
        const canvas = fakes.instances[0];

        expect(renderable.rect).toEqual({ x: 0, y: 0, w: 1, h: 1 });
        expect(canvas.ctx.drawImage).not.toHaveBeenCalled();
    });

    // 绘制时按居中变换顺序应用原点、镜像、旋转、透明度与目标矩形
    it('applies the centered transform for each object', () => {
        const { texture } = createTexture();
        const object = makeObject({
            x: 5,
            y: -3,
            scale: 200,
            opacity: 128,
            mirror: 1,
            rotate: 90
        });
        const frame = makeFrame({
            originX: 16,
            originY: 10,
            objects: [object]
        });
        const animater = new RenderAnimater();
        const generator = animater.once(texture, makeData(texture, [frame]));

        nextValue(generator);
        const canvas = fakes.instances[0];
        const ctx = canvas.ctx;

        expect(ctx.save).toHaveBeenCalledTimes(1);
        expect(ctx.restore).toHaveBeenCalledTimes(1);
        expect(ctx.translate).toHaveBeenCalledWith(21, 7);
        expect(ctx.scale).toHaveBeenCalledWith(-1, 1);
        expect(ctx.rotate.mock.calls[0][0]).toBeCloseTo(-Math.PI / 2, 6);
        expect(ctx.globalAlpha).toBeCloseTo(128 / 255, 6);
        expect(ctx.drawImage).toHaveBeenCalledWith(
            texture.source,
            0,
            0,
            32,
            16,
            -32,
            -16,
            64,
            32
        );
    });

    // 没有帧时 once 与 cycled 都立即结束且不创建画布
    it('ends immediately when there are no frames', () => {
        const { texture } = createTexture();
        const animater = new RenderAnimater();
        const data = makeData(texture, []);

        expect(animater.once(texture, data).next().done).toBe(true);
        expect(animater.cycled(texture, data).next().done).toBe(true);
        expect(fakes.instances.length).toBe(0);
    });

    // 动画器不会释放源纹理
    it('does not dispose the source texture', () => {
        const { texture, dispose } = createTexture();
        const animater = new RenderAnimater();
        const generator = animater.once(
            texture,
            makeData(texture, [makeFrame()])
        );

        nextValue(generator);
        generator.next();

        expect(dispose).not.toHaveBeenCalled();
    });
});
