import { IEnemyAttr, IHeroAttr } from '@user/data-common';
import {
    ICombatFlowHandler,
    ICombatScript,
    IEnemyDamageInfo
} from '@user/data-system';

export class MainCombatScript implements ICombatScript<IEnemyAttr, IHeroAttr> {
    priority: number = 0;

    async before(
        info: IEnemyDamageInfo<IEnemyAttr, IHeroAttr>,
        handler: ICombatFlowHandler<IEnemyAttr, IHeroAttr>
    ): Promise<boolean> {
        const hero = handler.hero;

        // 如果伤害大于勇士血量，直接不允许战斗
        if (!handler.force && hero.getFinalAttribute('hp') < info.damage) {
            return false;
        }

        return true;
    }

    async after(
        info: IEnemyDamageInfo<IEnemyAttr, IHeroAttr>,
        handler: ICombatFlowHandler<IEnemyAttr, IHeroAttr>
    ): Promise<void> {
        const hero = handler.hero;
        const readonlyEnemy = info.handler.enemy;

        // 计算金币和经验，支援怪也算上
        const baseExp = readonlyEnemy.getAttribute('exp');
        const baseMoney = readonlyEnemy.getAttribute('money');
        const [guardExp, guardMoney] = [
            ...readonlyEnemy.getAttribute('guard')
        ].reduce(
            (prev, curr) => {
                const attr = curr.getComputedEnemy();
                const exp = attr.getAttribute('exp');
                const money = attr.getAttribute('money');
                return [prev[0] + exp, prev[1] + money];
            },
            [0, 0]
        );

        const totalExp = baseExp + guardExp;
        const totalMoney = baseMoney + guardMoney;

        // 给勇士添加经验和金币
        hero.add('exp', totalExp);
        hero.add('money', totalMoney);

        // 进行全局提示
        handler.state.emitTip(
            `打败${readonlyEnemy.getAttribute('name')}，金币+${totalMoney}，经验+${totalExp}。`,
            readonlyEnemy.code
        );
    }
}
