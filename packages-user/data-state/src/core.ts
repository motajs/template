import { ICoreState, ISaveableExecutor } from './types';
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
    IHeroState,
    IFlagSystem,
    FlagSystem,
    IMotaDataLoader,
    MotaDataLoader,
    loading,
    IRoleFaceBinder,
    RoleFaceBinder,
    FaceDirection,
    ISaveableContent,
    SaveCompression,
    IReadonlyEnemy,
    IMapStore,
    MapStore
} from '@user/data-base';
import {
    CommonAuraConverter,
    EnemyLegacyBridge,
    GuardAuraConverter,
    MainDamageCalculator,
    MainEnemyFinalEffect,
    MainMapDamageConverter,
    MainMapDamageReducer,
    registerSpecials,
    MainEnemyComparer,
    IEnemyAttr
} from './enemy';
import {
    BG2_ZINDEX,
    BG_ZINDEX,
    EVENT_ZINDEX,
    FG2_ZINDEX,
    FG_ZINDEX,
    HERO_DEFAULT_ATTRIBUTE,
    TILE_HEIGHT,
    TILE_WIDTH
} from './shared';
import { IHeroAttr } from './hero';
import { ILoadProgressTotal, LoadProgressTotal } from '@motajs/loader';
import { isNil } from 'lodash-es';
import { logger } from '@motajs/common';
import { ISaveSystem, SaveSystem } from './save';

export class CoreState implements ICoreState {
    // 全局内容
    readonly roleFace: IRoleFaceBinder;
    readonly idNumberMap: Map<string, number>;
    readonly numberIdMap: Map<number, string>;

    // 可存档内容
    readonly maps: IMapStore;
    readonly hero: IHeroState<IHeroAttr>;
    readonly enemyManager: IEnemyManager<IEnemyAttr>;
    readonly flags: IFlagSystem;

    // 状态内容
    readonly loadProgress: ILoadProgressTotal;
    readonly dataLoader: IMotaDataLoader;
    readonly enemyContext: IEnemyContext<IEnemyAttr, IHeroAttr>;
    readonly saveSystem: ISaveSystem;

    /** 可存档对象映射 */
    private readonly saveables: Map<string, ISaveableContent<any>> = new Map();
    /** 所有已添加的可存档对象 */
    private readonly addedSaveables: Set<ISaveableContent<any>> = new Set();
    /** 已绑定的存档执行器 */
    private readonly executors: Map<
        ISaveableContent<any>,
        ISaveableExecutor<any>
    > = new Map();

    constructor() {
        this.maps = new MapStore();
        this.roleFace = new RoleFaceBinder();
        this.idNumberMap = new Map();
        this.numberIdMap = new Map();

        this.loadProgress = new LoadProgressTotal();
        this.dataLoader = new MotaDataLoader(this.loadProgress);

        //#region 勇士初始化

        const heroMover = new HeroMover();
        const heroAttribute = new HeroAttribute(HERO_DEFAULT_ATTRIBUTE);
        const heroState = new HeroState(heroMover, heroAttribute);
        this.hero = heroState;

        //#endregion

        //#region 怪物初始化

        // 怪物管理器初始化
        const comparer = new MainEnemyComparer();
        const enemyManager = new EnemyManager(new EnemyLegacyBridge());
        enemyManager.attachEnemyComparer(comparer);
        enemyManager.setAttributeDefaults('hp', 0);
        enemyManager.setAttributeDefaults('atk', 0);
        enemyManager.setAttributeDefaults('def', 0);
        enemyManager.setAttributeDefaults('exp', 0);
        enemyManager.setAttributeDefaults('money', 0);
        enemyManager.setAttributeDefaults('point', 0);
        registerSpecials(enemyManager);
        this.enemyManager = enemyManager;
        // 怪物上下文初始化
        const enemyContext = new EnemyContext<IEnemyAttr, IHeroAttr>();
        const damageSystem = new DamageSystem(enemyContext);
        const mapDamage = new MapDamage(enemyContext);
        damageSystem.useCalculator(new MainDamageCalculator());
        mapDamage.useReducer(new MainMapDamageReducer());
        mapDamage.useConverter(new MainMapDamageConverter());
        enemyContext.attachDamageSystem(damageSystem);
        enemyContext.attachMapDamage(mapDamage);
        enemyContext.registerAuraConverter(new CommonAuraConverter());
        enemyContext.registerAuraConverter(new GuardAuraConverter());
        enemyContext.registerFinalEffect(new MainEnemyFinalEffect());
        enemyContext.resize(TILE_WIDTH, TILE_HEIGHT);
        enemyContext.bindHero(heroAttribute);
        this.enemyContext = enemyContext;

        //#endregion

        //#region 存档系统

        this.saveSystem = new SaveSystem();
        // 配置存档系统，一般情况下不建议动，除非你知道你在干什么
        this.saveSystem.config({
            autosaveLevel: SaveCompression.LowCompression,
            commonSaveLevel: SaveCompression.HighCompression,
            autosaveTimeTolerance: 50,
            saveTimeTolerance: 100,
            autosaveStackSize: 20
        });

        // 初始化存档数据库，不要动
        loading.once('coreInit', () => {
            this.saveSystem.init(`@game/${core.firstData.name}`);
        });

        //#endregion

        //#region 其他初始化

        this.flags = new FlagSystem();

        // 加载先使用兼容层实现
        loading.once('loaded', () => {
            this.initEnemyManager(enemys_fcae963b_31c9_42b4_b48c_bb48d09f3f80);
            this.initMapStore(
                core.floorIds,
                core.floors as Record<FloorIds, ResolvedFloor>
            );
        });

        this.addSaveableContent('@system/hero', this.hero);
        this.addSaveableContent('@system/flags', this.flags);
        this.addSaveableContent('@system/maps', this.maps);
        this.addSaveableContent('@system/enemy', this.enemyManager);

        //#endregion
    }

