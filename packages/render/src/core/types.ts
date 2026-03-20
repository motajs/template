import { IExcitable, IExcitation } from '@motajs/animate';
import { ITransformUpdatable, Transform } from './transform';
import {
    ActionEventMap,
    ActionType,
    ERenderItemActionEvent,
    EventProgress
} from './event';
import { MotaOffscreenCanvas2D } from './canvas2d';
import { Font } from '../style';
import { DefineComponent, DefineSetupFnComponent } from 'vue';
import { JSX } from 'vue/jsx-runtime';
import EventEmitter from 'eventemitter3';
import { SizedCanvasImageSource } from '../types';
import { ITexture } from '../assets';

//#region 功能类型

export const enum RenderPosition {
    /** 绝对定位，受到坐标与变换矩阵的影响 */
    Absolute
}

export type Props<
    T extends
        | keyof JSX.IntrinsicElements
        | DefineSetupFnComponent<any>
        | DefineComponent
> = T extends keyof JSX.IntrinsicElements
    ? JSX.IntrinsicElements[T]
    : T extends DefineSetupFnComponent<any>
      ? InstanceType<T>['$props'] & InstanceType<T>['$emits']
      : T extends DefineComponent
        ? InstanceType<T>['$props'] & InstanceType<T>['$emits']
        : unknown;

export type ElementLocator = [
    x?: number,
    y?: number,
    width?: number,
    height?: number,
    anchorX?: number,
    anchorY?: number
];

export type ElementAnchor = [x: number, y: number];
export type ElementScale = [x: number, y: number];

//#endregion

//#region 渲染元素

export type ExcitableDelegation =
    | IExcitable<number>
    | ((payload: number) => void);

export interface ERenderItemEvent extends ERenderItemActionEvent {
    resize: [width: number, height: number];
    transform: [item: IRenderItem, transform: Transform];
}

export interface IRenderItem
    extends ITransformUpdatable<Transform>, EventEmitter<ERenderItemEvent> {
    /** 是否为根元素 */
    readonly isRoot: boolean;
    /** 当前元素的父元素 */
    readonly parent: IRenderItem | null;
    /** 当前元素的子元素 */
    readonly children: Set<IRenderItem>;
    /** 此元素所附属的根元素 */
    readonly root: IRenderTreeRoot | null;
    /** 当前元素是否连接至根元素 */
    readonly connected: boolean;

    /** 渲染元素的唯一标识符，每个渲染元素都会不一样 */
    readonly uid: number;
    /** 渲染元素标识符，原则上不能重复 */
    readonly id: string;

    /** 是否是注释元素 */
    readonly isComment: boolean;

    /** 元素纵深 */
    readonly zIndex: number;
    /** 元素横坐标 */
    readonly x: number;
    /** 元素纵坐标 */
    readonly y: number;
    /** 元素宽度 */
    readonly width: number;
    /** 元素高度 */
    readonly height: number;
    /** 锚点横坐标，0表示最左端，1表示最右端 */
    readonly anchorX: number;
    /** 锚点纵坐标，0表示最上端，1表示最下端 */
    readonly anchorY: number;

    /** 元素定位方式 */
    readonly position: RenderPosition;
    /** 元素变换矩阵 */
    readonly transform: Transform;

    /** 是否是高清画布 */
    readonly highResolution: boolean;
    /** 是否启用抗锯齿 */
    readonly antiAliasing: boolean;
    /** 是否隐藏当前元素，隐藏后不会被渲染，但仍存在于渲染树中 */
    readonly hidden: boolean;
    /** 元素滤镜 */
    readonly filter: string;
    /** 元素与在其下方的元素的混合模式 */
    readonly composite: GlobalCompositeOperation;
    /** 元素不透明度 */
    readonly alpha: number;
    /** 元素的缩放比例，与渲染器的缩放比例及 `devicePixelRatio` 等有关 */
    readonly scale: number;

    /** 光标样式 */
    readonly cursor: string;
    /** 当前元素是否忽略交互事件 */
    readonly noEvent: boolean;

    /** 当前元素是否启用缓存机制 */
    readonly enableCache: boolean;

    //#region 渲染部分

    /**
     * 更新这个渲染元素
     * @param item 触发更新事件的元素，不填默认为元素自身触发
     */
    update(item?: IRenderItem): void;

    /**
     * 刷新所有子元素
     */
    refreshAllChildren(): void;

    /**
     * 将此元素渲染至目标画布上
     * @param canvas 渲染至的画布
     * @param transform 父元素的变换矩阵
     */
    renderContent(canvas: MotaOffscreenCanvas2D, transform: Transform): void;

    //#endregion

    //#region 画布方法

    /**
     * 申请一个 `MotaOffscreenCanvas2D`，即申请一个画布，画布将会存储在元素身上。
     * 为确保不会内存泄漏，当画布不会再被使用时请及时调用 {@link deleteCanvas} 退还。
     * @param alpha 是否启用画布的 alpha 通道
     * @param autoScale 是否自动跟随缩放
     */
    requireCanvas(alpha?: boolean, autoScale?: boolean): MotaOffscreenCanvas2D;

    /**
     * 删除由 `requireCanvas` 申请的画布，当画布不再使用时，需要用该方法删除画布
     * @param canvas 要删除的画布
     */
    deleteCanvas(canvas: MotaOffscreenCanvas2D): void;

    //#endregion

    //#region 渲染设置

    /**
     * 修改这个对象的大小
     */
    size(width: number, height: number): void;

    /**
     * 设置这个元素的位置，等效于`transform.setTranslate(x, y)`
     * @param x 横坐标
     * @param y 纵坐标
     */
    pos(x: number, y: number): void;

    /**
     * 设置元素的纵深
     * @param zIndex 元素纵深
     */
    setZIndex(zIndex: number): void;

    /**
     * 设置当前渲染元素是否使用高清画布
     * @param hd 是否高清
     */
    setHD(hd: boolean): void;

    /**
     * 设置当前渲染元素是否启用抗锯齿
     * @param anti 是否抗锯齿
     */
    setAntiAliasing(anti: boolean): void;

    /**
     * 设置渲染元素的位置锚点
     * @param x 锚点的横坐标，小数，0表示最左边，1表示最右边
     * @param y 锚点的纵坐标，小数，0表示最上边，1表示最下边
     */
    setAnchor(x: number, y: number): void;

    /**
     * 设置元素滤镜
     * @param filter 滤镜字符串
     */
    setFilter(filter: string): void;

    /**
     * 设置不透明度
     * @param alpha 不透明度
     */
    setAlpha(alpha: number): void;

    /**
     * 设置光标样式
     * @param cursor 光标样式
     */
    setCursor(cursor: string): void;

    /**
     * 设置元素与其下方内容的混合模式
     * @param composite 混合模式
     */
    setComposite(composite: GlobalCompositeOperation): void;

    /**
     * 设置元素变换矩阵
     * @param transform 变换矩阵对象
     */
    setTransform(transform: Transform): void;

    /**
     * 隐藏此元素
     */
    hide(): void;

    /**
     * 显示此元素
     */
    show(): void;

    //#endregion

    //#region 功能方法

    /**
     * 获取当前元素的绝对位置（不建议使用，因为应当很少会有获取绝对位置的需求）
     * @param x 点相对于元素的横坐标
     * @param y 点相对于元素的纵坐标
     */
    getAbsolutePosition(x: number, y: number): [number, number];

    /**
     * 获取到可以包围这个元素的最小矩形，相对于父元素
     */
    getBoundingRect(): DOMRectReadOnly;

    /**
     * 在下一帧渲染之前执行函数，常用于渲染前数据更新，理论上不应当用于渲染，不保证运行顺序
     * 此方法会将委托在根元素上，如果当前元素没有绑定任何根元素，那么不会有任何行为。
     * @param fn 执行的函数
     */
    requestBeforeFrame(fn: () => void): void;

    /**
     * 在下一帧渲染之后执行函数，理论上不应当用于渲染，不保证运行顺序
     * 此方法会将委托在根元素上，如果当前元素没有绑定任何根元素，那么不会有任何行为。
     * @param fn 执行的函数
     */
    requestAfterFrame(fn: () => void): void;

    /**
     * 委托 Excitable，让其在指定时间范围内每帧执行对应函数，超过时间后自动删除。
     * 此方法会将委托在根元素的激励源上，如果此当前元素没有绑定任何根元素，
     * 那么将会临时存储此激励对象，然后当此元素首次绑定在任何根元素上时，将会自动委托至目标根元素。
     * @param excitable 每帧执行的激励对象或函数
     * @param time 函数持续时间，不填代表不会自动删除，需要手动删除
     * @param end 持续时间结束后执行的函数
     * @returns 委托id，可用于删除
     */
    delegateExcitable(
        excitable: ExcitableDelegation,
        time?: number,
        end?: () => void
    ): number;

    /**
     * 移除委托激励对象。此方法需要传入 {@link delegateExcitable} 的返回值，但是当元素未绑定根元素时，
     * 虽然会在绑定时调用，但是你并不能获得对应的 id，因此更推荐使用 {@link removeExcitableObject}。
     * @param id 函数id，也就是{@link delegateExcitable}的返回值
     * @param callEnd 是否调用结束函数，即{@link delegateExcitable}的end参数，默认调用
     * @returns 是否删除成功，比如对应ticker不存在，就是删除失败
     */
    removeExcitable(id: number, callEnd?: boolean): boolean;

    /**
     * 移除委托激励对象
     * @param excitable 委托激励对象或函数
     * @param callEnd 是否调用结束函数，默认调用
     */
    removeExcitableObject(
        excitable: ExcitableDelegation,
        callEnd?: boolean
    ): boolean;

    /**
     * 检查是否包含一个委托函数
     * @param id 函数id
     */
    hasExcitable(id: number): boolean;

    //#endregion

    //#region 父子关系

    /**
     * 向这个元素添加子元素
     * @param child 添加的元素
     */
    appendChild(...child: IRenderItem[]): void;

    /**
     * 移除这个元素中的某个子元素
     * @param child 要移除的元素
     */
    removeChild(...child: IRenderItem[]): void;

    /**
     * 将这个渲染元素添加到其他父元素上
     * @param parent 父元素
     */
    appendTo(parent: IRenderItem): void;

    /**
     * 从渲染树中移除这个节点
     * @returns 是否移除成功
     */
    remove(): boolean;

    /**
     * 获取排序后的子元素，根据 `zIndex` 排序，小的在前，大的在后
     */
    getSortedChildren(): IRenderItem[];

    //#endregion

    //#region 事件相关

    /**
     * 设置是否忽略交互事件，交互事件将会直接下穿至在其下方的元素
     * @param ignore 是否忽略事件
     */
    ignoreEvent(ignore: boolean): void;

    /**
     * 根据事件类型和事件阶段获取事件名称
     * @param type 事件类型
     * @param progress 事件阶段
     */
    getEventName(
        type: ActionType,
        progress: EventProgress
    ): keyof ERenderItemActionEvent;

    //#endregion

    //#region 其他接口

    /**
     * 设置元素的 id
     * @param id 元素 id
     */
    setID(id: string): void;

    /**
     * 摧毁这个渲染元素，摧毁后不应继续使用
     */
    destroy(): void;

    //#endregion
}

