import { RenderItem, RenderItemDefaultHooks } from './item';
import { CanvasStyle } from '../types';
import { logger } from '@motajs/common';
import { clamp, isEqual, isNil } from 'lodash-es';
import {
    ILineProperty,
    GraphicMode,
    IGraphicRenderItem,
    IGraphicCircle,
    IGraphicEllipse,
    IGraphicLine,
    IGraphicBezierCurve,
    IGraphicQuadBezierCurve,
    IGraphicPath,
    RectRCorner,
    CircleParams,
    EllipseParams,
    RectRCircleParams,
    RectREllipseParams,
    IGraphicRectR,
    IRenderItemBaseHooks
} from './types';
import { MotaOffscreenCanvas2D } from './canvas2d';

// 所有的图形元素都考虑了描边粗细的影响，为防止因为描边导致内容溢出，在有描边存在时，会将图形路径向内收缩以避免溢出，
// 图形路径会向内收缩描边宽度的一半，不能保证在 `miter` 线接方式下，连接处不会溢出，不能保证线头不会溢出

const enum GraphicModeProp {
    Fill,
    Stroke,
    StrokeAndFill
}

/** 用于点击检测的画布 */
const testCanvas = new MotaOffscreenCanvas2D(false);
testCanvas.size(1, 1);

