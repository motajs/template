import {
    CoreState,
    IPluginOrderResult,
    orderPlugins,
    PluginStatus
} from '@user/data-state';
import {
    IClientCore,
    IClientCoreConfig,
    IClientPlugin,
    IClientPluginDefine
} from './types';
import { logger } from '@motajs/common';
import {
    IMotaAudioContext,
    ISoundPlayer,
    IBGMPlayer,
    MotaAudioContext,
    SoundPlayer,
    BGMPlayer
} from '@motajs/audio';
import { IRenderTreeRoot, MotaRenderer } from '@motajs/render';
import {
    ITextureManager,
    TextureManager,
    ISaveSystem,
    SaveSystem,
    IGameUIPropsBase,
    ClientHotkey,
    IClientHotkey
} from '@user/client-base';
import {
    IMapRenderer,
    IMapExtensionManager,
    MapRenderer,
    MapExtensionManager
} from '@user/client-base';
import {
    ExcitationDivider,
    IExcitation,
    IExcitationDivider,
    RafExcitation
} from '@motajs/animate';
import { IRendererUsing, RendererUsing } from '@motajs/render-vue';
import { IUIController, UIController } from '@motajs/system';
import { createUIPropsBase } from './ui/func';

export class ClientCore extends CoreState implements IClientCore {
    // Layer 4 渲染基础层
    readonly save: ISaveSystem;
    readonly audioContext: IMotaAudioContext;
    readonly soundPlayer: ISoundPlayer<SoundIds>;
    readonly bgmPlayer: IBGMPlayer<BgmIds>;
    readonly rafExcitation: IExcitation<number>;
    readonly excitationDivider: IExcitationDivider<number>;
    readonly renderer: IRenderTreeRoot;
    readonly materials: ITextureManager;
    readonly using: IRendererUsing;
    readonly mainMapRenderer: IMapRenderer;
    readonly expandMapRenderer: IMapRenderer;
    readonly mainMapExtension: IMapExtensionManager;
    readonly sceneController: IUIController<IGameUIPropsBase>;
    readonly mainUIController: IUIController<IGameUIPropsBase>;
    readonly hotkey: IClientHotkey;

    // Layer 5 渲染顶层 - 目前没东西

    /** 已注册的渲染端插件 */
    private readonly clientPlugins: Map<string, IClientPlugin> = new Map();
    /** 排序后的渲染端插件 */
    private readonly orderedClientPlugins: IPluginOrderResult;

    constructor(config: IClientCoreConfig) {
        super(config);

        this.save = new SaveSystem();
        this.audioContext = new MotaAudioContext();
        this.soundPlayer = new SoundPlayer(this.audioContext);
        this.bgmPlayer = new BGMPlayer(this.audioContext);
        this.materials = new TextureManager(
            this,
            config.tilesetReserve,
            config.tilesetUnit
        );
        this.hotkey = new ClientHotkey();

        this.rafExcitation = new RafExcitation();
        this.excitationDivider = new ExcitationDivider<number>();

        this.renderer = new MotaRenderer({
            canvas: '#render-main',
            width: config.renderWidth,
            height: config.renderHeight,
            // 使用分频器，用户可以在设置中调整，如果设备性能较差调高分频有助于提高性能表现
            excitaion: this.excitationDivider
        });
        this.using = new RendererUsing(this.renderer);
        this.mainMapRenderer = new MapRenderer(this.materials);
        this.mainMapExtension = new MapExtensionManager(this.mainMapRenderer);
        this.expandMapRenderer = new MapRenderer(this.materials);
        this.sceneController = new UIController<IGameUIPropsBase>();
        this.mainUIController = new UIController<IGameUIPropsBase>();
        const pbCreator = createUIPropsBase(this);
        this.sceneController.setPropsBaseCreator(pbCreator);
        this.mainUIController.setPropsBaseCreator(pbCreator);

        this.loader.addCoreConfig('client', config.clientURL);

        // 渲染端插件注册表
        for (const define of config.clientPlugins) {
            if (this.clientPlugins.has(define.id)) {
                logger.error(78, define.id);
                continue;
            }
            this.clientPlugins.set(define.id, {
                status: PluginStatus.NotAwakened,
                plugin: define
            });
        }
        const deps = new Map<string, readonly string[]>();
        for (const [id, plugin] of this.clientPlugins) {
            deps.set(id, plugin.plugin.clientDeps);
        }
        this.orderedClientPlugins = orderPlugins(deps);
    }

