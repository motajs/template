import { IBGMPlayer, IMotaAudioContext, ISoundPlayer } from '@motajs/audio';
import { ISaveSystem } from './save';
import { ICoreState } from '@user/data-state';
import { IAutotileProcessor, ITextureManager } from './material';
import { IRenderTreeRoot } from '@motajs/render';
import { IExcitation, IExcitationDivider } from '@motajs/animate';

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
    /** 自动元件处理器 */
    readonly autotile: IAutotileProcessor;
    /** 渲染画面的根元素 */
    readonly renderer: IRenderTreeRoot;
    /** 用于渲染系统的 Raf 激励源 */
    readonly rafExcitation: IExcitation<number>;
    /** 用于渲染系统的激励源分频器 */
    readonly excitationDivider: IExcitationDivider<number>;
}

export interface IClientBaseExtended {
    /** 当前对象的渲染端基本层对象（Layer 4 对象） */
    readonly state: IClientBase;
}
