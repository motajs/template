import { EnemyManager, IEnemyManager } from '@user/data-base';
import { IEnemyAttributes } from './enemy/types';
import { IGameDataState } from './types';
import { registerSpecials } from './enemy';

export class GameDataState implements IGameDataState {
    readonly enemyManager: IEnemyManager<IEnemyAttributes>;

    constructor() {
        this.enemyManager = new EnemyManager<IEnemyAttributes>();
        registerSpecials(this.enemyManager);
    }
}
