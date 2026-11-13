import { RenderItem, Transform, MotaOffscreenCanvas2D } from '.';
import { CanvasStyle } from '../types';
import { Font } from '../style';
import {
    IRenderAnimated,
    IRenderImage,
    IRenderText,
    IRenderTreeRoot
} from './types';
import { ITexture, ITextureAnimater, ITextureRenderable } from '../assets';

/** 文字的安全填充，会填充在文字的上侧和下侧，防止削顶和削底 */
const SAFE_PAD = 1;

/** 文本测量画布 */
const MEASURE = new MotaOffscreenCanvas2D();
MEASURE.setHD(false);
MEASURE.setScale(1);
MEASURE.size(1, 1);

export class Text extends RenderItem implements IRenderText {
    text: string = '';

    fillStyle?: CanvasStyle = '#fff';
    strokeStyle?: CanvasStyle;
    font: Font = new Font();
    strokeWidth: number = 1;

    /** 文本的下边缘位置 */
    private descent: number = 0;

    protected getDefaultCache(): boolean {
        return false;
    }

    protected render(
        canvas: MotaOffscreenCanvas2D,
        _transform: Transform
    ): void {
        const ctx = canvas.ctx;
        const stroke = this.strokeWidth;
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = this.fillStyle ?? 'transparent';
        ctx.strokeStyle = this.strokeStyle ?? 'transparent';
        ctx.font = this.font.string();
        ctx.lineWidth = this.strokeWidth;
        ctx.lineJoin = 'round';

        if (this.strokeStyle) {
            ctx.strokeText(this.text, stroke, this.descent + stroke + SAFE_PAD);
        }
        if (this.fillStyle) {
            ctx.fillText(this.text, stroke, this.descent + stroke + SAFE_PAD);
        }
    }

    /**
     * 获取文字的长度
     */
    measure() {
        const ctx = MEASURE.ctx;
        ctx.textBaseline = 'bottom';
        ctx.font = this.font.string();
        const res = ctx.measureText(this.text);
        return res;
    }

    /**
     * 设置显示文字
     * @param text 显示的文字
     */
    setText(text: string) {
        this.text = text;
        this.calBox();
        this.update();
    }

    /**
     * 设置使用的字体
     * @param font 字体
     */
    setFont(font: Font) {
        this.font = font;
        this.calBox();
        this.update(this);
    }

    /**
     * 设置字体样式
     * @param fill 填充样式
     * @param stroke 描边样式
     */
    setStyle(fill?: CanvasStyle, stroke?: CanvasStyle) {
        this.fillStyle = fill;
        this.strokeStyle = stroke;
        this.update();
    }

    /**
     * 设置描边宽度
     * @param width 宽度
     */
    setStrokeWidth(width: number) {
        const before = this.strokeWidth;
        this.strokeWidth = width;
        const dw = width - before;
        this.size(this.width + dw * 2, this.height + dw * 2);
        this.update();
    }

    /**
     * 计算字体所占空间，从而确定这个元素的大小
     */
    calBox() {
        const { width, actualBoundingBoxAscent, actualBoundingBoxDescent } =
            this.measure();
        this.descent = actualBoundingBoxAscent;
        const height = actualBoundingBoxAscent + actualBoundingBoxDescent;
        const stroke = this.strokeWidth * 2;
        this.size(width + stroke, height + stroke + SAFE_PAD * 2);
    }

    protected handleProps(
        key: string,
        _prevValue: any,
        nextValue: any
    ): boolean {
        switch (key) {
            case 'text':
                if (!this.assertType(nextValue, 'string', key)) return false;
                this.setText(nextValue);
                return true;
            case 'fillStyle':
                this.setStyle(nextValue, this.strokeStyle);
                return true;
            case 'strokeStyle':
                this.setStyle(this.fillStyle, nextValue);
                return true;
            case 'font':
                if (!this.assertType(nextValue, Font, key)) return false;
                this.setFont(nextValue);
                return true;
            case 'strokeWidth':
                this.setStrokeWidth(nextValue);
                return true;
        }
        return false;
    }
}

export class Image extends RenderItem implements IRenderImage {
    image: ITexture | null = null;

    protected getDefaultCache(): boolean {
        return false;
    }