//#endregion

//#region 根元素

export interface IRenderItemParameterMap {
    container: [enableCache?: boolean];
    custom: [enableCache?: boolean];
    text: [text: string, enableCache?: boolean];
    image: [image: CanvasImageSource, enableCache?: boolean];
    shader: [];
    comment: [text?: string];
    template: [enableCache?: boolean];
    'custom-container': [enableCache?: boolean];
    'g-rect': [enableCache?: boolean];
    'g-circle': [enableCache?: boolean];
    'g-ellipse': [enableCache?: boolean];
    'g-line': [enableCache?: boolean];
    'g-bezier': [enableCache?: boolean];
    'g-quad': [enableCache?: boolean];
    'g-path': [enableCache?: boolean];
    'g-rectr': [enableCache?: boolean];
}

export interface IRenderItemInstanceMap {
    container: IRenderItem;
    custom: IRenderCustom;
    text: IRenderText;
    image: IRenderImage;
    shader: IWebGL2RenderItem;
    comment: IRenderItem;
    template: IRenderItem;
    'custom-container': ICustomContainer;
    'g-rect': IGraphicRenderItem;
    'g-circle': IGraphicCircle;
    'g-ellipse': IGraphicEllipse;
    'g-line': IGraphicLine;
    'g-bezier': IGraphicBezierCurve;
    'g-quad': IGraphicQuadBezierCurve;
    'g-path': IGraphicPath;
    'g-rectr': IGraphicRectR;
}

export type RenderItemTags = keyof IRenderItemParameterMap &
    keyof IRenderItemInstanceMap;

