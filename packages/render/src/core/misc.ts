import { RenderItem, Transform, MotaOffscreenCanvas2D } from '.';
import { CanvasStyle } from '../types';
import { Font } from '../style';
import { IRenderImage, IRenderText } from './types';
import { ITexture } from '../assets';

/** 文字的安全填充，会填充在文字的上侧和下侧，防止削顶和削底 */
const SAFE_PAD = 1;

export class Text extends RenderItem implements IRenderText {
    text: string;

    fillStyle?: CanvasStyle = '#fff';
    strokeStyle?: CanvasStyle;
    font: Font = new Font();
    strokeWidth: number = 1;

    private length: number = 0;
    private descent: number = 0;

    private static measureCanvas = new MotaOffscreenCanvas2D();

    constructor(text: string = '', enableCache: boolean = false) {
        super(enableCache);

        this.text = text;
        if (text.length > 0) {
            this.requestBeforeFrame(() => {
                this.calBox();
            });
        }
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
        const ctx = Text.measureCanvas.ctx;
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
        this.length = width;
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
    image: ITexture | null;

    constructor(enableCache: boolean = false) {
        super(enableCache);
        this.image = null;
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

export class Comment extends RenderItem {
    readonly isComment: boolean = true;

    constructor(public text: string = '') {
        super(false);
        this.hide();
    }

    getBoundingRect(): DOMRectReadOnly {
        return new DOMRectReadOnly(0, 0, 0, 0);
    }

    protected render(
        _canvas: MotaOffscreenCanvas2D,
        _transform: Transform
    ): void {}
}