    //#region 插件方法

    /**
     * 获取指定插件的所有渲染端插件依赖对象
     * @param plugin 目标插件定义对象
     */
    protected getClientDependencies(
        plugin: IClientPluginDefine
    ): IClientPlugin[] {
        const dependencies: IClientPlugin[] = [];
        for (const dependency of plugin.dataDeps) {
            const plugin = this.clientPlugins.get(dependency);
            if (plugin) dependencies.push(plugin);
        }
        return dependencies;
    }

    /**
     * 插件同步初始化
     */
    protected awake(): void {
        super.awake();
        const result = this.orderedClientPlugins;
        if (result.cyclic.size > 0) {
            logger.error(76, [...result.cyclic].join(', '));
        }
        for (const [pluginId, lacked] of result.missing) {
            for (const dependency of lacked) {
                logger.error(77, pluginId, dependency);
            }
        }
        for (const id of result.order) {
            const holder = this.clientPlugins.get(id)!;
            const plugin = holder.plugin;
            if (!this.checkPluginStatus(holder, PluginStatus.NotAwakened)) {
                continue;
            }
            const dataDeps = this.getDataDependencies(plugin);
            const clientDeps = this.getClientDependencies(plugin);
            plugin.awake(this, dataDeps, clientDeps);
            holder.status = PluginStatus.Awakened;
        }
    }

    /**
     * 插件异步初始化
     */
    protected async initialize(): Promise<void> {
        await super.initialize();
        const result = this.orderedClientPlugins;
        for (const id of result.order) {
            const holder = this.clientPlugins.get(id)!;
            const plugin = holder.plugin;
            if (!this.checkPluginStatus(holder, PluginStatus.Awakened)) {
                continue;
            }
            const dataDeps = this.getDataDependencies(plugin);
            const clientDeps = this.getClientDependencies(plugin);
            await plugin.initialize(this, dataDeps, clientDeps);
            holder.status = PluginStatus.Initialized;
        }
    }

    /**
     * 插件加载初始化
     */
    protected async afterLoad(): Promise<void> {
        await super.afterLoad();
        const result = this.orderedClientPlugins;
        for (const id of result.order) {
            const holder = this.clientPlugins.get(id)!;
            const plugin = holder.plugin;
            if (!this.checkPluginStatus(holder, PluginStatus.Initialized)) {
                continue;
            }
            const dataDeps = this.getDataDependencies(plugin);
            const clientDeps = this.getClientDependencies(plugin);
            await plugin.afterLoad(this, dataDeps, clientDeps);
            holder.status = PluginStatus.Loaded;
        }
    }

    getClientPlugin<T extends IClientPluginDefine>(
        id: string
    ): Readonly<IClientPlugin<T>> | null {
        return (this.clientPlugins.get(id) as IClientPlugin<T>) ?? null;
    }

    async *load(): AsyncGenerator<number, void> {
        yield* super.load();
        for (const plugin of this.clientPlugins.values()) {
            if (plugin.status !== PluginStatus.Loaded) {
                logger.error(81, plugin.plugin.id);
            }
        }
    }

    //#endregion

    /**
     * 进行地图渲染拓展初始化
     */
    private async initMapExtensions() {
        // 算是一种妥协吧，等之后加载系统重构之后应该会清晰很多
        await this.materials.trackedAsset.then();

        this.mainMapRenderer.useAsset(this.materials.trackedAsset);
        // const layer = this.maps.getLayerByAlias('event');
        // if (layer) {
        //     this.mainMapExtension.addHero(this.hero.mover, layer);
        //     this.mainMapExtension.addDoor(layer);
        // }
        this.mainMapExtension.addText();
    }
}
