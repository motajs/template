import { logger } from '@motajs/common';
import { ILoadManager, LoadManager } from '@motajs/loader';
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
    GameEventStore,
    IGameEventStore,
    IItemStore,
    ItemStore,
    IMapStore,
    MapStore,
    IReplaySystem,
    ReplaySystem,
    ReplayCode
} from '@user/data-common';
import {
    EnemyManager,
    IEnemyManager,
    HeroAttribute,
    HeroState,
    IHeroState,
    IFlagSystem,
    FlagSystem,
    IMapState,
    MapState
} from '@user/data-base';
import {
    DamageSystem,
    EnemyContext,
    GameEventSystem,
    IEnemyContext,
    IGameEventSystem,
    MapDamage,
    IPathfindingSystem,
    PathfindingSystem
} from '@user/data-system';
import { ICoreState, ICoreStateConfig, ISaveableExecutor } from './types';
import {
    CommonAuraConverter,
    GuardAuraConverter,
    MainDamageCalculator,
    MainEnemyFinalEffect,
    MainMapDamageConverter,
    MainMapDamageReducer,
    createSpecials,
    MainEnemyComparer
} from './enemy';
import { HERO_DEFAULT_ATTRIBUTE } from './shared';
import { DefaultHeroMoveTopImpl, DefaultPassPredicateImpl } from './hero';
import { createEventRegistrations } from './event';
import {
    ReplayEquip,
    ReplayMove,
    ReplayTeleport,
    ReplayUnequip,
    ReplayUseItem
} from './replay';
import {
    IMotaDataLoader,
    MotaDataLoader,
    DefaultDataLoaderHook
} from './loader';

export class CoreState implements ICoreState {
    // Layer 0 公共层，最底层的接口，不会依赖任何其他内容，一般是工具性接口及不需要存档的数据
    readonly roleFace: IRoleFaceBinder;
    readonly faceManager: IFaceManager;
    readonly tileStore: ITileStore;
    readonly itemStore: IItemStore<IHeroAttr>;
    readonly mapStore: IMapStore;
    readonly eventStore: IGameEventStore;
    readonly replaySystem: IReplaySystem;

    // Layer 1 数据层，所有可存档内容都在这，一般用于数据存储
    readonly maps: IMapState;
    readonly hero: IHeroState<IHeroAttr>;
    readonly enemyManager: IEnemyManager<IEnemyAttr>;
    readonly flags: IFlagSystem;

    // Layer 2 执行层，游戏逻辑对象都在这，包括一些需要操作数据层的逻辑系统等
    readonly enemyContext: IEnemyContext<IEnemyAttr, IHeroAttr>;
    readonly eventSystem: IGameEventSystem;
    readonly pathfinding: IPathfindingSystem;

    // Layer 3 用户层，也就是最顶层的内容，一般仅用于初始化以及仅供渲染端调用的顶层模块
    readonly loader: IMotaDataLoader;
    readonly loadManager: ILoadManager;

    /** 可存档对象映射 */
    private readonly saveables: Map<string, ISaveableContent<any>> = new Map();
    /** 所有已添加的可存档对象 */
    private readonly addedSaveables: Set<ISaveableContent<any>> = new Set();
    /** 已绑定的存档执行器 */
    private readonly executors: Map<
        ISaveableContent<any>,
        ISaveableExecutor<any>
    > = new Map();

    constructor(config: Readonly<ICoreStateConfig>) {
        //#region L0 定义

        this.roleFace = new RoleFaceBinder();
        this.faceManager = new FaceManager();
        this.tileStore = new TileStore();
        this.itemStore = new ItemStore<IHeroAttr>(this.tileStore);
        this.mapStore = new MapStore();
        this.eventStore = new GameEventStore();

        this.initializeL0();

        //#endregion

        //#region L1 定义

        this.flags = new FlagSystem();
        this.maps = new MapState(this);
        const dir8 = this.faceManager.get(FaceGroup.Dir8)!;
        const heroAttribute = new HeroAttribute(HERO_DEFAULT_ATTRIBUTE);
        this.hero = new HeroState(this, dir8, heroAttribute);
        this.enemyManager = new EnemyManager<IEnemyAttr>(this.tileStore);

        this.initializeL1();

        //#endregion

        //#region L2 定义

        this.enemyContext = new EnemyContext<IEnemyAttr, IHeroAttr>(this);
        const events = createEventRegistrations();
        this.eventSystem = new GameEventSystem(this, events);
        this.replaySystem = new ReplaySystem();
        this.pathfinding = new PathfindingSystem(this);

        this.initializeL2();

        //#endregion

        //#region L3 定义

        this.loadManager = new LoadManager();
        this.loader = new MotaDataLoader(this.loadManager, config.loadStarter);

        this.initializeL3(config);

        //#endregion
    }

    //#region 初始化方法

    /**
     * 初始化数据端 L0
     */
    private initializeL0() {
        const dir4 = new Dir4FaceHandler();
        const dir8 = new Dir8FaceHandler();
        this.faceManager.register(FaceGroup.Dir4, dir4);
        this.faceManager.registerById('dir4', dir4);
        this.faceManager.register(FaceGroup.Dir8, dir8);
        this.faceManager.registerById('dir8', dir8);
    }

