import { IStateBase } from '@user/data-base';
import { IEnemyContext } from './combat';

export interface IStateSystem<TEnemy, THero> extends IStateBase<TEnemy, THero> {
    /** 怪物上下文 */
    readonly enemyContext: IEnemyContext<TEnemy, THero>;
}

export interface IStateSystemExtended<TEnemy = unknown, THero = unknown> {
    /** 当前对象对应的执行层对象（Layer 2 对象） */
    readonly state: IStateSystem<TEnemy, THero>;
}