export abstract class GraphicItemBase
    extends RenderItem
    implements Required<ILineProperty>, IGraphicRenderItem
{
    mode: GraphicMode = GraphicMode.Fill;
    fill: CanvasStyle = '#ddd';
    stroke: CanvasStyle = '#ddd';
    lineWidth: number = 2;
    lineDash: number[] = [];
    lineDashOffset: number = 0;
    lineJoin: CanvasLineJoin = 'bevel';
    lineCap: CanvasLineCap = 'butt';
    miterLimit: number = 10;
    fillRule: CanvasFillRule = 'nonzero';

    /** props 是否启用了 fill */
    private propFill: boolean = true;
    /** props 是否启用了 stroke */
    private propStroke: boolean = false;
    /** props 是否启用了 strokeAndFill */
    private strokeAndFill: boolean = false;
    /** props 是否设置过 fill */
    private propFillSet: boolean = false;

    /** 交互是否仅在描边上判定 */
    private actionStroke: boolean = false;
    /** 当前的缓存 Path2D */
    private cachePath?: Path2D;
    /** 路径缓存是否为脏 */
    protected pathDirty: boolean = true;

    /**
     * 获取这个元素的绘制路径
     */
    abstract getPath(stroke: boolean, lineWidth: number): Path2D;

    protected getDefaultCache(): boolean {
        return false;
    }

    protected getDefaultHook(): IRenderItemBaseHooks {
        return new RenderItemDefaultHooks(this.events);
    }

    private refreshCache() {
        if (!this.pathDirty) return;
        const stroke = this.mode !== GraphicMode.Fill;
        this.cachePath = this.getPath(stroke, this.lineWidth);
        this.pathDirty = false;
    }

    protected render(canvas: MotaOffscreenCanvas2D): void {
        const ctx = canvas.ctx;
        this.setCanvasState(canvas);
        this.refreshCache();
        const path = this.cachePath;
        if (!path) return;

        switch (this.mode) {
            case GraphicMode.Fill:
                ctx.fill(path, this.fillRule);
                break;
            case GraphicMode.Stroke:
                ctx.stroke(path);
                break;
            case GraphicMode.FillAndStroke:
                ctx.fill(path, this.fillRule);
                ctx.stroke(path);
                break;
            case GraphicMode.StrokeAndFill:
                ctx.stroke(path);
                ctx.fill(path, this.fillRule);
                break;
        }
    }

    protected isActionInElement(x: number, y: number): boolean {
        const ctx = testCanvas.ctx;
        this.refreshCache();
        const path = this.cachePath;
        if (!path) return false;
        const fixX = x * devicePixelRatio;
        const fixY = y * devicePixelRatio;
        ctx.lineWidth = this.lineWidth;
        ctx.lineCap = this.lineCap;
        ctx.lineJoin = this.lineJoin;
        ctx.setLineDash(this.lineDash);
        switch (this.mode) {
            case GraphicMode.Fill:
                return ctx.isPointInPath(path, fixX, fixY, this.fillRule);
            case GraphicMode.Stroke:
                if (this.actionStroke) {
                    return ctx.isPointInStroke(path, fixX, fixY);
                } else {
                    return (
                        ctx.isPointInPath(path, fixX, fixY, this.fillRule) ||
                        ctx.isPointInStroke(path, fixX, fixY)
                    );
                }
            case GraphicMode.FillAndStroke:
            case GraphicMode.StrokeAndFill:
                return (
                    ctx.isPointInPath(path, fixX, fixY, this.fillRule) ||
                    ctx.isPointInStroke(path, fixX, fixY)
                );
        }
    }

    /**
     * 设置描边绘制的信息
     * @param options 线的信息
     */
    setLineOption(options: Partial<ILineProperty>) {
        if (!isNil(options.lineWidth)) {
            this.lineWidth = options.lineWidth;
            this.pathDirty = true;
        }
        if (!isNil(options.lineDash)) {
            this.lineDash = options.lineDash;
        }
        if (!isNil(options.lineDashOffset)) {
            this.lineDashOffset = options.lineDashOffset;
        }
        if (!isNil(options.lineJoin)) {
            this.lineJoin = options.lineJoin;
        }
        if (!isNil(options.lineCap)) {
            this.lineCap = options.lineCap;
        }
        if (!isNil(options.miterLimit)) {
            this.miterLimit = options.miterLimit;
        }
        this.update();
    }

    /**
     * 设置填充样式
     * @param style 绘制样式
     */
    setFillStyle(style: CanvasStyle) {
        this.fill = style;
        this.update();
    }

    /**
     * 设置描边样式
     * @param style 绘制样式
     */
    setStrokeStyle(style: CanvasStyle) {
        this.stroke = style;
        this.update();
    }

    /**
     * 设置填充原则
     * @param rule 填充原则
     */
    setFillRule(rule: CanvasFillRule) {
        this.fillRule = rule;
        this.update();
    }

    /**
     * 设置绘制模式，是描边还是填充
     * @param mode 绘制模式
     */
    setMode(mode: GraphicMode) {
        const beforeStroke = this.mode !== GraphicMode.Fill;
        const nowStroke = mode !== GraphicMode.Fill;
        this.mode = mode;
        if (nowStroke !== beforeStroke) {
            // 当描边状态改变时，需要把路径标记为脏
            this.pathDirty = true;
        }
        this.update();
    }

    /**
     * 检查渲染模式，参考 {@link GraphicPropsBase} 中的 fill stroke strokeAndFill 属性
     */
    private checkMode(mode: GraphicModeProp, value: boolean) {
        switch (mode) {
            case GraphicModeProp.Fill:
                this.propFill = value;
                this.propFillSet = true;
                break;
            case GraphicModeProp.Stroke:
                this.propStroke = value;
                break;
            case GraphicModeProp.StrokeAndFill:
                this.strokeAndFill = value;
                break;
        }
        if (this.strokeAndFill) {
            this.mode = GraphicMode.StrokeAndFill;
        } else {
            if (!this.propFillSet) {
                if (this.propStroke) {
                    this.mode = GraphicMode.Stroke;
                } else {
                    this.mode = GraphicMode.Fill;
                }
            } else {
                if (this.propFill && this.propStroke) {
                    this.mode = GraphicMode.FillAndStroke;
                } else if (this.propFill) {
                    this.mode = GraphicMode.Fill;
                } else if (this.propStroke) {
                    this.mode = GraphicMode.Stroke;
                } else {
                    this.mode = GraphicMode.Fill;
                }
            }
        }
        this.update();
    }

    /**
     * 设置画布的渲染状态，在实际渲染前调用
     * @param canvas 要设置的画布
     */
    protected setCanvasState(canvas: MotaOffscreenCanvas2D) {
        const ctx = canvas.ctx;
        ctx.fillStyle = this.fill;
        ctx.strokeStyle = this.stroke;
        ctx.lineWidth = this.lineWidth;
        ctx.setLineDash(this.lineDash);
        ctx.lineDashOffset = this.lineDashOffset;
        ctx.lineJoin = this.lineJoin;
        ctx.lineCap = this.lineCap;
        ctx.miterLimit = this.miterLimit;
    }

    protected handleProps(
        key: string,
        _prevValue: any,
        nextValue: any
    ): boolean {
        switch (key) {
            case 'fill':
                if (!this.assertType(nextValue, 'boolean', key)) return false;
                this.checkMode(GraphicModeProp.Fill, nextValue);
                return true;
            case 'stroke':
                if (!this.assertType(nextValue, 'boolean', key)) return false;
                this.checkMode(GraphicModeProp.Stroke, nextValue);
                return true;
            case 'strokeAndFill':
                if (!this.assertType(nextValue, 'boolean', key)) return false;
                this.checkMode(GraphicModeProp.StrokeAndFill, nextValue);
                return true;
            case 'fillRule':
                if (!this.assertType(nextValue, 'string', key)) return false;
                this.setFillRule(nextValue);
                return true;
            case 'fillStyle':
                this.setFillStyle(nextValue);
                return true;
            case 'strokeStyle':
                this.setStrokeStyle(nextValue);
                return true;
            case 'lineWidth':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.lineWidth = nextValue;
                this.update();
                return true;
            case 'lineDash':
                if (!this.assertType(nextValue, Array, key)) return false;
                this.lineDash = nextValue as number[];
                this.update();
                return true;
            case 'lineDashOffset':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.lineDashOffset = nextValue;
                this.update();
                return true;
            case 'lineJoin':
                if (!this.assertType(nextValue, 'string', key)) return false;
                this.lineJoin = nextValue;
                this.update();
                return true;
            case 'lineCap':
                if (!this.assertType(nextValue, 'string', key)) return false;
                this.lineCap = nextValue;
                this.update();
                return true;
            case 'miterLimit':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.miterLimit = nextValue;
                this.update();
                return true;
            case 'actionStroke':
                if (!this.assertType(nextValue, 'boolean', key)) return false;
                this.actionStroke = nextValue;
                return true;
        }
        return false;
    }
}

