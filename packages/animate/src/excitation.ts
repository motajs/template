import { logger } from '@motajs/common';
import {
    IExcitation,
    IExcitable,
    IExcitableController,
    IExcitationVariator,
    ExcitationCurve,
    VariatorCurveMode
} from './types';
import { excited } from './utils';

/**
 * IExcitation 抽象基类，管理受激励对象的注册、激励与移除。
 * 便于拓展不同类型的激励源。
 */
export abstract class ExcitationBase<T> implements IExcitation<T> {
    protected readonly excitables: Set<IExcitable<T>> = new Set();
    protected destroyed: boolean = false;

    /**
     * 当前激励负载，由子类实现
     */
    abstract payload(): T;

    /**
     * 激励所有受激励对象
     */
    excite(payload: T): void {
        this.excitables.forEach(ex => ex.excited(payload));
    }

    /**
     * 添加受激励对象
     */
    add(object: IExcitable<T>): IExcitableController<T> | null {
        if (this.destroyed) {
            logger.error(48, 'add');
            return null;
        }
        this.excitables.add(object);
        const controller: IExcitableController<T> = {
            excitable: object,
            revoke: () => this.remove(object),
            excite: (payload: T) => object.excited(payload)
        };
        return controller;
    }

    /**
     * 移除受激励对象
     */
    remove(object: IExcitable<T>): boolean {
        if (this.destroyed) {
            logger.error(48, 'remove');
            return false;
        }
        return this.excitables.delete(object);
    }

    /**
     * 摧毁激励源，清理所有引用
     */
    destroy(): void {
        this.destroyed = true;
        this.excitables.clear();
    }
}

/**
 * 基于 requestAnimationFrame 的激励源
 * 每帧激励所有对象，payload 为当前时间戳
 */
export class RafExcitation extends ExcitationBase<number> {
    private rafId: number = -1;
    private now: number = 0;

    constructor() {
        super();
        this.tick = this.tick.bind(this);
        this.rafId = requestAnimationFrame(this.tick);
    }

    payload(): number {
        return this.now;
    }

    /**
     * 每帧对所有激励源激励一次
     * @param ts 当前时间戳
     */
    private tick(ts: number) {
        this.now = ts;
        this.excite(ts);
        if (!this.destroyed) {
            this.rafId = requestAnimationFrame(this.tick);
        } else {
            this.rafId = -1;
        }
    }

    override destroy(): void {
        if (this.rafId !== -1) {
            cancelAnimationFrame(this.rafId);
            this.rafId = -1;
        }
        super.destroy();
    }
}

interface CurveQueue {
    /** 速率曲线 */
    curve: ExcitationCurve;
    /** 变速持续时间 */
    time: number;
    /** 变速参考模式 */
    mode: VariatorCurveMode;
    /** 兑现 Promise */
    resolve: () => void;
}

interface CurrentCurve {
    /** 当前速率曲线 */
    curve: ExcitationCurve;
    /** 变速时长 */
    time: number;
    /** 变速参考模式 */
    mode: VariatorCurveMode;
    /** 起始时间戳 */
    startTs: number;
    /** 兑现 Promise */
    resolve: () => void;
}

/**
 * 激励源变速器
 * 可对 payload 为 number 的激励源进行变速处理
 */
