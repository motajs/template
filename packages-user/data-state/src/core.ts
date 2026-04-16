import { ICoreState, IStateSaveData } from './types';
import { ILayerState, LayerState } from './map';
import { IRoleFaceBinder, RoleFaceBinder } from './common';
import {
    DamageSystem,
    EnemyContext,
    EnemyManager,
    HeroMover,
    IEnemyContext,
    IEnemyManager,
    MapDamage,
    HeroAttribute,
    HeroState,
    IHeroState
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
import { HERO_DEFAULT_ATTRIBUTE, TILE_HEIGHT, TILE_WIDTH } from './shared';
import { IHeroAttributeObject } from './hero';

export class CoreState implements ICoreState {
    readonly layer: ILayerState;
    readonly roleFace: IRoleFaceBinder;
    readonly idNumberMap: Map<string, number>;
    readonly numberIdMap: Map<number, string>;

    readonly hero: IHeroState<IHeroAttributeObject>;

    readonly enemyManager: IEnemyManager<IEnemyAttributes>;
    readonly enemyContext: IEnemyContext<IEnemyAttributes>;

    constructor() {
        this.layer = new LayerState();
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

        //#region 勇士初始化

        const heroMover = new HeroMover();
        const heroAttribute = new HeroAttribute(HERO_DEFAULT_ATTRIBUTE);
        const heroState = new HeroState(heroMover, heroAttribute);
        this.hero = heroState;

        //#endregion
    }

    saveState(): IStateSaveData {
        return structuredClone({
            followers: this.hero.mover.followers
        });
    }

    loadState(data: IStateSaveData): void {
        this.hero.mover.removeAllFollowers();
        data.followers.forEach(v => {
            this.hero.mover.addFollower(v.num, v.identifier);
        });
    }
}