export class Rect extends GraphicItemBase {
    pos(x: number, y: number): void {
        super.pos(x, y);
        this.pathDirty = true;
    }

    size(width: number, height: number): void {
        super.size(width, height);
        this.pathDirty = true;
    }

    getPath(stroke: boolean, lineWidth: number): Path2D {
        const pad = stroke ? lineWidth / 2 : 0;
        const path = new Path2D();
        path.rect(pad, pad, this.width - pad * 2, this.height - pad * 2);
        return path;
    }
}

export class Circle extends GraphicItemBase implements IGraphicCircle {
    radius: number = 10;
    start: number = 0;
    end: number = Math.PI * 2;
    anchorX: number = 0.5;
    anchorY: number = 0.5;

    getPath(stroke: boolean, lineWidth: number): Path2D {
        const pad = stroke ? lineWidth / 2 : 0;
        const path = new Path2D();
        const radius = this.radius;
        path.arc(radius, radius, radius - pad, this.start, this.end);
        return path;
    }

    /**
     * 设置圆的半径
     * @param radius 半径
     */
    setRadius(radius: number) {
        this.radius = radius;
        this.size(radius * 2, radius * 2);
        this.pathDirty = true;
        this.update();
    }

    /**
     * 设置圆的起始与终止角度
     * @param start 起始角度
     * @param end 终止角度
     */
    setAngle(start: number, end: number) {
        this.start = start;
        this.end = end;
        this.pathDirty = true;
        this.update();
    }

    protected handleProps(
        key: string,
        prevValue: any,
        nextValue: any
    ): boolean {
        switch (key) {
            case 'radius':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setRadius(nextValue);
                return true;
            case 'start':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setAngle(nextValue, this.end);
                return true;
            case 'end':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setAngle(this.start, nextValue);
                return true;
            case 'circle': {
                if (isEqual(nextValue, prevValue)) return true;
                const value = nextValue as CircleParams;
                if (!this.assertType(value, Array, key)) return false;
                const [cx, cy, radius, start, end] = value;
                if (!isNil(cx) && !isNil(cy)) {
                    this.pos(cx, cy);
                }
                if (!isNil(radius)) {
                    this.setRadius(radius);
                }
                if (!isNil(start) && !isNil(end)) {
                    this.setAngle(start, end);
                }
                return true;
            }
        }
        return super.handleProps(key, prevValue, nextValue);
    }
}

