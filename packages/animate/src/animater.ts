import { logger } from '@motajs/common';
import {
    ExcitationCurve,
    IAnimatable,
    IAnimater,
    IAnimationPlan,
    IExcitableController,
    IExcitation,
    IAnimatePlanIdentifier,
    EndRelation
} from './types';
import { linear } from './utils';

interface IAnimaterTimedInfo extends IAnimatePlanIdentifier {
    /** 等待时长 */
    readonly time: number;
}

interface IAnimaterResolvedTimedInfo extends IAnimaterTimedInfo {
    /** 当前定时动画计划被唤起的时刻 */
    readonly arousedTime: number;
}

interface IAnimaterRawPlan extends IAnimationPlan {
    /** 当此动画开始时需要执行的计划 */
    readonly when: Set<IAnimaterTimedInfo>;
    /** 当此动画结束后需要执行的计划 */
    readonly after: Set<IAnimaterTimedInfo>;
    /** 兑现函数，当本次动画计划执行完毕后执行 */
    readonly resolve: () => void;
    /** 终值参考模式 */
    readonly end: EndRelation;
}

interface IAnimatingContent extends IAnimaterRawPlan {
    /** 动画执行开始的时刻 */
    readonly startTime: number;
    /** 动画执行的初始值 */
    readonly startValue: number;
    /** 动画终值与初值的差值 */
    readonly diff: number;
}

interface IAnimaterContentPlan {
    /** 当前动画对象中所有的动画计划 */
    readonly animationPlan: Map<number, IAnimaterRawPlan>;
    /** 计数器，用于计算动画计划的索引 */
    counter: number;
}

interface IAnimaterPlanGroupBase {
    /** 计划执行前的等待时间 */
    readonly preTime: number;
    /** 计划执行后的等待时间 */
    readonly postTime: number;
    /** 计划组的首个动画计划 */
    readonly planStart: Set<IAnimatePlanIdentifier>;
}

interface IAnimaterPlanGroup extends IAnimaterPlanGroupBase {
    /** 当前计划组中所有的动画对象计划 */
    readonly contentStore: Map<IAnimatable, IAnimaterContentPlan>;
}

export class Animater implements IAnimater {
    /** 当前是否正在定义动画计划 */
    private planning: boolean = false;

    /** 当前绑定的激励源 */
    private excitation: IExcitation<number> | null = null;
    /** 当前定义在绑定激励源上的可激励对象 */
    private controller: IExcitableController<number> | null = null;

    /** 计划组计数器 */
    private groupCounter: number = 0;
    /** 当前正在计划的动画计划 */
    private planningStore: Map<IAnimatable, IAnimaterContentPlan> = new Map();
    /** 计划存储 */
    private groupStore: Map<number, IAnimaterPlanGroup> = new Map();
    /** 需要执行的计划队列 */
    private pendingGroups: number[] = [];
    /** 是否已经因为没有结束计划组而报错 */
    private planErrored: boolean = false;

    /** 当前所有正在等待执行的 `when` 操作 */
    private whens: Set<IAnimaterResolvedTimedInfo> = new Set();
    /** 当前所有正在等待执行的 `after` 操作 */
    private afters: Set<IAnimaterResolvedTimedInfo> = new Set();

    /** 当前正在执行的计划组 */
    private executingGroup: number = -1;
    /** 当前正在执行的计划组对象 */
    private executingGroupObj: IAnimaterPlanGroup | null = null;
    /** 当前正在执行的动画 */
    private executing: Set<IAnimatingContent> = new Set();
    /** 当前动画对象正在被哪个动画执行 */
    private executingMap: Map<IAnimatable, IAnimatingContent> = new Map();

    /** 当前使用的速率曲线 */
    private curveStatus: ExcitationCurve = linear();
    /** 当前使用的动画对象计划 */
    private animatableStatus: IAnimaterContentPlan | null = null;
    /** 当前使用的动画对象 */
    private currentAnimatable: IAnimatable | null = null;
    /** 当前正在计划的计划组的起始动画 */
    private planningStart: Set<IAnimatePlanIdentifier> = new Set();

