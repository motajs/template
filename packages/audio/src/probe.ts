import {
    ADTS,
    BlobSource,
    BufferSource,
    FLAC,
    Input,
    InputFormat,
    MP3,
    MP4,
    OGG,
    UrlSource,
    WAVE,
    WEBM
} from 'mediabunny';
import { logger } from '@motajs/common';
import {
    AudioCodec,
    AudioContainer,
    AudioInputSource,
    IAudioFormatInfo
} from './types';

// 声明本包支持的全部容器格式，原生支持的格式仍优先走浏览器解码
const mediaFormats = [MP4, WEBM, OGG, WAVE, FLAC, MP3, ADTS];

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
 * 用支持格式表创建一个 mediabunny 输入
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
 * 把 mediabunny 的容器格式映射为本包的音频容器枚举
 * @param format mediabunny 返回的容器格式
 */
function toAudioContainer(format: InputFormat): AudioContainer {
    switch (format) {
        case MP4:
            return AudioContainer.Mp4;
        case WEBM:
            return AudioContainer.WebM;
        case OGG:
            return AudioContainer.Ogg;
        case WAVE:
            return AudioContainer.Wav;
        case FLAC:
            return AudioContainer.Flac;
        case MP3:
            return AudioContainer.Mp3;
        case ADTS:
            return AudioContainer.Adts;
        default:
            return AudioContainer.Unknown;
    }
}

/**
 * 读取音频时长，优先使用容器头部信息，必要时才扫描整个文件
 * @param input mediabunny 输入
 * @param container 已识别的容器格式
 */
async function readDuration(
    input: Input,
    container: AudioContainer
): Promise<number | null> {
    const duration = await input.getDurationFromMetadata();
    if (duration !== null) return duration;
    // Ogg 与 WebM 不记录头部时长，整文件解码本来就要遍历全部数据
    if (container === AudioContainer.Ogg || container === AudioContainer.WebM) {
        return input.computeDuration();
    }
    return null;
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
    const container = toAudioContainer(await input.getFormat());
    if (container === AudioContainer.Unknown) {
        // 已注册格式表覆盖全部支持的容器，走到这里说明探测结果异常
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
    const duration = await readDuration(input, container);
    input.dispose();
    return { container, codec, sampleRate, channels, duration };
}
