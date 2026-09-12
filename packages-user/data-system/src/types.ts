import { IStateBase } from '@user/data-base';
import { IEnemyContext } from './combat';
import { IEnemyAttr, IHeroAttr, IReplaySystem } from '@user/data-common';
import { IGameEventSystem } from './event';
import { IPathfindingSystem } from './path';

export interface IStateSystem extends IStateBase {
    /** 怪物上下文 */
    readonly enemyContext: IEnemyContext<IEnemyAttr, IHeroAttr>;
    /** 游戏事件系统 */
    readonly eventSystem: IGameEventSystem;
    /** 已绑定勇士移动器的寻路系统 */
    readonly pathfinding: IPathfindingSystem;
    /** 当前 CoreState 独立拥有的录像系统 */
    readonly replaySystem: IReplaySystem;
}

export interface IStateSystemExtended {
    /** 当前对象对应的执行层对象（Layer 2 对象） */
    readonly state: IStateSystem;
}
