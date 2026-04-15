import { IEnemy, IEnemyFinalEffect } from '@user/data-base';
import { IEnemyAttributes } from './types';
import { ITileLocator } from '@user/types';

const HERO_STATUS_PLACEHOLDER = {
    atk: 0,
    def: 0
} as const;

export class MainEnemyFinalEffect implements IEnemyFinalEffect<IEnemyAttributes> {
    readonly priority: number = 0;

    apply(enemy: IEnemy<IEnemyAttributes>, _locator: ITileLocator): void {
        if (enemy.hasSpecial(3)) {
            enemy.setAttribute(
                'def',
                Math.max(
                    enemy.getAttribute('def'),
                    HERO_STATUS_PLACEHOLDER.atk - 1
                )
            );
        }

        if (enemy.hasSpecial(10)) {
            enemy.setAttribute('atk', HERO_STATUS_PLACEHOLDER.atk);
            enemy.setAttribute('def', HERO_STATUS_PLACEHOLDER.def);
        }
    }
}