    /**
     * 初始化数据端 L1
     */
    private initializeL1() {
        const comparer = new MainEnemyComparer();
        this.enemyManager.attachEnemyComparer(comparer);

        const specials = createSpecials(this);
        for (const [code, cons] of specials) {
            this.enemyManager.registerSpecial(code, cons);
        }
    }

    /**
     * 初始化数据端 L2
     */
    private initializeL2() {
        const predicate = new DefaultPassPredicateImpl(this);
        this.pathfinding.finder.usePassPredicate(predicate);
        // 初始状态下勇士不在任何楼层，切换楼层后再具体设置
        this.pathfinding.finder.useMapLayer(null);
        this.pathfinding.useMover(this.hero.location.mover);

        this.initializeEnemy();
    }

    private initializeL3(config: Readonly<ICoreStateConfig>) {
        // 勇士顶层初始化
        const heroMoveTopImpl = new DefaultHeroMoveTopImpl(this);
        this.hero.location.mover.useTopImplementation(heroMoveTopImpl);

        // 加载
        this.loader.addHook(new DefaultDataLoaderHook());
        this.loader.addCoreConfig('core', config.coreURL);

        this.initializeSave();
        this.initializeReplay();
    }

    /**
     * 初始化怪物信息
     */
    private initializeEnemy() {
        // 初始化怪物上下文
        const ctx = this.enemyContext;
        const damageSystem = new DamageSystem(ctx);
        const mapDamage = new MapDamage(ctx);
        damageSystem.useCalculator(new MainDamageCalculator());
        mapDamage.useReducer(new MainMapDamageReducer());
        mapDamage.useConverter(new MainMapDamageConverter());
        ctx.attachDamageSystem(damageSystem);
        ctx.attachMapDamage(mapDamage);
        ctx.bindHero(this.hero.getAttribute());

        // 注册光环转换器
        ctx.registerAuraConverter(new CommonAuraConverter());
        ctx.registerAuraConverter(new GuardAuraConverter());

        // 注册怪物最终效果
        ctx.registerFinalEffect(new MainEnemyFinalEffect());
    }

    /**
     * 初始化存档内容
     */
    private initializeSave() {
        this.addSaveableContent('@system/hero', this.hero);
        this.addSaveableContent('@system/flags', this.flags);
        this.addSaveableContent('@system/maps', this.maps);
        this.addSaveableContent('@system/enemy', this.enemyManager);
        this.addSaveableContent('@system/replay', this.replaySystem);
    }

    /**
     * 注册全部录像指令
     */
    private initializeReplay() {
        const replay = this.replaySystem;

        const up = new ReplayMove(this, FaceDirection.Up);
        const right = new ReplayMove(this, FaceDirection.Right);
        const down = new ReplayMove(this, FaceDirection.Down);
        const left = new ReplayMove(this, FaceDirection.Left);
        const teleport = new ReplayTeleport(this);
        const useItem = new ReplayUseItem(this);
        const equip = new ReplayEquip(this);
        const unequip = new ReplayUnequip(this);

        replay.registerCommand(ReplayCode.Up, up);
        replay.registerCommand(ReplayCode.Right, right);
        replay.registerCommand(ReplayCode.Down, down);
        replay.registerCommand(ReplayCode.Left, left);
        replay.registerCommand(ReplayCode.Teleport, teleport);
        replay.registerCommand(ReplayCode.UseItem, useItem);
        replay.registerCommand(ReplayCode.Equip, equip);
        replay.registerCommand(ReplayCode.Unequip, unequip);
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

    saveState(compression: SaveCompression): ReadonlyMap<string, unknown> {
        const result = new Map<string, unknown>();
        for (const [key, value] of this.saveables) {
            const content = value.saveState(compression);
            result.set(key, content);
        }
        return result;
    }

    loadState(
        state: ReadonlyMap<string, unknown>,
        compression: SaveCompression
    ): void {
        // 需要先清空录像的禁用标记
        this.replaySystem.array.clearDisableFlag();
        for (const [key, value] of this.saveables) {
            // 使用 has 判断是否在映射中，而非值的非空判断，因为空值也有可能是存档的一部分
            if (!state.has(key)) {
                logger.warn(177, key);
                continue;
            }
            const data = state.get(key);
            // 使用禁用录像包裹所有的读档行为，避免产生意外记录
            this.replaySystem.disable();
            value.loadState(data, compression);
            this.replaySystem.revert();
            // 但 Executor 不包裹，因为它确实可能产生需要记录的行为
            const executor = this.executors.get(value);
            if (executor) {
                executor.afterLoad(value, this);
            }
        }
        const loaded = new Set<string>(state.keys());
        const total = new Set(this.saveables.keys());
        const remain = loaded.difference(total);
        if (remain.size > 0) {
            const ids = [...remain].join(' | ');
            logger.warn(178, ids);
        }
    }

    //#endregion
}
