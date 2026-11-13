import { IRenderTreeRoot, MotaRenderer, RenderItem } from '@motajs/render';
import {
    computed,
    ComputedRef,
    getCurrentInstance,
    onUnmounted,
    Ref,
    ref
} from 'vue';
import {
    IExcitable,
    IAnimater,
    ITransition,
    Animater,
    IExcitation,
    Transition,
    excited,
    ExcitationCurve,
    IAnimatable
} from '@motajs/animate';
import { ITransitionedController } from './types';

//#region 函数功能接口

/**
 * 尝试获取当前组件的根渲染元素，若无法找到可能存在的根元素，则返回 `null`。
 * 仅允许在组件的 `setup` 或其生命周期钩子中调用，否则一定返回 `null`。
 *
 * ```ts
 * const root = useRootRenderer()!;
 * const ex = root.excitation; // 例如从根元素获取激励源
 * ```
 */
export function useRendererRoot(): IRenderTreeRoot | null {
    const instance = getCurrentInstance();
    if (!instance) return null;
    // 尝试从几个路径获取根元素
    const root = instance.root.vnode.el;
    if (root instanceof RenderItem) {
        if (root.parent instanceof MotaRenderer) {
            return root.parent;
        } else {
            return null;
        }
    }
    const currEl = instance.proxy?.$el;
    if (currEl instanceof RenderItem) return currEl.root;
    const appEl = instance.appContext.app._container;
    if (appEl instanceof MotaRenderer) return appEl;
    return null;
}

/**
 * 当根元素被激励时同时激励传入的被激励对象，仅可在组件的 `setup` 或其生命周期钩子（如 `onMounted`）中使用。
 * 在组件内需要每帧执行时务必使用此接口，否则可能会导致激励对象没有被正确删除，出现内存泄漏问题。在组件外调用此方法无效。
 *
 * ```ts
 * let curr = 0;
 * const excitable: IExcitable = {
 *   excited(time) { curr = time; }
 * }
 * onExcited(excitable);
 * ```
 * @param excitable 要执行的被激励对象
 */
export function onExcited(excitable: IExcitable<number>): void {
    const renderer = useRendererRoot();
    if (!renderer) return;
    const num = renderer.delegateExcitable(excitable);
    onUnmounted(() => {
        renderer.removeExcitable(num);
    });
}

/**
 * 当根元素被激励时同时执行传入的激励函数，仅可在组件的 `setup` 或其生命周期钩子（如 `onMounted`）中使用。
 * 在组件内需要每帧执行时务必使用此接口，否则可能会导致激励对象没有被正确删除，出现内存泄漏问题。在组件外调用此方法无效。
 *
 * ```ts
 * let curr = 0;
 * const func = (time: number) => void (curr += time);
 * onExcitedFunc(func);
 * ```
 * @param excitable 要执行的激励函数
 */
export function onExcitedFunc(func: (time: number) => void): void {
    onExcited(excited(func));
}

/**
 * 创建一个受指定激励源激励（一般为根渲染器的激励源）的动画执行器，仅可在组件的 `setup` 或其声明周期钩子中使用。
 * 如果不传入动画对象，那么当当前组件被卸载时，会一并把内部创建的动画对象销毁，此后不能再使用此动画对象。
 * 在组件中建议使用此方法来获取动画器，否则可能会导致动画器没有被正确销毁，出现内存泄漏问题。
 *
 * ```ts
 * const obj = ref(0);
 * const anim = useAnimater()!;
 * anim.animate(obj).to(100, 1000);
 * ```
 * @param anim 手动指定动画对象，不传时会自动创建
 * @param excitation 手动指定激励源，不传时会使用根渲染器的激励源
 */
export function useAnimater(
    anim?: IAnimater,
    excitation?: IExcitation<number>
): IAnimater | null {
    const renderer = useRendererRoot();
    if (!renderer) return null;
    const ex = excitation ?? renderer.excitation;
    const animater = anim ?? new Animater();
    animater.bindExcitation(ex);
    onUnmounted(() => {
        animater.unbindExcitation();
        if (!anim) animater.destroy();
    });
    return animater;
}