export interface IMotaRendererConfig {
    /** 要挂载到哪个画布上，可以填 css 选择器或画布元素本身 */
    readonly canvas: string | HTMLCanvasElement;
    /** 画布的宽度，所有渲染操作会自行适配缩放 */
    readonly width: number;
    /** 画布的高度，所有渲染操作会自行适配缩放 */
    readonly height: number;
    /** 是否启用不透明度通道，默认启用 */
    readonly alpha?: boolean;
    /** 指定渲染器的激励源，默认使用 `RafExcitation` */
    readonly excitaion?: IExcitation<number>;
}

export type RenderItemConstructor = new (...params: any[]) => IRenderItem;

export interface IRenderTreeRoot extends IRenderItem {
    /** 是否是根元素 */
    readonly isRoot: true;
    /** 根元素的激励源 */
    readonly excitation: IExcitation<number>;

    /**
     * 根据标签名称创建对应的元素
     * @param tag 标签名称
     * @param params 传给标签的参数
     */
    createElement<K extends RenderItemTags>(
        tag: K,
        ...params: IRenderItemParameterMap[K]
    ): IRenderItemInstanceMap[K];
    /**
     * 根据元素类创建对应的元素
     * @param ele 元素构造器
     * @param params 传递给构造器的参数
     */
    createElement<P extends any[], I extends IRenderItem>(
        ele: new (...params: P) => I,
        ...params: P
    ): I;

    /**
     * 注册标签渲染元素
     * @param tag 标签名称
     * @param cons 对应渲染元素的构造器
     */
    registerElement(tag: string, cons: RenderItemConstructor): void;

    /**
     * 当前根元素是否包含指定标签
     * @param tag 标签名称
     */
    hasTag(tag: string): boolean;

    /**
     * 将一个渲染元素连接到此根元素
     * @param item 要连接到此根元素的渲染元素
     */
    connect(item: IRenderItem): void;

    /**
     * 将已连接的渲染元素从此根元素中去掉
     * @param item 要取消连接的渲染元素
     */
    disconnect(item: IRenderItem): void;

    /**
     * 修改已连接的元素的 id
     * @param item 修改了 id 的元素
     * @param previous 先前的元素 id
     * @param current 现在的元素 id
     */
    modifyId(item: IRenderItem, previous: string, current: string): void;

    /**
     * 获取渲染至的目标画布，即显示在画面上的画布
     */
    getCanvas(): HTMLCanvasElement;

    /**
     * 当鼠标覆盖在某个元素上时执行
     * @param element 鼠标覆盖的元素
     */
    hoverElement(element: IRenderItem): void;

    /**
     * 设置这个渲染器的缩放比
     * @param scale 缩放比
     */
    setScale(scale: number): void;

    /**
     * 获取当前渲染器的缩放比
     */
    getScale(): number;
}

//#endregion

//#region 核心元素

export interface IRenderText extends IRenderItem {
    /** 文字内容 */
    readonly text: string;
    /** 填充样式 */
    readonly fillStyle?: CanvasStyle;
    /** 描边样式 */
    readonly strokeStyle?: CanvasStyle;
    /** 文字字体 */
    readonly font: Font;
    /** 描边宽度 */
    readonly strokeWidth: number;

    /**
     * 获取文字的长度
     */
    measure(): TextMetrics;

    /**
     * 设置显示文字
     * @param text 显示的文字
     */
    setText(text: string): void;

    /**
     * 设置使用的字体
     * @param font 字体
     */
    setFont(font: Font): void;

    /**
     * 设置字体样式
     * @param fill 填充样式
     * @param stroke 描边样式
     */
    setStyle(fill?: CanvasStyle, stroke?: CanvasStyle): void;

    /**
     * 设置描边宽度
     * @param width 宽度
     */
    setStrokeWidth(width: number): void;
}

export interface IRenderImage extends IRenderItem {
    /** 当前元素的图片内容 */
    readonly image: ITexture | null;

    /**
     * 设置图片资源
     * @param image 图片资源
     */
    setImage(image: ITexture): void;
}

//#endregion

//#region 自定义元素

export type CustomRenderFunction = (canvas: MotaOffscreenCanvas2D) => void;

export interface IRenderCustom extends IRenderItem {
    /** 当前自定义渲染元素的渲染函数 */
    readonly renderFn: CustomRenderFunction;

    /**
     * 设置渲染函数
     * @param fn 渲染函数
     */
    setRenderFn(fn: CustomRenderFunction): void;
}

export type CustomContainerRenderFn = (
    canvas: MotaOffscreenCanvas2D,
    children: IRenderItem[],
    transform: Transform
) => void;

export type CustomContainerPropagateOrigin = <T extends ActionType>(
    type: T,
    progress: EventProgress,
    event: ActionEventMap[T]
) => void;

export type CustomContainerPropagateFn = <T extends ActionType>(
    type: T,
    progress: EventProgress,
    event: ActionEventMap[T],
    container: ICustomContainer,
    origin: CustomContainerPropagateOrigin
) => void;

export interface ICustomContainer extends IRenderItem {
    /**
     * 设置这个自定义容器的渲染函数
     * @param render 渲染函数
     */
    setRenderFn(fn: CustomContainerRenderFn): void;

    /**
     * 设置这个自定义容器的事件传递函数
     * @param propagate 事件传递函数
     */
    setPropagateFn(fn: CustomContainerPropagateFn): void;
}

//#endregion

//#region 图形元素

export type CircleParams = [
    cx?: number,
    cy?: number,
    radius?: number,
    start?: number,
    end?: number
];
export type EllipseParams = [
    cx?: number,
    cy?: number,
    radiusX?: number,
    radiusY?: number,
    start?: number,
    end?: number
];
export type LineParams = [x1: number, y1: number, x2: number, y2: number];
export type BezierParams = [
    sx: number,
    sy: number,
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    ex: number,
    ey: number
];
export type QuadParams = [
    sx: number,
    sy: number,
    cpx: number,
    cpy: number,
    ex: number,
    ey: number
];
export type RectRCircleParams = [
    r1: number,
    r2?: number,
    r3?: number,
    r4?: number
];
export type RectREllipseParams = [
    rx1: number,
    ry1: number,
    rx2?: number,
    ry2?: number,
    rx3?: number,
    ry3?: number,
    rx4?: number,
    ry4?: number
];

export interface ILineProperty {
    /** 线宽 */
    readonly lineWidth: number;
    /** 线的虚线设置 */
    readonly lineDash?: number[];
    /** 虚线偏移量 */
    readonly lineDashOffset?: number;
    /** 线的连接样式 */
    readonly lineJoin: CanvasLineJoin;
    /** 线的顶端样式 */
    readonly lineCap: CanvasLineCap;
    /** 线的斜接限制，当连接为miter类型时可填，默认为10 */
    readonly miterLimit: number;
}

