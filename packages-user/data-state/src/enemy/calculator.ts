import {
    CriticalableHeroStatus,
    IDamageCalculator,
    IEnemyDamageInfo,
    IReadonlyEnemyHandler
} from '@user/data-base';
import { IEnemyAttr } from './types';
import { IVampireValue } from './special';
import { IHeroAttr } from '../hero';

export class MainDamageCalculator implements IDamageCalculator<
    IEnemyAttr,
    IHeroAttr
> {
    /** 当前是否正在计算支援怪的伤害 */
    private inGuard: boolean = false;

    /**
     * 计算战斗伤害信息
     * @param handler 信息对象
     */
    calculate(
        handler: IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>
    ): IEnemyDamageInfo {
        const { enemy, locator, hero } = handler;
        const hp = hero.getBaseAttribute('hp');
        const atk = hero.getFinalAttribute('atk');
        const def = hero.getFinalAttribute('def');
        const mdef = this.inGuard ? 0 : hero.getFinalAttribute('mdef');
        // 支援中魔防只会被计算一次，因此除了当前怪物，计算其他怪物伤害时魔防为 0
        const monAtk = enemy.getAttribute('atk');
        const monDef = enemy.getAttribute('def');
        let monHp = enemy.getAttribute('hp');

        // 无敌
        if (enemy.hasSpecial(20) && core.itemCount('cross') < 1) {
            return { damage: Infinity, turn: 0 };
        }

        /** 怪物会对勇士造成的总伤害 */
        let damage = 0;

        /** 勇士每轮造成的伤害 */
        let heroPerDamage = 0;
        /** 怪物每轮造成的伤害 */
        let enemyPerDamage = 0;

        // 勇士每轮伤害为勇士攻击减去怪物防御
        heroPerDamage += atk - monDef;
        if (heroPerDamage <= 0) {
            return { damage: Infinity, turn: 0 };
        }

        // 吸血
        const vampire = enemy.getSpecial<IVampireValue>(11);
        if (vampire) {
            const value = (vampire.value.vampire / 100) * hp;
            damage += value;
            // 如果吸血加到自身
            if (vampire.value.add) {
                monHp += value;
            }
        }

        // 魔攻
        if (enemy.hasSpecial(2)) {
            enemyPerDamage = monAtk;
        } else {
            enemyPerDamage = monAtk - def;
        }

        // 连击
        if (enemy.hasSpecial(4)) enemyPerDamage *= 2;
        if (enemy.hasSpecial(5)) enemyPerDamage *= 3;

        const multiHit = enemy.getSpecial<number>(6);
        if (multiHit) {
            enemyPerDamage *= multiHit.value;
        }

        if (enemyPerDamage < 0) enemyPerDamage = 0;

        let turn = Math.ceil(monHp / heroPerDamage);

        // 支援，当怪物被支援且不包含支援标记时执行，因为支援怪不能再被支援了
        const guards = enemy.getAttribute('guard');
        if (guards.size > 0 && !this.inGuard) {
            this.inGuard = true;
            // 计算支援怪的伤害，同时把打支援怪花费的回合数加到当前怪物上，因为打支援怪的时候当前怪物也会打你
            // 因此回合数需要加上打支援怪的回合数
            for (const guard of guards) {
                // 直接把 enemy 传过去，因此支援的 enemy 会吃到其原本所在位置的光环加成
                const extraInfo = this.calculate({
                    enemy: guard.getComputedEnemy(),
                    locator,
                    hero
                });
                turn += extraInfo.turn;
                damage += extraInfo.damage;
            }
            this.inGuard = false;
        }

        // 先攻
        if (enemy.hasSpecial(1)) {
            damage += enemyPerDamage;
        }

        // 破甲
        const breakArmor = enemy.getSpecial<number>(7);
        if (breakArmor) {
            damage += (breakArmor.value / 100) * def;
        }

        // 反击
        const counterAttack = enemy.getSpecial<number>(8);
        if (counterAttack) {
            // 反击是每回合生效，因此加到 enemyPerDamage 上
            enemyPerDamage += (counterAttack.value / 100) * atk;
        }

        // 净化
        const purify = enemy.getSpecial<number>(9);
        if (purify) {
            damage += purify.value * mdef;
        }

        damage += (turn - 1) * enemyPerDamage;

        // 魔防
        damage -= mdef;

        // 未开启负伤时，如果伤害为负，则设为 0
        if (!core.flags.enableNegativeDamage && damage < 0) {
            damage = 0;
        }

        // 固伤，无法被魔防减伤
        const fixedDamage = enemy.getSpecial<number>(22);
        if (fixedDamage) {
            damage += fixedDamage.value;
        }

        // 仇恨，无法被魔防减伤
        if (enemy.hasSpecial(17)) {
            damage += core.getFlag('hatred', 0);
        }

        return {
            damage: Math.floor(damage),
            turn
        };
    }

    /**
     * 获取临界计算的上界
     * @param handler 信息对象
     * @param attribute 目标属性名
     */
    getCriticalLimit(
        handler: IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>,
        attribute: CriticalableHeroStatus<IHeroAttr>
    ): number {
        switch (attribute) {
            case 'atk': {
                if (handler.enemy.hasSpecial(3)) {
                    return Infinity;
                }
                return (
                    handler.enemy.getAttribute('def') +
                    handler.enemy.getAttribute('hp')
                );
            }
        }
        return handler.hero.getFinalAttribute(attribute);
    }
}
