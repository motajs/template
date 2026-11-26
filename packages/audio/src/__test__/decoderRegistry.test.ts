// 校验编码解码器注册表的注册、创建、未注册返回 null 与上下文透传
import { describe, expect, it } from 'vitest';
import {
    AudioCodec,
    IAudioCodecDecoder,
    IAudioDecodedChunk,
    IAudioFormatInfo,
    IMotaAudioContext
} from '../types';
import { AudioDecoderRegistry } from '../decoderRegistry';

// 注册表测试只需要一个能拿住引用的空解码器，不涉及任何解码行为
class StubCodecDecoder implements IAudioCodecDecoder {
    configured: IAudioFormatInfo | null = null;

    configure(info: IAudioFormatInfo): Promise<void> {
        this.configured = info;
        return Promise.resolve();
    }

    decode(): Promise<IAudioDecodedChunk | null> {
        return Promise.resolve(null);
    }

    flush(): Promise<IAudioDecodedChunk | null> {
        return Promise.resolve(null);
    }

    destroy(): Promise<void> {
        return Promise.resolve();
    }
}

describe('编码解码器注册表', () => {
    // 注册后应为对应编码创建解码器，未注册的编码返回 null
    it('注册与创建', () => {
        const registry = new AudioDecoderRegistry({} as IMotaAudioContext);
        const decoder = new StubCodecDecoder();
        registry.registerCodecDecoder(AudioCodec.Vorbis, () => decoder);
        expect(registry.createCodecDecoder(AudioCodec.Vorbis)).toBe(decoder);
        expect(registry.createCodecDecoder(AudioCodec.Opus)).toBeNull();
    });

    // 创建解码器时应把注册表持有的音频上下文透传给工厂
    it('工厂收到上下文', () => {
        const context = {} as IMotaAudioContext;
        const registry = new AudioDecoderRegistry(context);
        let received: IMotaAudioContext | null = null;
        registry.registerCodecDecoder(AudioCodec.Opus, passed => {
            received = passed;
            return new StubCodecDecoder();
        });
        expect(registry.createCodecDecoder(AudioCodec.Opus)).not.toBeNull();
        expect(received).toBe(context);
    });
});
