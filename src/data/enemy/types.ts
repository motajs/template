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

export interface IEnemyInitializationReturns {
    /** 虚弱处理对象 */
    readonly weak: ICombatWeakHandler;
}

export interface ICombatWeakHandler {
    /**
     * 设置当前的虚弱值
     * @param value 虚弱值
     */
    setWeakValue(value: number): void;

    /**
     * 获取当前的虚弱值
     */
    getWeakValue(): number;
}