export class ExcitationVariator
    extends ExcitationBase<number>
    implements IExcitationVariator
{
    /** 当前绑定的激励源 */
    source: IExcitation<number> | null = null;
    /** 当前速度 */
    speed: number = 1;

    /** 在源中添加的被激励对象的控制器 */
    private sourceController: IExcitableController<number> | null = null;

    /** 上一次变速时源的参考时间戳 */
    private sourceTs: number = 0;
    /** 上一次变速时自身的参考时间戳 */
    private selfTs: number = 0;
    /** 当前自身时间戳 */
    private now: number = 0;

    /** 曲线队列 */
    private curveQueue: CurveQueue[] = [];
    /** 当前执行的曲线 */
    private currentCurve: CurrentCurve | null = null;

    payload(): number {
        return this.now;
    }

    /**
     * 处理源的激励，更新自身时间戳并处理曲线逻辑
     */
    excite(payload: number): void {
        if (!this.source) return;

        // 计算新的自身时间戳
        const newSelfTs = this.selfTs + (payload - this.sourceTs) * this.speed;
        this.now = newSelfTs;

        // 处理曲线执行
        if (this.currentCurve) {
            // 根据模式计算完成度所用的时间戳
            const referenceTs =
                this.currentCurve.mode === VariatorCurveMode.SourceRelated
                    ? payload
                    : newSelfTs;
            const elapsed = referenceTs - this.currentCurve.startTs;

            if (elapsed >= this.currentCurve.time) {
                // 曲线完成，使用 curve(1) 作为最终速率值
                this.setSpeed(this.currentCurve.curve(1));
                this.currentCurve.resolve();

                this.currentCurve = null;

                // 执行下一个曲线
                if (this.curveQueue.length > 0) {
                    this.startNextCurve();
                }
            } else {
                // 曲线进行中，更新速度
                const progress = elapsed / this.currentCurve.time;
                this.setSpeed(this.currentCurve.curve(progress));
            }
        }

        // 激励所有受激励对象
        this.excitables.forEach(ex => ex.excited(newSelfTs));
    }

    bindExcitation(excitation: IExcitation<number>): void {
        // 如果已绑定不同的源，先解绑
        if (this.source !== null && this.source !== excitation) {
            this.unbindExcitation();
        }

        if (this.source === excitation) {
            return;
        }

        this.source = excitation;
        this.sourceTs = excitation.payload();
        this.selfTs = this.sourceTs;
        this.speed = 1;

        // 创建内部激励对象，将源的激励转发给自身
        const internalExcitable: IExcitable<number> = excited(payload => {
            this.excite(payload);
        });

        this.sourceController = excitation.add(internalExcitable);
    }

    unbindExcitation(): void {
        if (this.source === null) {
            return;
        }

        // 取消在源上的绑定
        if (this.sourceController !== null) {
            this.sourceController.revoke();
            this.sourceController = null;
        }

        // 取消曲线执行
        this.endAllCurves();

        // 重置状态
        this.source = null;
        this.speed = 1;
        this.sourceTs = 0;
        this.selfTs = 0;
        this.now = 0;
    }

    setSpeed(speed: number): void {
        if (this.source === null) {
            logger.error(49, 'set speed');
            return;
        }

        // 更新参考时间戳
        this.sourceTs = this.source.payload();
        this.selfTs = this.now;
        this.speed = speed;
    }

    curveSpeed(
        curve: ExcitationCurve,
        time: number,
        mode: VariatorCurveMode = VariatorCurveMode.SourceRelated
    ): Promise<void> {
        if (this.source === null) {
            logger.error(49, 'curve speed');
            return Promise.resolve();
        }

        return new Promise<void>(resolve => {
            this.curveQueue.push({ curve, time, mode, resolve });

            // 如果没有正在执行的曲线，立即开始
            if (this.currentCurve === null) {
                this.startNextCurve();
            }
        });
    }

    private startNextCurve(): void {
        if (this.curveQueue.length === 0) {
            return;
        }

        const item = this.curveQueue.shift()!;

        // 记录起始时间戳
        const startTs =
            item.mode === VariatorCurveMode.SourceRelated
                ? this.source!.payload()
                : this.now;

        this.currentCurve = {
            ...item,
            startTs
        };
    }

    endAllCurves(): void {
        if (!this.currentCurve) return;

        if (this.curveQueue.length > 0) {
            const last = this.curveQueue.at(-1)!;
            const speed = last.curve(1);
            this.setSpeed(speed);
            this.curveQueue = [];
            this.currentCurve = null;
        } else {
            const speed = this.currentCurve.curve(1);
            this.setSpeed(speed);
            this.currentCurve = null;
        }
    }

    override destroy(): void {
        this.unbindExcitation();
        super.destroy();
    }
}
