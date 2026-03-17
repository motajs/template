import { BGMPlayer, MotaAudioContext, SoundPlayer } from '@motajs/audio';

/** 游戏全局音频上下文 */
export const audioContext = new MotaAudioContext();
/** 音效播放器 */
export const soundPlayer = new SoundPlayer(audioContext);
/** 音乐播放器 */
export const bgmPlayer = new BGMPlayer(audioContext);