    /** 当前的 `when` 计划内容 */
    private whenBind: IAnimaterRawPlan | null = null;
    /** 当前的 `after` 计划内容 */
    private afterBind: IAnimaterRawPlan | null = null;
    /** 当前的 `when` 等待时长 */
    private whenTime: number = 0;
    /** 当前的 `after` 等待时长 */
    private afterTime: number = 0;

    /** 计划组是否正在进行执行前等待 */
    private waitingPre = false;
    /** 计划组执行前等待的时间 */
    private waitingPreStart = 0;
    /** 计划组是否正在进行执行后等待 */
    private waitingPost = false;
    /** 计划组执行后等待的时间 */
    private waitingPostStart = 0;

    /** 上一个定义的动画计划 */
    private lastAnimatable: IAnimaterRawPlan | null = null;

    constructor() {
        this.excited = this.excited.bind(this);
    }

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

    //#region 动画计划

    animate(content: IAnimatable): this {
        if (!this.planningStore.has(content)) {
            const plan: IAnimaterContentPlan = {
                animationPlan: new Map(),
                counter: 0
            };
            this.animatableStatus = plan;
            this.planningStore.set(content, plan);
        } else {
            const plan = this.planningStore.get(content)!;
            this.animatableStatus = plan;
        }
        this.currentAnimatable = content;
        return this;
    }

    curve(curve: ExcitationCurve): this {
        this.curveStatus = curve;
        return this;
    }

    to(
        value: number,
        time: number,
        end: EndRelation = EndRelation.Target
    ): this {
        if (!this.animatableStatus || !this.currentAnimatable) return this;
        this.planning = true;
        // 定义动画计划
        const index = ++this.animatableStatus.counter;
        const { promise, resolve } = Promise.withResolvers<void>();
        const plan: IAnimaterRawPlan = {
            identifier: { content: this.currentAnimatable, index },
            curve: this.curveStatus,
            targetValue: value,
            end,
            time,
            promise,
            resolve,
            when: new Set(),
            after: new Set()
        };
        this.animatableStatus.animationPlan.set(index, plan);
        // 检查 when after 状态，如果是在这个状态下，加入到对应的计划中
        if (this.whenBind) {
            const identifier: IAnimaterTimedInfo = {
                content: this.currentAnimatable,
                index,
                time: this.whenTime
            };
            this.whenBind.when.add(identifier);
        } else if (this.afterBind) {
            const identifier: IAnimaterTimedInfo = {
                content: this.currentAnimatable,
                index,
                time: this.afterTime
            };
            this.afterBind.after.add(identifier);
        } else {
            const identifier: IAnimatePlanIdentifier = {
                content: this.currentAnimatable,
                index
            };
            this.planningStart.add(identifier);
        }
        // 将上一次的计划设为本计划，用于 after when 的调用
        this.lastAnimatable = plan;
        return this;
    }

    after(time: number = 0): this {
        if (!this.lastAnimatable) return this;
        this.afterBind = this.lastAnimatable;
        this.afterTime = time;
        this.whenBind = null;
        return this;
    }

    afterPlan(content: IAnimatable, index: number, time: number = 0): this {
        const plan = this.queryRaw(content, index);
        if (!plan) return this;
        this.afterBind = plan;
        this.afterTime = time;
        this.whenBind = null;
        return this;
    }

    when(time: number = 0): this {
        if (!this.lastAnimatable) return this;
        this.whenBind = this.lastAnimatable;
        this.whenTime = time;
        this.afterBind = null;
        return this;
    }

    whenPlan(content: IAnimatable, index: number, time: number = 0): this {
        const plan = this.queryRaw(content, index);
        if (!plan) return this;
        this.whenBind = plan;
        this.whenTime = time;
        this.afterBind = null;
        return this;
    }

