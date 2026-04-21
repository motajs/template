import { ITileLocator, logger } from '@motajs/common';
import {
    CriticalableHeroStatus,
    IDamageCalculator,
    IDamageContext,
    IDamageSystem,
    IEnemyContext,
    IEnemyCritical,
    IEnemyDamageInfo,
    IReadonlyEnemyHandler,
    IEnemyView,
    IReadonlyEnemy
} from './types';
import { IHeroAttribute, IReadonlyHeroAttribute } from '../hero';
import { clamp } from 'lodash-es';

interface ICriticalSearchResult {
    /** 此临界点的属性值 */
    readonly value: number;
    /** 此临界点的伤害信息 */
    readonly info: IEnemyDamageInfo;
}

export class DamageContext<TAttr, THero> implements IDamageContext<
    TAttr,
    THero
> {
    /** 当前正在使用的计算器 */
    protected calculator: IDamageCalculator<TAttr, THero> | null;
    /** 当前勇士属性 */
    protected heroStatus: IReadonlyHeroAttribute<THero> | null;

    constructor(
        readonly context: IEnemyContext<TAttr, THero>,
        calculator: IDamageCalculator<TAttr, THero> | null = null,
        heroStatus: IReadonlyHeroAttribute<THero> | null = null
    ) {
        this.calculator = calculator;
        this.heroStatus = heroStatus;
    }

    /**
     * 创建只读信息对象
     * @param enemy 怪物对象
     * @param locator 怪物位置
     * @param hero 勇士属性对象
     */
    private createReadonlyHandler(
        enemy: IReadonlyEnemy<TAttr>,
        locator: ITileLocator,
        hero: IReadonlyHeroAttribute<THero>
    ): IReadonlyEnemyHandler<TAttr, THero> {
        return { enemy, locator, hero };
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
        const hero = this.heroStatus;
        const locator = this.context.getEnemyLocatorByView(enemy);
        if (!hero || !locator) return null;

        const computed = enemy.getComputedEnemy();
        const handler = this.createReadonlyHandler(computed, locator, hero);

        return this.calculator.calculate(handler);
    }

    getDamageInfoByComputed(
        enemy: IReadonlyEnemy<TAttr>
    ): IEnemyDamageInfo | null {
        if (!this.heroStatus) {
            logger.warn(107);
            return null;
        }
        if (!this.calculator) {
            logger.warn(106);
            return null;
        }

        const hero = this.heroStatus;
        const view = this.context.getViewByComputed(enemy);
        if (!hero || !view) return null;
        const locator = this.context.getEnemyLocatorByView(view);
        if (!locator) return null;

        const handler = this.createReadonlyHandler(enemy, locator, hero);

        return this.calculator.calculate(handler);
    }

    *calculateCritical(
        view: IEnemyView<TAttr>,
        attribute: CriticalableHeroStatus<THero>,
        precision: number = 12
    ): Generator<IEnemyCritical, void, void> {
        if (!this.heroStatus) {
            logger.warn(107);
            return;
        }
        if (!this.calculator) {
            logger.warn(106);
            return;
        }

        const locator = this.context.getEnemyLocatorByView(view);
        if (!locator) return;

        const enemy = view.getComputedEnemy();
        const hero = this.heroStatus.getModifiableClone();
        const handler = this.createReadonlyHandler(enemy, locator, hero);

        const currentInfo = this.calculator.calculate(handler);
        if (!currentInfo) return;

        const currentValue = hero.getBaseAttribute(attribute) as number;
        const upperLimit = Math.floor(
            this.calculator.getCriticalLimit(handler, attribute)
        );

        if (currentValue >= upperLimit) return;

        // 超过 64 位的精度没有意义，所以最高设置为 64
        const maxIterations = clamp(Math.floor(precision), 4, 64);
        let baseValue = currentValue;
        let baseInfo = currentInfo;

        while (baseValue < upperLimit) {
            const next = this.findNextCritical(
                handler,
                hero,
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
     * @param handler 信息对象，其中的 `hero` 成员与 `hero` 参数同引用
     * @param hero 可修改勇士属性对象，与 `handler` 中的 `hero` 成员同引用
     * @param attribute 勇士属性名
     * @param currentValue 当前勇士属性值
     * @param upperLimit 二分上界
     * @param referenceDamage 参考伤害值
     * @param maxIterations 最大迭代数量
     */
    private findNextCritical(
        handler: IReadonlyEnemyHandler<TAttr, THero>,
        hero: IHeroAttribute<THero>,
        attribute: CriticalableHeroStatus<THero>,
        currentValue: number,
        upperLimit: number,
        referenceDamage: number,
        maxIterations: number
    ): ICriticalSearchResult | null {
        let left = currentValue;
        let right = upperLimit;

        hero.setBaseAttribute(attribute, right as THero[typeof attribute]);

        let targetInfo = this.calculator!.calculate(handler);
        if (targetInfo.damage >= referenceDamage) return null;

        let iter = 0;
        while (iter++ < maxIterations) {
            const middle = Math.floor((left + right) / 2);
            hero.setBaseAttribute(attribute, middle as THero[typeof attribute]);
            const middleInfo = this.calculator!.calculate(handler);

            if (middleInfo.damage < referenceDamage) {
                right = middle;
            } else {
                left = middle;
                targetInfo = middleInfo;
            }
            if (right - left <= 1) break;
        }

        return {
            value: right,
            info: targetInfo
        };
    }
}

export class DamageSystem<TAttr, THero>
    extends DamageContext<TAttr, THero>
    implements IDamageSystem<TAttr, THero>
{
    /** 怪物伤害缓存 */
    private readonly cache: Map<IEnemyView<TAttr>, IEnemyDamageInfo> =
        new Map();

    constructor(context: IEnemyContext<TAttr, THero>) {
        super(context);
    }

    useCalculator(calculator: IDamageCalculator<TAttr, THero>): void {
        this.calculator = calculator;
        this.markAllDirty();
    }

    getCalculator(): IDamageCalculator<TAttr, THero> | null {
        return this.calculator;
    }

    bindHeroStatus(hero: IReadonlyHeroAttribute<THero> | null): void {
        this.heroStatus = hero;
        this.markAllDirty();
    }

    getDamageInfo(enemy: IEnemyView<TAttr>): IEnemyDamageInfo | null {
        const cached = this.cache.get(enemy);
        if (cached) {
            return cached;
        }

        const info = super.getDamageInfo(enemy);
        if (!info) return info;
        this.cache.set(enemy, info);

        return info;
    }

    getDamageInfoByComputed(
        enemy: IReadonlyEnemy<TAttr>
    ): IEnemyDamageInfo | null {
        const view = this.context.getViewByComputed(enemy);
        if (view) {
            const cached = this.cache.get(view);
            if (cached) {
                return cached;
            }
        }

        const info = super.getDamageInfoByComputed(enemy);
        if (!view || !info) return info;

        this.cache.set(view, info);

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

    with(hero: IHeroAttribute<THero>): IDamageContext<TAttr, THero> {
        return new DamageContext(this.context, this.calculator, hero);
    }
}
