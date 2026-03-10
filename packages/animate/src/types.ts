/**
 * 动画速率曲线，输入时间完成度，输出一个值，时间完成度范围在 `0-1` 之间，而输出值没有范围限制。
 * 在不同场景下，速率曲线返回值的含义可能不同，有的可能表示动画完成度，有的可能表示绝对的坐标值。
 */
export type ExcitationCurve = (progress: number) => number;

/**
 * 二维动画速率曲线，输入时间完成度，输出两个值。可由两个一维曲线组合而成（本质是参数方程）
 */
export type ExcitationCurve2D = (progress: number) => [number, number];

/**
 * 三维动画速率曲线，输入时间完成度，输出三个值。可由三个一维曲线组合而成（本质是参数方程）
 */
export type ExcitationCurve3D = (progress: number) => [number, number, number];

/**
 * `n` 维动画速率曲线，输入时间完成度，输出 `n` 个值。可由 `n` 个一维曲线组合而成（本质是参数方程）
 */
export type GeneralExcitationCurve = (progress: number) => number[];

export interface IExcitable<T> {
    /**
     * 受到激励源激励
     * @param payload 由激励源传递而来的负载
     */
    excited(payload: T): void;
}

export interface IExcitableController<T> {
    /** 受激励对象 */
    readonly excitable: IExcitable<T>;

    /**
     * 释放此受激励对象，不再受到当前激励源激励，可以换用其他激励源
     */
    revoke(): void;

    /**
     * 手动激励此受激励对象一次
     * @param payload 激励负载
     */
    excite(payload: T): void;
}

export interface IExcitation<T> {
    /**
     * 获取当前的激励负载
     */
    payload(): T;

    /**
     * 激励所有由此激励源激励的内容
     * @param payload 传递给激励内容的负载
     */
    excite(payload: T): void;

    /**
     * 添加受激励对象
     * @param object 受激励对象
     * @returns 受激励对象控制器
     */
    add(object: IExcitable<T>): IExcitableController<T> | null;

    /**
     * 移除一个受激励对象
     * @param object 受激励对象
     * @returns 是否成功移除，内容不存在或是其他特殊情况会返回 `false`
     */
    remove(object: IExcitable<T>): boolean;

    /**
     * 摧毁这个激励源
     */
    destroy(): void;
}

export const enum VariatorCurveMode {
    /**
     * 时间相对于激励源，不受变速器当前速度影响
     */
    SourceRelated,

    /**
     * 时间相对于变速器本身，当变速器本身的速度变慢时，速率曲线的运行速度也变慢
     */
    SelfRelated
}

export interface IExcitationVariator extends IExcitation<number> {
    /** 变速器当前的速度值 */
    readonly speed: number;
    /** 当前绑定的激励源 */
    readonly source: IExcitation<number> | null;

    /**
     * 绑定激励源对象，变速器将以此激励源为基础实施变速
     * @param excitation 绑定的激励源
     */
    bindExcitation(excitation: IExcitation<number>): void;

    /**
     * 取消绑定当前的激励源
     */
    unbindExcitation(): void;

    /**
     * 修改激励速度
     * @param speed 激励速度，值表示当前速度与原速度的比值，1 为原速
     */
    setSpeed(speed: number): void;

    /**
     * 使用速率曲线来修改激励速度，当有速率曲线在执行时，调用此函数将会加入队列，当上一个曲线结束后立刻执行
     * @param curve 速率曲线
     * @param time 速率曲线实施时间
     * @param mode 速率曲线实施模式
     */
    curveSpeed(
        curve: ExcitationCurve,
        time: number,
        mode?: VariatorCurveMode
    ): Promise<void>;

    /**
     * 终止当前所有速率曲线的执行，最终速度为队列中最后一个曲线的终止速度
     */
    endAllCurves(): void;
}

export interface IAnimatable {
    /** 动画数值 */
    value: number;
}

export interface IAnimatePlanIdentifier {
    /** 动画对象 */
    readonly content: IAnimatable;
    /** 动画对象对应的动画计划 */
    readonly index: number;
}

export interface IAnimationPlan {
    /** 动画计划的标识符 */
    readonly identifier: IAnimatePlanIdentifier;
    /** 动画的速率曲线 */
    readonly curve: ExcitationCurve;
    /** 动画的目标值 */
    readonly targetValue: number;
    /** 动画时长 */
    readonly time: number;
    /** 动画结束后兑现的 `Promise` */
    readonly promise: Promise<void>;
}

export const enum EndRelation {
    /**
     * 以传入的动画目标值为动画终值。
     */
    Target,

    /**
     * 设动画初值为 `a`, 传入的终值为 `b`, 曲线为 `f(x)`，则动画终值为 `(b - a) * f(1) + a`。
     * 此时如果不希望动画结束时变为传入终值（比如内容原地震动），就可以使用此模式。
     */
    Curve,

    /**
     * 以动画结束时刻的值作为动画终值。如果动画正常结束，此值效果与 `Curve` 模式相同，
     * 如果动画提前结束，那么将会使用提前结束时的值作为终值。
     */
    Self
}

export interface IAnimater extends IExcitable<number> {
    /**
     * 在动画执行器上绑定激励源
     * @param excitation 绑定的激励源
     */
    bindExcitation(excitation: IExcitation<number>): void;

    /**
     * 取消绑定激励源
     */
    unbindExcitation(): void;

    /**
     * 绑定动画对象，之后的接口调用都将施加在此对象上
     * @param content 动画对象
     */
    animate(content: IAnimatable): this;

    /**
     * 设置当前的速率曲线
     * @param curve 速率曲线
     */
    curve(curve: ExcitationCurve): this;

