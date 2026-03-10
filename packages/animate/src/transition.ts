import {
    EndRelation,
    ExcitationCurve,
    IAnimatable,
    IExcitableController,
    IExcitation,
    ITransition
} from './types';
import { linear } from './utils';

interface ITransitionData {
    /** 渐变对象 */
    readonly animatable: IAnimatable;
    /** 渐变执行完毕后兑现的 `Promise` */
    readonly promise: Promise<void>;
    /** `Promise` 兑现函数 */
    readonly resolve: () => void;
    /** 渐变起始时刻 */
    startTime: number;
    /** 渐变时长 */
    time: number;
    /** 渐变起始值 */
    startValue: number;
    /** 渐变目标值 */
    targetValue: number;
    /** 渐变终值与初值的差值 */
    diff: number;
    /** 渐变结尾参考方式 */
    end: EndRelation;
    /** 速率曲线 */
    curve: ExcitationCurve;
}

export class Transition implements ITransition {
    /** 当前绑定的激励源 */
    private excitation: IExcitation<number> | null = null;
    /** 当前定义在绑定激励源上的可激励对象 */
    private controller: IExcitableController<number> | null = null;

    /** 当前使用的速率曲线 */
    private curveStatus: ExcitationCurve = linear();
    /** 当前绑定的渐变对象 */
    private animatableStatus: IAnimatable | null = null;
    /** 渐变数据 */
    private transitionData: Map<IAnimatable, ITransitionData> = new Map();

    bindExcitation(excitation: IExcitation<number>): void {
        if (excitation === this.excitation) return;
        this.unbindExcitation();
        this.controller = excitation.add(this);
        this.excitation = excitation;
    }

    unbindExcitation(): void {
        if (!this.excitation) return;
        this.controller?.revoke();
        this.excitation = null;
    }

    //#region 渐变定义

    curve(curve: ExcitationCurve): this {
        this.curveStatus = curve;
        return this;
    }

    transite(animatable: IAnimatable): this {
        this.animatableStatus = animatable;
        return this;
    }

    to(
        value: number,
        time: number,
        end: EndRelation = EndRelation.Target
    ): this {
        if (!this.animatableStatus || !this.excitation) return this;
        const animatable = this.animatableStatus;
        const now = this.excitation.payload();
        const data = this.transitionData.getOrInsertComputed(
            this.animatableStatus,
            _ => {
                const { promise, resolve } = Promise.withResolvers<void>();
                return {
                    animatable,
                    promise,
                    resolve,
                    startTime: 0,
                    time: 0,
                    startValue: 0,
                    targetValue: 0,
                    diff: 0,
                    end,
                    curve: this.curveStatus
                };
            }
        );
        data.curve = this.curveStatus;
        data.startTime = now;
        data.time = time;
        data.startValue = animatable.value;
        data.targetValue = value;
        data.diff = value - animatable.value;
        data.end = end;
        return this;
    }

    wait(animatable: IAnimatable): Promise<void> {
        const data = this.transitionData.get(animatable);
        if (!data) return Promise.resolve();
        else return data.promise;
    }

    revoke(): void {
        this.animatableStatus = null;
    }

    //#endregion

    //#region 渐变执行

    excited(payload: number): void {
        const toDelete = new Set<IAnimatable>();
        for (const [anim, data] of this.transitionData) {
            const elapsed = payload - data.startTime;
            const progress = elapsed / data.time;
            if (progress >= 1) {
                // 动画结束
                if (data.end === EndRelation.Target) {
                    anim.value = data.targetValue;
                } else {
                    anim.value = data.startValue + data.diff * data.curve(1);
                }
                data.resolve();
                toDelete.add(anim);
                this.transitionData.delete(anim);
            } else {
                // 动画进行中
                const curveValue = data.curve(progress);
                anim.value = data.startValue + data.diff * curveValue;
            }
        }
        toDelete.forEach(v => this.transitionData.delete(v));
    }

    //#endregion
}
