import { IEnemyAttr, IHeroAttr } from '@user/data-common';
import { ICoreState } from '@user/data-state';
import { ICombatFlowHooks, IEnemyDamageInfo } from '@user/data-system';

export class MainCombatFlowHooks implements ICombatFlowHooks<
    IEnemyAttr,
    IHeroAttr
> {
    constructor(readonly state: ICoreState) {}

    async onBeforeCombat(
        info: IEnemyDamageInfo<IEnemyAttr, IHeroAttr>
    ): Promise<void> {
        // 删除下面这一行开始编写你自己的战前钩子
        void info;
    }

    async onAfterCombat(
        info: IEnemyDamageInfo<IEnemyAttr, IHeroAttr>
    ): Promise<void> {
        // 删除下面这一行开始编写你自己的战后钩子
        void info;
    }
}