export interface IGraphicProperty extends ILineProperty {
    /** 渲染模式，参考 {@link GraphicMode} */
    readonly mode: GraphicMode;
    /** 填充样式 */
    readonly fill: CanvasStyle;
    /** 描边样式 */
    readonly stroke: CanvasStyle;
    /** 填充算法 */
    readonly fillRule: CanvasFillRule;
}

export const enum GraphicMode {
    /** 仅填充 */
    Fill,
    /** 仅描边 */
    Stroke,
    /** 先填充，然后描边 */
    FillAndStroke,
    /** 先描边，然后填充 */
    StrokeAndFill
}

export interface IGraphicRenderItem extends IRenderItem {
    /**
     * 设置描边绘制的信息
     * @param options 线的信息
     */
    setLineOption(options: Partial<ILineProperty>): void;

    /**
     * 设置填充样式
     * @param style 绘制样式
     */
    setFillStyle(style: CanvasStyle): void;

    /**
     * 设置描边样式
     * @param style 绘制样式
     */
    setStrokeStyle(style: CanvasStyle): void;

    /**
     * 设置填充原则
     * @param rule 填充原则
     */
    setFillRule(rule: CanvasFillRule): void;

    /**
     * 设置绘制模式，是描边还是填充
     * @param mode 绘制模式
     */
    setMode(mode: GraphicMode): void;
}

export interface IGraphicCircle extends IGraphicRenderItem {
    /** 圆半径 */
    readonly radius: number;
    /** 圆的起始角度 */
    readonly start: number;
    /** 圆的终止角度 */
    readonly end: number;

    /**
     * 设置圆的半径
     * @param radius 半径
     */
    setRadius(radius: number): void;

    /**
     * 设置圆的起始与终止角度
     * @param start 起始角度
     * @param end 终止角度
     */
    setAngle(start: number, end: number): void;
}

export interface IGraphicEllipse extends IGraphicRenderItem {
    /** 椭圆横轴长 */
    readonly radiusX: number;
    /** 椭圆纵轴长 */
    readonly radiusY: number;
    /** 椭圆起始角度 */
    readonly start: number;
    /** 椭圆终止角度 */
    readonly end: number;

    /**
     * 设置椭圆的横纵轴长度
     * @param x 横轴长度
     * @param y 纵轴长度
     */
    setRadius(x: number, y: number): void;

    /**
     * 设置椭圆的起始与终止角度
     * @param start 起始角度
     * @param end 终止角度
     */
    setAngle(start: number, end: number): void;
}

export interface IGraphicLine extends IGraphicRenderItem {
    /** 起始点横坐标 */
    readonly x1: number;
    /** 起始点纵坐标 */
    readonly y1: number;
    /** 终止点横坐标 */
    readonly x2: number;
    /** 终止点纵坐标 */
    readonly y2: number;

    /**
     * 设置第一个点的横纵坐标
     */
    setPoint1(x: number, y: number): void;

    /**
     * 设置第二个点的横纵坐标
     */
    setPoint2(x: number, y: number): void;
}

export interface IGraphicBezierCurve extends IGraphicRenderItem {
    /** 起始点横坐标 */
    readonly sx: number;
    /** 起始点纵坐标 */
    readonly sy: number;
    /** 控制点1横坐标 */
    readonly cp1x: number;
    /** 控制点1纵坐标 */
    readonly cp1y: number;
    /** 控制点2横坐标 */
    readonly cp2x: number;
    /** 控制点2纵坐标 */
    readonly cp2y: number;
    /** 终止点横坐标 */
    readonly ex: number;
    /** 终止点纵坐标 */
    readonly ey: number;

    /**
     * 设置起始点坐标
     */
    setStart(x: number, y: number): void;

    /**
     * 设置控制点1坐标
     */
    setControl1(x: number, y: number): void;

    /**
     * 设置控制点2坐标
     */
    setControl2(x: number, y: number): void;

    /**
     * 设置终点坐标
     */
    setEnd(x: number, y: number): void;
}

export interface IGraphicQuadBezierCurve extends IGraphicRenderItem {
    /** 起始点横坐标 */
    readonly sx: number;
    /** 起始点纵坐标 */
    readonly sy: number;
    /** 控制点横坐标 */
    readonly cpx: number;
    /** 控制点纵坐标 */
    readonly cpy: number;
    /** 终止点横坐标 */
    readonly ex: number;
    /** 终止点纵坐标 */
    readonly ey: number;

    /**
     * 设置起始点坐标
     */
    setStart(x: number, y: number): void;

    /**
     * 设置控制点坐标
     */
    setControl(x: number, y: number): void;

    /**
     * 设置终点坐标
     */
    setEnd(x: number, y: number): void;
}

export interface IGraphicPath extends IGraphicRenderItem {
    /** 当前元素的路径对象 */
    readonly path: Path2D;

    /**
     * 获取当前元素的路径对象
     */
    getPath(): Path2D;

    /**
     * 重置此元素的路径
     */
    resetPath(): void;

    /**
     * 为路径添加路径
     * @param path 要添加的路径
     */
    addPath(path: Path2D): void;
}

export const enum RectRCorner {
    TopLeft,
    TopRight,
    BottomRight,
    BottomLeft
}

export interface IGraphicRectR extends IGraphicRenderItem {
    /** 圆角属性，四元素数组，每个元素是一个二元素数组，表示这个角的半径，顺序为 左上，右上，右下，左下 */
    readonly corner: [radiusX: number, radiusY: number][];

    /**
     * 设置圆角半径
     * @param x 横向半径
     * @param y 纵向半径
     */
    setRadius(x: number, y: number, corner: RectRCorner): void;

    /**
     * 设置圆形圆角参数
     * @param circle 圆形圆角参数
     */
    setCircle(circle: RectRCircleParams): void;

    /**
     * 设置椭圆圆角参数
     * @param ellipse 椭圆圆角参数
     */
    setEllipse(ellipse: RectREllipseParams): void;
}

//#endregion

//#region WebGL2

export interface IGL2ProgramPrefix {
    readonly VERTEX: string;
    readonly FRAGMENT: string;
}

export const enum UniformType {
    Uniform1f,
    Uniform1fv,
    Uniform1i,
    Uniform1iv,
    Uniform1ui,
    Uniform1uiv,
    Uniform2f,
    Uniform2fv,
    Uniform2i,
    Uniform2iv,
    Uniform2ui,
    Uniform2uiv,
    Uniform3f,
    Uniform3fv,
    Uniform3i,
    Uniform3iv,
    Uniform3ui,
    Uniform3uiv,
    Uniform4f,
    Uniform4fv,
    Uniform4i,
    Uniform4iv,
    Uniform4ui,
    Uniform4uiv
}

