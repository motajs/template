import { IEnemy, IEnemyFinalEffect } from '@user/data-base';
import { IEnemyAttributes } from './types';
import { ITileLocator } from '@motajs/common';

const HERO_STATUS_PLACEHOLDER = {
    atk: 0,
    def: 0
} as const;

export class MainEnemyFinalEffect implements IEnemyFinalEffect<IEnemyAttributes> {
    readonly priority: number = 0;

    apply(enemy: IEnemy<IEnemyAttributes>, _locator: ITileLocator): void {
        // 3-坚固
        if (enemy.hasSpecial(3)) {
            const target = Math.max(
                enemy.getAttribute('def'),
                HERO_STATUS_PLACEHOLDER.atk - 1
            );
            enemy.setAttribute('def', target);
        }

        // 10-模仿
        if (enemy.hasSpecial(10)) {
            enemy.setAttribute('atk', HERO_STATUS_PLACEHOLDER.atk);
            enemy.setAttribute('def', HERO_STATUS_PLACEHOLDER.def);
        }
    }
}
