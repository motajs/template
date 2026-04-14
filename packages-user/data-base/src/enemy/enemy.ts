import { logger } from '@motajs/common';
import {
    IEnemy,
    IEnemyAttributes,
    IEnemyContext,
    IReadonlyEnemy,
    ISpecial,
    IEnemyView
} from './types';

export class Enemy implements IEnemy {
    readonly specials: Set<ISpecial<any>> = new Set();
    /** code -> ISpecial 映射，用于快速查找 */
    private readonly specialMap: Map<number, ISpecial<any>> = new Map();

    constructor(
        readonly id: string,
        readonly code: number,
        readonly attributes: IEnemyAttributes
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

    setAttribute<K extends keyof IEnemyAttributes>(
        key: K,
        value: IEnemyAttributes[K]
    ): void {
        this.attributes[key] = value;
    }

    getAttribute<K extends keyof IEnemyAttributes>(
        key: K
    ): IEnemyAttributes[K] {
        return this.attributes[key];
    }

    clone(): IEnemy {
        const cloned = new Enemy(
            this.id,
            this.code,
            structuredClone(this.attributes)
        );
        for (const special of this.specials) {
            cloned.addSpecial(special.clone());
        }
        return cloned;
    }

    copy(enemy: IReadonlyEnemy): void {
        ATTRIBUTE_KEYS.forEach(key => {
            this.setAttribute(key, structuredClone(enemy.getAttribute(key)));
        });
        this.specials.clear();
        this.specialMap.clear();
        for (const special of enemy.iterateSpecials()) {
            this.addSpecial(special.clone());
        }
    }
}

export class EnemyView implements IEnemyView {
    private computedEnemy: IEnemy;

    constructor(
        readonly baseEnemy: IEnemy,
        readonly context: IEnemyContext
    ) {
        this.computedEnemy = baseEnemy.clone();
    }

    reset(): void {
        this.computedEnemy.copy(this.baseEnemy);
    }

    getBaseEnemy(): IReadonlyEnemy {
        return this.baseEnemy;
    }

    getComputedEnemy(): IReadonlyEnemy {
        this.context.requestRefresh(this);
        return this.computedEnemy;
    }

    /**
     * 获取计算中怪物对象，这个接口不对外暴露，仅在系统内部的 EnemyContext 中使用。
     */
    getComputingEnemy(): IEnemy {
        return this.computedEnemy;
    }

    getModifiableEnemy(): IEnemy {
        return this.baseEnemy;
    }

    markDirty(): void {
        this.context.markDirty(this);
    }
}

export const ATTRIBUTE_KEYS: (keyof IEnemyAttributes)[] = [
    'hp',
    'atk',
    'def',
    'money',
    'exp',
    'point'
];