export class Ellipse extends GraphicItemBase implements IGraphicEllipse {
    radiusX: number = 10;
    radiusY: number = 10;
    start: number = 0;
    end: number = Math.PI * 2;
    anchorX: number = 0.5;
    anchorY: number = 0.5;

    getPath(stroke: boolean, lineWidth: number): Path2D {
        const pad = stroke ? lineWidth / 2 : 0;
        const path = new Path2D();
        const rx = this.radiusX;
        const ry = this.radiusY;
        path.ellipse(rx, ry, rx - pad, ry - pad, 0, this.start, this.end);
        return path;
    }

    /**
     * 设置椭圆的横纵轴半径
     * @param x 横轴半径
     * @param y 纵轴半径
     */
    setRadius(x: number, y: number) {
        this.radiusX = x;
        this.radiusY = y;
        this.size(x * 2, y * 2);
        this.pathDirty = true;
        this.update();
    }

    /**
     * 设置椭圆的起始与终止角度
     * @param start 起始角度
     * @param end 终止角度
     */
    setAngle(start: number, end: number) {
        this.start = start;
        this.end = end;
        this.pathDirty = true;
        this.update();
    }

    protected handleProps(
        key: string,
        prevValue: any,
        nextValue: any
    ): boolean {
        switch (key) {
            case 'radiusX':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setRadius(nextValue, this.radiusY);
                return true;
            case 'radiusY':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setRadius(this.radiusY, nextValue);
                return true;
            case 'start':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setAngle(nextValue, this.end);
                return true;
            case 'end':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setAngle(this.start, nextValue);
                return true;
            case 'ellipse': {
                if (isEqual(nextValue, prevValue)) return true;
                const value = nextValue as EllipseParams;
                if (!this.assertType(value, Array, key)) return false;
                const [cx, cy, radiusX, radiusY, start, end] = value;
                if (!isNil(cx) && !isNil(cy)) {
                    this.pos(cx, cy);
                }
                if (!isNil(radiusX) && !isNil(radiusY)) {
                    this.setRadius(radiusX, radiusY);
                }
                if (!isNil(start) && !isNil(end)) {
                    this.setAngle(start, end);
                }
                return true;
            }
        }
        return super.handleProps(key, prevValue, nextValue);
    }
}

export class Line extends GraphicItemBase implements IGraphicLine {
    x1: number = 0;
    y1: number = 0;
    x2: number = 0;
    y2: number = 0;
    mode: GraphicMode = GraphicMode.Stroke;

    getPath(): Path2D {
        const path = new Path2D();
        const x = this.x;
        const y = this.y;
        path.moveTo(this.x1 - x, this.y1 - y);
        path.lineTo(this.x2 - x, this.y2 - y);
        return path;
    }

    /**
     * 设置第一个点的横纵坐标
     */
    setPoint1(x: number, y: number) {
        this.x1 = x;
        this.y1 = y;
        this.fitRect();
        this.update();
    }

    /**
     * 设置第二个点的横纵坐标
     */
    setPoint2(x: number, y: number) {
        this.x2 = x;
        this.y2 = y;
        this.fitRect();
        this.update();
    }

    private fitRect() {
        const left = Math.min(this.x1, this.x2);
        const top = Math.min(this.y1, this.y2);
        const right = Math.max(this.x1, this.x2);
        const bottom = Math.max(this.y1, this.y2);
        this.pos(left, top);
        this.size(right - left, bottom - top);
        this.pathDirty = true;
    }

    protected handleProps(
        key: string,
        prevValue: any,
        nextValue: any
    ): boolean {
        switch (key) {
            case 'x1':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setPoint1(nextValue, this.y1);
                return true;
            case 'y1':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setPoint1(this.x1, nextValue);
                return true;
            case 'x2':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setPoint2(nextValue, this.y2);
                return true;
            case 'y2':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setPoint2(this.x2, nextValue);
                return true;
            case 'line':
                if (isEqual(nextValue, prevValue)) return true;
                if (!this.assertType(nextValue as number[], Array, key)) {
                    return false;
                }
                this.setPoint1(nextValue[0], nextValue[1]);
                this.setPoint2(nextValue[2], nextValue[3]);
                return true;
        }
        return super.handleProps(key, prevValue, nextValue);
    }
}

