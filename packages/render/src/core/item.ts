import { isEqual, isNil } from 'lodash-es';
import { MotaOffscreenCanvas2D } from './canvas2d';
import { ITransformUpdatable, Transform } from './transform';
import {
    Hookable,
    HookController,
    IHookController,
    logger
} from '@motajs/common';
import { ElementNamespace, ComponentInternalInstance } from 'vue';
import {
    ActionEventMap,
    ActionType,
    EventProgress,
    IActionEvent,
    IActionEventBase,
    IWheelEvent,
    MouseType
} from './event';
import { vec3 } from 'gl-matrix';
import {
    ExcitableDelegation,
    IRenderItem,
    IRenderItemBaseHooks,
    IRenderTreeRoot,
    RenderPosition
} from './types';
import { transformCanvas } from './utils';

interface RenderItemCanvasData {
    autoScale: boolean;
}

interface ToDelegateExcitables {
    readonly excitable: ExcitableDelegation;
    readonly time?: number;
    readonly end?: () => void;
}

export abstract class RenderItem
    extends Hookable<IRenderItemBaseHooks>
    implements IRenderItem, ITransformUpdatable<Transform>
{
    //#region 元素属性

    /** 元素唯一标识符 */
    uid: number = 0;
    /** 是否是注释元素 */
    readonly isComment: boolean = false;
    /** 元素标识符 */
    id: string = '';

    /** 元素纵深，表示了遮挡关系 */
    zIndex: number = 0;
    /** 元素横坐标 */
    x: number = 0;
    /** 元素纵坐标 */
    y: number = 0;
    /** 元素宽度 */
    width: number = 200;
    /** 元素高度 */
    height: number = 200;
    /** 该元素的变换矩阵 */
    transform: Transform = new Transform();
    /** 是否为自我变换模式 */
    selfTransform: boolean = false;
    /** 渲染锚点，(0,0)表示左上角，(1,1)表示右下角 */
    anchorX: number = 0;
    /** 渲染锚点，(0,0)表示左上角，(1,1)表示右下角 */
    anchorY: number = 0;
    /** 渲染定位模式 */
    position: RenderPosition = RenderPosition.Absolute;
    /** 是否是高清画布 */
    highResolution: boolean = true;
    /** 是否抗锯齿 */
    antiAliasing: boolean = true;
    /** 是否被隐藏 */
    hidden: boolean = false;
    /** 滤镜 */
    filter: string = 'none';
    /** 混合方式 */
    composite: GlobalCompositeOperation = 'source-over';
    /** 不透明度 */
    alpha: number = 1;
    /** 缩放比 */
    scale: number = 1;
    /** 鼠标覆盖在此元素上时的光标样式 */
    cursor: string = 'inherit';

    /** 该元素是否忽略交互事件 */
    noEvent: boolean = false;

    //#endregion

    //#region 父子关系

    /** 当前元素是否为根元素 */
    readonly isRoot: boolean = false;
    /** 父元素对象 */
    parent: RenderItem | null = null;
    /** 此元素的根元素 */
    root: IRenderTreeRoot | null = null;
    /** 当前元素是否连接至了根元素 */
    connected: boolean = false;
    /** 该渲染元素的子元素 */
    children: Set<RenderItem> = new Set();

    //#endregion

    //#region 渲染配置与缓存

    /** 渲染缓存信息 */
    protected readonly cache: MotaOffscreenCanvas2D | null;
    /** 是否需要更新缓存 */
    protected cacheDirty: boolean = false;
    /** 是否启用缓存机制 */
    readonly enableCache: boolean = true;
    /** 这个渲染元素使用到的所有画布 */
    protected readonly canvases: Set<MotaOffscreenCanvas2D> = new Set();
    /** 这个渲染元素每个画布的配置信息 */
    private readonly canvasMap: WeakMap<
        MotaOffscreenCanvas2D,
        RenderItemCanvasData
    > = new WeakMap();

    //#endregion

    //#region 交互事件

    /** 当前元素包含的监听事件名称列表 */
    private readonly eventNames: Set<string> = new Set();
    /** 当前元素包含的监听事件，这是为了能够使用 `prop` 传入时不需要为每个内容都添加一个 `hook` 对象 */
    private readonly events: Map<string, (...params: any[]) => any> = new Map();

    /** 是否调用了 `ev.stopPropagation` */
    protected propagationStoped: Map<ActionType, boolean> = new Map();
    /** 捕获阶段缓存的事件对象 */
    private cachedEvent: Map<ActionType, IActionEvent> = new Map();
    /** 是否在元素内 */
    private inElement: boolean = false;
    /** 鼠标标识符映射，键为按下的鼠标按键类型，值表示本次操作的唯一标识符，在按下、移动、抬起过程中保持一致 */
    protected readonly mouseId: Map<MouseType, number> = new Map();
    /** 当前所有的触摸标识符 */
    protected readonly touchId: Set<number> = new Set();

    //#endregion

    //#region debug

    /** 是否需要禁用更新，如果出现更新，那么发出警告并停止更新操作 */
    private forbidUpdate: boolean = false;

    //#endregion

    //#region 其他

    /** 存储当前渲染对象的所有委托激励对象，用于在被销毁时删除 */
    private delegationsIdMap: Map<number, ExcitableDelegation> = new Map();
    /** 委托激励对象到其 id 的映射 */
    private delegationsMap: Map<ExcitableDelegation, number> = new Map();

    /** 当未绑定根元素时临时存储帧前函数 */
    private beforeFrames: Set<() => void> = new Set();
    /** 当未绑定根元素时临时存储帧后函数 */
    private afterFrames: Set<() => void> = new Set();
    /** 当未绑定根元素时临时存储委托可激励对象 */
    private toDelegate: Set<ToDelegateExcitables> = new Set();

    //#endregion

    constructor(enableCache: boolean = true) {
        super();
        this.enableCache = enableCache;
        this.position = RenderPosition.Absolute;
        this.transform.bind(this);
        if (enableCache) {
            this.cache = this.requireCanvas();
            this.cache.size(this.width, this.height);
        } else {
            this.cache = null;
        }
        this.eventNames
            .add('onClick')
            .add('onClickCapture')
            .add('onDown')
            .add('onDownCapture')
            .add('onMove')
            .add('onMoveCapture')
            .add('onUp')
            .add('onUpCapture')
            .add('onEnter')
            .add('onLeave')
            .add('onWheel')
            .add('onWheelCapture')
            .add('onResize')
            .add('onTransform');

        this.addHook(this.getDefaultHook());
    }

    /**
     * 获取默认钩子对象，子类可以拓展以实现自己默认钩子的 `prop` 支持
     */
    protected getDefaultHook(): IRenderItemBaseHooks {
        return new RenderItemDefaultHooks(this.events);
    }

    protected createController(
        hook: Partial<IRenderItemBaseHooks>
    ): IHookController<IRenderItemBaseHooks> {
        return new HookController(this, hook);
    }

    setID(id: string): void {
        this.checkRoot();
        const prev = this.id;
        this.id = id;
        this.root?.modifyId(this, prev, id);
    }

    //#region 渲染部分

    /**
     * 渲染函数
     * @param canvas 渲染至的画布
     * @param transform 当前变换矩阵的，渲染时已经进行变换处理，不需要对画布再次进行变换处理。
     *                  此参数可用于自己对元素进行变换处理，也会用于对子元素的处理。
     */
    protected abstract render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void;

    /**
     * 渲染当前对象
     * @param canvas 渲染至的画布
     */
    renderContent(canvas: MotaOffscreenCanvas2D) {
        if (this.hidden) return;
        this.forbidUpdate = true;
        const tran = this.transform;

        const ax = -this.anchorX * this.width;
        const ay = -this.anchorY * this.height;

        const ctx = canvas.ctx;
        ctx.save();
        ctx.filter = this.filter;
        ctx.globalAlpha = this.alpha;
        ctx.globalCompositeOperation = this.composite;
        if (this.enableCache && this.cache) {
            if (this.selfTransform) {
                transformCanvas(this.cache, tran);
            } else {
                transformCanvas(canvas, tran);
            }
            const { width, height } = this.cache!;
            if (this.cacheDirty) {
                this.cache.clear();
                this.render(this.cache, tran);
                this.cacheDirty = false;
            }
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(this.cache.canvas, ax, ay, width, height);
        } else {
            transformCanvas(canvas, tran);
            ctx.imageSmoothingEnabled = this.antiAliasing;
            ctx.translate(ax, ay);
            this.render(canvas, tran);
            this.cacheDirty = false;
        }
        ctx.restore();
        this.forbidUpdate = false;
    }

    update(item: IRenderItem = this): void {
        if (import.meta.env.DEV) {
            if (this.forbidUpdate) {
                logger.warn(61, this.constructor.name, this.uid.toString());
            }
        }
        if (this.parent) {
            if (this.cacheDirty && this.parent.cacheDirty) return;
            this.cacheDirty = true;
            if (this.hidden) return;
            this.parent.update(item);
        } else {
            if (this.cacheDirty) return;
            this.cacheDirty = true;
        }
    }

    /**
     * 刷新所有子元素
     */
    refreshAllChildren() {
        if (this.children.size > 0) {
            const stack: RenderItem[] = [this];
            while (stack.length > 0) {
                const item = stack.pop();
                if (!item) continue;
                item.cacheDirty = true;
                item.children.forEach(v => stack.push(v));
            }
        }
        this.update();
    }

    //#endregion

    /**
     * 申请一个 `MotaOffscreenCanvas2D`，即申请一个画布
     * @param alpha 是否启用画布的 alpha 通道
     * @param autoScale 是否自动跟随缩放
     */
    requireCanvas(alpha: boolean = true, autoScale: boolean = true) {
        const canvas = new MotaOffscreenCanvas2D(alpha);
        if (autoScale) {
            canvas.setScale(this.scale);
        } else {
            canvas.setScale(1);
        }
        this.canvases.add(canvas);
        this.canvasMap.set(canvas, { autoScale });
        return canvas;
    }

    /**
     * 删除由 `requireCanvas` 申请的画布，当画布不再使用时，可以用该方法删除画布
     * @param canvas 要删除的画布
     */
    deleteCanvas(canvas: MotaOffscreenCanvas2D) {
        this.canvases.delete(canvas);
        this.canvasMap.delete(canvas);
    }

    //#region 事件处理

    onResize(scale: number): void {
        this.scale = scale;
        this.canvases.forEach(v => {
            if (this.canvasMap.get(v)?.autoScale) {
                v.setScale(scale);
            }
        });
        this.update();
    }

    //#endregion

    //#region 渲染设置

    /**
     * 修改这个对象的大小
     */
    size(width: number, height: number): void {
        if (width === this.width && height === this.height) return;
        this.width = width;
        this.height = height;
        if (this.enableCache) {
            this.cache!.size(width, height);
        }
        this.update();
        this.forEachHook(hook => hook.onResize?.(width, height));
    }

    /**
     * 设置这个元素的位置，等效于`transform.setTranslate(x, y)`
     * @param x 横坐标
     * @param y 纵坐标
     */
    pos(x: number, y: number) {
        // 这个函数会调用 update，因此不再手动调用 update
        this.transform.setTranslate(x, y);
    }

    /**
     * 设置元素变换矩阵
     * @param transform 变换矩阵对象
     */
    setTransform(transform: Transform): void {
        this.transform.unbind(this);
        this.transform = transform;
        this.transform.bind(this);
        this.x = transform.x;
        this.y = transform.y;
    }

    setSelfTransform(self: boolean): void {
        this.selfTransform = self;
        this.update();
    }

    /**
     * 设置本元素的滤镜
     * @param filter 滤镜
     */
    setFilter(filter: string) {
        this.filter = filter;
        // 设置滤镜时，不需要更新自身的缓存，直接调用父元素的更新即可
        this.parent?.update();
    }

    /**
     * 设置本元素渲染时的混合方式
     * @param composite 混合方式
     */
    setComposite(composite: GlobalCompositeOperation) {
        this.composite = composite;
        // 设置混合模式时，不需要更新自身的缓存，直接调用父元素的更新即可
        this.parent?.update();
    }

    /**
     * 设置本元素的不透明度
     * @param alpha 不透明度
     */
    setAlpha(alpha: number) {
        this.alpha = alpha;
        // 设置不透明度时，不需要更新自身的缓存，直接调用父元素的更新即可
        this.parent?.update();
    }

    setHD(hd: boolean): void {
        this.highResolution = hd;
        if (this.enableCache) {
            this.cache!.setHD(hd);
        }
        this.update();
    }

    setAntiAliasing(anti: boolean): void {
        this.antiAliasing = anti;
        if (this.enableCache) {
            this.cache!.setAntiAliasing(anti);
        }
        this.update();
    }

    setZIndex(zIndex: number) {
        this.zIndex = zIndex;
        this.parent?.requestSort();
    }

    setAnchor(x: number, y: number): void {
        this.anchorX = x;
        this.anchorY = y;
        // 设置锚点时，不需要更新自身的缓存，直接调用父元素的更新即可
        this.parent?.update();
    }

    /**
     * 设置光标样式
     * @param cursor 光标样式
     */
    setCursor(cursor: string): void {
        this.cursor = cursor;
    }

    /**
     * 隐藏这个元素
     */
    hide() {
        if (this.hidden) return;
        this.update();
        this.hidden = true;
    }

    /**
     * 显示这个元素
     */
    show() {
        if (!this.hidden) return;
        this.hidden = false;
        this.refreshAllChildren();
    }

    //#endregion

    //#region 功能方法

    /**
     * 获取当前元素的绝对位置（不建议使用，因为应当很少会有获取绝对位置的需求）
     */
    getAbsolutePosition(x: number = 0, y: number = 0): [number, number] {
        const [px, py] = this.selfTransform
            ? [x, y]
            : this.transform.transformed(x, y);
        if (!this.parent) return [px, py];
        else {
            const [px, py] = this.parent.getAbsolutePosition();
            return [x + px, y + py];
        }
    }

    /**
     * 获取到可以包围这个元素的最小矩形，相对于父元素
     */
    getBoundingRect(): DOMRectReadOnly {
        if (this.selfTransform) {
            const left = -this.anchorX * this.width;
            const top = -this.anchorY * this.height;
            return new DOMRectReadOnly(left, top, this.width, this.height);
        }
        const tran = this.transform;
        if (!tran) return new DOMRectReadOnly(0, 0, this.width, this.height);
        const [x1, y1] = tran.transformed(
            -this.anchorX * this.width,
            -this.anchorY * this.height
        );
        const [x2, y2] = tran.transformed(
            this.width * (1 - this.anchorX),
            -this.anchorY * this.height
        );
        const [x3, y3] = tran.transformed(
            -this.anchorX * this.width,
            this.height * (1 - this.anchorY)
        );
        const [x4, y4] = tran.transformed(
            this.width * (1 - this.anchorX),
            this.height * (1 - this.anchorY)
        );
        const left = Math.min(x1, x2, x3, x4);
        const right = Math.max(x1, x2, x3, x4);
        const top = Math.min(y1, y2, y3, y4);
        const bottom = Math.max(y1, y2, y3, y4);
        return new DOMRectReadOnly(left, top, right - left, bottom - top);
    }

    updateTransform(transform: Transform) {
        // 更新变换矩阵时，只需要更新有 `selfTransform` 的子元素，其他的不需要更新
        let childUpdated = false;
        if (this.children.size > 0) {
            const stack: RenderItem[] = [this];
            while (stack.length > 0) {
                const item = stack.pop();
                if (!item || !item.selfTransform) continue;
                childUpdated = true;
                item.cacheDirty = true;
                item.children.forEach(v => stack.push(v));
            }
        }
        // 根据子元素更新情况以及自身是否 `selfTransform` 来决定是更新自己还是更新父元素
        if (!childUpdated) {
            if (this.selfTransform) {
                this.update();
            } else {
                this.parent?.update();
            }
        } else {
            this.parent?.update();
        }
        this.x = transform.x;
        this.y = transform.y;
        this.forEachHook(hook => hook.onTransform?.(transform));
    }

    requestBeforeFrame(fn: () => void): void {
        if (!this.root) {
            this.beforeFrames.add(fn);
        } else {
            this.root?.requestBeforeFrame(fn);
        }
    }

    requestAfterFrame(fn: () => void): void {
        if (!this.root) {
            this.afterFrames.add(fn);
        } else {
            this.root?.requestAfterFrame(fn);
        }
    }

    delegateExcitable(
        excitable: ExcitableDelegation,
        time?: number,
        end?: () => void
    ): number {
        if (!this.root) {
            this.toDelegate.add({ excitable, time, end });
            return -1;
        } else {
            const index = this.root.delegateExcitable(excitable, time, end);
            this.delegationsIdMap.set(index, excitable);
            this.delegationsMap.set(excitable, index);
            return index;
        }
    }

    removeExcitable(id: number, callEnd: boolean = true): boolean {
        if (!this.root) return false;
        else {
            const excitable = this.delegationsIdMap.get(id);
            if (excitable !== void 0) this.delegationsMap.delete(excitable);
            this.delegationsIdMap.delete(id);
            return this.root.removeExcitable(id, callEnd);
        }
    }

    removeExcitableObject(
        excitable: ExcitableDelegation,
        callEnd?: boolean
    ): boolean {
        if (!this.root) return false;
        else {
            const num = this.delegationsMap.get(excitable);
            if (num !== void 0) this.delegationsIdMap.delete(num);
            this.delegationsMap.delete(excitable);
            return this.root.removeExcitableObject(excitable, callEnd);
        }
    }

    hasExcitable(id: number): boolean {
        if (!this.root) return false;
        else return this.root?.hasExcitable(id);
    }

    //#endregion

    //#region 父子关系

    setRoot(item: IRenderTreeRoot | null) {
        this.root?.disconnect(this);
        this.root = item;
        if (item) {
            item.connect(item);
            this.connected = true;
        } else {
            this.connected = false;
        }
        if (item) {
            this.beforeFrames.forEach(v => item.requestBeforeFrame(v));
            this.afterFrames.forEach(v => item.requestAfterFrame(v));
            this.toDelegate.forEach(obj => {
                const { excitable, time, end } = obj;
                const id = item.delegateExcitable(excitable, time, end);
                this.delegationsMap.set(excitable, id);
                this.delegationsIdMap.set(id, excitable);
            });
            this.beforeFrames.clear();
            this.afterFrames.clear();
            this.toDelegate.clear();
        }
    }

    checkRoot() {
        if (this.root) return;
        if (this.isRoot) return;
        let ele: IRenderItem = this;
        while (!ele.isRoot) {
            if (ele.root) {
                ele = ele.root;
                break;
            }
            if (!ele.parent) {
                return;
            } else {
                ele = ele.parent;
            }
        }
        this.setRoot(ele as IRenderTreeRoot);
    }

    /**
     * 将这个渲染元素添加到其他父元素上
     * @param parent 父元素
     */
    appendTo(parent: IRenderItem) {
        this.remove();
        const p = parent as RenderItem;
        parent.children.add(this);
        this.parent = p;
        p.requestSort();
        this.update();
        this.checkRoot();
        this.transform.bind(this);
        this.onResize(parent.scale);
        this.forEachHook(hook => hook.onResize?.(this.width, this.height));
    }

    /**
     * 从渲染树中移除这个节点
     * @returns 是否移除成功
     */
    remove(): boolean {
        if (!this.parent) return false;
        this.delegationsIdMap.forEach(v =>
            this.root?.removeExcitableObject(v, false)
        );
        this.delegationsMap.forEach(v => {
            this.root?.removeExcitable(v, false);
        });
        this.delegationsIdMap.clear();
        this.delegationsMap.clear();
        this.toDelegate.clear();
        this.beforeFrames.clear();
        this.afterFrames.clear();
        const parent = this.parent;
        const success = parent.children.delete(this);
        this.parent = null;
        parent.requestSort();
        parent.update();
        this.transform.unbind(this);
        if (!success) return false;
        this.setRoot(null);
        return true;
    }

    /**
     * 添加子元素，默认没有任何行为且会抛出警告，你需要在自己的RenderItem继承类中复写它，才可以使用
     * @param child 子元素
     */
    appendChild(..._child: IRenderItem[]): void {
        logger.warn(35);
    }

    /**
     * 移除子元素，默认没有任何行为且会抛出警告，你需要在自己的RenderItem继承类中复写它，才可以使用
     * @param child 子元素
     */
    removeChild(..._child: IRenderItem[]): void {
        logger.warn(36);
    }

    /**
     * 申请对元素进行排序，默认没有任何行为且会抛出警告，你需要在自己的RenderItem继承类中复写它，才可以使用
     */
    requestSort(): void {
        logger.warn(37);
    }

    /**
     * 获取排序后的子元素，根据 `zIndex` 排序，小的在前，大的在后。
     * 包含子元素的元素应该 `override` 此方法。
     */
    getSortedChildren(): IRenderItem[] {
        return [];
    }

    //#endregion

    //#region 交互事件

    /**
     * 设置是否忽略交互事件，交互事件将会直接下穿至在其下方的元素
     * @param ignore 是否忽略事件
     */
    ignoreEvent(ignore: boolean): void {
        this.noEvent = ignore;
    }

    private emitEvent<T extends ActionType>(
        type: T,
        progress: EventProgress,
        ev: ActionEventMap[T]
    ): ActionEventMap[T] {
        if (type === ActionType.Enter) {
            this.forEachHook(hook => hook.onEnter?.(ev));
            return ev;
        } else if (type === ActionType.Leave) {
            this.forEachHook(hook => hook.onLeave?.(ev));
            return ev;
        }

        if (progress === EventProgress.Capture) {
            switch (type) {
                case ActionType.Click:
                    this.forEachHook(hook => hook.onClickCapture?.(ev));
                    break;
                case ActionType.Down:
                    this.forEachHook(hook => hook.onDownCapture?.(ev));
                    break;
                case ActionType.Move:
                    this.forEachHook(hook => hook.onMoveCapture?.(ev));
                    break;
                case ActionType.Up:
                    this.forEachHook(hook => hook.onUpCapture?.(ev));
                    break;
                case ActionType.Wheel:
                    this.forEachHook(hook =>
                        hook.onWheelCapture?.(ev as IWheelEvent)
                    );
                    break;
            }
        } else {
            switch (type) {
                case ActionType.Click:
                    this.forEachHook(hook => hook.onClick?.(ev));
                    break;
                case ActionType.Down:
                    this.forEachHook(hook => hook.onDown?.(ev));
                    break;
                case ActionType.Move:
                    this.forEachHook(hook => hook.onMove?.(ev));
                    break;
                case ActionType.Up:
                    this.forEachHook(hook => hook.onUp?.(ev));
                    break;
                case ActionType.Wheel:
                    this.forEachHook(hook => hook.onWheel?.(ev as IWheelEvent));
                    break;
            }
        }

        return ev;
    }

    /**
     * 传递事件，即将事件传递给父元素或子元素等，可以通过 override 来实现自己的事件传递，
     * 例如 Container 元素就需要在捕获阶段将事件传递给所有子元素，
     * 默认行为是，捕获阶段触发自身冒泡，冒泡阶段触发父元素冒泡，适用于大部分不包含子元素的元素
     * @param type 事件类型
     * @param progress 事件阶段，捕获阶段或冒泡阶段
     * @param event 正在处理的事件对象
     */
    protected propagateEvent<T extends ActionType>(
        type: T,
        progress: EventProgress,
        event: ActionEventMap[T]
    ): void {
        if (progress === EventProgress.Capture) {
            this.bubbleEvent(type, event);
        } else {
            this.parent?.bubbleEvent(type, event);
        }
    }

    private handleEvent<T extends ActionType>(
        type: T,
        progress: EventProgress,
        event: ActionEventMap[T]
    ) {
        const ev = this.processEvent(type, progress, event);
        if (!ev) {
            this.propagationStoped.set(type, false);
            return ev;
        }

        this.emitEvent(type, progress, ev);

        if (!this.propagationStoped.get(type)) {
            this.propagateEvent(type, progress, ev);
        }

        this.propagationStoped.set(type, false);
        return ev;
    }

    /**
     * 捕获事件
     * @param type 事件类型
     * @param event 由父元素传递来的事件
     */
    captureEvent<T extends ActionType>(type: T, event: ActionEventMap[T]) {
        return this.handleEvent(type, EventProgress.Capture, event);
    }

    /**
     * 冒泡事件
     * @param type 事件类型
     * @param event 由子元素传递来的事件
     */
    bubbleEvent<T extends ActionType>(type: T, event: ActionEventMap[T]) {
        return this.handleEvent(type, EventProgress.Bubble, event);
    }

    /**
     * 处理事件，用于根据上一级传递的事件内容生成新的事件内容，并执行一些事件的默认行为
     * @param type 事件类型
     * @param progress 事件阶段，捕获阶段还是冒泡阶段
     * @param event 由上一级（捕获阶段的父元素，冒泡阶段的子元素）传递来的事件内容
     */
    protected processEvent<T extends ActionType>(
        type: T,
        progress: EventProgress,
        event: ActionEventMap[T]
    ): ActionEventMap[T] | null {
        if (this.noEvent) return null;
        if (progress === EventProgress.Capture) {
            // 捕获阶段需要计算鼠标位置
            const tran = this.transform;
            const [nx, ny] = this.calActionPosition(event, tran);
            const inElement = this.isActionInElement(nx, ny);
            // 在元素范围内，执行事件
            const newEvent: ActionEventMap[T] = {
                ...event,
                offsetX: nx,
                offsetY: ny,
                target: this,
                stopPropagation: () => {
                    this.propagationStoped.set(type, true);
                }
            };
            this.inElement = inElement;
            if (!this.processCapture(type, newEvent, inElement)) return null;
            this.cachedEvent.set(type, newEvent);
            return newEvent;
        } else {
            const newEvent = this.cachedEvent.get(type) as ActionEventMap[T];
            this.processBubble(type, newEvent, this.inElement);
            this.cachedEvent.delete(type);
            return newEvent;
        }
    }

    /**
     * 处理捕获阶段的事件，可以通过 override 来添加新内容，注意调用 `super.processCapture` 来执行默认行为
     * @param type 事件类型
     * @param event 正在处理的事件对象
     * @param inElement 当前鼠标是否在元素内
     * @returns 是否继续传递事件
     */
    protected processCapture<T extends ActionType>(
        type: T,
        event: ActionEventMap[T],
        inElement: boolean
    ): boolean {
        switch (type) {
            case ActionType.Move: {
                if (inElement) {
                    this.root?.hoverElement(this);
                }
                break;
            }
            case ActionType.Down: {
                // 记录标识符，用于判定 click
                if (!inElement) return false;
                if (event.touch) {
                    this.touchId.add(event.identifier);
                } else {
                    this.mouseId.set(event.type, event.identifier);
                }
                break;
            }
            case ActionType.Click: {
                if (!inElement) return false;
                if (event.touch) {
                    if (!this.touchId.has(event.identifier)) {
                        return false;
                    }
                    this.touchId.delete(event.identifier);
                } else {
                    if (this.mouseId.get(event.type) !== event.identifier) {
                        this.mouseId.delete(event.type);
                        return false;
                    }
                    this.mouseId.delete(event.type);
                }
                break;
            }
        }

        return inElement;
    }

    /**
     * 处理冒泡阶段的事件，可以通过 override 来添加新内容，注意调用 `super.processBubble` 来执行默认行为
     * @param type 事件类型
     * @param event 正在处理的事件对象
     * @param inElement 当前鼠标是否在元素内
     * @returns 是否继续传递事件
     */
    protected processBubble<T extends ActionType>(
        type: T,
        _event: ActionEventMap[T],
        inElement: boolean
    ): boolean {
        switch (type) {
            case ActionType.Enter:
            case ActionType.Leave:
                return false;
        }
        return inElement;
    }

    /**
     * 计算一个点击事件在该元素上的位置
     * @param ev 触发的事件
     * @param transform 当前的变换矩阵
     */
    protected calActionPosition(ev: IActionEvent, transform: Transform): vec3 {
        const ax = this.anchorX * this.width;
        const ay = this.anchorY * this.height;
        if (this.selfTransform) {
            return [ax, ay, 0];
        } else {
            const [tx, ty] = transform.untransformed(ev.offsetX, ev.offsetY);
            return [tx + ax, ty + ay, 0];
        }
    }

    /**
     * 判断一个点击事件是否在元素内，可以通过 override 来修改其行为
     * @param x 横坐标
     * @param y 纵坐标
     */
    protected isActionInElement(x: number, y: number) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    //#endregion

    //#region vue支持 props处理

    /**
     * 判断一个prop是否是期望类型
     * @param value 实际值
     * @param expected 期望类型
     * @param key 键名
     */
    protected assertType(value: any, expected: string, key: string): boolean;
    /**
     * 判断一个prop是否是期望类型
     * @param value 实际值
     * @param expected 期望类型
     * @param key 键名
     */
    protected assertType<T>(
        value: any,
        expected: new (...params: any[]) => T,
        key: string
    ): value is T;
    protected assertType(
        value: any,
        expected: string | (new (...params: any[]) => any),
        key: string
    ) {
        if (typeof expected === 'string') {
            const type = typeof value;
            if (type !== expected) {
                logger.error(21, key, expected, type);
                return false;
            } else {
                return true;
            }
        } else {
            if (value instanceof expected) {
                return true;
            } else {
                logger.error(
                    21,
                    key,
                    expected.name,
                    value?.constructor?.name ?? typeof value
                );
                return false;
            }
        }
    }

    /**
     * `override` 以自定义 `vue` 参数处理，返回 false 以避免后续判断提高运行速度。
     * @param _key 属性键名
     * @param _prevValue 该属性先前的数值
     * @param _nextValue 该属性当前的数值
     */
    protected handleProps(
        _key: string,
        _prevValue: any,
        _nextValue: any
    ): boolean {
        return false;
    }

    /**
     * 在 jsx, vue 中当属性改变后触发此函数，用于处理响应式等情况
     * @param key 属性键名
     * @param prevValue 该属性先前的数值
     * @param nextValue 该属性当前的数值
     * @param _namespace 元素命名空间
     * @param _parentComponent 元素的父组件
     */
    patchProp(
        key: string,
        prevValue: any,
        nextValue: any,
        _namespace?: ElementNamespace,
        _parentComponent?: ComponentInternalInstance | null
    ): void {
        if (isNil(prevValue) && isNil(nextValue)) return;
        if (this.handleProps(key, prevValue, nextValue)) return;
        switch (key) {
            case 'x': {
                if (!this.assertType(nextValue, 'number', key)) return;
                this.pos(nextValue, this.transform.y);
                return;
            }
            case 'y': {
                if (!this.assertType(nextValue, 'number', key)) return;
                this.pos(this.transform.x, nextValue);
                return;
            }
            case 'anchorX': {
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setAnchor(nextValue, this.anchorY);
                return;
            }
            case 'anchorY': {
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setAnchor(this.anchorX, nextValue);
                return;
            }
            case 'zIndex': {
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setZIndex(nextValue);
                return;
            }
            case 'width': {
                if (!this.assertType(nextValue, 'number', key)) return;
                this.size(nextValue, this.height);
                return;
            }
            case 'height': {
                if (!this.assertType(nextValue, 'number', key)) return;
                this.size(this.width, nextValue);
                return;
            }
            case 'filter': {
                if (!this.assertType(nextValue, 'string', key)) return;
                this.setFilter(nextValue);
                return;
            }
            case 'hd': {
                if (!this.assertType(nextValue, 'boolean', key)) return;
                this.setHD(nextValue);
                return;
            }
            case 'anti': {
                if (!this.assertType(nextValue, 'boolean', key)) return;
                this.setAntiAliasing(nextValue);
                return;
            }
            case 'noanti': {
                if (!this.assertType(nextValue, 'boolean', key)) return;
                this.setAntiAliasing(!nextValue);
                return;
            }
            case 'hidden': {
                if (!this.assertType(nextValue, 'boolean', key)) return;
                if (nextValue) this.hide();
                else this.show();
                return;
            }
            case 'transform': {
                if (!this.assertType(nextValue, Transform, key)) return;
                this.setTransform(nextValue);
                return;
            }
            case 'selfTransform': {
                if (!this.assertType(nextValue, 'boolean', key)) return;
                this.selfTransform = nextValue;
                this.update();
                return;
            }
            case 'type': {
                if (!this.assertType(nextValue, 'number', key)) return;
                this.position = nextValue;
                this.update();
                return;
            }
            case 'id': {
                if (!this.assertType(nextValue, 'string', key)) return;
                this.id = nextValue;
                return;
            }
            case 'alpha': {
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setAlpha(nextValue);
                return;
            }
            case 'composite': {
                if (!this.assertType(nextValue, 'string', key)) return;
                this.setComposite(nextValue);
                return;
            }
            case 'loc': {
                if (isEqual(nextValue, prevValue)) return;
                if (!this.assertType(nextValue, Array, key)) return;
                if (!isNil(nextValue[0]) && !isNil(nextValue[1])) {
                    this.pos(nextValue[0] as number, nextValue[1] as number);
                }
                if (!isNil(nextValue[2]) && !isNil(nextValue[3])) {
                    this.size(nextValue[2] as number, nextValue[3] as number);
                }
                if (!isNil(nextValue[4]) && !isNil(nextValue[5])) {
                    this.setAnchor(
                        nextValue[4] as number,
                        nextValue[5] as number
                    );
                }
                return;
            }
            case 'anc': {
                if (isEqual(nextValue, prevValue)) return;
                if (!this.assertType(nextValue, Array, key)) return;
                this.setAnchor(nextValue[0] as number, nextValue[1] as number);
                return;
            }
            case 'cursor': {
                if (!this.assertType(nextValue, 'string', key)) return;
                this.setCursor(nextValue);
                return;
            }
            case 'scale': {
                if (isEqual(nextValue, prevValue)) return;
                if (!this.assertType(nextValue, Array, key)) return;
                this.transform.setScale(
                    nextValue[0] as number,
                    nextValue[1] as number
                );
                return;
            }
            case 'rotate': {
                if (!this.assertType(nextValue, 'number', key)) return;
                this.transform.setRotate(nextValue);
                return;
            }
            case 'noevent': {
                if (!this.assertType(nextValue, 'boolean', key)) return;
                this.noEvent = nextValue;
                return;
            }
        }
        if (this.eventNames.has(key)) {
            // 事件参数
            if (!this.assertType(nextValue, Function, key)) return;
            this.events.set(key, nextValue);
        }
    }

    //#endregion

    /**
     * 摧毁这个渲染元素，摧毁后不应继续使用
     */
    destroy(): void {
        this.remove();
        this.canvases.clear();
        this.cache?.clear();
        this.propagationStoped.clear();
        this.cachedEvent.clear();
        this.mouseId.clear();
        this.touchId.clear();
        this.children.clear();
        this.setRoot(null);
    }
}

