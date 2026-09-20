import { logger } from '@motajs/common';
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
    EnemyLegacyBridge,
    GuardAuraConverter,
    MainDamageCalculator,
    MainEnemyFinalEffect,
    MainMapDamageConverter,
    MainMapDamageReducer,
    registerSpecials,
    MainEnemyComparer
} from './enemy';
import { HERO_DEFAULT_ATTRIBUTE, TILE_HEIGHT, TILE_WIDTH } from './shared';
import { DefaultHeroMoveTopImpl, DefaultPassPredicateImpl } from './hero';
import { createEventRegistrations } from './event/registrations';
import {
    ReplayEquip,
    ReplayMove,
    ReplayTeleport,
    ReplayUnequip,
    ReplayUseItem
} from './replay';
import { IMotaDataLoader } from './loader/types';
import { MotaDataLoader } from './loader/loader';
import { ILoadManager, LoadManager } from '@motajs/loader';
import { DefaultDataLoaderHook } from './loader/hook';

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
        //#region L0 初始化

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
        this.tileStore = new TileStore();
        // 道具
        this.itemStore = new ItemStore<IHeroAttr>(this.tileStore);
        // 地图
        this.mapStore = new MapStore();
        // 游戏事件
        this.eventStore = new GameEventStore();

        //#endregion

        //#region L1 初始化

        // Flag 系统
        this.flags = new FlagSystem();

        // 地图
        this.maps = new MapState(this.tileStore, this);

        // 勇士
        const heroAttribute = new HeroAttribute(HERO_DEFAULT_ATTRIBUTE);
        const heroState = new HeroState(this, dir8, heroAttribute);
        this.hero = heroState;

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

        // 游戏事件系统
        const eventSystem = new GameEventSystem(
            this,
            createEventRegistrations()
        );
        this.eventSystem = eventSystem;

        // 录像系统
        this.replaySystem = new ReplaySystem();

        // 寻路系统
        this.pathfinding = new PathfindingSystem(this);
        this.pathfinding.useMover(this.hero.location.mover);
        // 初始状态下勇士不在任何楼层，切换楼层后再具体设置
        this.pathfinding.finder.useMapLayer(null);
        const predicate = new DefaultPassPredicateImpl(this);
        this.pathfinding.finder.usePassPredicate(predicate);

        //#endregion

        //#region L3 初始化

        // 加载
        this.loadManager = new LoadManager();
        this.loader = new MotaDataLoader(
            this.loadManager,
            config.coreURL,
            config.loadStarter
        );
        this.loader.addHook(new DefaultDataLoaderHook());

        // 存档内容
        this.addSaveableContent('@system/hero', this.hero);
        this.addSaveableContent('@system/flags', this.flags);
        this.addSaveableContent('@system/maps', this.maps);
        this.addSaveableContent('@system/enemy', this.enemyManager);
        this.addSaveableContent('@system/replay', this.replaySystem);

        // 勇士顶层初始化
        const heroMoveTopImpl = new DefaultHeroMoveTopImpl(this);
        this.hero.location.mover.useTopImplementation(heroMoveTopImpl);

        // 录像系统初始化注册
        this.registerReplayCommands();

        //#endregion
    }

    //#region 私有方法

    /**
     * 注册全部录像指令
     */
    private registerReplayCommands() {
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