    /**
     * 类内查询动画计划，可以获取到外界获取不到的信息
     * @param content 动画对象
     * @param index 动画计划索引
     * @param plan 计划组索引，不填时表示当前正在计划中的计划组，即从上一次调用 `planEnd` 至现在的这个区间。
     */
    private queryRaw(
        content: IAnimatable,
        index: number,
        plan: number = -1
    ): IAnimaterRawPlan | null {
        if (plan === -1) {
            const animation = this.planningStore.get(content);
            if (!animation) return null;
            const result = animation.animationPlan.get(index);
            return result ?? null;
        } else {
            const group = this.groupStore.get(plan);
            if (!group) return null;
            const animation = group.contentStore.get(content);
            if (!animation) return null;
            const result = animation.animationPlan.get(index);
            return result ?? null;
        }
    }

    query(
        content: IAnimatable,
        index: number,
        plan: number = -1
    ): IAnimationPlan | null {
        return this.queryRaw(content, index, plan);
    }

    wait(
        content: IAnimatable,
        index: number,
        plan: number = this.executingGroup
    ): Promise<void> {
        const raw = this.query(content, index, plan);
        if (!raw) return Promise.resolve();
        else return raw.promise;
    }

    planEnd(preTime: number = 0, postTime: number = 0): number {
        if (!this.planning) return -1;
        const group: IAnimaterPlanGroup = {
            contentStore: this.planningStore,
            planStart: this.planningStart,
            preTime,
            postTime
        };
        this.whenBind = null;
        this.afterBind = null;
        this.currentAnimatable = null;
        this.animatableStatus = null;
        this.lastAnimatable = null;
        this.planningStart = new Set();
        this.planningStore = new Map();
        this.planning = false;
        const index = ++this.groupCounter;
        this.groupStore.set(index, group);
        this.pendingGroups.push(index);
        this.startPlanGroup();
        this.planErrored = false;
        return index;
    }

    //#endregion

    //#region 动画执行

    excited(payload: number): void {
        if (this.planning) {
            if (!this.planErrored) {
                logger.error(50);
                this.planErrored = true;
            }
            return;
        }
        // 计划组未执行
        if (this.executingGroup === -1 || !this.executingGroupObj) return;

        // 计划组 preTime 等待
        if (this.waitingPre) {
            const dt = payload - this.waitingPreStart;
            if (dt < this.executingGroupObj.preTime) return;
            this.waitingPre = false;
            // 启动所有 planStart 动画
            for (const identifier of this.executingGroupObj.planStart) {
                this.executeAnimate(identifier);
            }
        }

        // 计划组 postTime 等待
        if (this.waitingPost) {
            const dt = payload - this.waitingPostStart;
            if (dt >= this.executingGroupObj.postTime) {
                this.waitingPost = false;
                this.endPlanGroup();
            }
            return;
        }

        // 处理 when/after 等待
        const whenToDelete = new Set<IAnimaterResolvedTimedInfo>();
        for (const w of this.whens) {
            if (payload - w.arousedTime >= w.time) {
                whenToDelete.add(w);
                this.executeAnimate(w);
            }
        }
        whenToDelete.forEach(v => this.whens.delete(v));

        const afterToDelete = new Set<IAnimaterResolvedTimedInfo>();
        for (const a of this.afters) {
            if (payload - a.arousedTime >= a.time) {
                afterToDelete.add(a);
                this.executeAnimate(a);
            }
        }
        afterToDelete.forEach(v => this.afters.delete(v));

        // 动画执行
        const endedAnimate = new Set<IAnimatingContent>();
        const afters = new Set<IAnimaterTimedInfo>();
        for (const anim of this.executing) {
            const progress = (payload - anim.startTime) / anim.time;
            const content = anim.identifier.content;
            if (progress >= 1) {
                // 动画结束
                if (anim.end === EndRelation.Target) {
                    content.value = anim.targetValue;
                } else {
                    content.value = anim.startValue + anim.curve(1) * anim.diff;
                }
                anim.resolve();
                endedAnimate.add(anim);
                anim.after.forEach(v => afters.add(v));
            } else {
                const completion = anim.curve(progress);
                content.value = completion * anim.diff + anim.startValue;
            }
        }
        // 检查 after
        afters.forEach(v => {
            this.startAfter({ ...v, arousedTime: payload });
        });
        // 必要清理
        endedAnimate.forEach(v => {
            this.executing.delete(v);
            this.executingMap.delete(v.identifier.content);
        });

        // 检查计划组是否全部结束
        if (
            this.executing.size === 0 &&
            this.whens.size === 0 &&
            this.afters.size === 0
        ) {
            this.waitingPost = true;
            this.waitingPostStart = payload;
        }
    }