/**
 * 创建一个受指定激励源激励（一般为根渲染器的激励源）的渐变执行器，仅可在组件的 `setup` 或其声明周期钩子中使用。
 * 如果不传入渐变对象，那么当当前组件被卸载时，会一并把内部创建的渐变对象销毁，此后不能再使用此渐变对象。
 * 在组件中建议使用此方法来获取渐变对象，否则可能会导致渐变对象没有被正确销毁，出现内存泄漏问题。
 *
 * ```ts
 * const obj = ref(0);
 * const anim = useAnimater()!;
 * anim.transition(obj).to(100, 1000);
 * ```
 * @param anim 手动指定动画对象，不传时会自动创建
 * @param excitation 手动指定激励源，不传时会使用根渲染器的激励源
 */
export function useTransition(
    tran?: ITransition,
    excitation?: IExcitation<number>
): ITransition | null {
    const renderer = useRendererRoot();
    if (!renderer) return null;
    const ex = excitation ?? renderer.excitation;
    const transition = tran ?? new Transition();
    transition.bindExcitation(ex);
    onUnmounted(() => {
        transition.unbindExcitation();
        if (!tran) transition.destroy();
    });
    return transition;
}

const transitionMap: Map<IRenderTreeRoot, ITransition> = new Map();

/**
 * 创建一个渐变数值，当数值发生变化时会缓慢变化值目标值而非突变，只可以用于组件内，不可用于组件外
 * ```tsx
 * const value = transitioned(10, 300, linear()); // 创建渐变，初始值为 10，渐变时长 300ms，线性变化
 * value.set(100); // 渐变至 100
 *
 * // 直接在元素上使用
 * <text text={value.ref.value} />
 * ```
 * @param value 初始值
 * @param time 渐变时长
 * @param curve 渐变的速率曲线
 */
export function transitioned(
    value: number,
    time: number,
    curve: ExcitationCurve
): ITransitionedController<number> | null {
    const renderer = useRendererRoot();
    if (!renderer) return null;
    const tran = transitionMap.getOrInsertComputed(
        renderer,
        () => new Transition()
    );
    if (!tran.excitation) {
        tran.bindExcitation(renderer.excitation);
    }
    return new RenderTransition(value, tran, time, curve);
}

/**
 * 创建一个渐变颜色，当颜色发生变化时会缓慢变化值目标值而非突变，自动判断颜色字符串类型，只可用于组件内，不可用于组件外
 * ```tsx
 * // 创建渐变，初始值为 '#fff'（白色），渐变时长 300ms，线性变化
 * const color = transitionedColor('#fff', 300, linear());
 * color.set('rgba(129, 30, 40, 0.7)'); // 渐变至这个颜色
 *
 * // 直接在元素上使用
 * <text text='文本' fillStyle={color.ref.value} />
 * ```
 * @param color 颜色的初始值
 * @param time 渐变时长
 * @param curve 渐变的速率曲线
 */
export function transitionedColor(
    color: string,
    time: number,
    curve: ExcitationCurve
): ITransitionedController<string> | null {
    const renderer = useRendererRoot();
    if (!renderer) return null;
    const tran = transitionMap.getOrInsertComputed(
        renderer,
        () => new Transition()
    );
    if (!tran.excitation) {
        tran.bindExcitation(renderer.excitation);
    }
    return new RenderColorTransition(color, tran, time, curve);
}

//#endregion

//#region 渐变

class RenderTransition implements ITransitionedController<number> {
    readonly ref: Ref<number>;

    set value(v: number) {
        this.set(v);
    }
    get value() {
        return this.ref.value;
    }

    constructor(
        value: number,
        readonly transition: ITransition,
        public time: number,
        public curve: ExcitationCurve
    ) {
        this.ref = ref(value);
    }

    set(value: number, time: number = this.time): void {
        this.transition.curve(this.curve).transition(this.ref).to(value, time);
    }

    mode(timing: ExcitationCurve): void {
        this.curve = timing;
    }

    setTime(time: number): void {
        this.time = time;
    }
}

type ColorRGBA = [number, number, number, number];

