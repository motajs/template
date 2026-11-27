import { AudioType } from './types';

const audio = new Audio();

const supportMap = new Map<string, boolean>();

/**
 * 检查一种音频类型是否能被播放
 * @param type 音频类型
 */
export function isAudioSupport(type: AudioType): boolean {
    if (supportMap.has(type)) return supportMap.get(type)!;
    else {
        const support = audio.canPlayType(type);
        const canPlay = support === 'maybe' || support === 'probably';
        supportMap.set(type, canPlay);
        return canPlay;
    }
}

const typeMap = new Map<string, AudioType>([
    ['ogg', AudioType.Ogg],
    ['mp3', AudioType.Mp3],
    ['wav', AudioType.Wav],
    ['flac', AudioType.Flac],
    ['opus', AudioType.Opus],
    ['aac', AudioType.Aac],
    ['webm', AudioType.WebM]
]);

/**
 * 根据文件名拓展猜测其类型
 * @param file 文件名
 */
export function guessTypeByExt(file: string): AudioType | '' {
    const ext = /\.[a-zA-Z\d]+$/.exec(file);
    if (!ext?.[0]) return '';
    const type = ext[0].slice(1);
    return typeMap.get(type.toLocaleLowerCase()) ?? '';
}

/** 可由流式音频源增量解码的格式 */
const streamTypes: Set<AudioType> = new Set([
    AudioType.Ogg,
    AudioType.Opus,
    AudioType.WebM
]);

/**
 * 检查一种音频类型是否可由流式音频源播放
 * @param type 音频类型
 */
export function isAudioStreamSupport(type: AudioType): boolean {
    return streamTypes.has(type);
}

isAudioSupport(AudioType.Ogg);
isAudioSupport(AudioType.Mp3);
isAudioSupport(AudioType.Wav);
isAudioSupport(AudioType.Flac);
isAudioSupport(AudioType.Opus);
isAudioSupport(AudioType.Aac);
isAudioSupport(AudioType.WebM);
