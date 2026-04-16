import { ILayerState } from './map';
import { IRoleFaceBinder } from './common';
import {
    IEnemyContext,
    IEnemyManager,
    IHeroFollower,
    IHeroState
} from '@user/data-base';
import { IEnemyAttributes } from './enemy/types';

export interface IGameDataState {
    /** 怪物管理器 */
    readonly enemyManager: IEnemyManager<IEnemyAttributes>;
}

export interface IStateSaveData {
    /** 跟随者列表 */
    readonly followers: readonly IHeroFollower[];
}

export interface ICoreState {
    /** 地图状态 */
    readonly layer: ILayerState;
    /** 勇士状态 */
    readonly hero: IHeroState;
    /** 朝向绑定 */
    readonly roleFace: IRoleFaceBinder;
    /** id 到图块数字的映射 */
    readonly idNumberMap: Map<string, number>;
    /** 图块数字到 id 的映射 */
    readonly numberIdMap: Map<number, string>;

    /** 怪物管理器 */
    readonly enemyManager: IEnemyManager<IEnemyAttributes>;
    /** 怪物上下文 */
    readonly enemyContext: IEnemyContext<IEnemyAttributes>;

    /**
     * 保存状态
     */
    saveState(): IStateSaveData;

    /**
     * 加载状态
     * @param data 状态对象
     */
    loadState(data: IStateSaveData): void;
}