    /**
     * 将动画对象的值按照当前设置改变至目标值，为一次动画操作，计入动画索引（参考 {@link query} 的描述）。
     * 如果动画开始时当前动画对象有动画正在执行，那么会立刻结束正在执行的动画，开始执行当前动画。
     * @param value 目标值
     * @param time 动画时长
     * @param end 动画结束参考方式，决定着动画结束时的值应该是多少，具体参考 {@link EndRelation}
     */
    to(value: number, time: number, end?: EndRelation): this;

    /**
     * 在刚刚定义的动画结束后指定时长再开始后续计划。
     *
     * ```ts
     * const obj1 = { value: 0 };
     * const obj2 = { value: 0 };
     * animater.animate(obj1)
     *   .curve(linear())
     *   .to(100, 500)
     *   .animate(obj2)
     *   .after()
     *   .to(200, 200)
     *   .planEnd();
     * ```
     *
     * @param time 等待时长，默认为 0
     */
    after(time?: number): this;

    /**
     * 在指定动画结束后指定时长再开始后续计划。计划索引参考 {@link query} 的定义。
     *
     * ```ts
     * const obj1 = { value: 0 };
     * const obj2 = { value: 0 };
     * animater.animate(obj1)
     *   .curve(linear())
     *   .to(100, 500)
     *   .animate(obj2)
     *   .to(200, 200)
     *   .afterPlan(obj1, 1)
     *   ...
     *   .planEnd();
     * ```
     *
     * @param content 动画对象
     * @param index 动画对象对应的计划索引
     * @param time 等待时长，默认为 0
     */
    afterPlan(content: IAnimatable, index: number, time?: number): this;

    /**
     * 等待刚刚定义的动画开始指定时长后再开始后续计划，与 {@link after} 类似，但是是以刚刚定义的动画开始执行为基准
     * @param time 等待时长
     */
    when(time?: number): this;

    /**
     * 等待指定动画计划开始指定时长后再开始后续计划，与 {@link afterPlan} 类似，但是是以指定动画开始执行为基准
     * @param content 动画对象
     * @param index 动画对象对应的计划索引
     * @param time 等待时长，默认为 0
     */
    whenPlan(content: IAnimatable, index: number, time?: number): this;

    /**
     * 查询动画计划。
     *
     * 动画计划采用计划组的方式查询，每个计划组之间的动画计划互不干扰。`plan` 描述需要查询的计划组，
     * `index` 表示在这个计划组内的动画计划索引，`content` 表示要查询哪个动画对象的动画计划。
     * 动画计划索引描述的是该动画对象在本计划组中的第几次动画计划，从 1 开始计算。举例来说：
     *
     * ```ts
     * const obj = { value: 0 };
     * animater.animate()
     *   .curve(linear())
     *   .to(100, 1000) // 索引为 1
     *   .after()
     *   .curve(sin(CurveMode.EaseOut))
     *   .to(200, 500) // 索引为 2
     *   .animate(obj2)
     *   ...
     *   .animate(obj)
     *   .to(100, 500) // 索引为 3
     *   .planEnd();
     * ```
     *
     * @param content 动画对象
     * @param index 动画计划索引
     * @param plan 计划组索引，不填时表示当前正在计划中的计划组，即从上一次调用 `planEnd` 至现在的这个区间，
     *             如果期间没有没有任何动画计划，那么会返回 `null`，并不会自动回退到上一次定义的的计划组。
     */
    query(
        content: IAnimatable,
        index: number,
        plan?: number
    ): IAnimationPlan | null;

    /**
     * 等待指定动画计划执行完毕，参考 {@link query} 的描述。
     * 如果对象没有正在执行动画或在指定计划中不存在，那么返回的 `Promise` 会立刻兑现。
     * @param content 动画对象
     * @param index 动画计划索引
     * @param plan 计划组索引，不填时表示当前正在执行动画的计划组。
     */
    wait(content: IAnimatable, index: number, plan?: number): Promise<void>;

    /**
     * 结束当前动画计划的定义，形成动画计划组。该函数必须在动画计划定义完毕后立刻执行来进行必要的处理工作。
     * 后面的计划组会等待前面的计划组的动画全部执行完毕后再开始执行。
     * 参考 {@link query} 中对计划组的描述。
     * @param preTime 计划执行前的等待时长，等待这么长时间之后开始执行首个动画
     * @param postTime 计划执行后的等待时长，等待这么长时间之后计划才真正结束
     */
    planEnd(preTime?: number, postTime?: number): number;
}

export interface ITransition extends IExcitable<number> {
    /**
     * 在动画执行器上绑定激励源
     * @param excitation 绑定的激励源
     */
    bindExcitation(excitation: IExcitation<number>): void;

    /**
     * 取消绑定激励源
     */
    unbindExcitation(): void;

    /**
     * 设置当前的速率曲线
     * @param curve 速率曲线
     */
    curve(curve: ExcitationCurve): this;

    /**
     * 绑定渐变对象，之后的渐变操作都会作用在此对象上
     * @param animatable 渐变对象
     */
    transite(animatable: IAnimatable): this;

    /**
     * 将当前绑定的值立刻缓慢渐变至目标值
     * @param value 目标值
     * @param time 渐变时长
     * @param end 结尾参考方式
     */
    to(value: number, time: number, end?: EndRelation): this;

    /**
     * 等待指定动画对象的渐变执行完成，如果对象没有正在执行渐变，那么返回的 `Promise` 会立刻兑现。
     * @param animatable 要等待的动画对象
     */
    wait(animatable: IAnimatable): Promise<void>;

    /**
     * 释放当前绑定的渐变对象，防止绑定的渐变对象一直不会被垃圾回收
     */
    revoke(): void;
}
