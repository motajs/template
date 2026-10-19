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
    IGameUIPropsBase
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
import { createApp } from './render';
import { LoadSceneUI } from '../../../src/client/ui/load';
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

    // Layer 5 渲染顶层 - 目前没东西

    /** 已注册的渲染端插件 */
    private readonly clientPlugins: Map<
        string,
        IClientPlugin<IClientPluginDefine>
    > = new Map();
    private readonly orderedClientPlugins: IPluginOrderResult<
        IClientPlugin<IClientPluginDefine>
    >;

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
        this.orderedClientPlugins = orderPlugins(this.clientPlugins);
    }

    //#region 插件方法

    getClientPlugin<T extends IClientPluginDefine>(
        id: string
    ): Readonly<IClientPlugin<T>> | null {
        return (this.clientPlugins.get(id) as IClientPlugin<T>) ?? null;
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
        for (const holder of result.order) {
            if (holder.status !== PluginStatus.NotAwakened) continue;
            const dependencies: IClientPlugin<IClientPluginDefine>[] = [];
            for (const dependency of holder.plugin.dependencies) {
                const plugin = this.clientPlugins.get(dependency);
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
        await super.initialize();
        const result = this.orderedClientPlugins;
        for (const holder of result.order) {
            if (holder.status !== PluginStatus.Awakened) continue;
            const dependencies: IClientPlugin<IClientPluginDefine>[] = [];
            for (const dependency of holder.plugin.dependencies) {
                const plugin = this.clientPlugins.get(dependency);
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
        await super.afterLoad();
        const result = this.orderedClientPlugins;
        for (const holder of result.order) {
            if (holder.status !== PluginStatus.Initialized) continue;
            const dependencies: IClientPlugin<IClientPluginDefine>[] = [];
            for (const dependency of holder.plugin.dependencies) {
                const plugin = this.clientPlugins.get(dependency);
                if (plugin) dependencies.push(plugin);
            }
            await holder.plugin.afterLoad(this, dependencies);
            holder.status = PluginStatus.Loaded;
        }
    }

    //#endregion

    /**
     * 初始化渲染端主对象
     */
    private async init() {
        createApp(this.sceneController.render()).mount(this.renderer);
        this.sceneController.open(LoadSceneUI, {});
    }

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
