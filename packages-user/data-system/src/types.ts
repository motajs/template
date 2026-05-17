import { IStateBase } from '@user/data-base';
import { IEnemyContext } from './combat';
import { ITriggerCollector, ITriggerRegistry } from './trigger';
import { IEnemyAttr, IHeroAttr } from '@user/data-common';

export interface IStateSystem extends IStateBase {
    /** 怪物上下文 */
    readonly enemyContext: IEnemyContext<IEnemyAttr, IHeroAttr>;
    /** 触发器注册 */
    readonly triggerRegistry: ITriggerRegistry;
    /** 触发器收集器 */
    readonly triggerCollector: ITriggerCollector;
}

export interface IStateSystemExtended {
    /** 当前对象对应的执行层对象（Layer 2 对象） */
    readonly state: IStateSystem;
}