export const enum UniformMatrix {
    UMatrix2x2,
    UMatrix2x3,
    UMatrix2x4,
    UMatrix3x2,
    UMatrix3x3,
    UMatrix3x4,
    UMatrix4x2,
    UMatrix4x3,
    UMatrix4x4
}

export const enum AttribType {
    Attrib1f,
    Attrib1fv,
    Attrib2f,
    Attrib2fv,
    Attrib3f,
    Attrib3fv,
    Attrib4f,
    Attrib4fv,
    AttribI4i,
    AttribI4iv,
    AttribI4ui,
    AttribI4uiv
}

export const enum RenderMode {
    Arrays,
    Elements,
    ArraysInstanced,
    ElementsInstanced
}

export type ProgramConstructor<T extends IGL2Program> = new (
    gl2: IWebGL2RenderItem,
    vs?: string,
    fs?: string
) => T;

export interface IWebGL2RenderItem extends IRenderItem {
    readonly UNIFORM_1f: UniformType.Uniform1f;
    readonly UNIFORM_1fv: UniformType.Uniform1fv;
    readonly UNIFORM_1i: UniformType.Uniform1i;
    readonly UNIFORM_1iv: UniformType.Uniform1iv;
    readonly UNIFORM_1ui: UniformType.Uniform1ui;
    readonly UNIFORM_1uiv: UniformType.Uniform1uiv;
    readonly UNIFORM_2f: UniformType.Uniform2f;
    readonly UNIFORM_2fv: UniformType.Uniform2fv;
    readonly UNIFORM_2i: UniformType.Uniform2i;
    readonly UNIFORM_2iv: UniformType.Uniform2iv;
    readonly UNIFORM_2ui: UniformType.Uniform2ui;
    readonly UNIFORM_2uiv: UniformType.Uniform2uiv;
    readonly UNIFORM_3f: UniformType.Uniform3f;
    readonly UNIFORM_3fv: UniformType.Uniform3fv;
    readonly UNIFORM_3i: UniformType.Uniform3i;
    readonly UNIFORM_3iv: UniformType.Uniform3iv;
    readonly UNIFORM_3ui: UniformType.Uniform3ui;
    readonly UNIFORM_3uiv: UniformType.Uniform3uiv;
    readonly UNIFORM_4f: UniformType.Uniform4f;
    readonly UNIFORM_4fv: UniformType.Uniform4fv;
    readonly UNIFORM_4i: UniformType.Uniform4i;
    readonly UNIFORM_4iv: UniformType.Uniform4iv;
    readonly UNIFORM_4ui: UniformType.Uniform4ui;
    readonly UNIFORM_4uiv: UniformType.Uniform4uiv;
    // uniform matrix 类型
    readonly U_MATRIX_2x2: UniformMatrix.UMatrix2x2;
    readonly U_MATRIX_2x3: UniformMatrix.UMatrix2x3;
    readonly U_MATRIX_2x4: UniformMatrix.UMatrix2x4;
    readonly U_MATRIX_3x2: UniformMatrix.UMatrix3x2;
    readonly U_MATRIX_3x3: UniformMatrix.UMatrix3x3;
    readonly U_MATRIX_3x4: UniformMatrix.UMatrix3x4;
    readonly U_MATRIX_4x2: UniformMatrix.UMatrix4x2;
    readonly U_MATRIX_4x3: UniformMatrix.UMatrix4x3;
    readonly U_MATRIX_4x4: UniformMatrix.UMatrix4x4;
    // attribute 类型
    readonly ATTRIB_1f: AttribType.Attrib1f;
    readonly ATTRIB_1fv: AttribType.Attrib1fv;
    readonly ATTRIB_2f: AttribType.Attrib2f;
    readonly ATTRIB_2fv: AttribType.Attrib2fv;
    readonly ATTRIB_3f: AttribType.Attrib3f;
    readonly ATTRIB_3fv: AttribType.Attrib3fv;
    readonly ATTRIB_4f: AttribType.Attrib4f;
    readonly ATTRIB_4fv: AttribType.Attrib4fv;
    readonly ATTRIB_I4i: AttribType.AttribI4i;
    readonly ATTRIB_I4iv: AttribType.AttribI4iv;
    readonly ATTRIB_I4ui: AttribType.AttribI4ui;
    readonly ATTRIB_I4uiv: AttribType.AttribI4uiv;
    // 渲染模式
    readonly DRAW_ARRAYS: RenderMode.Arrays;
    readonly DRAW_ELEMENTS: RenderMode.Elements;
    readonly DRAW_ARRAYS_INSTANCED: RenderMode.ArraysInstanced;
    readonly DRAW_ELEMENTS_INSTANCED: RenderMode.ElementsInstanced;
    /** 最大纹理数量 */
    readonly MAX_TEXTURE_COUNT: number;
    /** WebGL2 的画布 */
    readonly canvas: HTMLCanvasElement;
    /** WebGL2 上下文 */
    readonly gl: WebGL2RenderingContext;

    /**
     * 将画面渲染至帧缓冲
     * @param name 帧缓冲名称
     * @param texture 渲染至的纹理
     * @param clear 是否先清空画布再渲染
     */
    framebuffer(name: string, texture: IShaderTexture2D, clear?: boolean): void;

    /**
     * 创建一个帧缓冲对象
     * @param name 帧缓冲名称
     * @returns 是否创建成功
     */
    createFramebuffer(name: string): boolean;

    /**
     * 删除一个帧缓冲对象
     * @param name 帧缓冲名称
     * @returns 是否删除成功
     */
    deleteFramebuffer(name: string): boolean;

    /**
     * 切换着色器程序
     * @param program 着色器程序
     */
    useProgram(program: IGL2Program): void;

    /**
     * 创建一个着色器程序
     * @param vs 顶点着色器，可选
     * @param fs 片元着色器，可选
     */
    createProgram<T extends IGL2Program>(
        Program: ProgramConstructor<T>,
        vs?: string,
        fs?: string
    ): T;

    /**
     * 删除一个着色器程序
     * @param program 要删除的着色器程序
     */
    deleteProgram(program: IGL2Program): void;
}

type _U1 = [x0: number];
type _U2 = [x0: number, x1: number];
type _U3 = [x0: number, x1: number, x2: number];
type _U4 = [x0: number, x1: number, x2: number, x3: number];
type _UV<T> = [data: T, srcOffset?: number, srcLength?: number];
type _A<T> = [data: T];

