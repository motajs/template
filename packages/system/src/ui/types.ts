import { Props } from '@motajs/render';
import {
    ComponentOptions,
    DefineComponent,
    DefineSetupFnComponent,
    EmitsOptions,
    Reactive,
    Ref,
    ShallowRef,
    SlotsType,
    VNode
} from 'vue';

export type SetupComponentOptions<
    Props extends Record<string, any>,
    E extends EmitsOptions = {},
    EE extends string = string,
    S extends SlotsType = {}
> = Pick<ComponentOptions, 'name' | 'inheritAttrs'> & {
    props?: (keyof Props)[];
    emits?: E | EE[];
    slots?: S;
};

export type UIComponent = DefineSetupFnComponent<any> | DefineComponent;

export interface IUIDefaultPropsBase<T extends UIComponent = UIComponent> {
    /** 当前打开的 UI 所属的控制器 */
    readonly controller: IUIController<this>;
    /** 当前 UI 实例对象 */
    readonly instance: IUIInstance<T, this>;
}

export interface IGameUI<C extends UIComponent = UIComponent> {
    /** 这个 UI 的名称 */
    readonly name: string;
    /** 这个 UI 的 vue 组件对象 */
    readonly component: C;
}

export interface IUICustomStrategy<PB extends IUIDefaultPropsBase<any>> {
    /**
     * 打开一个新的 UI
     * @param ins 要打开的 UI 实例
     * @param stack 当前的 UI 栈，还未将 UI 实例加入栈中
     */
    open(
        ins: IUIInstance<UIComponent, PB>,
        stack: IUIInstance<UIComponent, PB>[]
    ): void;

    /**
     * 关闭一个 UI
     * @param ins 要关闭的 UI 实例
     * @param stack 当前的 UI 栈，还未将 UI 实例移除
     * @param index 这个 UI 实例在 UI 栈中的索引
     */
    close(
        ins: IUIInstance<UIComponent, PB>,
        stack: IUIInstance<UIComponent, PB>[],
        index: number
    ): void;

    /**
     * 隐藏一个 UI
     * @param ins 要隐藏的 UI 实例，还未进入隐藏状态
     * @param stack 当前的 UI 栈
     * @param index 这个 UI 实例在 UI 栈中的索引
     */
    hide(
        ins: IUIInstance<UIComponent, PB>,
        stack: IUIInstance<UIComponent, PB>[],
        index: number
    ): void;

    /**
     * 显示一个 UI
     * @param ins 要显示的 UI 实例，还未进入显示状态
     * @param stack 当前的 UI 栈
     * @param index 这个 UI 实例在 UI 栈中的索引
     */
    show(
        ins: IUIInstance<UIComponent, PB>,
        stack: IUIInstance<UIComponent, PB>[],
        index: number
    ): void;

    /**
     * 更新所有 UI 的显示状态，一般会在显示模式更改时调用，用于初始化显示模式的显示状态
     * @param stack 当前的 UI 栈
     */
    update(stack: IUIInstance<UIComponent, PB>[]): void;
}

export interface IKeepController {
    /**
     * 安全关闭背景 UI，如果当前没有 UI 已开启，那么直接关闭，否则维持
     */
    safelyUnload(): void;

    /**
     * 不论当前是否有 UI 已开启，都关闭背景
     */
    unload(): void;
}

/**
 * 获取 UI 组件在排除内置基础参数后的剩余参数类型
 */
export type UIRawProps<
    C extends UIComponent,
    PB extends IUIDefaultPropsBase<any>
> = Omit<Props<C>, keyof PB>;

/**
 * UI 基础 Props 参数的构造函数
 */
export type UIPropsBaseCreator<PB extends IUIDefaultPropsBase<any>> = (
    instance: IUIInstance<UIComponent, PB>,
    controller: IUIController<PB>
) => PB;

export interface IUIController<PB extends IUIDefaultPropsBase<any>> {
    /** 当前的 UI 栈 */
    readonly stack: IUIInstance[];
    /** 背景 UI 对象，当显示背景 UI 时，会显示此 UI 对应的实例 */
    readonly background: IGameUI | null;

