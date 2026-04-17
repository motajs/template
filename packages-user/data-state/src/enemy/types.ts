import { IEnemyView } from '@user/data-base';

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
    /** 支援来源怪物视图列表 */
    guard: Set<IEnemyView<IEnemyAttr>>;
}

export const enum MapDamageType {
    /** 未知伤害 */
    Unknown,
    /** 领域伤害 */
    Zone,
    /** 激光伤害 */
    Layer,
    /** 阻击伤害 */
    Repulse,
    /** 夹击伤害 */
    Between
}
