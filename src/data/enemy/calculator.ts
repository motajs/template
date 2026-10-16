import {
    CriticalableHeroStatus,
    IDamageCalculator,
    IEnemyDamageInfoBase,
    IReadonlyEnemyHandler
} from '@user/data-system';
import { IEnemyAttr, IHeroAttr } from '@user/data-common';
import { ISpecial9Value } from './special';

export class MainDamageCalculator implements IDamageCalculator<
    IEnemyAttr,
    IHeroAttr
> {
    /** 当前是否正在计算支援怪的伤害 */
    private inGuard: boolean = false;

    calculate(
        handler: IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>
    ): IEnemyDamageInfoBase {
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
        if (
            enemy.hasSpecial(20) &&
            handler.state.hero.items.itemCount('cross') < 1
        ) {
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
        const vampire = enemy.getSpecial<ISpecial9Value>(9);
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

        const multiHit = enemy.getSpecial<number>(4);
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
            for (const view of guards) {
                // 直接把 enemy 传过去，因此支援的 enemy 会吃到其原本所在位置的光环加成
                const extraInfo = this.calculate({
                    enemy: view.getComputedEnemy(),
                    context: handler.context,
                    locator,
                    hero,
                    state: handler.state
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
        const breakArmor = enemy.getSpecial<number>(5);
        if (breakArmor) {
            damage += (breakArmor.value / 100) * def;
        }

        // 反击
        const counterAttack = enemy.getSpecial<number>(6);
        if (counterAttack) {
            // 反击是每回合生效，因此加到 enemyPerDamage 上
            enemyPerDamage += (counterAttack.value / 100) * atk;
        }

        // 净化
        const purify = enemy.getSpecial<number>(7);
        if (purify) {
            damage += purify.value * mdef;
        }

        damage += (turn - 1) * enemyPerDamage;

        // 魔防
        damage -= mdef;

        // 未开启负伤时，如果伤害为负，则设为 0
        if (
            !handler.state.flags.getFieldValueDefaults(
                'enableNegativeDamage',
                false
            ) &&
            damage < 0
        ) {
            damage = 0;
        }

        // 固伤，无法被魔防减伤
        const fixedDamage = enemy.getSpecial<number>(20);
        if (fixedDamage) {
            damage += fixedDamage.value;
        }

        // 仇恨，无法被魔防减伤
        if (enemy.hasSpecial(15)) {
            damage += handler.state.flags.getFieldValueDefaults('hatred', 0);
        }

        // 自爆
        if (enemy.hasSpecial(17)) {
            damage = Math.max(damage, hp - 1);
        }

        return {
            damage: Math.floor(damage),
            turn
        };
    }

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
