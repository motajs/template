import { IExcitation, IExcitationDivider } from '@motajs/animate';
import { IRenderTreeRoot } from '@motajs/render';
import { IRendererUsing } from '@motajs/render-vue';
import { UIController } from '@motajs/system';
import { IBGMPlayer, IMotaAudioContext, ISoundPlayer } from '@motajs/audio';
import { ICoreState } from '@user/data-state';
import { ISaveSystem } from './save';
import { ITextureManager } from './material';
import { IMapRenderer, IMapExtensionManager } from './map';

export interface IClientBase extends ICoreState {
    /** 存档系统 */
    readonly save: ISaveSystem;
    /** 音频上下文 */
    readonly audioContext: IMotaAudioContext;
    /** 音效播放器 */
    readonly soundPlayer: ISoundPlayer<SoundIds>;
    /** BGM 播放器 */
    readonly bgmPlayer: IBGMPlayer<BgmIds>;
    /** 素材管理器 */
    readonly materials: ITextureManager;
    /** 渲染画面的根元素 */
    readonly renderer: IRenderTreeRoot;
    /** 用于渲染系统的 Raf 激励源 */
    readonly rafExcitation: IExcitation<number>;
    /** 用于渲染系统的激励源分频器 */
    readonly excitationDivider: IExcitationDivider<number>;
    /** 主地图渲染器，主要用于渲染游戏画面中的地图 */
    readonly mainMapRenderer: IMapRenderer;
    /** 副地图渲染器，主要用于渲染缩略图、浏览地图等内容 */
    readonly expandMapRenderer: IMapRenderer;
    /** 主地图渲染器的拓展管理对象 */
    readonly mainMapExtension: IMapExtensionManager;
    /** 渲染器使用对象，供组件内注册渲染激励与事件监听 */
    readonly using: IRendererUsing;
    /** 主场景的 UI 控制器，管理游戏主场景的 UI 显示 */
    readonly sceneController: UIController;
    /** 主界面的 UI 控制器，管理游戏主界面的 UI 显示 */
    readonly mainUIController: UIController;
}

export interface IClientBaseExtended {
    /** 当前对象的渲染端基本层对象（Layer 4 对象） */
    readonly state: IClientBase;
}
