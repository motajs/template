import { ICoreState, IStateSaveData } from './types';
import { IHeroState, HeroState } from './hero';
import { ILayerState, LayerState } from './map';
import { IRoleFaceBinder, RoleFaceBinder } from './common';
import {
    DamageSystem,
    EnemyContext,
    EnemyManager,
    IEnemyContext,
    IEnemyManager,
    MapDamage
} from '@user/data-base';
import { IEnemyAttributes } from './enemy/types';
import {
    CommonAuraConverter,
    EnemyLegacyBridge,
    GuardAuraConverter,
    MainEnemyFinalEffect,
    MainMapDamageConverter,
    MainMapDamageReducer,
    registerSpecials
} from './enemy';
import { TILE_HEIGHT, TILE_WIDTH } from './shared';

export class CoreState implements ICoreState {
    readonly layer: ILayerState;
    readonly hero: IHeroState;
    readonly roleFace: IRoleFaceBinder;
    readonly idNumberMap: Map<string, number>;
    readonly numberIdMap: Map<number, string>;

    readonly enemyManager: IEnemyManager<IEnemyAttributes>;
    readonly enemyContext: IEnemyContext<IEnemyAttributes>;

    constructor() {
        this.layer = new LayerState();
        this.hero = new HeroState();
        this.roleFace = new RoleFaceBinder();
        this.idNumberMap = new Map();
        this.numberIdMap = new Map();

        //#region 怪物初始化

        // 怪物管理器初始化
        const enemyManager = new EnemyManager(new EnemyLegacyBridge());
        enemyManager.setAttributeDefaults('hp', 0);
        enemyManager.setAttributeDefaults('atk', 0);
        enemyManager.setAttributeDefaults('def', 0);
        enemyManager.setAttributeDefaults('exp', 0);
        enemyManager.setAttributeDefaults('money', 0);
        enemyManager.setAttributeDefaults('point', 0);
        registerSpecials(enemyManager);
        this.enemyManager = enemyManager;
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
        enemyContext.registerFinalEffect(new MainEnemyFinalEffect());
        enemyContext.resize(TILE_WIDTH, TILE_HEIGHT);
        this.enemyContext = enemyContext;

        //#endregion
    }

    saveState(): IStateSaveData {
        return structuredClone({
            followers: this.hero.followers
        });
    }

    loadState(data: IStateSaveData): void {
        this.hero.removeAllFollowers();
        data.followers.forEach(v => {
            this.hero.addFollower(v.num, v.identifier);
        });
    }
}