export class BezierCurve
    extends GraphicItemBase
    implements IGraphicBezierCurve
{
    sx: number = 0;
    sy: number = 0;
    cp1x: number = 0;
    cp1y: number = 0;
    cp2x: number = 0;
    cp2y: number = 0;
    ex: number = 0;
    ey: number = 0;
    mode: GraphicMode = GraphicMode.Stroke;

    getPath(): Path2D {
        const path = new Path2D();
        const x = this.x;
        const y = this.y;
        path.moveTo(this.sx - x, this.sy - y);
        path.bezierCurveTo(
            this.cp1x - x,
            this.cp1y - y,
            this.cp2x - x,
            this.cp2y - y,
            this.ex - x,
            this.ey - y
        );
        return path;
    }

    /**
     * 设置起始点坐标
     */
    setStart(x: number, y: number) {
        this.sx = x;
        this.sy = y;
        this.fitRect();
        this.update();
    }

    /**
     * 设置控制点1坐标
     */
    setControl1(x: number, y: number) {
        this.cp1x = x;
        this.cp1y = y;
        this.fitRect();
        this.update();
    }

    /**
     * 设置控制点2坐标
     */
    setControl2(x: number, y: number) {
        this.cp2x = x;
        this.cp2y = y;
        this.fitRect();
        this.update();
    }

    /**
     * 设置终点坐标
     */
    setEnd(x: number, y: number) {
        this.ex = x;
        this.ey = y;
        this.fitRect();
        this.update();
    }

    private fitRect() {
        const left = Math.min(this.sx, this.cp1x, this.cp2x, this.ex);
        const top = Math.min(this.sy, this.cp1y, this.cp2y, this.ey);
        const right = Math.max(this.sx, this.cp1x, this.cp2x, this.ex);
        const bottom = Math.max(this.sy, this.cp1y, this.cp2y, this.ey);
        this.pos(left, top);
        this.size(right - left, bottom - top);
        this.pathDirty = true;
    }

    protected handleProps(
        key: string,
        prevValue: any,
        nextValue: any
    ): boolean {
        switch (key) {
            case 'sx':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setStart(nextValue, this.sy);
                return true;
            case 'sy':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setStart(this.sx, nextValue);
                return true;
            case 'cp1x':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setControl1(nextValue, this.cp1y);
                return true;
            case 'cp1y':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setControl1(this.cp1x, nextValue);
                return true;
            case 'cp2x':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setControl2(nextValue, this.cp2y);
                return true;
            case 'cp2y':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setControl2(this.cp2x, nextValue);
                return true;
            case 'ex':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setEnd(nextValue, this.ey);
                return true;
            case 'ey':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setEnd(this.ex, nextValue);
                return true;
            case 'curve':
                if (isEqual(nextValue, prevValue)) return true;
                if (!this.assertType(nextValue as number[], Array, key)) {
                    return false;
                }
                this.setStart(nextValue[0], nextValue[1]);
                this.setControl1(nextValue[2], nextValue[3]);
                this.setControl2(nextValue[4], nextValue[5]);
                this.setEnd(nextValue[6], nextValue[7]);
                return true;
        }
        return super.handleProps(key, prevValue, nextValue);
    }
}

