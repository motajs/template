import { ERenderItemEvent, IRenderItem, IRenderTreeRoot } from '@motajs/render';
import { VNodeProps } from 'vue';
import { BaseProps } from './props';
import { TagDefine } from './elements';
import {
    IAnimater,
    IExcitable,
    IExcitation,
    ITransition
} from '@motajs/animate';
import EventEmitter from 'eventemitter3';

//#region 标签管理

export type TagCreateFunction = (
    props?: (VNodeProps & { [key: string]: any }) | null
) => IRenderItem;

export interface IRenderTagInfo {
    /** 标签创建函数 */
    readonly onCreate: TagCreateFunction;
}

export interface IRenderTagManager {
    /** 标签管理器对应的渲染根元素 */
    readonly renderer: IRenderTreeRoot;

    /**
     * 注册自定义标签
     * @param tag 标签名称
     * @param onCreate 创建标签的函数
     */
    registerTag(tag: string, onCreate: TagCreateFunction): void;

    /**
     * 获取指定标签的信息
     * @param tag 标签名称
     */
    getTag(tag: string): IRenderTagInfo | null;

    /**
     * 创建常规元素的创建函数
     * @param cache 创建时默认是否启用缓存
     * @param Cons 渲染元素构造器
     */
    createStandardElement(
        cache: boolean,
        Cons: new (enableCache?: boolean) => IRenderItem
    ): TagCreateFunction;

    /**
     * 创建无创建参数的元素创建函数
     * @param Cons 渲染元素构造器
     */
    createNoParamElement(Cons: new () => IRenderItem): TagCreateFunction;
}

export type DefaultProps<
    P extends BaseProps = BaseProps,
    E extends ERenderItemEvent = ERenderItemEvent
> = TagDefine<P, E>;

//#endregion

//#region 功能接口

export interface IRendererUsing {
    /** Using 对象使用的渲染器 */
    readonly renderer: IRenderTreeRoot;

    /**
     * 当渲染器的激励源触发激励时同时执行传入的可激励对象，相当于每帧执行一次。
     *
     * 在**组件内**需要每帧执行时**务必**使用此接口，否则可能会导致激励对象没有被正确删除，出现内存泄漏问题。
     *
     * 在**组件外不要**使用此接口，否则可能没有效果！
     * @param excitable 可激励对象
     */
    onExcited(excitable: IExcitable<number>): void;

    /**
     * 当渲染器的激励源触发激励时同时执行传入的函数，相当于每帧执行一次。
     *
     * 在**组件内**需要每帧执行时**务必**使用此接口，否则可能会导致激励对象没有被正确删除，出现内存泄漏问题。
     *
     * 在**组件外不要**使用此接口，否则可能没有效果！
     * @param excitable 可激励对象
     */
    onExcitedFunc(fn: (payload: number) => void): void;

    /**
     * 监听渲染元素的指定事件。
     *
     * 在组件内如果你需要监听事件，应该先考虑使用 `JSX` 的 `onXxx` 来监听事件，而不是使用此接口。
     *
     * 如果 `JSX` 的 `onXxx` 不能满足你的需求，再考虑使用此接口，在组件内**不要**直接使用 `item.on` 来监听事件，
     * 否则可能导致事件监听没有正确删除，出现内存泄漏问题。
     *
     * 在**组件外不要**使用此接口，否则可能没有效果！
     * @param item 要监听的渲染元素
     * @param key 事件类型
     * @param listener 当事件触发时执行的函数
     */
    listenEvent<
        T extends ERenderItemEvent,
        K extends EventEmitter.EventNames<T>
    >(
        item: IRenderItem,
        key: K,
        listener: EventEmitter.EventListener<T, K>
    ): void;

    /**
     * 创建一个动画执行器。
     *
     * 在**组件内**需要动画器时**务必**使用此接口，否则可能会动画器没有被正确销毁，出现内存泄漏问题。
     *
     * 在**组件外不要**使用此接口，否则可能没有效果！
     * @param excitation 动画执行器使用的激励源
     */
    useAnimater(excitation: IExcitation<number>): IAnimater;

    /**
     * 创建一个渐变执行器。
     *
     * 在**组件内**需要渐变对象时**务必**使用此接口，否则可能会渐变对象没有被正确销毁，出现内存泄漏问题。
     *
     * 在**组件外不要**使用此接口，否则可能没有效果！
     * @param excitation 渐变执行器使用的激励源
     */
    useTransition(excitation: IExcitation<number>): ITransition;
}

//#endregion