    /** 当前的背景 UI 实例的浅层响应式对象 */
    readonly backIns: ShallowRef<IUIInstance | null>;
    /** 当前 UI 是否已经被激活的响应式对象，即至少有一个 UI 正在显示，或处在 `keep` 环境下 */
    readonly active: Ref<boolean>;
    /** 当前是否显示背景的响应式对象，用于容器响应式判断是否需要显示背景 */
    readonly showBack: Ref<boolean>;

    /**
     * 设置基础参数的构造函数
     * @param creator UI 基础 Props 参数的构造函数
     */
    setPropsBaseCreator(creator: UIPropsBaseCreator<PB> | null): void;

    /**
     * 创建对应 UI 实例对象的基础参数
     * @param instance UI 实例对象
     */
    createPropsBase(instance: IUIInstance<UIComponent, PB>): PB;

    /**
     * 设置控制器的背景 UI
     * @param background 背景 UI
     * @param vBind 当打开背景时，传递给背景的 VBind 参数
     * @returns 背景对应的 UI 实例
     */
    setBackground<C extends UIComponent>(
        background: IGameUI<C> | null,
        vBind: UIRawProps<C, PB>
    ): IUIInstance<C, PB> | null;

    /**
     * 当前是否显示背景 UI
     */
    showingBack(): boolean;

    /**
     * 隐藏背景 UI
     */
    hideBackground(): void;

    /**
     * 显示背景 UI
     */
    showBackground(): void;

    /**
     * 隐藏一个 UI
     * @param ins 要隐藏的 UI 实例
     */
    hide(ins: IUIInstance<UIComponent, PB>): void;

    /**
     * 显示一个 UI
     * @param ins 要显示的 UI 实例
     */
    show(ins: IUIInstance<UIComponent, PB>): void;

    /**
     * 打开一个 ui
     * @param ui 要打开的 ui
     * @param vBind 传递给这个 ui 的响应式数据
     * @param alwaysShow 这个 ui 是否保持开启，对于需要叠加显示的 ui 非常有用
     */
    open<C extends UIComponent>(
        ui: IGameUI<C>,
        vBind: UIRawProps<C, PB>,
        alwaysShow?: boolean
    ): IUIInstance<C, PB>;

    /**
     * 关闭一个 ui
     * @param ui 要关闭的 ui 实例
     */
    close(ui: IUIInstance<UIComponent, PB>): void;

    /**
     * 关闭所有或指定类型的所有 UI
     */
    closeAll(ui?: IGameUI): void;

    /**
     * 维持背景 UI，一般用于防闪烁，例如使用道具时可能在关闭道具栏后打开新 UI，这时就需要防闪烁
     */
    keep(): IKeepController;

    /**
     * 渲染这个 UI，可以直接嵌入渲染树中
     */
    render(): VNode;

    /**
     * 设置为仅显示最后一个 UI
     * @param stack 是否设置为栈模式，即删除一个 UI 后，其之后打开的 UI 是否也一并删除，默认为栈模式
     */
    lastOnly(stack?: boolean): void;

    /**
     * 设置为显示所有 UI
     * @param stack 是否设置为栈模式，即删除一个 UI 后，其之后打开的 UI 是否也一并删除，默认不是栈模式
     */
    showAll(stack?: boolean): void;

    /**
     * 使用自定义的显示模式
     * @param strategy 自定义显示模式的配置
     */
    showCustom(strategy: IUICustomStrategy<PB>): void;
}

export interface IUIInstance<
    C extends UIComponent = UIComponent,
    PB extends IUIDefaultPropsBase<C> = IUIDefaultPropsBase<C>
> {
    /** 这个 ui 实例的唯一 key，用于 vue */
    readonly key: number;
    /** 这个 ui 实例的 ui 信息 */
    readonly ui: IGameUI<C>;
    /** 传递给这个 ui 实例的响应式数据 */
    readonly vBind: Reactive<UIRawProps<C, PB>>;
    /** 当前元素是否被隐藏 */
    readonly hidden: Ref<boolean>;
    /** 是否永远保持开启 */
    readonly alwaysShow: boolean;

    /**
     * 隐藏这个 ui
     */
    hide(): void;

    /**
     * 显示这个 ui
     */
    show(): void;
}