export interface UniformSetFn {
    [UniformType.Uniform1f]: _U1;
    [UniformType.Uniform1fv]: _UV<Float32List>;
    [UniformType.Uniform1i]: _U1;
    [UniformType.Uniform1iv]: _UV<Int32List>;
    [UniformType.Uniform1ui]: _U1;
    [UniformType.Uniform1uiv]: _UV<Uint32List>;
    [UniformType.Uniform2f]: _U2;
    [UniformType.Uniform2fv]: _UV<Float32List>;
    [UniformType.Uniform2i]: _U2;
    [UniformType.Uniform2iv]: _UV<Int32List>;
    [UniformType.Uniform2ui]: _U2;
    [UniformType.Uniform2uiv]: _UV<Uint32List>;
    [UniformType.Uniform3f]: _U3;
    [UniformType.Uniform3fv]: _UV<Float32List>;
    [UniformType.Uniform3i]: _U3;
    [UniformType.Uniform3iv]: _UV<Int32List>;
    [UniformType.Uniform3ui]: _U3;
    [UniformType.Uniform3uiv]: _UV<Uint32List>;
    [UniformType.Uniform4f]: _U4;
    [UniformType.Uniform4fv]: _UV<Float32List>;
    [UniformType.Uniform4i]: _U4;
    [UniformType.Uniform4iv]: _UV<Int32List>;
    [UniformType.Uniform4ui]: _U4;
    [UniformType.Uniform4uiv]: _UV<Uint32List>;
}

export interface AttribSetFn {
    [AttribType.Attrib1f]: _U1;
    [AttribType.Attrib1fv]: _A<Float32List>;
    [AttribType.Attrib2f]: _U2;
    [AttribType.Attrib2fv]: _A<Float32List>;
    [AttribType.Attrib3f]: _U3;
    [AttribType.Attrib3fv]: _A<Float32List>;
    [AttribType.Attrib4f]: _U4;
    [AttribType.Attrib4fv]: _A<Float32List>;
    [AttribType.AttribI4i]: _U4;
    [AttribType.AttribI4iv]: _A<Int32List>;
    [AttribType.AttribI4ui]: _U4;
    [AttribType.AttribI4uiv]: _A<Uint32List>;
}

export interface IShaderUniform<T extends UniformType> {
    /** 这个 uniform 变量的内存位置 */
    readonly location: WebGLUniformLocation;
    /** 这个 uniform 变量的类型 */
    readonly type: T;
    /** 这个量所处的着色器程序 */
    readonly program: IGL2Program;
    /**
     * 设置这个 uniform 变量的值，
     * 参考 https://developer.mozilla.org/zh-CN/docs/Web/API/WebGL2RenderingContext/uniform
     * @param params 要传递的参数，例如 uniform2f 就要传递 x0 x1 两个参数等，可以参考 mdn 文档
     */
    set(...params: UniformSetFn[T]): void;
}

export interface IShaderAttrib<T extends AttribType> {
    /** 这个 attribute 常量的内存位置 */
    readonly location: number;
    /** 这个 attribute 常量的类型 */
    readonly type: T;
    /** 这个量所处的着色器程序 */
    readonly program: IGL2Program;
    /**
     * 设置这个 attribute 常量的值，
     * 浮点数参考 https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/vertexAttrib
     * 整数参考 https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/vertexAttribI
     * @param params 要传递的参数
     */
    set(...params: AttribSetFn[T]): void;
}

export interface IShaderAttribArray {
    /** 这个 attribute 常量的内存位置 */
    readonly location: number;
    /** 这个 attribute 所用的缓冲区信息 */
    readonly data: WebGLBuffer;
    /** 这个量所处的着色器程序 */
    readonly program: IGL2Program;
    /**
     * 修改缓冲区数据，会更改数据大小，重新分配内存，不更改数据大小的情况下建议使用 {@link sub} 代替。
     * 参考 https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/bufferData
     * @param data 数据
     * @param usage 用途
     */
    buffer(data: AllowSharedBufferSource | null, usage: GLenum): void;
    /**
     * 修改缓冲区数据，会更改数据大小，重新分配内存，不更改数据大小的情况下建议使用 {@link sub} 代替。
     * 参考 https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/bufferData
     * @param data 数据
     * @param usage 用途
     * @param srcOffset 数据偏移量
     * @param length 数据长度
     */
    buffer(
        data: ArrayBufferView,
        usage: GLenum,
        srcOffset: number,
        length?: number
    ): void;
    /**
     * 修改缓冲区数据，但是不修改数据大小，不重新分配内存。
     * 参考 https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferSubData
     * @param dstByteOffset 数据修改的起始位置
     * @param srcData 数据
     */
    sub(dstByteOffset: GLintptr, srcData: AllowSharedBufferSource): void;
    /**
     * 修改缓冲区数据，但是不修改数据大小，不重新分配内存。
     * 参考 https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferSubData
     * @param dstByteOffset 数据修改的起始位置
     * @param srcData 数据
     * @param srcOffset 数据偏移量
     * @param length 数据长度
     */
    sub(
        dstByteOffset: GLintptr,
        srcData: ArrayBufferView,
        srcOffset: number,
        length?: GLuint
    ): void;
    /**
     * 告诉 gpu 将读取此 attribute 数据
     * 参考 https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
     * @param size 单个数据大小
     * @param type 数据类型
     * @param normalized 是否要经过归一化处理
     * @param stride 每一部分字节偏移量
     * @param offset 第一部分字节偏移量
     */
    pointer(
        size: GLint,
        type: GLenum,
        normalized: GLboolean,
        stride: GLsizei,
        offset: GLintptr
    ): void;
    /**
     * 告诉 gpu 将由整数类型读取此 attribute 数据
     * 参考 https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/vertexAttribIPointer
     * @param size 单个数据大小
     * @param type 数据类型
     * @param stride 每一部分字节偏移量
     * @param offset 第一部分字节偏移量
     */
    pointerI(
        size: GLint,
        type: GLenum,
        stride: GLsizei,
        offset: GLintptr
    ): void;
    /**
     * 设置顶点指针更新时刻。
     * 参考 https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/vertexAttribDivisor
     * @param divisor 每多少个实例更新一次，0表示每个顶点都更新
     */
    divisor(divisor: number): void;
    /**
     * 启用这个顶点数据
     */
    enable(): void;
    /**
     * 禁用这个顶点数据
     */
    disable(): void;
}

