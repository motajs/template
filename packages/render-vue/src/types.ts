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
