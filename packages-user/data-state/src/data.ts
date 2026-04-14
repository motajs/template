import { EnemyManager, IEnemyManager } from '@user/data-base';
import { IGameDataState } from './types';
import { registerSpecials } from './enemy';

export class GameDataState implements IGameDataState {
    readonly enemyManager: IEnemyManager;

    constructor() {
        this.enemyManager = new EnemyManager();
        registerSpecials(this.enemyManager);
    }
}
