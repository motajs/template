import { IEnemy, IReadonlyEnemy } from '@user/data-base';
import { IEnemyView, IEnemyContext } from './types';

export class EnemyView<TAttr> implements IEnemyView<TAttr> {
    /** 计算后怪物 */
    private readonly computedEnemy: IEnemy<TAttr>;

    constructor(
        readonly baseEnemy: IEnemy<TAttr>,
        readonly context: IEnemyContext<TAttr, unknown>
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
