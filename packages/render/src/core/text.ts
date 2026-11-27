import { Font } from '../style';
import { MotaOffscreenCanvas2D } from './canvas2d';
import { RenderItem, RenderItemDefaultHooks } from './item';
import { IRenderText, IRenderTextHooks } from './types';

/** 文字的安全填充，会填充在文字的上侧和下侧，防止削顶和削底 */
const SAFE_PAD = 1;

/** 文本测量画布 */
const MEASURE = new MotaOffscreenCanvas2D();
MEASURE.setHD(false);
MEASURE.setScale(1);
MEASURE.size(1, 1);

export class RenderText
    extends RenderItem<IRenderTextHooks>
    implements IRenderText
{
    text: string = '';

    fillStyle?: CanvasStyle = '#fff';
    strokeStyle?: CanvasStyle;
    font: Font = new Font();
    strokeWidth: number = 1;

    /** 文本的下边缘位置 */
    private descent: number = 0;

    constructor() {
        super();
        this.eventNames.add('onSetText').add('onUpdateSize');
    }

    protected getDefaultCache(): boolean {
        return false;
    }

    protected getDefaultHook(): IRenderTextHooks {
        return new RenderTextDefaultHooks(this.events);
    }

    protected render(canvas: MotaOffscreenCanvas2D): void {
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
        this.forEachHook(hook => hook.onSetText?.(text));
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
        const tw = width + stroke;
        const th = height + stroke + SAFE_PAD * 2;
        this.size(tw, th);
        this.forEachHook(hook => hook.onUpdateSize?.(tw, th));
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

export class RenderTextDefaultHooks
    extends RenderItemDefaultHooks
    implements IRenderTextHooks
{
    onSetText(text: string): void {
        this.list.get('onSetText')?.(text);
    }
}