    /**
     * 开始执行指定的动画
     * @param identifier 要执行的动画标识符
     */
    private executeAnimate(identifier: IAnimatePlanIdentifier) {
        if (!this.executingGroupObj || !this.excitation) return;
        const plan = this.queryRaw(
            identifier.content,
            identifier.index,
            this.executingGroup
        );
        if (!plan) return;
        // 冲突检测
        if (this.executingMap.has(identifier.content)) {
            const curr = this.executingMap.get(identifier.content)!;
            const now = this.excitation.payload();
            if (curr.startTime === now) {
                logger.error(51);
                return;
            }
            // 终止前一个动画
            curr.resolve();
            // 这里也需要
            const anim = curr.identifier.content;
            if (curr.end === EndRelation.Target) {
                anim.value = curr.targetValue;
            } else if (curr.end === EndRelation.Curve) {
                anim.value = curr.startValue + curr.curve(1) * curr.diff;
            } else {
                const elapsed = this.excitation.payload() - curr.startTime;
                const curveValue = curr.curve(elapsed / curr.time);
                anim.value = curr.startValue + curr.diff * curveValue;
            }
            this.executing.delete(curr);
        }
        // 记录动画初始值和开始时间
        const startValue = identifier.content.value;
        const startTime = this.excitation.payload();
        const anim: IAnimatingContent = {
            ...plan,
            startTime,
            startValue,
            diff: plan.targetValue - startValue
        };
        this.executing.add(anim);
        this.executingMap.set(identifier.content, anim);
        // 检查 when
        for (const when of plan.when) {
            this.startWhen({ ...when, arousedTime: startTime });
        }
    }

    /**
     * 开始 `when` 状态计时
     * @param when `when` 状态
     */
    private startWhen(when: IAnimaterResolvedTimedInfo) {
        if (when.time === 0) {
            this.executeAnimate(when);
        } else {
            this.whens.add(when);
        }
    }

    /**
     * 开始 `after` 状态计时
     * @param after `after` 状态
     */
    private startAfter(after: IAnimaterResolvedTimedInfo) {
        if (after.time === 0) {
            this.executeAnimate(after);
        } else {
            this.afters.add(after);
        }
    }

    /**
     * 开始指定计划组动画的执行
     */
    private startPlanGroup() {
        if (this.executingGroup !== -1) return;
        if (this.pendingGroups.length === 0) return;
        if (!this.excitation) return;
        const group = this.pendingGroups.shift();
        if (group === void 0) return;
        const obj = this.groupStore.get(group);
        if (!obj) return;
        this.executingGroup = group;
        this.executingGroupObj = obj;
        // preTime 等待
        if (obj.preTime > 0) {
            this.waitingPre = true;
            this.waitingPreStart = this.excitation.payload();
        } else {
            // 立即启动所有 planStart 动画
            for (const identifier of this.executingGroupObj.planStart) {
                this.executeAnimate(identifier);
            }
        }
    }

    /**
     * 结束计划组的执行
     */
    private endPlanGroup() {
        // 清理状态
        this.executingGroup = -1;
        this.executingGroupObj = null;
        this.executing.clear();
        this.executingMap.clear();
        this.whens.clear();
        this.afters.clear();
        this.waitingPre = false;
        this.waitingPost = false;
        // 启动下一个计划组
        this.startPlanGroup();
    }

    //#endregion
}