export interface IShaderIndices {
    /** 这个顶点索引所用的缓冲区信息 */
    readonly data: WebGLBuffer;
    /** 这个量所处的着色器程序 */
    readonly program: IGL2Program;
    /**
     * 修改缓冲区数据，会更改数据大小，重新分配内存，不更改数据大小的情况下建议使用 {@link sub} 代替。
     * 参考 https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/bufferData
     * @param data 数据
     * @param usage 用途
     */
    buffer(data: AllowSharedBufferSource | null, usage: GLenum): void;
    /**
     * 修改缓冲区数据，会更改数据大小，重新分配内存，不更改数据大小的情况下建议使用 {@link sub} 代替。
     * 参考 https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/bufferData
     * @param data 数据
     * @param usage 用途
     * @param srcOffset 数据偏移量
     * @param length 数据长度
     */
    buffer(
        data: ArrayBufferView,
        usage: GLenum,
        srcOffset: number,
        length?: number
    ): void;
    /**
     * 修改缓冲区数据，但是不修改数据大小，不重新分配内存。
     * 参考 https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferSubData
     * @param dstByteOffset 数据修改的起始位置
     * @param srcData 数据
     */
    sub(dstByteOffset: GLintptr, srcData: AllowSharedBufferSource): void;
    /**
     * 修改缓冲区数据，但是不修改数据大小，不重新分配内存。
     * 参考 https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferSubData
     * @param dstByteOffset 数据修改的起始位置
     * @param srcData 数据
     * @param srcOffset 数据偏移量
     * @param length 数据长度
     */
    sub(
        dstByteOffset: GLintptr,
        srcData: ArrayBufferView,
        srcOffset: number,
        length?: GLuint
    ): void;
}

export interface IShaderUniformMatrix {
    /** 矩阵的内存位置 */
    readonly location: WebGLUniformLocation;
    /** 矩阵类型 */
    readonly type: UniformMatrix;
    /** 这个量所处的着色器程序 */
    readonly program: IGL2Program;
    /**
     * 设置矩阵的值，参考 https://developer.mozilla.org/zh-CN/docs/Web/API/WebGL2RenderingContext/uniformMatrix
     * @param transpose 是否转置矩阵
     * @param data 矩阵数据，列主序
     * @param srcOffset 数据偏移量
     * @param srcLength 数据长度
     */
    set(
        transpose: GLboolean,
        data: Float32List,
        srcOffset?: number,
        srcLength?: number
    ): void;
}

export interface IShaderUniformBlock {
    /** 这个 uniform block 的内存地址 */
    readonly location: GLuint;
    /** 与这个 uniform block 所绑定的缓冲区 */
    readonly buffer: WebGLBuffer;
    /** 这个 uniform block 的大小 */
    readonly size: number;
    /** 这个量所处的着色器程序 */
    readonly program: IGL2Program;
    /**
     * 参考 https://developer.mozilla.org/zh-CN/docs/Web/API/WebGL2RenderingContext/bindBufferBase
     * @param srcData 要设置为的值
     */
    set(srcData: AllowSharedBufferSource | null): void;
    /**
     * 参考 https://developer.mozilla.org/zh-CN/docs/Web/API/WebGL2RenderingContext/bindBufferBase
     * @param srcData 要设置为的值
     * @param srcOffset 数据偏移量
     * @param length 数据长度
     */
    set(srcData: ArrayBufferView, srcOffset: number, length?: number): void;
}

export interface IShaderTexture2D {
    /** 纹理对象 */
    readonly texture: WebGLTexture;
    /** 宽度 */
    readonly width: number;
    /** 高度 */
    readonly height: number;
    /** 纹理所属索引 */
    readonly index: number;
    /** 这个量所处的着色器程序 */
    readonly program: IGL2Program;
    /**
     * 设置这个纹理的图像，不建议使用，会修改宽高
     * @param source 要设置成的图像源
     */
    set(source: TexImageSource): void;
    /**
     * 设置纹理的一部分信息，不会修改宽高
     * @param source 要设置的图像源
     * @param x 要设置到的起始点横坐标
     * @param y 要设置到的起始点纵坐标
     * @param width 宽度
     * @param height 高度
     */
    sub(
        source: TexImageSource,
        x: number,
        y: number,
        width: number,
        height: number
    ): void;
}

export interface DrawArraysParam {
    mode: GLenum;
    first: number;
    count: number;
}

export interface DrawElementsParam {
    mode: GLenum;
    count: number;
    type: GLenum;
    offset: GLintptr;
}

export interface DrawArraysInstancedParam {
    mode: GLenum;
    first: number;
    count: number;
    instanceCount: number;
}

export interface DrawElementsInstancedParam {
    mode: GLenum;
    count: number;
    type: GLenum;
    offset: GLintptr;
    instanceCount: number;
}

export interface DrawParamsMap {
    [RenderMode.Arrays]: DrawArraysParam;
    [RenderMode.ArraysInstanced]: DrawArraysInstancedParam;
    [RenderMode.Elements]: DrawElementsParam;
    [RenderMode.ElementsInstanced]: DrawElementsInstancedParam;
}

export interface IGL2Program {
    /** webgl2上下文 */
    readonly gl: WebGL2RenderingContext;
    /** 当前着色器程序的着色器渲染元素 */
    readonly element: IWebGL2RenderItem;
    /** 当前的webgl程序 */
    readonly program: WebGLProgram | null;
    /** 当前正在使用的顶点索引数组 */
    readonly usingIndices: IShaderIndices | null;
    /** 渲染模式 */
    readonly renderMode: RenderMode;

    /**
     * 渲染前准备
     */
    ready(): boolean;

    /**
     * 设置渲染模式，目前可选 {@link IWebGL2RenderItem.DRAW_ARRAYS} 至 {@link IWebGL2RenderItem.DRAW_INSTANCED}
     */
    mode(mode: RenderMode): void;

    /**
     * 获取指定渲染模式的渲染参数
     * @param param 渲染模式
     */
    getDrawParams<T extends RenderMode>(
        param: T
    ): Readonly<DrawParamsMap[T]> | null;

    /**
     * 设置 DRAW_ARRAYS 模式下的渲染参数
     * 参考 https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/drawArrays
     * @param mode 渲染模式
     * @param first 第一个元素的位置
     * @param count 渲染多少个元素
     */
    paramArrays(mode: GLenum, first: number, count: number): void;

    /**
     * 设置 DRAW_ARRAYS_INSTANCED 模式下的渲染参数
     * 参考 https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawArraysInstanced
     * @param mode 渲染模式
     * @param first 第一个元素的位置
     * @param count 渲染多少个元素
     * @param instanceCount 渲染实例数量
     */
    paramArraysInstanced(
        mode: GLenum,
        first: number,
        count: number,
        instanceCount: number
    ): void;

