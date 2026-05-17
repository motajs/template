import { IHeroFollower, IHeroState } from './hero';
import { IEnemyManager } from './enemy';
import { IFlagSystem } from './flag';
import { IMapStore } from './map';
import {
    IDataCommon,
    IEnemyAttr,
    IHeroAttr,
    ISaveableContent
} from '@user/data-common';

export interface IStateSaveData {
    /** 跟随者列表 */
    readonly followers: readonly IHeroFollower[];
}

export interface IStateBase extends IDataCommon {
    /** 地图状态 */
    readonly maps: IMapStore;
    /** 勇士状态 */
    readonly hero: IHeroState<IHeroAttr>;

    /** 怪物管理器 */
    readonly enemyManager: IEnemyManager<IEnemyAttr>;

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

export interface IStateBaseExtended {
    /** 当前对象对应的数据层对象（Layer 1 对象） */
    readonly state: IStateBase;
}
