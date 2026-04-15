import { IEnemyLegacyBridge } from '@user/data-base';
import { IEnemyAttributes } from './types';

export class EnemyLegacyBridge implements IEnemyLegacyBridge<IEnemyAttributes> {
    fromLegacyEnemy(
        enemy: Enemy,
        defaultAttr: Partial<IEnemyAttributes>
    ): IEnemyAttributes {
        return {
            hp: enemy.hp ?? defaultAttr.hp ?? 0,
            atk: enemy.atk ?? defaultAttr.atk ?? 0,
            def: enemy.def ?? defaultAttr.def ?? 0,
            money: enemy.money ?? defaultAttr.money ?? 0,
            exp: enemy.exp ?? defaultAttr.exp ?? 0,
            point: enemy.point ?? defaultAttr.point ?? 0,
            guard: defaultAttr.guard ?? new Set()
        };
    }
}
