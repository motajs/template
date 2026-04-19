import { ICoreState } from '@user/data-state';
import { IClientCore } from './types';
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
    IMotaAssetsLoader,
    IMaterialManager,
    IAutotileProcessor,
    MotaAssetsLoader,
    MaterialManager,
    AutotileProcessor
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

export class ClientCore implements IClientCore {
    readonly loader: IMotaAssetsLoader;

    readonly materials: IMaterialManager;
    readonly autotile: IAutotileProcessor;

    readonly rafExcitation: IExcitation<number>;
    readonly excitationDivider: IExcitationDivider<number>;
    readonly renderer: IRenderTreeRoot;
    readonly mainMapRenderer: IMapRenderer;
    readonly mainMapExtension: IMapExtensionManager;

    readonly audioContext: IMotaAudioContext;
    readonly soundPlayer: ISoundPlayer<SoundIds>;
    readonly bgmPlayer: IBGMPlayer<BgmIds>;

    constructor(public data: ICoreState) {
        //#region 音频系统

        this.audioContext = new MotaAudioContext();
        this.soundPlayer = new SoundPlayer(this.audioContext);
        this.bgmPlayer = new BGMPlayer(this.audioContext);

        //#endregion

        //#region 素材系统

        this.materials = new MaterialManager();
        this.autotile = new AutotileProcessor(this.materials);

        //#endregion

        this.loader = new MotaAssetsLoader(
            data.loadProgress,
            data.dataLoader,
            this.audioContext,
            this.soundPlayer,
            this.materials
        );

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
        this.mainMapRenderer = new MapRenderer(this.materials, data.layer);
        this.mainMapExtension = new MapExtensionManager(this.mainMapRenderer);

        // 兼容层
        loading.once('assetBuilt', () => {
            this.createMainExtension();
        });

        //#endregion
    }

    /**
     * 进行地图渲染拓展初始化
     */
    private async createMainExtension() {
        // 算是一种妥协吧，等之后加载系统重构之后应该会清晰很多
        await this.materials.trackedAsset.then();

        this.mainMapRenderer.useAsset(this.materials.trackedAsset);
        const layer = this.data.layer.getLayerByAlias('event');
        if (layer) {
            this.mainMapExtension.addHero(this.data.hero.mover, layer);
            this.mainMapExtension.addDoor(layer);
        }
        this.mainMapExtension.addText();
    }

    bindDataState(state: ICoreState): void {
        this.data = state;
    }

    getDataState(): ICoreState {
        return this.data;
    }
}