    protected render(
        canvas: MotaOffscreenCanvas2D,
        _transform: Transform
    ): void {
        if (!this.image) return;
        const ctx = canvas.ctx;
        const {
            source,
            rect: { x, y, w, h }
        } = this.image.render();
        ctx.drawImage(source, x, y, w, h, 0, 0, this.width, this.height);
    }

    /**
     * 设置图片资源
     * @param image 图片资源
     */
    setImage(image: ITexture | null) {
        this.image = image;
        this.update();
    }

    protected handleProps(
        key: string,
        _prevValue: any,
        nextValue: any
    ): boolean {
        switch (key) {
            case 'image':
                if (!nextValue) this.setImage(null);
                else this.setImage(nextValue);
                return true;
        }
        return false;
    }
}

export class Animated<T> extends RenderItem implements IRenderAnimated<T> {
    texture: ITexture | null = null;
    animater: ITextureAnimater<T> | null = null;
    interval: number = 50;
    cycled: boolean = false;
    paused: boolean = false;
    param: T | undefined = void 0;

    /** 当前时刻 */
    private currentTime: number = -1;
    /** 上一帧的时刻 */
    private lastFrameTime: number = -1;
    /** 当前的可渲染对象 */
    private current: ITextureRenderable | null = null;

    /** 动画生成器 */
    private gen: Generator<ITextureRenderable, void> | null = null;
    /** 委托 Excitation 的 id */
    private delegation: number = -1;

    protected onConnected(root: IRenderTreeRoot): void {
        this.delegation = root.delegateExcitable(time => {
            this.currentTime = time;
            if (this.lastFrameTime === -1) {
                this.lastFrameTime = time;
            }
            if (this.paused || !this.gen) return;
            const dt = time - this.lastFrameTime;
            const nextFrames = Math.floor(dt / this.interval);
            if (!this.current || nextFrames >= 1) {
                const pass = this.current ? nextFrames : 1;
                for (let i = 0; i < pass; i++) {
                    const next = this.gen.next();
                    if (next.done) break;
                    this.current = next.value;
                }
                this.lastFrameTime = time;
                this.update();
            }
        });
    }

    protected onDisconnected(prevRoot: IRenderTreeRoot): void {
        prevRoot.removeExcitable(this.delegation);
    }

    protected getDefaultCache(): boolean {
        return false;
    }

    protected render(canvas: MotaOffscreenCanvas2D): void {
        const ctx = canvas.ctx;
        if (!this.current) return;
        const { source, rect: r } = this.current;
        const { width, height } = this;
        ctx.drawImage(source, r.x, r.y, r.w, r.h, 0, 0, width, height);
    }

    /**
     * 执行动画执行器，获取动画序列生成器
     */
    private generate() {
        if (!this.animater || !this.texture) {
            this.gen = null;
            this.current = null;
            this.update();
            return;
        }
        if (this.cycled) {
            this.gen = this.animater.cycled(this.texture, this.param as T);
            this.lastFrameTime = this.currentTime;
        } else {
            this.gen = this.animater.once(this.texture, this.param as T);
            this.lastFrameTime = this.currentTime;
        }
        this.update();
    }

    setTexture(texture: ITexture | null): void {
        this.texture = texture;
        this.generate();
    }

    setInterval(interval: number): void {
        if (interval <= 0) {
            this.interval = 50;
        } else {
            this.interval = interval;
        }
    }

    setAnimater(animater: ITextureAnimater<T> | null): void {
        this.animater = animater;
        this.generate();
    }

    setParam(param: T | undefined): void {
        this.param = param;
        this.generate();
    }

    pause(): void {
        this.paused = true;
    }

    resume(): void {
        this.paused = false;
        this.lastFrameTime = this.currentTime;
    }

    setCycled(cycled: boolean): void {
        this.cycled = cycled;
        this.generate();
    }
}

export class Comment extends RenderItem {
    readonly isComment: boolean = true;

    constructor() {
        super();
        this.hide();
    }

    protected getDefaultCache(): boolean {
        return false;
    }

    getBoundingRect(): DOMRectReadOnly {
        return new DOMRectReadOnly(0, 0, 0, 0);
    }

    protected render(): void {}
}
