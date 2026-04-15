import { ICoreState, IGameDataState, IStateSaveData } from './types';
import { IHeroState, HeroState } from './hero';
import { ILayerState, LayerState } from './map';
import { IRoleFaceBinder, RoleFaceBinder } from './common';
import { GameDataState } from './data';
import {
    DamageSystem,
    EnemyContext,
    IEnemyContext,
    MapDamage
} from '@user/data-base';
import { IEnemyAttributes } from './enemy/types';
import {
    CommonAuraConverter,
    GuardAuraConverter,
    MainMapDamageConverter,
    MainMapDamageReducer
} from './enemy';

export class CoreState implements ICoreState {
    readonly layer: ILayerState;
    readonly hero: IHeroState;
    readonly roleFace: IRoleFaceBinder;
    readonly data: IGameDataState;
    readonly idNumberMap: Map<string, number>;
    readonly numberIdMap: Map<number, string>;
    readonly enemyContext: IEnemyContext<IEnemyAttributes>;

    constructor() {
        this.layer = new LayerState();
        this.hero = new HeroState();
        this.roleFace = new RoleFaceBinder();
        this.idNumberMap = new Map();
        this.numberIdMap = new Map();
        this.data = new GameDataState();

        // 怪物上下文初始化
        const enemyContext = new EnemyContext<IEnemyAttributes>();
        const damageSystem = new DamageSystem(enemyContext);
        const mapDamage = new MapDamage(enemyContext);
        mapDamage.useConverter(new MainMapDamageConverter());
        mapDamage.useReducer(new MainMapDamageReducer());
        enemyContext.attachDamageSystem(damageSystem);
        enemyContext.attachMapDamage(mapDamage);
        enemyContext.registerAuraConverter(new CommonAuraConverter());
        enemyContext.registerAuraConverter(new GuardAuraConverter());
        enemyContext.resize(core._WIDTH_, core._HEIGHT_);
        this.enemyContext = enemyContext;
    }

    saveState(): IStateSaveData {
        return structuredClone({
            followers: this.hero.followers
        });
    }

    loadState(data: IStateSaveData): void {
        this.hero.removeAllFollowers();
        data?.followers.forEach(v => {
            this.hero.addFollower(v.num, v.identifier);
        });
    }
}
