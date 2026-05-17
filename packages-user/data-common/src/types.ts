import { ITileLocator } from '@motajs/common';
import { IFaceManager, IRoleFaceBinder } from './common';
import { ITileStore } from './store';

export interface IEnemyAttr {
    /** 怪物生命值 */
    hp: number;
    /** 怪物攻击力 */
    atk: number;
    /** 怪物防御力 */
    def: number;
    /** 怪物金币 */
    money: number;
    /** 怪物经验值 */
    exp: number;
    /** 怪物加点量 */
    point: number;
    /** 支援来源怪物坐标索引列表 */
    guard: Set<ITileLocator>;
}

export interface IHeroAttr {
    /** 勇士名称 */
    name: string;
    /** 勇士生命值 */
    hp: number;
    /** 勇士生命值上限 */
    hpmax: number;
    /** 勇士攻击力 */
    atk: number;
    /** 勇士防御力 */
    def: number;
    /** 勇士护盾 */
    mdef: number;
    /** 勇士魔法值 */
    mana: number;
    /** 勇士魔法上限 */
    manamax: number;
    /** 勇士拥有的金币 */
    money: number;
    /** 勇士拥有的经验 */
    exp: number;
}

export interface IDataCommon {
    /** 图块定义存储 */
    readonly tileStore: ITileStore<MapDataOf<keyof NumberToId>>;
    /** 朝向绑定 */
    readonly roleFace: IRoleFaceBinder;
    /** 朝向管理 */
    readonly faceManager: IFaceManager;
}

export interface IDataCommonExtended {
    /** 当前对象对应的公共层对象（Layer 0 对象） */
    readonly state: IDataCommon;
}
