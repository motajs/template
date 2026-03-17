import { OggVorbisDecoderWebWorker } from '@wasm-audio-decoders/ogg-vorbis';
import { OggOpusDecoderWebWorker } from 'ogg-opus-decoder';
import { IAudioDecodeData, IAudioDecoder, IMotaAudioContext } from './types';

export class VorbisDecoder implements IAudioDecoder {
    decoder?: OggVorbisDecoderWebWorker;

    async create(): Promise<void> {
        this.decoder = new OggVorbisDecoderWebWorker();
        await this.decoder.ready;
    }

    async destroy(): Promise<void> {
        if (!this.decoder) return;
        else return this.decoder.free();
    }

    async decode(data: Uint8Array): Promise<IAudioDecodeData | null> {
        if (!this.decoder) return Promise.resolve(null);
        else return this.decoder.decode(data) as Promise<IAudioDecodeData>;
    }

    async decodeAll(data: Uint8Array): Promise<IAudioDecodeData | null> {
        if (!this.decoder) return Promise.resolve(null);
        else return this.decoder.decodeFile(data) as Promise<IAudioDecodeData>;
    }

    async flush(): Promise<IAudioDecodeData | null> {
        if (!this.decoder) return Promise.resolve(null);
        else return this.decoder.flush() as Promise<IAudioDecodeData>;
    }
}

export class OpusDecoder implements IAudioDecoder {
    decoder?: OggOpusDecoderWebWorker;

    async create(): Promise<void> {
        this.decoder = new OggOpusDecoderWebWorker({
            speechQualityEnhancement: 'none'
        });
        await this.decoder.ready;
    }

    async destroy(): Promise<void> {
        if (!this.decoder) return;
        else return this.decoder.free();
    }

    async decode(data: Uint8Array): Promise<IAudioDecodeData | null> {
        if (!this.decoder) return Promise.resolve(null);
        else return this.decoder.decode(data) as Promise<IAudioDecodeData>;
    }

    async decodeAll(data: Uint8Array): Promise<IAudioDecodeData | null> {
        if (!this.decoder) return Promise.resolve(null);
        else return this.decoder.decodeFile(data) as Promise<IAudioDecodeData>;
    }

    async flush(): Promise<IAudioDecodeData | null> {
        if (!this.decoder) return Promise.resolve(null);
        else return this.decoder.flush() as Promise<IAudioDecodeData>;
    }
}

export class VanillaDecoder implements IAudioDecoder {
    constructor(readonly ac: IMotaAudioContext) {}

    create(): Promise<void> {
        return Promise.resolve();
    }

    destroy(): Promise<void> {
        return Promise.resolve();
    }

    private async decodeData(
        data: Uint8Array
    ): Promise<IAudioDecodeData | null> {
        if (data.buffer instanceof ArrayBuffer) {
            const buffer = await this.ac.ac.decodeAudioData(data.buffer);
            const decodedData: Float32Array<ArrayBuffer>[] = [];
            for (let i = 0; i < buffer.numberOfChannels; i++) {
                const data = buffer.getChannelData(i);
                decodedData.push(data);
            }
            const sampled = decodedData[0].length;
            const sampleRate = buffer.sampleRate;
            return {
                errors: [],
                channelData: decodedData,
                samplesDecoded: sampled,
                sampleRate
            };
        } else {
            return Promise.resolve(null);
        }
    }

    decode(data: Uint8Array): Promise<IAudioDecodeData | null> {
        return this.decodeData(data);
    }

    decodeAll(data: Uint8Array): Promise<IAudioDecodeData | null> {
        return this.decodeData(data);
    }

    flush(): Promise<IAudioDecodeData | null> {
        return Promise.resolve(null);
    }
}
