import { IStateBase } from '@user/data-base';
import { IEnemyContext } from './combat';
import { ITriggerCollector, ITriggerRegistry } from './trigger';

export interface IStateSystem<TEnemy, THero> extends IStateBase<TEnemy, THero> {
    /** 怪物上下文 */
    readonly enemyContext: IEnemyContext<TEnemy, THero>;
    /** 触发器注册 */
    readonly triggerRegistry: ITriggerRegistry;
    /** 触发器收集器 */
    readonly triggerCollector: ITriggerCollector;
}

export interface IStateSystemExtended<TEnemy = unknown, THero = unknown> {
    /** 当前对象对应的执行层对象（Layer 2 对象） */
    readonly state: IStateSystem<TEnemy, THero>;
}
