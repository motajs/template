import { IHeroFollower, IHeroState } from './hero';
import { IEnemyManager } from './enemy';
import { IFlagSystem } from './flag';
import { IRoleFaceBinder, ISaveableContent } from './common';
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

    /** 地图状态 */
    readonly layer: ILayerState;
    /** 勇士状态 */
    readonly hero: IHeroState<THero>;

    /** 怪物管理器 */
    readonly enemyManager: IEnemyManager<TEnemy>;

    /** Flag 系统 */
    readonly flags: IFlagSystem;

    /**
     * 添加可存档对象，添加后系统将会自动在存档时将对象存储
     * @param id 可存档对象的 id
     * @param content 可存档对象
     */
    addSaveableContent(id: string, content: ISaveableContent<unknown>): void;

    /**
     * 根据 id 获取对应的可存档对象
     * @param id 可存档对象的 id
     */
    getSaveableContent<T>(id: string): ISaveableContent<T> | null;
}
