import { logger } from '@motajs/common';
import {
    CriticalableHeroStatus,
    IDamageCalculator,
    IDamageSystem,
    IEnemyContext,
    IEnemyCritical,
    IEnemyDamageInfo,
    IEnemyView,
    IReadonlyEnemy
} from './types';

interface ICriticalSearchResult {
    /** 此临界点的属性值 */
    readonly value: number;
    /** 此临界点的伤害信息 */
    readonly info: IEnemyDamageInfo;
}

export class DamageSystem<TAttr, THero> implements IDamageSystem<TAttr, THero> {
    /** 当前正在使用的计算器 */
    private calculator: IDamageCalculator<TAttr, THero> | null = null;
    /** 当前勇士属性 */
    private heroStatus: Readonly<THero> | null = null;
    /** 怪物伤害缓存 */
    private readonly cache: Map<IEnemyView<TAttr>, IEnemyDamageInfo> =
        new Map();

    constructor(readonly context: IEnemyContext<TAttr>) {}

    useCalculator(calculator: IDamageCalculator<TAttr, THero>): void {
        this.calculator = calculator;
        this.markAllDirty();
    }

    getCalculator(): IDamageCalculator<TAttr, THero> | null {
        return this.calculator;
    }

    bindHeroStatus(hero: Readonly<THero>): void {
        this.heroStatus = hero;
        this.markAllDirty();
    }

    /**
     * 深拷贝勇士属性
     */
    private cloneHeroStatus(): THero | null {
        if (!this.heroStatus) return null;
        else return structuredClone(this.heroStatus);
    }

    /**
     * 在修改勇士属性的情况下计算怪物伤害
     * @param enemy 怪物属性
     * @param attribute 修改的属性键名
     * @param value 修改为的属性值
     * @returns
     */
    private calculateDamageWithModified(
        enemy: IReadonlyEnemy<TAttr>,
        attribute: CriticalableHeroStatus<THero>,
        value: number
    ): IEnemyDamageInfo {
        const hero = this.cloneHeroStatus()!;
        // @ts-expect-error 之后会进行修复
        hero[attribute] = value;
        return this.calculator!.calculate(hero, enemy);
    }

    getDamageInfo(enemy: IEnemyView<TAttr>): IEnemyDamageInfo | null {
        if (!this.heroStatus) {
            logger.warn(107);
            return null;
        }
        if (!this.calculator) {
            logger.warn(106);
            return null;
        }
        const hero = this.cloneHeroStatus()!;

        const cached = this.cache.get(enemy);
        if (cached) {
            return cached;
        }

        const info = this.calculator.calculate(hero, enemy.getComputedEnemy());
        this.cache.set(enemy, info);
        return info;
    }

    markDirty(enemy: IEnemyView<TAttr>): void {
        this.cache.delete(enemy);
    }

    deleteEnemy(enemy: IEnemyView<TAttr>): void {
        this.cache.delete(enemy);
    }

    markAllDirty(): void {
        this.cache.clear();
    }

    *calculateCritical(
        view: IEnemyView<TAttr>,
        attribute: CriticalableHeroStatus<THero>,
        precision: number
    ): Generator<IEnemyCritical, void, void> {
        if (!this.heroStatus) {
            logger.warn(107);
            return;
        }
        if (!this.calculator) {
            logger.warn(106);
            return;
        }

        const currentInfo = this.getDamageInfo(view);
        if (!currentInfo) return;

        const enemy = view.getComputedEnemy();
        const hero = this.cloneHeroStatus()!;
        const currentValue = hero[attribute] as number;

        const upperLimit = Math.floor(
            this.calculator.getCriticalLimit(hero, enemy, attribute)
        );

        if (currentValue >= upperLimit) return;

        const maxIterations = Math.max(0, Math.floor(precision));
        let baseValue = currentValue;
        let baseInfo = currentInfo;

        while (baseValue < upperLimit) {
            const next = this.findNextCritical(
                enemy,
                attribute,
                baseValue,
                upperLimit,
                baseInfo.damage,
                maxIterations
            );
            if (!next) return;

            yield {
                nextValue: next.value,
                baseValue: currentValue,
                nextDiff: next.value - currentValue,
                baseInfo: currentInfo,
                info: next.info,
                damageDiff: next.info.damage - currentInfo.damage
            };

            baseValue = next.value;
            baseInfo = next.info;
        }
    }

    /**
     * 计算下一个临界点
     * @param enemy 怪物对象
     * @param attribute 勇士属性名
     * @param currentValue 当前勇士属性值
     * @param upperLimit 二分上界
     * @param referenceDamage 参考伤害值
     * @param maxIterations 最大迭代数量
     */
    private findNextCritical(
        enemy: IReadonlyEnemy<TAttr>,
        attribute: CriticalableHeroStatus<THero>,
        currentValue: number,
        upperLimit: number,
        referenceDamage: number,
        maxIterations: number
    ): ICriticalSearchResult | null {
        let left = currentValue;
        let right = upperLimit;
        let rightInfo = this.calculateDamageWithModified(
            enemy,
            attribute,
            right
        );

        if (rightInfo.damage >= referenceDamage) return null;

        let iter = 0;
        while (iter < maxIterations) {
            const middle = Math.floor((left + right) / 2);
            const middleInfo = this.calculateDamageWithModified(
                enemy,
                attribute,
                middle
            );
            if (middleInfo.damage < referenceDamage) {
                right = middle;
                rightInfo = middleInfo;
            } else {
                left = middle;
            }
            if (right - left <= 1) break;

            iter++;
        }

        return {
            value: right,
            info: rightInfo
        };
    }
}
