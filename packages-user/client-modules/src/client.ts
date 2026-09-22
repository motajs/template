import { CoreState } from '@user/data-state';
import { IClientCore, IClientCoreConfig } from './types';
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
    IAutotileProcessor,
    MaterialManager,
    AutotileProcessor,
    ISaveSystem,
    SaveSystem
} from '@user/client-base';
import {
    IMapRenderer,
    IMapExtensionManager,
    MapRenderer,
    MapExtensionManager
} from './render/map';
import {
    ExcitationDivider,
    ExcitationVariator,
    IExcitation,
    IExcitationDivider,
    RafExcitation
} from '@motajs/animate';
import {
    DEBUG_DIVIDER,
    DEBUG_VARIATOR,
    DIVIDER_DEBUG_DIVIDER,
    MAIN_HEIGHT,
    MAIN_WIDTH,
    VARIATOR_DEBUG_SPEED
} from './shared';
import { loading } from '@user/data-base';
import { fallbackLoad } from './fallback/load';
import { WebLoadStarter } from '@motajs/loader';

export class ClientCore extends CoreState implements IClientCore {
    // Layer 4 渲染基础层
    readonly save: ISaveSystem;

    // Layer 5 渲染顶层
    readonly materials: ITextureManager;
    readonly autotile: IAutotileProcessor;

    readonly rafExcitation: IExcitation<number>;
    readonly excitationDivider: IExcitationDivider<number>;
    readonly renderer: IRenderTreeRoot;
    readonly mainMapRenderer: IMapRenderer;
    readonly mainMapExtension: IMapExtensionManager;

    readonly audioContext: IMotaAudioContext;
    readonly soundPlayer: ISoundPlayer<SoundIds>;
    readonly bgmPlayer: IBGMPlayer<BgmIds>;

    constructor(config: IClientCoreConfig) {
        super({
            loadStarter: new WebLoadStarter(),
            coreURL: 'placeholder'
        });

        //#region Layer 4

        this.save = new SaveSystem();
        this.save.init(`@game/${core.firstData.name}`);

        //#region 音频系统

        this.audioContext = new MotaAudioContext();
        this.soundPlayer = new SoundPlayer(this.audioContext);
        this.bgmPlayer = new BGMPlayer(this.audioContext);

        //#endregion

        //#region 素材系统

        this.materials = new MaterialManager(this);
        this.autotile = new AutotileProcessor(this.materials, this);

        //#endregion

        // 兼容层
        loading.once('loaded', () => {
            fallbackLoad(this.materials);
            loading.emit('assetBuilt');
        });

        //#region 渲染系统

        const rafExcitation = new RafExcitation();
        const excitationDivider = new ExcitationDivider<number>();

        if (DEBUG_VARIATOR) {
            const variator = new ExcitationVariator();
            variator.bindExcitation(rafExcitation);
            variator.setSpeed(VARIATOR_DEBUG_SPEED);
            excitationDivider.bindExcitation(variator);
        } else {
            excitationDivider.bindExcitation(rafExcitation);
        }

        if (DEBUG_DIVIDER) {
            excitationDivider.setDivider(DIVIDER_DEBUG_DIVIDER);
        }

        this.rafExcitation = rafExcitation;
        this.excitationDivider = excitationDivider;
        this.renderer = new MotaRenderer({
            canvas: '#render-main',
            width: MAIN_WIDTH,
            height: MAIN_HEIGHT,
            // 使用分频器，用户可以在设置中调整，如果设备性能较差调高分频有助于提高性能表现
            excitaion: excitationDivider
        });
        this.mainMapRenderer = new MapRenderer(this.materials);
        this.mainMapExtension = new MapExtensionManager(this.mainMapRenderer);

        // 兼容层
        loading.once('assetBuilt', () => {
            this.initMapExtensions();
        });

        //#endregion

        this.loader.addCoreConfig('client', config.clientURL);
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
