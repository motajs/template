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
 * `n` 维动画速率曲线，输入时间完成度，输出三个值。可由 `n` 个一维曲线组合而成（本质是参数方程）
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
