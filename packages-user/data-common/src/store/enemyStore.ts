import { isNil } from 'lodash-es';
import { IEnemyRawData, IEnemyStore, ITileStore } from './types';
import { logger } from '@motajs/common';

export class EnemyStore<THero> implements IEnemyStore<THero> {
    /** 以道具图块数字为键的原始道具定义表 */
    private readonly dataMap: Map<number, IEnemyRawData<THero>> = new Map();

    constructor(readonly tileStore: ITileStore) {}

    addEnemy(enemy: IEnemyRawData<THero>): void {
        if (this.dataMap.has(enemy.num)) {
            logger.warn(181, enemy.num.toString(), 'enemy');
        }
        this.dataMap.set(enemy.num, enemy);
    }

    getEnemy(token: number | string): IEnemyRawData<THero> | null {
        const num = this.tileStore.num(token);
        if (isNil(num)) return null;
        return this.dataMap.get(num) ?? null;
    }
}
