import { IRenderItemBaseHooks } from '@motajs/render';
import { Ref } from 'vue';
import { BaseProps } from './props';
import { TagDefine } from './elements';
import { ExcitationCurve } from '@motajs/animate';

export type DefaultProps<
    P extends BaseProps = BaseProps,
    H extends IRenderItemBaseHooks = IRenderItemBaseHooks
> = TagDefine<P, H>;

//#region 功能接口

export interface ITransitionedBase<T> {
    /** 响应式对象，可以直接写作元素 prop */
    readonly ref: Readonly<Ref<T>>;
    /** 当前值 */
    readonly value: T;

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

export interface ITransitionedController<T> extends ITransitionedBase<T> {
    /**
     * 执行动画，使当前值缓慢变化至目标值
     * @param value 目标值
     * @param time 动画时长
     */
    set(value: T, time?: number): void;
}

export interface ICycledTransitionController extends ITransitionedBase<number> {
    /**
     * 设置循环渐变的范围
     * @param min 要设置为的最小值
     * @param max 要设置为的最大值
     */
    setRange(min: number, max: number): void;
}

//#endregion
