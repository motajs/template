import { IHeroFollower, IStateBase } from '@user/data-base';
import { IEnemyAttr } from './enemy/types';
import { IHeroAttr } from './hero';

export interface IStateSaveData {
    /** 跟随者列表 */
    readonly followers: readonly IHeroFollower[];
}

export interface ICoreState extends IStateBase<IEnemyAttr, IHeroAttr> {}