class RenderColorTransition implements ITransitionedController<string> {
    /** R 通道可动画对象 */
    private readonly rValue: IAnimatable;
    /** G 通道可动画对象 */
    private readonly gValue: IAnimatable;
    /** B 通道可动画对象 */
    private readonly bValue: IAnimatable;
    /** A 通道可动画对象 */
    private readonly aValue: IAnimatable;

    readonly ref: ComputedRef<string>;

    set value(v: string) {
        this.set(v);
    }
    get value() {
        return this.encodeColor();
    }

    constructor(
        value: string,
        readonly transition: ITransition,
        public time: number,
        public curve: ExcitationCurve
    ) {
        const [r, g, b, a] = this.decodeColor(value);
        this.rValue = ref(r);
        this.gValue = ref(g);
        this.bValue = ref(b);
        this.aValue = ref(a);
        this.ref = computed(() => this.encodeColor());
    }

    set(value: string, time: number = this.time): void {
        this.transitionColor(this.decodeColor(value), time);
    }

    mode(timing: ExcitationCurve): void {
        this.curve = timing;
    }

    setTime(time: number): void {
        this.time = time;
    }

    /**
     * 渐变至目标颜色
     * @param param0 目标颜色数组
     * @param time 渐变时长
     */
    private transitionColor([r, g, b, a]: ColorRGBA, time: number) {
        this.transition
            .curve(this.curve)
            .transition(this.rValue)
            .to(r, time)
            .transition(this.gValue)
            .to(g, time)
            .transition(this.bValue)
            .to(b, time)
            .transition(this.aValue)
            .to(a, time);
    }

    /**
     * 解析十六进制、rgba、rgb 颜色字符串
     * @param color 颜色字符串
     */
    private decodeColor(color: string): ColorRGBA {
        if (color.startsWith('#')) {
            return this.decodeHash(color);
        } else if (color.startsWith('rgba(')) {
            return this.decodeRGBA(color);
        } else if (color.startsWith('rgb(')) {
            return this.decodeRGB(color);
        }
        return [0, 0, 0, 1];
    }

    /**
     * 解析十六进制颜色字符串
     * @param color 十六进制字符串
     */
    private decodeHash(color: string): ColorRGBA {
        switch (color.length) {
            case 4:
                return [
                    Number(`0x${color.slice(1, 2).repeat(2)}`),
                    Number(`0x${color.slice(2, 3).repeat(2)}`),
                    Number(`0x${color.slice(3, 4).repeat(2)}`),
                    1
                ];
            case 5:
                return [
                    Number(`0x${color.slice(1, 2).repeat(2)}`),
                    Number(`0x${color.slice(2, 3).repeat(2)}`),
                    Number(`0x${color.slice(3, 4).repeat(2)}`),
                    Number(`0x${color.slice(4, 5).repeat(2)}`)
                ];
            case 7:
                return [
                    Number(`0x${color.slice(1, 3)}`),
                    Number(`0x${color.slice(3, 5)}`),
                    Number(`0x${color.slice(5, 7)}`),
                    1
                ];
            case 9:
                return [
                    Number(`0x${color.slice(1, 3)}`),
                    Number(`0x${color.slice(3, 5)}`),
                    Number(`0x${color.slice(5, 7)}`),
                    Number(`0x${color.slice(7, 9)}`)
                ];
        }
        return [0, 0, 0, 0];
    }

    /**
     * 解析 RGBA 颜色字符串
     * @param color 颜色字符串
     */
    private decodeRGBA(color: string): ColorRGBA {
        const data = color.slice(color.indexOf('(') + 1, color.indexOf(')'));
        const [r, g, b, a] = data.split(',');
        return [Number(r), Number(g), Number(b), Number(a)];
    }

    /**
     * 解析 RGB 颜色字符串
     * @param color 颜色字符串
     */
    private decodeRGB(color: string): ColorRGBA {
        const data = color.slice(color.indexOf('(') + 1, color.indexOf(')'));
        const [r, g, b] = data.split(',');
        return [Number(r), Number(g), Number(b), 1];
    }

    /**
     * 编码颜色为 RGBA 字符串
     */
    private encodeColor() {
        const r = this.rValue.value;
        const g = this.gValue.value;
        const b = this.bValue.value;
        const a = this.aValue.value;
        return `rgba(${r},${g},${b},${a})`;
    }
}

//#endregion
