import { ICoreState, ISaveableExecutor } from './types';
import {
    IRoleFaceBinder,
    IFaceManager,
    ITileStore,
    ISaveableContent,
    TileStore,
    SaveCompression,
    RoleFaceBinder,
    FaceManager,
    Dir4FaceHandler,
    Dir8FaceHandler,
    FaceGroup,
    FaceDirection,
    IHeroAttr,
    IEnemyAttr,
    ISaveSystem,
    SaveSystem,
    IItemStore,
    ItemStore
} from '@user/data-common';
import {
    EnemyManager,
    IEnemyManager,
    HeroAttribute,
    HeroState,
    IHeroState,
    IFlagSystem,
    FlagSystem,
    IMotaDataLoader,
    MotaDataLoader,
    loading,
    IReadonlyEnemy,
    IMapStore,
    MapStore
} from '@user/data-base';
import {
    DamageSystem,
    EnemyContext,
    IEnemyContext,
    ITriggerCollector,
    ITriggerRegistry,
    MapDamage,
    TriggerCollector,
    TriggerRegistry
} from '@user/data-system';
import {
    CommonAuraConverter,
    EnemyLegacyBridge,
    GuardAuraConverter,
    MainDamageCalculator,
    MainEnemyFinalEffect,
    MainMapDamageConverter,
    MainMapDamageReducer,
    registerSpecials,
    MainEnemyComparer
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
import {
    ItemLegacyBridge,
    LegacyItemData,
    LegacyTileData,
    TileLegacyBridge
} from './legacy';
import { ILoadProgressTotal, LoadProgressTotal } from '@motajs/loader';
import { isNil } from 'lodash-es';
import { logger } from '@motajs/common';
import { DefaultHeroMoveTopImpl } from './hero';

export class CoreState implements ICoreState {
    // Layer 0 公共层，最底层的接口，不会依赖任何其他内容，一般是工具性接口及不需要存档的数据
    readonly saveSystem: ISaveSystem;
    readonly roleFace: IRoleFaceBinder;
    readonly faceManager: IFaceManager;
    readonly tileStore: ITileStore<LegacyTileData>;
    readonly itemStore: IItemStore<LegacyItemData>;

    // Layer 1 数据层，所有可存档内容都在这，一般用于数据存储
    readonly maps: IMapStore;
    readonly hero: IHeroState<IHeroAttr>;
    readonly enemyManager: IEnemyManager<IEnemyAttr>;
    readonly flags: IFlagSystem;

    // Layer 2 执行层，游戏逻辑对象都在这，包括一些需要操作数据层的逻辑系统等
    readonly enemyContext: IEnemyContext<IEnemyAttr, IHeroAttr>;
    readonly triggerRegistry: ITriggerRegistry;
    readonly triggerCollector: ITriggerCollector;

    // Layer 3 用户层，也就是最顶层的内容，一般仅用于初始化以及仅供渲染端调用的顶层模块
    readonly loadProgress: ILoadProgressTotal;
    readonly dataLoader: IMotaDataLoader;

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
        //#region L0 初始化

        // 存档系统
        this.saveSystem = new SaveSystem();
        // 配置存档系统，一般情况下不建议动，除非你知道你在干什么
        this.saveSystem.config({
            autosaveLevel: SaveCompression.LowCompression,
            commonSaveLevel: SaveCompression.HighCompression,
            autosaveTimeTolerance: 50,
            saveTimeTolerance: 100,
            autosaveStackSize: 20
        });

        // 朝向
        this.roleFace = new RoleFaceBinder();
        this.faceManager = new FaceManager();
        const dir4 = new Dir4FaceHandler();
        const dir8 = new Dir8FaceHandler();
        this.faceManager.register(FaceGroup.Dir4, dir4);
        this.faceManager.registerById('dir4', dir4);
        this.faceManager.register(FaceGroup.Dir8, dir8);
        this.faceManager.registerById('dir8', dir8);

        // 图块
        const tileStore = new TileStore<LegacyTileData>();
        tileStore.attachLegacyConverter(new TileLegacyBridge());
        this.tileStore = tileStore;
        // 道具
        const itemStore = new ItemStore<LegacyItemData>();
        itemStore.attachLegacyConverter(new ItemLegacyBridge(this));
        this.itemStore = itemStore;

        //#endregion

        //#region L1 初始化

        // Flag 系统
        this.flags = new FlagSystem();

        // 地图
        this.maps = new MapStore(tileStore, this);

        // 勇士
        const heroAttribute = new HeroAttribute(HERO_DEFAULT_ATTRIBUTE);
        const heroState = new HeroState(this, dir8, heroAttribute);
        this.hero = heroState;

        this.loadProgress = new LoadProgressTotal();
        this.dataLoader = new MotaDataLoader(this.loadProgress);

        // 怪物管理器
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

        //#endregion

        //#region L2 初始化

        // 怪物上下文
        const enemyContext = new EnemyContext<IEnemyAttr, IHeroAttr>(this);
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

        // 触发器注册与收集器
        const triggerRegistry = new TriggerRegistry(this);
        const triggerCollector = new TriggerCollector();
        triggerCollector.attachRegistry(triggerRegistry);
        this.triggerRegistry = triggerRegistry;
        this.triggerCollector = triggerCollector;

        //#endregion

        //#region L3 初始化

        // 存档内容
        this.addSaveableContent('@system/hero', this.hero);
        this.addSaveableContent('@system/flags', this.flags);
        this.addSaveableContent('@system/maps', this.maps);
        this.addSaveableContent('@system/enemy', this.enemyManager);
        // 初始化存档数据库，不要动
        loading.once('coreInit', () => {
            this.saveSystem.init(`@game/${core.firstData.name}`);
        });

        // 加载初始化，先使用兼容层实现
        loading.once('loaded', () => {
            this.initTileStore(core.maps.blocksInfo);
            this.initItemStore(core.items.items);
            this.initEnemyManager(enemys_fcae963b_31c9_42b4_b48c_bb48d09f3f80);
            this.initMapStore(
                core.floorIds,
                core.floors as Record<FloorIds, ResolvedFloor>
            );
        });

        // 勇士顶层初始化
        const heroMoveTopImpl = new DefaultHeroMoveTopImpl(this);
        this.hero.location.mover.useTopImplementation(heroMoveTopImpl);

        //#endregion
    }

    //#region 私有方法

    /**
     * 初始化图块存储对象
     * @param data 旧样板图块定义对象
     */
    private initTileStore(data: typeof core.maps.blocksInfo) {
        const entries = Object.entries(data);
        for (const [key, block] of entries) {
            this.tileStore.fromLegacy(Number(key), block);
        }

        for (const [key, block] of entries) {
            if (!block.faceIds) continue;
            const { down, up, left, right } = block.faceIds;
            const downNum = this.tileStore.idToNumber(down);
            if (downNum !== Number(key)) continue;
            const upNum = this.tileStore.idToNumber(up);
            const leftNum = this.tileStore.idToNumber(left);
            const rightNum = this.tileStore.idToNumber(right);
            this.roleFace.malloc(downNum, FaceDirection.Down);
            if (!isNil(upNum)) {
                this.roleFace.bind(upNum, downNum, FaceDirection.Up);
            }
            if (!isNil(leftNum)) {
                this.roleFace.bind(leftNum, downNum, FaceDirection.Left);
            }
            if (!isNil(rightNum)) {
                this.roleFace.bind(rightNum, downNum, FaceDirection.Right);
            }
        }
    }

    /**
     * 初始化道具存储对象
     * @param data 旧样板道具定义对象
     */
    private initItemStore(data: typeof core.items.items) {
        const entries = Object.entries(data);
        for (const [id, legacy] of entries) {
            const num = this.tileStore.idToNumber(id);
            if (isNil(num)) {
                logger.warn(145, id);
                continue;
            }
            this.itemStore.fromLegacy(num, legacy);
        }
    }

    /**
     * 初始化怪物管理器对象
     * @param data 旧样板怪物存储对象
     */
    private initEnemyManager(data: Record<EnemyIds, Enemy>) {
        const manager = this.enemyManager;
        const reference = new Map<number, IReadonlyEnemy<IEnemyAttr>>();
        for (const [id, enemy] of Object.entries(structuredClone(data))) {
            const num = this.tileStore.idToNumber(id);
            if (isNil(num)) continue;
            if (enemy.faceIds) {
                // 有 faceId 的要把其他的也映射到当前怪物
                const { left, up, right, down } = enemy.faceIds;
                const leftCode = this.tileStore.idToNumber(left)!;
                const upCode = this.tileStore.idToNumber(up)!;
                const rightCode = this.tileStore.idToNumber(right)!;
                const downCode = this.tileStore.idToNumber(down)!;
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
            const state = this.maps.createLayerState(
                id,
                floor.width,
                floor.height
            );
            const bg = state.addLayer();
            const bg2 = state.addLayer();
            const event = state.addLayer();
            const fg = state.addLayer();
            const fg2 = state.addLayer();
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

    //#endregion

    //#region 存档方法

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

    //#endregion
}