    /**
     * 设置 DRAW_ELEMENTS 模式下的渲染参数
     * 参考 https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/drawElements
     * @param mode 渲染模式
     * @param count 渲染元素数量
     * @param type 数据类型
     * @param offset 偏移量
     */
    paramElements(
        mode: GLenum,
        count: number,
        type: GLenum,
        offset: number
    ): void;

    /**
     * 设置 DRAW_ELEMENTS 模式下的渲染参数
     * 参考 https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawElementsInstanced
     * @param mode 渲染模式
     * @param count 渲染元素数量
     * @param type 数据类型
     * @param offset 偏移量
     * @param instanceCount 渲染实例数量
     */
    paramElementsInstanced(
        mode: GLenum,
        count: number,
        type: GLenum,
        offset: number,
        instanceCount: number
    ): void;

    /**
     * 切换渲染时使用的顶点索引
     * @param name 要使用的顶点索引名称
     */
    useIndices(name: string | IShaderIndices): void;

    /**
     * 检查当前是否需要重新编译着色器，如果需要，则重新编译
     * @param force 是否强制重新编译
     * @returns 是否执行了编译操作
     */
    requestCompile(force?: boolean): boolean;

    /**
     * 设置顶点着色器内容
     * @param vs 顶点着色器
     */
    vs(vs: string): void;

    /**
     * 设置片元着色器内容
     * @param fs 片元着色器
     */
    fs(fs: string): void;

    /**
     * 当这个程序被卸载时执行的函数
     */
    unload(): void;

    /**
     * 当这个程序被加载（使用）时执行的函数
     */
    load(): void;

    /**
     * 获取一个uniform，需要事先定义，否则返回null
     * @param uniform uniform名称
     */
    getUniform<T extends UniformType = UniformType>(
        uniform: string
    ): IShaderUniform<T> | null;

    /**
     * 获取一个attribute，需要事先定义，否则返回null
     * @param attrib attribute名称
     */
    getAttribute<T extends AttribType = AttribType>(
        attrib: string
    ): IShaderAttrib<T> | null;

    /**
     * 获取一个attribute array，需要事先定义，否则返回null
     * @param name attribute array名称
     */
    getAttribArray(name: string): IShaderAttribArray | null;

    /**
     * 获取一个顶点索引数组，需要提前定义，否则返回null
     * @param name 顶点索引数组的名称
     */
    getIndices(name: string): IShaderIndices | null;

    /**
     * 获取一个 uniform matrix，需要事先定义，否则返回null
     * @param matrix uniform matrix 的名称
     */
    getMatrix(matrix: string): IShaderUniformMatrix | null;

    /**
     * 获取一个 uniform block，例如 UBO，需要事先定义，否则返回null
     * @param block uniform block 的名称
     */
    getUniformBlock(block: string): IShaderUniformBlock | null;

    /**
     * 获取一个 texture，需要事先定义，否则返回null
     * @param name texture 的名称
     */
    getTexture(name: string): IShaderTexture2D | null;

    /**
     * 定义一个 uniform 变量，并存入本着色器程序的 uniform 变量映射
     * @param uniform uniform 变量名
     * @param type uniform 类型，可选 {@link IWebGL2RenderItem.UNIFORM_1f} 至 {@link IWebGL2RenderItem.UNIFORM_4uiv}
     * @returns uniform 变量的操作对象，可用于设置其值
     */
    defineUniform<T extends UniformType>(
        uniform: string,
        type: T
    ): IShaderUniform<T> | null;

    /**
     * 定义一个 uniform 矩阵变量，并存入本着色器程序的 uniform 矩阵变量映射
     * @param uniform uniform 矩阵变量名
     * @param type uniform 矩阵类型，可选 {@link IWebGL2RenderItem.U_MATRIX_2x2} 至 {@link IWebGL2RenderItem.U_MATRIX_4x4}
     * @returns uniform 矩阵变量的操作对象，可用于设置其值
     */
    defineUniformMatrix(
        uniform: string,
        type: UniformMatrix
    ): IShaderUniformMatrix | null;

    /**
     * 定义一个 attribute 常量，并存入本着色器程序的 attribute 常量映射，在 es 300 版本中叫做 in
     * @param attrib attribute 常量名
     * @param type attribute 类型，可选 {@link IWebGL2RenderItem.ATTRIB_1f} 至 {@link IWebGL2RenderItem.ATTRIB_I4uiv}
     * @returns attribute 常量的操作对象，可用于设置其值
     */
    defineAttribute<T extends AttribType>(
        attrib: string,
        type: T
    ): IShaderAttrib<T> | null;

    /**
     * 定义一个顶点数组
     * @param name 顶点数组名称
     */
    defineAttribArray(name: string): IShaderAttribArray | null;

    /**
     * 定义一个顶点索引数组
     * @param name 顶点索引数组的名称
     */
    defineIndices(name: string): IShaderIndices | null;

    /**
     * 定义一个 uniform block，例如 UBO，并存入本着色器程序的 uniform block 映射
     * 用于一次性向着色器传输大量数据
     * @param block uniform block 名称
     * @param size 数据量，即数据长度，例如一个vec4就是4个长度
     * @param usage 缓冲区用途，例如 gl.STATIC_DRAW 是指会频繁读取但不会频繁写入
     *              参考 https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/bufferData
     *              的 `usage` 参数
     * @param binding uniform block 的索引，例如这是你设置的第一个uniform block，就可以填0，第二个填1，以此类推
     * @returns uniform block 的操作对象，可用于设置其值
     */
    defineUniformBlock(
        block: string,
        size: number,
        usage: number,
        binding: number
    ): IShaderUniformBlock | null;

    /**
     * 定义一个材质
     * @param name 纹理名称
     * @param index 纹理索引，根据不同浏览器，其最大数量不一定相等，根据标准其数量应该大于等于 8 个，
     *              因此考虑到兼容性，不建议纹理数量超过 8 个。
     * @param w 纹理的宽度
     * @param h 纹理的高度
     * @returns 这个 texture 的操作对象，可以用于设置其内容
     */
    defineTexture(
        name: string,
        index: number,
        w?: number,
        h?: number
    ): IShaderTexture2D | null;

    /**
     * 绑定纹理，自动判断应该使用 sub 还是 set
     * @param program 使用的着色器程序
     * @param texture 要绑定至的纹理
     * @param source 纹理内容
     * @returns 是否绑定成功
     */
    texTexture(texture: string, source: SizedCanvasImageSource): boolean;

    /**
     * 摧毁这个着色器程序，不要直接调用，请使用 {@link IWebGL2RenderItem.deleteProgram} 来删除一个着色器程序
     */
    destroy(): void;
}

//#endregion
