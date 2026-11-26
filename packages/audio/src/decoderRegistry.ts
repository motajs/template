import {
    AudioCodec,
    AudioCodecDecoderCreateFunc,
    IAudioCodecDecoder,
    IAudioDecoderRegistry,
    IMotaAudioContext
} from './types';

export class AudioDecoderRegistry implements IAudioDecoderRegistry {
    /** 创建编码解码器时透传给工厂的音频上下文 */
    private readonly context: IMotaAudioContext;
    /** 编码到解码器创建函数的映射 */
    private readonly decoders: Map<AudioCodec, AudioCodecDecoderCreateFunc> =
        new Map();

    constructor(context: IMotaAudioContext) {
        this.context = context;
    }

    registerCodecDecoder(
        codec: AudioCodec,
        decoder: AudioCodecDecoderCreateFunc
    ): void {
        this.decoders.set(codec, decoder);
    }

    createCodecDecoder(codec: AudioCodec): IAudioCodecDecoder | null {
        const create = this.decoders.get(codec);
        if (!create) return null;
        return create(this.context);
    }
}
