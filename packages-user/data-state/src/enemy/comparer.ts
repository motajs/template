import { IEnemyComparer, IReadonlyEnemy } from '@user/data-base';
import { IEnemyAttr } from './types';

export class MainEnemyComparer implements IEnemyComparer<IEnemyAttr> {
    compare(
        enemyA: IReadonlyEnemy<IEnemyAttr>,
        enemyB: IReadonlyEnemy<IEnemyAttr>
    ): boolean {
        // 比较基本属性
        if (
            enemyA.getAttribute('hp') !== enemyB.getAttribute('hp') ||
            enemyA.getAttribute('atk') !== enemyB.getAttribute('atk') ||
            enemyA.getAttribute('def') !== enemyB.getAttribute('def') ||
            enemyA.getAttribute('money') !== enemyB.getAttribute('money') ||
            enemyA.getAttribute('exp') !== enemyB.getAttribute('exp') ||
            enemyA.getAttribute('point') !== enemyB.getAttribute('point')
        ) {
            return false;
        }

        // 比较特殊属性
        const specialsA = [...enemyA.iterateSpecials()];
        const specialsB = [...enemyB.iterateSpecials()];
        if (specialsA.length !== specialsB.length) return false;
        for (const special of specialsA) {
            const other = enemyB.getSpecial(special.code);
            if (!other || !special.deepEqualsTo(other)) return false;
        }
        return true;
    }
}