    /**
     * 初始化怪物管理器对象
     * @param data 旧样板怪物存储对象
     */
    private initEnemyManager(data: Record<EnemyIds, Enemy>) {
        // TODO: 修改怪物模板并存入存档，即 core.setEnemy
        const manager = this.enemyManager;
        const reference = new Map<number, IReadonlyEnemy<IEnemyAttr>>();
        for (const [id, enemy] of Object.entries(structuredClone(data))) {
            const num = this.idNumberMap.get(id);
            if (isNil(num)) continue;
            if (enemy.faceIds) {
                // 有 faceId 的要把其他的也映射到当前怪物
                const { left, up, right, down } = enemy.faceIds;
                const leftCode = this.idNumberMap.get(left)!;
                const upCode = this.idNumberMap.get(up)!;
                const rightCode = this.idNumberMap.get(right)!;
                const downCode = this.idNumberMap.get(down)!;
                const prefab = manager.fromLegacyEnemy(downCode, enemy);
                reference.set(downCode, prefab);
                manager.addPrefab(prefab);
                this.roleFace.malloc(downCode, FaceDirection.Down);
                this.roleFace.bind(leftCode, downCode, FaceDirection.Left);
                this.roleFace.bind(upCode, downCode, FaceDirection.Up);
                this.roleFace.bind(rightCode, downCode, FaceDirection.Down);
                manager.reusePrefab(num, leftCode, left);
                manager.reusePrefab(num, upCode, up);
                manager.reusePrefab(num, rightCode, right);
            } else {
                const prefab = manager.fromLegacyEnemy(num, enemy);
                reference.set(num, prefab);
                manager.addPrefab(prefab);
            }
        }
        manager.compareWith(reference);
    }

    private initMapStore(
        floors: FloorIds[],
        data: Record<FloorIds, ResolvedFloor>
    ) {
        const reference = new Map<string, Map<number, Uint32Array>>();
        for (const id of floors) {
            const floor = data[id];
            const state = this.maps.createLayerState(id);
            const bg = state.addLayer(floor.width, floor.height);
            const bg2 = state.addLayer(floor.width, floor.height);
            const event = state.addLayer(floor.width, floor.height);
            const fg = state.addLayer(floor.width, floor.height);
            const fg2 = state.addLayer(floor.width, floor.height);
            bg.setZIndex(BG_ZINDEX);
            bg2.setZIndex(BG2_ZINDEX);
            event.setZIndex(EVENT_ZINDEX);
            fg.setZIndex(FG_ZINDEX);
            fg2.setZIndex(FG2_ZINDEX);
            state.setLayerAlias(bg, 'bg');
            state.setLayerAlias(bg2, 'bg2');
            state.setLayerAlias(event, 'event');
            state.setLayerAlias(fg, 'fg');
            state.setLayerAlias(fg2, 'fg2');
            state.setActiveStatus(false);

            const size = floor.width * floor.height;
            const ref = new Map<number, Uint32Array>();

            if (floor.bgmap && floor.bgmap.length > 0) {
                const arr = new Uint32Array(floor.bgmap.flat());
                bg.setMapRef(arr);
                ref.set(BG_ZINDEX, new Uint32Array(arr));
            } else {
                ref.set(BG_ZINDEX, new Uint32Array(size));
            }

            if (floor.bg2map && floor.bg2map.length > 0) {
                const arr = new Uint32Array(floor.bg2map.flat());
                bg2.setMapRef(arr);
                ref.set(BG2_ZINDEX, new Uint32Array(arr));
            } else {
                ref.set(BG2_ZINDEX, new Uint32Array(size));
            }

            if (floor.map && floor.map.length > 0) {
                const arr = new Uint32Array(floor.map.flat());
                event.setMapRef(arr);
                ref.set(EVENT_ZINDEX, new Uint32Array(arr));
            } else {
                ref.set(EVENT_ZINDEX, new Uint32Array(size));
            }

            if (floor.fgmap && floor.fgmap.length > 0) {
                const arr = new Uint32Array(floor.fgmap.flat());
                fg.setMapRef(arr);
                ref.set(FG_ZINDEX, new Uint32Array(arr));
            } else {
                ref.set(FG_ZINDEX, new Uint32Array(size));
            }

            if (floor.fg2map && floor.fg2map.length > 0) {
                const arr = new Uint32Array(floor.fg2map.flat());
                fg2.setMapRef(arr);
                ref.set(FG2_ZINDEX, new Uint32Array(arr));
            } else {
                ref.set(FG2_ZINDEX, new Uint32Array(size));
            }

            reference.set(id, ref);
        }
        this.maps.compareWith(reference);
    }

    addSaveableContent(id: string, content: ISaveableContent<unknown>): void {
        if (this.saveables.has(id)) {
            logger.warn(112, id);
            return;
        }
        this.saveables.set(id, content);
        this.addedSaveables.add(content);
    }

    getSaveableContent<T>(id: string): ISaveableContent<T> | null {
        const content = this.saveables.get(id);
        return (content as ISaveableContent<T>) ?? null;
    }

    bindSaveableExecuter<T>(
        content: ISaveableContent<T> | string,
        executor: ISaveableExecutor<T>
    ): void {
        if (typeof content === 'string') {
            const saveable = this.saveables.get(content);
            if (!saveable) return;
            this.executors.set(saveable, executor);
        } else {
            if (!this.addedSaveables.has(content)) {
                logger.warn(113);
                return;
            }
            this.executors.set(content, executor);
        }
    }
}
