import { IRenderTreeRoot } from '@motajs/render';
import { ICoreState } from '@user/data-state';
import { IMapExtensionManager, IMapRenderer } from './render/map';
import { IBGMPlayer, IMotaAudioContext, ISoundPlayer } from '@motajs/audio';
import {
    IAutotileProcessor,
    IMaterialManager,
    IMotaAssetsLoader
} from '@user/client-base';
import { IExcitation, IExcitationDivider } from '@motajs/animate';

export interface IClientCore {
    /** 数据端状态对象 */
    readonly data: ICoreState;

    readonly loader: IMotaAssetsLoader;

    /** 素材管理器 */
    readonly materials: IMaterialManager;
    /** 自动元件处理器 */
    readonly autotile: IAutotileProcessor;

    /** 用于渲染系统的 Raf 激励源 */
    readonly rafExcitation: IExcitation<number>;
    /** 用于渲染系统的激励源分频器 */
    readonly excitationDivider: IExcitationDivider<number>;
    /** 渲染画面的根元素 */
    readonly renderer: IRenderTreeRoot;
    /** 主地图渲染器，主要用于渲染游戏画面中的地图 */
    readonly mainMapRenderer: IMapRenderer;
    /** 副地图渲染器，主要用于渲染缩略图、浏览地图等内容 */
    // readonly expandMapRenderer: IMapRenderer;
    /** 主地图渲染器的拓展管理对象 */
    readonly mainMapExtension: IMapExtensionManager;

    /** 音频上下文 */
    readonly audioContext: IMotaAudioContext;
    /** 音效播放器 */
    readonly soundPlayer: ISoundPlayer<SoundIds>;
    /** BGM 播放器 */
    readonly bgmPlayer: IBGMPlayer<BgmIds>;

    /**
     * 绑定数据端状态
     * @param state 数据端状态
     */
    bindDataState(state: ICoreState): void;

    /**
     * 获取当前绑定的数据端状态对象
     */
    getDataState(): ICoreState;
}
