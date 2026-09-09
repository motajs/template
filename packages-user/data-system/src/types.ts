import { IStateBase } from '@user/data-base';
import { IEnemyContext } from './combat';
import { IEnemyAttr, IHeroAttr } from '@user/data-common';
import { IGameEventSystem } from './event';

export interface IStateSystem extends IStateBase {
    /** 怪物上下文 */
    readonly enemyContext: IEnemyContext<IEnemyAttr, IHeroAttr>;
    /** 游戏事件系统 */
    readonly eventSystem: IGameEventSystem;
}

export interface IStateSystemExtended {
    /** 当前对象对应的执行层对象（Layer 2 对象） */
    readonly state: IStateSystem;
}
