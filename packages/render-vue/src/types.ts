import {
    IRenderItem,
    IRenderItemBaseHooks,
    IRenderTreeRoot
} from '@motajs/render';
import { Ref, VNodeProps } from 'vue';
import { BaseProps } from './props';
import { TagDefine } from './elements';
import { ExcitationCurve } from '@motajs/animate';

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
    H extends IRenderItemBaseHooks = IRenderItemBaseHooks
> = TagDefine<P, H>;

//#endregion

//#region 功能接口

export interface ITransitionedController<T> {
    readonly ref: Readonly<Ref<T>>;
    readonly value: T;

    /**
     * 执行动画，使当前值缓慢变化至目标值
     * @param value 目标值
     * @param time 动画时长
     */
    set(value: T, time?: number): void;

    /**
     * 设置动画的速率曲线
     * @param timing 速率曲线
     */
    mode(timing: ExcitationCurve): void;

    /**
     * 设置动画的动画时长
     * @param time 动画时长
     */
    setTime(time: number): void;
}

//#endregion
