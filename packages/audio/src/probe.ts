import {
    BlobSource,
    BufferSource,
    Input,
    OGG,
    UrlSource,
    WEBM
} from 'mediabunny';
import { logger } from '@motajs/common';
import {
    AudioCodec,
    AudioContainer,
    AudioInputSource,
    IAudioFormatInfo
} from './types';

// 只声明本 tracer 支持的容器格式，避免为其它格式付解析器体积
const mediaFormats = [OGG, WEBM];

/**
 * 把统一的音频输入类型转换为 mediabunny 支持的数据源，不支持的输入返回 null
 * @param source 音频输入数据
 */
function createMediaSource(
    source: AudioInputSource
): BufferSource | BlobSource | UrlSource | null {
    if (source instanceof ArrayBuffer) return new BufferSource(source);
    if (source instanceof Uint8Array) return new BufferSource(source);
    if (source instanceof Blob) return new BlobSource(source);
    if (typeof source === 'string') return new UrlSource(source);
    logger.warn(217, source.constructor.name);
    return null;
}

/**
 * 用 Ogg / WebM 精选格式表创建一个 mediabunny 输入
 * @param source 音频输入数据
 */
export function createMediaInput(source: AudioInputSource): Input | null {
    const mediaSource = createMediaSource(source);
    if (!mediaSource) return null;
    return new Input({ formats: mediaFormats, source: mediaSource });
}

/**
 * 把 mediabunny 的编码字符串映射为本包的音频编码枚举
 * @param codec mediabunny 返回的编码字符串
 */
function toAudioCodec(codec: string | null): AudioCodec {
    switch (codec) {
        case 'opus':
            return AudioCodec.Opus;
        case 'vorbis':
            return AudioCodec.Vorbis;
        case 'aac':
            return AudioCodec.Aac;
        case 'mp3':
            return AudioCodec.Mp3;
        case 'flac':
            return AudioCodec.Flac;
        case 'pcm-s16':
        case 'pcm-s24':
        case 'pcm-s32':
        case 'pcm-f32':
            return AudioCodec.Pcm;
        default:
            return AudioCodec.Unknown;
    }
}

/**
 * 探测音频数据的容器、编码、采样率、声道数与总时长
 * @param source 音频输入数据
 */
export async function probeAudioSource(
    source: AudioInputSource
): Promise<IAudioFormatInfo | null> {
    const input = createMediaInput(source);
    if (!input) return null;
    const readable = await input.canRead();
    if (!readable) {
        input.dispose();
        return null;
    }
    const format = await input.getFormat();
    let container = AudioContainer.Unknown;
    if (format === OGG) container = AudioContainer.Ogg;
    else if (format === WEBM) container = AudioContainer.WebM;
    if (container === AudioContainer.Unknown) {
        // 已注册格式表只有 Ogg / WebM，走到这里说明探测结果异常
        input.dispose();
        logger.error(97);
        return null;
    }
    const track = await input.getPrimaryAudioTrack();
    if (!track) {
        input.dispose();
        logger.error(97);
        return null;
    }
    const codec = toAudioCodec(await track.getCodec());
    const sampleRate = await track.getSampleRate();
    const channels = await track.getNumberOfChannels();
    const duration = await input.computeDuration();
    input.dispose();
    return { container, codec, sampleRate, channels, duration };
}
