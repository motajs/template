//#region 勇士属性

export interface IHeroAttributeObject {
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

//#endregion
