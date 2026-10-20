import {
    Hookable,
    HookController,
    IHookController,
    logger
} from '@motajs/common';
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
    ReplaySystem,
    IDataCommonHooks
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
    CombatFlow,
    EnemyContext,
    GameEventSystem,
    ICombatFlow,
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
    IPluginDefine,
    IPluginBase,
    ISaveableExecutor,
    PluginStatus
} from './types';
import { IPluginOrderResult, orderPlugins } from './plugin';
import { IMotaDataLoader, MotaDataLoader } from './loader';

export class CoreState
    extends Hookable<IDataCommonHooks>
    implements ICoreState
{
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
    readonly combat: ICombatFlow<IEnemyAttr, IHeroAttr>;
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

    /** 已注册的数据端插件 */
    private readonly dataPlugins: Map<string, IDataPlugin> = new Map();
    /** 排序后的数据端插件 */
    private readonly orderedDataPlugins: IPluginOrderResult;

    constructor(config: Readonly<ICoreStateConfig>) {
        super();
        // L0 定义
        this.roleFace = new RoleFaceBinder();
        this.faceManager = new FaceManager();
        this.tileStore = new TileStore();
        this.itemStore = new ItemStore<IHeroAttr>(this.tileStore);
        this.mapStore = new MapStore();
        this.eventStore = new GameEventStore();
        this.replaySystem = new ReplaySystem();

        // L1 定义
        this.flags = new FlagSystem();
        this.maps = new MapState(this);
        this.hero = new HeroState(this);
        this.enemyManager = new EnemyManager<IEnemyAttr>(this.tileStore);

        // L2 定义
        this.enemyContext = new EnemyContext<IEnemyAttr, IHeroAttr>(this);
        this.combat = new CombatFlow(this);
        this.eventSystem = new GameEventSystem(this, config.events);
        this.pathfinding = new PathfindingSystem(this);

        // L3 定义
        this.loadManager = new LoadManager();
        this.loader = new MotaDataLoader(this.loadManager, config.loadStarter);

        this.loader.addCoreConfig('core', config.coreURL);

        // 数据端插件注册表
        for (const define of config.dataPlugins) {
            if (this.dataPlugins.has(define.id)) {
                logger.error(78, define.id);
                continue;
            }
            this.dataPlugins.set(define.id, {
                status: PluginStatus.NotAwakened,
                plugin: define
            });
        }
        const deps = new Map<string, readonly string[]>();
        for (const [id, plugin] of this.dataPlugins) {
            deps.set(id, plugin.plugin.dataDeps);
        }
        this.orderedDataPlugins = orderPlugins(deps);
        this.awake();
    }

    protected createController(
        hook: Partial<IDataCommonHooks>
    ): IHookController<IDataCommonHooks> {
        return new HookController(this, hook);
    }

    emitTip(tip: string, icon?: number): void {
        this.forEachHook(hook => hook.onTip?.(tip, icon));
    }

    //#region 插件方法

    /**
     * 检查插件加载状态
     * @param plugin 插件状态对象
     * @param expected 预期的插件加载状态
     */
    protected checkPluginStatus(
        plugin: IPluginDefine<IPluginBase>,
        expected: PluginStatus
    ) {
        if (plugin.status === expected) {
            return true;
        } else {
            logger.error(
                80,
                plugin.plugin.id,
                expected.toString(),
                plugin.status.toString()
            );
            return false;
        }
    }

    /**
     * 获取指定插件的所有数据端插件依赖对象
     * @param plugin 目标插件定义对象
     */
    protected getDataDependencies(plugin: IPluginBase): IDataPlugin[] {
        const dependencies: IDataPlugin[] = [];
        for (const dependency of plugin.dataDeps) {
            const plugin = this.dataPlugins.get(dependency);
            if (plugin) dependencies.push(plugin);
        }
        return dependencies;
    }

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
        for (const id of result.order) {
            const holder = this.dataPlugins.get(id)!;
            const plugin = holder.plugin;
            if (!this.checkPluginStatus(holder, PluginStatus.NotAwakened)) {
                continue;
            }
            const dependencies = this.getDataDependencies(plugin);
            plugin.awake(this, dependencies);
            holder.status = PluginStatus.Awakened;
        }
    }

    /**
     * 插件异步初始化
     */
    protected async initialize(): Promise<void> {
        const result = this.orderedDataPlugins;
        for (const id of result.order) {
            const holder = this.dataPlugins.get(id)!;
            const plugin = holder.plugin;
            if (!this.checkPluginStatus(holder, PluginStatus.Awakened)) {
                continue;
            }
            const dependencies = this.getDataDependencies(plugin);
            await plugin.initialize(this, dependencies);
            holder.status = PluginStatus.Initialized;
        }
    }

    /**
     * 插件加载初始化
     */
    protected async afterLoad(): Promise<void> {
        const result = this.orderedDataPlugins;
        for (const id of result.order) {
            const holder = this.dataPlugins.get(id)!;
            const plugin = holder.plugin;
            if (!this.checkPluginStatus(holder, PluginStatus.Initialized)) {
                continue;
            }
            const dependencies = this.getDataDependencies(plugin);
            await plugin.afterLoad(this, dependencies);
            holder.status = PluginStatus.Loaded;
        }
    }

    getDataPlugin<T extends IDataPluginDefine>(
        id: string
    ): Readonly<IDataPlugin<T>> | null {
        return (this.dataPlugins.get(id) as IDataPlugin<T>) ?? null;
    }

    //#endregion

    //#region 初始化方法

    async *load(): AsyncGenerator<number, void> {
        await this.initialize();
        yield* this.loader.start();
        await this.afterLoad();
        for (const plugin of this.dataPlugins.values()) {
            if (plugin.status !== PluginStatus.Loaded) {
                logger.error(81, plugin.plugin.id);
            }
        }
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
