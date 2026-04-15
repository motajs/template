import { logger } from '@motajs/common';
import {
    IEnemy,
    IEnemyContext,
    IReadonlyEnemy,
    ISpecial,
    IEnemyView
} from './types';

export class Enemy<TAttr> implements IEnemy<TAttr> {
    readonly specials: Set<ISpecial<any>> = new Set();
    /** code -> ISpecial 映射，用于快速查找 */
    private readonly specialMap: Map<number, ISpecial<any>> = new Map();

    constructor(
        readonly id: string,
        readonly code: number,
        private attributes: TAttr
    ) {}

    getSpecial<T>(code: number): ISpecial<T> | null {
        return (this.specialMap.get(code) as ISpecial<T>) ?? null;
    }

    hasSpecial(code: number): boolean {
        return this.specialMap.has(code);
    }

    addSpecial(special: ISpecial<any>): void {
        if (this.specialMap.has(special.code)) {
            logger.warn(96, this.id, special.code.toString());
            return;
        }
        this.specials.add(special);
        this.specialMap.set(special.code, special);
    }

    deleteSpecial(special: number | ISpecial<any>): void {
        const code = typeof special === 'number' ? special : special.code;
        const existing = this.specialMap.get(code);
        if (!existing) return;
        this.specials.delete(existing);
        this.specialMap.delete(code);
    }

    iterateSpecials(): Iterable<ISpecial<any>> {
        return this.specials;
    }

    setAttribute<K extends keyof TAttr>(key: K, value: TAttr[K]): void {
        this.attributes[key] = value;
    }

    addAttribute<K extends SelectKey<TAttr, number>>(
        key: K,
        value: number
    ): void {
        (this.attributes[key] as number) += value;
    }

    getAttribute<K extends keyof TAttr>(key: K): TAttr[K] {
        return this.attributes[key];
    }

    cloneAttributes(): TAttr {
        return structuredClone(this.attributes);
    }

    clone(): IEnemy<TAttr> {
        const cloned = new Enemy<TAttr>(
            this.id,
            this.code,
            structuredClone(this.attributes)
        );
        for (const special of this.specials) {
            cloned.addSpecial(special.clone());
        }
        return cloned;
    }

    copyFrom(enemy: IReadonlyEnemy<TAttr>): void {
        this.attributes = enemy.cloneAttributes();
        this.specials.clear();
        this.specialMap.clear();
        for (const special of enemy.iterateSpecials()) {
            this.addSpecial(special.clone());
        }
    }
}

export class EnemyView<TAttr> implements IEnemyView<TAttr> {
    private computedEnemy: IEnemy<TAttr>;

    constructor(
        readonly baseEnemy: IEnemy<TAttr>,
        readonly context: IEnemyContext<TAttr>
    ) {
        this.computedEnemy = baseEnemy.clone();
    }

    reset(): void {
        this.computedEnemy.copyFrom(this.baseEnemy);
    }

    getBaseEnemy(): IReadonlyEnemy<TAttr> {
        return this.baseEnemy;
    }

    getComputedEnemy(): IReadonlyEnemy<TAttr> {
        this.context.requestRefresh(this);
        return this.computedEnemy;
    }

    /**
     * 获取计算中怪物对象，这个接口不对外暴露，仅在系统内部的 EnemyContext 中使用。
     */
    getComputingEnemy(): IEnemy<TAttr> {
        return this.computedEnemy;
    }

    getModifiableEnemy(): IEnemy<TAttr> {
        return this.baseEnemy;
    }

    markDirty(): void {
        this.context.markDirty(this);
    }
}
