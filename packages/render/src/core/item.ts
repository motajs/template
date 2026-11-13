import { isEqual, isNil } from 'lodash-es';
import { MotaOffscreenCanvas2D } from './canvas2d';
import { Transform } from './transform';
import {
    Hookable,
    HookController,
    IHookController,
    logger
} from '@motajs/common';
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
    IRenderItem,
    IRenderItemBaseHooks,
    IRenderTreeRoot,
    RenderPosition
} from './types';
import { transformCanvas } from './utils';

interface RenderItemCanvasData {
    autoScale: boolean;
}

export abstract class RenderItem
    extends Hookable<IRenderItemBaseHooks>
    implements IRenderItem
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
    children: RenderItem[] = [];
    /** 排序后的子元素列表 */
    private sortedChildren: RenderItem[] = [];
    /** 当前是否需要进行排序 */
    private needSort: boolean = false;

    //#endregion

    //#region 渲染配置与缓存

    /** 渲染缓存信息 */
    protected cache: MotaOffscreenCanvas2D | null = null;
    /** 是否需要更新缓存 */
    protected cacheDirty: boolean = false;
    /** 是否启用缓存机制 */
    enableCache: boolean = false;
    /** 这个渲染元素使用到的所有画布 */
    protected readonly canvases: Set<MotaOffscreenCanvas2D> = new Set();
    /** 这个渲染元素每个画布的配置信息 */
    private readonly canvasMap: WeakMap<
        MotaOffscreenCanvas2D,
        RenderItemCanvasData
    > = new WeakMap();

    /** 当前传入的 cache props */
    private cacheProp: boolean = false;
    /** 当前传入的 nocache props */
    private nocacheProp: boolean = false;

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

    constructor() {
        super();
        this.transform.bind(this);
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

        // 设置默认缓存
        const cache = this.getDefaultCache();
        this.setCacheEnabled(cache);
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
        if (this.children.length > 0) {
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
        canvas.setAntiAliasing(this.antiAliasing);
        canvas.setHD(this.highResolution);
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
        this.children.forEach(v => v.onResize(scale));
        this.update();
    }

    //#endregion

    //#region 渲染设置

    /**
     * 获取默认是否启用缓存
     */
    protected abstract getDefaultCache(): boolean;

    setCacheEnabled(enabled: boolean): void {
        if (enabled === this.enableCache) return;
        if (enabled) {
            const canvas = this.requireCanvas();
            this.enableCache = true;
            this.cache = canvas;
        } else {
            this.enableCache = false;
            this.cache?.clear();
            this.cache = null;
        }
        this.update();
    }

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

    pos(x: number, y: number) {
        // 这个函数会调用 update，因此不再手动调用 update
        this.transform.setTranslate(x, y);
    }

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

    setFilter(filter: string) {
        this.filter = filter;
        // 设置滤镜时，不需要更新自身的缓存，直接调用父元素的更新即可
        this.parent?.update();
    }

    setComposite(composite: GlobalCompositeOperation) {
        this.composite = composite;
        // 设置混合模式时，不需要更新自身的缓存，直接调用父元素的更新即可
        this.parent?.update();
    }

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

    setCursor(cursor: string): void {
        this.cursor = cursor;
    }

    hide() {
        if (this.hidden) return;
        this.update();
        this.hidden = true;
    }

    show() {
        if (!this.hidden) return;
        this.hidden = false;
        this.refreshAllChildren();
    }

    //#endregion

    //#region 功能方法

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
        if (this.children.length > 0) {
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

    //#endregion

    //#region 父子关系

    setRoot(item: IRenderTreeRoot | null) {
        if (item === this.root) return;
        const before = this.root;
        before?.disconnect(this);
        this.root = item;
        if (item) {
            item.connect(item);
            this.connected = true;
            this.onConnected(item);
        } else {
            this.connected = false;
            if (before) {
                this.onDisconnected(before);
            }
        }
    }

    appendTo(parent: IRenderItem, anchor?: IRenderItem) {
        parent.appendChild(this, anchor);
    }

    remove(): boolean {
        if (this.parent) {
            return this.parent.removeChild(this);
        } else {
            return false;
        }
    }

    appendChild(child: IRenderItem, anchor?: IRenderItem): void {
        const el = child as RenderItem;
        // TODO: 可能的性能优化点：如果元素已经是当前元素的子元素，那么直接转移过去，不再先移除再添加，收益不好说
        el.remove();
        if (anchor) {
            const index = this.children.indexOf(anchor as RenderItem);
            if (index === -1) {
                this.children.push(el);
            } else {
                this.children.splice(index, 0, el);
            }
        } else {
            this.children.push(el);
        }
        this.requestSort();
        el.parent = this;
        el.transform.bind(el);
        el.onResize(this.scale);
        el.forEachHook(hook => hook.onResize?.(el.width, el.height));
        // 还需要深度遍历每个元素，给每个元素都设置根元素
        if (this.root) {
            el.setRoot(this.root);
            el.forEachChild(item => item.setRoot(this.root));
        }
        el.update();
    }

    removeChild(child: IRenderItem): boolean {
        const el = child as RenderItem;
        if (!el.connected || !el.parent || !el.root) return false;
        if (el.parent !== this) return false;
        const index = this.children.indexOf(el);
        if (index === -1) return false;
        this.children.splice(index, 1);
        el.parent = null;
        this.requestSort();
        this.update();
        el.transform.unbind(el);
        el.setRoot(null);
        return true;
    }

    requestSort(): void {
        this.needSort = true;
    }

    getSortedChildren(): IRenderItem[] {
        if (this.needSort) {
            this.sortedChildren.length = 0;
            const sorted = this.children.toSorted(
                (a, b) => a.zIndex - b.zIndex
            );
            this.sortedChildren.push(...sorted);
        }
        return this.sortedChildren;
    }

    forEachChild(fn: (item: RenderItem) => void): void {
        const stack: RenderItem[] = [this];
        while (stack.length > 0) {
            const ele = stack.shift()!;
            stack.push(...ele.children);
            fn(ele);
        }
    }

    /**
     * 当当前元素连接到根元素时触发，override 以自定义连接效果，是钩子在子元素中的便捷写法
     * @param root 根元素
     */
    protected onConnected(root: IRenderTreeRoot) {
        void root;
    }

    /**
     * 当当前元素从根元素上断开连接时触发，override 以自定义连接效果，是钩子在子元素中的便捷写法
     * @param prevRoot 取消连接之前，当前元素连接至的根元素
     */
    protected onDisconnected(prevRoot: IRenderTreeRoot) {
        void prevRoot;
    }

    //#endregion

    //#region 交互事件

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
     */
    patchProp(key: string, prevValue: any, nextValue: any): void {
        if (isNil(prevValue) && isNil(nextValue)) return;
        if (this.handleProps(key, prevValue, nextValue)) return;
        switch (key) {
            case 'cache': {
                if (!this.assertType(nextValue, 'boolean', key)) return;
                this.cacheProp = nextValue;
                if (this.nocacheProp) {
                    this.setCacheEnabled(false);
                } else {
                    this.setCacheEnabled(nextValue);
                }
                return;
            }
            case 'nocache': {
                if (!this.assertType(nextValue, 'boolean', key)) return;
                this.nocacheProp = nextValue;
                if (nextValue) {
                    this.setCacheEnabled(false);
                } else {
                    this.setCacheEnabled(this.cacheProp);
                }
                return;
            }
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
        this.children.length = 0;
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
