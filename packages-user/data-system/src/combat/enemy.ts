import { IEnemy, IReadonlyEnemy } from '@user/data-base';
import { IEnemyContext, IComputingEnemyView } from './types';

export class EnemyView<TAttr> implements IComputingEnemyView<TAttr> {
    /** 计算后怪物 */
    private readonly computedEnemy: IEnemy<TAttr>;

    constructor(
        readonly baseEnemy: IEnemy<TAttr>,
        readonly context: IEnemyContext<TAttr, any>
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