export class QuadraticCurve
    extends GraphicItemBase
    implements IGraphicQuadBezierCurve
{
    sx: number = 0;
    sy: number = 0;
    cpx: number = 0;
    cpy: number = 0;
    ex: number = 0;
    ey: number = 0;
    mode: GraphicMode = GraphicMode.Stroke;

    getPath(): Path2D {
        const path = new Path2D();
        const x = this.x;
        const y = this.y;
        path.moveTo(this.sx - x, this.sy - y);
        path.quadraticCurveTo(
            this.cpx - x,
            this.cpy - y,
            this.ex - x,
            this.ey - y
        );
        return path;
    }

    /**
     * 设置起始点坐标
     */
    setStart(x: number, y: number) {
        this.sx = x;
        this.sy = y;
        this.fitRect();
        this.update();
    }

    /**
     * 设置控制点坐标
     */
    setControl(x: number, y: number) {
        this.cpx = x;
        this.cpy = y;
        this.fitRect();
        this.update();
    }

    /**
     * 设置终点坐标
     */
    setEnd(x: number, y: number) {
        this.ex = x;
        this.ey = y;
        this.fitRect();
        this.update();
    }

    private fitRect() {
        const left = Math.min(this.sx, this.cpx, this.ex);
        const top = Math.min(this.sy, this.cpy, this.ey);
        const right = Math.max(this.sx, this.cpx, this.ex);
        const bottom = Math.max(this.sy, this.cpy, this.ey);
        this.pos(left, top);
        this.size(right - left, bottom - top);
        this.pathDirty = true;
    }

    protected handleProps(
        key: string,
        prevValue: any,
        nextValue: any
    ): boolean {
        switch (key) {
            case 'sx':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setStart(nextValue, this.sy);
                return true;
            case 'sy':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setStart(this.sx, nextValue);
                return true;
            case 'cpx':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setControl(nextValue, this.cpy);
                return true;
            case 'cpy':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setControl(this.cpx, nextValue);
                return true;
            case 'ex':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setEnd(nextValue, this.ey);
                return true;
            case 'ey':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setEnd(this.ex, nextValue);
                return true;
            case 'curve':
                if (isEqual(nextValue, prevValue)) return true;
                if (!this.assertType(nextValue as number[], Array, key)) {
                    return false;
                }
                this.setStart(nextValue[0], nextValue[1]);
                this.setControl(nextValue[2], nextValue[3]);
                this.setEnd(nextValue[4], nextValue[5]);
                return true;
        }
        return super.handleProps(key, prevValue, nextValue);
    }
}

export class Path extends GraphicItemBase implements IGraphicPath {
    /** 路径 */
    path: Path2D = new Path2D();

    /**
     * 获取当前路径
     */
    getPath() {
        return this.path;
    }

    /**
     * 重置此元素的路径
     */
    resetPath() {
        this.path = new Path2D();
        this.update();
    }

    /**
     * 为路径添加路径
     * @param path 要添加的路径
     */
    addPath(path: Path2D) {
        this.path.addPath(path);
        this.pathDirty = true;
        this.update();
    }

    protected handleProps(
        key: string,
        prevValue: any,
        nextValue: any
    ): boolean {
        switch (key) {
            case 'path':
                if (!this.assertType(nextValue, Path2D, key)) return false;
                this.path = nextValue;
                this.pathDirty = true;
                this.update();
                return true;
        }
        return super.handleProps(key, prevValue, nextValue);
    }
}