export class RenderItemDefaultHooks implements IRenderItemBaseHooks {
    constructor(readonly list: Map<string, (...params: any[]) => any>) {}

    onClick(ev: Readonly<IActionEvent>): void {
        this.list.get('onClick')?.(ev);
    }

    onClickCapture(ev: Readonly<IActionEvent>): void {
        this.list.get('onClickCapture')?.(ev);
    }

    onDown(ev: Readonly<IActionEvent>): void {
        this.list.get('onDown')?.(ev);
    }

    onDownCapture(ev: Readonly<IActionEvent>): void {
        this.list.get('onDownCapture')?.(ev);
    }

    onMove(ev: Readonly<IActionEvent>): void {
        this.list.get('onMove')?.(ev);
    }

    onMoveCapture(ev: Readonly<IActionEvent>): void {
        this.list.get('onMoveCapture')?.(ev);
    }

    onUp(ev: Readonly<IActionEvent>): void {
        this.list.get('onUp')?.(ev);
    }

    onUpCapture(ev: Readonly<IActionEvent>): void {
        this.list.get('onUpCapture')?.(ev);
    }

    onEnter(ev: Readonly<IActionEventBase>): void {
        this.list.get('onEnter')?.(ev);
    }

    onLeave(ev: Readonly<IActionEventBase>): void {
        this.list.get('onLeave')?.(ev);
    }

    onWheel(ev: Readonly<IWheelEvent>): void {
        this.list.get('onWheel')?.(ev);
    }

    onWheelCapture(ev: Readonly<IWheelEvent>): void {
        this.list.get('onWheelCapture')?.(ev);
    }

    onResize(width: number, height: number): void {
        this.list.get('onResize')?.(width, height);
    }

    onTransform(transform: Transform): void {
        this.list.get('onTransform')?.(transform);
    }
}
