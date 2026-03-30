import {
    AudioType,
    BGMPlayer,
    MotaAudioContext,
    OpusDecoder,
    SoundPlayer,
    VorbisDecoder
} from '@motajs/audio';
import { MotaAssetsLoader } from './load/loader';
import { AutotileProcessor, MaterialManager } from './material';
import { dataLoader, loadProgress } from '@user/data-base';

//#region 音频实例

/** 游戏全局音频上下文 */
export const audioContext = new MotaAudioContext();
/** 音效播放器 */
export const soundPlayer = new SoundPlayer(audioContext);
/** 音乐播放器 */
export const bgmPlayer = new BGMPlayer(audioContext);

audioContext.registerDecoder(AudioType.Opus, () => new OpusDecoder());
audioContext.registerDecoder(AudioType.Ogg, () => new VorbisDecoder());

//#endregion

//#region 素材实例

/** 素材管理器 */
export const materials = new MaterialManager();
/** 自动元件处理器 */
export const autotile = new AutotileProcessor(materials);

//#endregion

//#region 加载实例

/** 客户端加载实例 */
export const loader = new MotaAssetsLoader(
    loadProgress,
    dataLoader,
    audioContext,
    soundPlayer,
    materials
);

//#endregion
