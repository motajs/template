import { IMotaDataLoader } from './load';
import { ILoadProgressTotal } from '@motajs/loader';
import { IHeroFollower, IHeroState } from './hero';
import { IEnemyContext, IEnemyManager } from './enemy';
import { IFlagSystem } from './flag';
import { IRoleFaceBinder } from './common';
import { ILayerState } from './map';

export interface IStateSaveData {
    /** 跟随者列表 */
    readonly followers: readonly IHeroFollower[];
}

export interface IStateBase<TEnemy, THero> {
    /** 朝向绑定 */
    readonly roleFace: IRoleFaceBinder;
    /** id 到图块数字的映射 */
    readonly idNumberMap: Map<string, number>;
    /** 图块数字到 id 的映射 */
    readonly numberIdMap: Map<number, string>;

    /** 加载进度对象 */
    readonly loadProgress: ILoadProgressTotal;
    /** 数据端加载对象 */
    readonly dataLoader: IMotaDataLoader;

    /** 地图状态 */
    readonly layer: ILayerState;
    /** 勇士状态 */
    readonly hero: IHeroState<THero>;

    /** 怪物管理器 */
    readonly enemyManager: IEnemyManager<TEnemy>;
    /** 怪物上下文 */
    readonly enemyContext: IEnemyContext<TEnemy, THero>;

    /** Flag 系统 */
    readonly flags: IFlagSystem;

    /**
     * 保存当前状态
     */
    saveState(): IStateSaveData;

    /**
     * 加载状态
     * @param state 状态对象
     */
    loadState(state: IStateSaveData): void;
}
