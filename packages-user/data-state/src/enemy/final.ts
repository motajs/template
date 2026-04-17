import { IEnemyFinalEffect, IEnemyHandler } from '@user/data-base';
import { IEnemyAttr } from './types';
import { IHeroAttr } from '../hero';

export class MainEnemyFinalEffect implements IEnemyFinalEffect<
    IEnemyAttr,
    IHeroAttr
> {
    readonly priority: number = 0;

    apply(handler: IEnemyHandler<IEnemyAttr, IHeroAttr>): void {
        const enemy = handler.enemy;
        const heroAtk = handler.hero.getFinalAttribute('atk');
        const heroDef = handler.hero.getFinalAttribute('def');

        // 3-坚固
        if (enemy.hasSpecial(3)) {
            const target = Math.max(enemy.getAttribute('def'), heroAtk - 1);
            enemy.setAttribute('def', target);
        }

        // 10-模仿
        if (enemy.hasSpecial(10)) {
            enemy.setAttribute('atk', heroAtk);
            enemy.setAttribute('def', heroDef);
        }
    }
}