export class RectR extends GraphicItemBase implements IGraphicRectR {
    /** 圆角属性，四元素数组，每个元素是一个二元素数组，表示这个角的半径，顺序为 左上，右上，右下，左下 */
    readonly corner: [radiusX: number, radiusY: number][] = [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0]
    ];

    getPath(stroke: boolean, lineWidth: number): Path2D {
        const pad = stroke ? lineWidth / 2 : 0;
        const path = new Path2D();
        const { width: w, height: h } = this;
        const [[xtl, ytl], [xtr, ytr], [xbr, ybr], [xbl, ybl]] = this.corner;
        const pi = Math.PI;
        // 左上圆角终点
        path.moveTo(xtl + pad, pad);
        // 右上圆角起点
        path.lineTo(w - xtr - pad, pad);
        // 右上圆角终点
        path.ellipse(w - xtr - pad, ytr + pad, xtr, ytr, 0, -pi / 2, 0);
        // 右下圆角起点
        path.lineTo(w - pad, h - ybr - pad);
        // 右下圆角终点
        path.ellipse(w - xbr - pad, h - ybr - pad, xbr, ybr, 0, 0, pi / 2);
        // 左下圆角起点
        path.lineTo(xbl + pad, h - pad);
        // 左下圆角终点
        path.ellipse(xbl + pad, h - ybl - pad, xbl, ybl, 0, pi / 2, pi);
        // 左上圆角起点
        path.lineTo(pad, ytl + pad);
        // 左上圆角终点
        path.ellipse(xtl + pad, ytl + pad, xtl, ytl, 0, pi, -pi / 2);
        path.closePath();
        return path;
    }

    /**
     * 设置圆角半径
     * @param x 横向半径
     * @param y 纵向半径
     */
    setRadius(x: number, y: number, corner: RectRCorner) {
        const hw = this.width / 2;
        const hh = this.height / 2;
        this.corner[corner] = [clamp(x, 0, hw), clamp(y, 0, hh)];
        this.pathDirty = true;
        this.update();
    }

    /**
     * 设置圆形圆角参数
     * @param circle 圆形圆角参数
     */
    setCircle(circle: RectRCircleParams) {
        const [r1, r2 = 0, r3 = 0, r4 = 0] = circle;
        switch (circle.length) {
            case 1: {
                this.setRadius(r1, r1, RectRCorner.BottomLeft);
                this.setRadius(r1, r1, RectRCorner.BottomRight);
                this.setRadius(r1, r1, RectRCorner.TopLeft);
                this.setRadius(r1, r1, RectRCorner.TopRight);
                break;
            }
            case 2: {
                this.setRadius(r1, r1, RectRCorner.TopLeft);
                this.setRadius(r1, r1, RectRCorner.BottomRight);
                this.setRadius(r2, r2, RectRCorner.BottomLeft);
                this.setRadius(r2, r2, RectRCorner.TopRight);
                break;
            }
            case 3: {
                this.setRadius(r1, r1, RectRCorner.TopLeft);
                this.setRadius(r2, r2, RectRCorner.TopRight);
                this.setRadius(r2, r2, RectRCorner.BottomLeft);
                this.setRadius(r3, r3, RectRCorner.BottomRight);
                break;
            }
            case 4: {
                this.setRadius(r1, r1, RectRCorner.TopLeft);
                this.setRadius(r2, r2, RectRCorner.TopRight);
                this.setRadius(r3, r3, RectRCorner.BottomRight);
                this.setRadius(r4, r4, RectRCorner.BottomLeft);
                break;
            }
        }
    }

    /**
     * 设置椭圆圆角参数
     * @param ellipse 椭圆圆角参数
     */
    setEllipse(ellipse: RectREllipseParams) {
        const [rx1, ry1, rx2 = 0, ry2 = 0, rx3 = 0, ry3 = 0, rx4 = 0, ry4 = 0] =
            ellipse;

        switch (ellipse.length) {
            case 2: {
                this.setRadius(rx1, ry1, RectRCorner.BottomLeft);
                this.setRadius(rx1, ry1, RectRCorner.BottomRight);
                this.setRadius(rx1, ry1, RectRCorner.TopLeft);
                this.setRadius(rx1, ry1, RectRCorner.TopRight);
                break;
            }
            case 4: {
                this.setRadius(rx1, ry1, RectRCorner.TopLeft);
                this.setRadius(rx1, ry1, RectRCorner.BottomRight);
                this.setRadius(rx2, ry2, RectRCorner.BottomLeft);
                this.setRadius(rx2, ry2, RectRCorner.TopRight);
                break;
            }
            case 6: {
                this.setRadius(rx1, ry1, RectRCorner.TopLeft);
                this.setRadius(rx2, ry2, RectRCorner.TopRight);
                this.setRadius(rx2, ry2, RectRCorner.BottomLeft);
                this.setRadius(rx3, ry3, RectRCorner.BottomRight);
                break;
            }
            case 8: {
                this.setRadius(rx1, ry1, RectRCorner.TopLeft);
                this.setRadius(rx2, ry2, RectRCorner.TopRight);
                this.setRadius(rx3, ry3, RectRCorner.BottomRight);
                this.setRadius(rx4, ry4, RectRCorner.BottomLeft);
                break;
            }
            default: {
                logger.warn(58, ellipse.length.toString());
            }
        }
    }

    protected handleProps(
        key: string,
        prevValue: any,
        nextValue: any
    ): boolean {
        switch (key) {
            case 'circle': {
                const value = nextValue as RectRCircleParams;
                if (!this.assertType(value, Array, key)) return false;
                this.setCircle(value);
                return true;
            }
            case 'ellipse': {
                const value = nextValue as RectREllipseParams;
                if (!this.assertType(value, Array, key)) return false;
                this.setEllipse(value);
                return true;
            }
        }
        return super.handleProps(key, prevValue, nextValue);
    }
}
