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
    IHeroAttr,
    IEnemyAttr,
    GameEventStore,
    IGameEventStore,
    IItemStore,
    ItemStore,
    IMapStore,
    MapStore,
    IReplaySystem,
    ReplaySystem
} from '@user/data-common';
import {
    EnemyManager,
    IEnemyManager,
    HeroState,
    IHeroState,
    IFlagSystem,
    FlagSystem,
    IMapState,
    MapState
} from '@user/data-base';
import {
    EnemyContext,
    GameEventSystem,
    IEnemyContext,
    IGameEventSystem,
    IPathfindingSystem,
    PathfindingSystem
} from '@user/data-system';
import {
    ICoreState,
    ICoreStateConfig,
    IDataPlugin,
    IDataPluginDefine,
    ISaveableExecutor,
    PluginStatus
} from './types';
import { IPluginOrderResult, orderPlugins } from './plugin';
import { IMotaDataLoader, MotaDataLoader } from './loader';

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

    /** 已注册的插件 */
    private readonly plugins: Map<string, IDataPlugin<IDataPluginDefine>> =
        new Map();
    private readonly orderedDataPlugins: IPluginOrderResult<
        IDataPlugin<IDataPluginDefine>
    >;

    constructor(config: Readonly<ICoreStateConfig>) {
        // L0 定义
        this.roleFace = new RoleFaceBinder();
        this.faceManager = new FaceManager();
        this.tileStore = new TileStore();
        this.itemStore = new ItemStore<IHeroAttr>(this.tileStore);
        this.mapStore = new MapStore();
        this.eventStore = new GameEventStore();

        // L1 定义
        this.flags = new FlagSystem();
        this.maps = new MapState(this);
        this.hero = new HeroState(this);
        this.enemyManager = new EnemyManager<IEnemyAttr>(this.tileStore);

        // L2 定义
        this.enemyContext = new EnemyContext<IEnemyAttr, IHeroAttr>(this);
        this.eventSystem = new GameEventSystem(this, config.events);
        this.replaySystem = new ReplaySystem();
        this.pathfinding = new PathfindingSystem(this);

        // L3 定义
        this.loadManager = new LoadManager();
        this.loader = new MotaDataLoader(this.loadManager, config.loadStarter);

        this.loader.addCoreConfig('core', config.coreURL);

        // 数据端插件注册表
        for (const define of config.dataPlugins) {
            if (this.plugins.has(define.id)) {
                logger.error(78, define.id);
                continue;
            }
            this.plugins.set(define.id, {
                status: PluginStatus.NotAwakened,
                plugin: define
            });
        }
        this.orderedDataPlugins = orderPlugins(this.plugins);
        this.awake();
    }

    //#region 插件方法

    /**
     * 插件同步初始化
     */
    protected awake(): void {
        const result = this.orderedDataPlugins;
        if (result.cyclic.size > 0) {
            logger.error(76, [...result.cyclic].join(', '));
        }
        for (const [pluginId, lacked] of result.missing) {
            for (const dependency of lacked) {
                logger.error(77, pluginId, dependency);
            }
        }
        for (const holder of result.order) {
            if (holder.status !== PluginStatus.NotAwakened) continue;
            const dependencies: IDataPlugin<IDataPluginDefine>[] = [];
            for (const dependency of holder.plugin.dependencies) {
                const plugin = this.plugins.get(dependency);
                if (plugin) dependencies.push(plugin);
            }
            holder.plugin.awake(this, dependencies);
            holder.status = PluginStatus.Awakened;
        }
    }

    /**
     * 插件异步初始化
     */
    protected async initialize(): Promise<void> {
        const result = this.orderedDataPlugins;
        for (const holder of result.order) {
            if (holder.status !== PluginStatus.Awakened) continue;
            const dependencies: IDataPlugin<IDataPluginDefine>[] = [];
            for (const dependency of holder.plugin.dependencies) {
                const plugin = this.plugins.get(dependency);
                if (plugin) dependencies.push(plugin);
            }
            await holder.plugin.initialize(this, dependencies);
            holder.status = PluginStatus.Initialized;
        }
    }

    /**
     * 插件加载初始化
     */
    protected async afterLoad(): Promise<void> {
        const result = this.orderedDataPlugins;
        for (const holder of result.order) {
            if (holder.status !== PluginStatus.Initialized) continue;
            const dependencies: IDataPlugin<IDataPluginDefine>[] = [];
            for (const dependency of holder.plugin.dependencies) {
                const plugin = this.plugins.get(dependency);
                if (plugin) dependencies.push(plugin);
            }
            await holder.plugin.afterLoad(this, dependencies);
            holder.status = PluginStatus.Loaded;
        }
    }

    getDataPlugin<T extends IDataPluginDefine>(
        id: string
    ): Readonly<IDataPlugin<T>> | null {
        return (this.plugins.get(id) as IDataPlugin<T>) ?? null;
    }

    //#endregion

    //#region 初始化方法

    async *load(): AsyncGenerator<number, void> {
        await this.initialize();
        yield* this.loader.start();
        await this.afterLoad();
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
