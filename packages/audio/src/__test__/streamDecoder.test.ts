// 校验流式解码器的分块喂入、编码选择与不支持数据处置
import { describe, expect, it } from 'vitest';
import {
    BufferSource,
    BufferTarget,
    EncodedAudioPacketSource,
    EncodedPacketSink,
    Input,
    OGG,
    Output,
    WebMOutputFormat
} from 'mediabunny';
import { AudioStreamDecoder } from '../streamDecoder';
import { OpusCodecDecoder } from '../opusSession';
import { IAudioDecodedChunk } from '../types';
// 仓库根类型检查未加载 Node 类型，测试需要在 Node 环境下读取音频样例
// @ts-expect-error 此处缺少 node:fs 的模块声明，仅测试环境使用
import { readFileSync } from 'node:fs';

const opusFixture = new Uint8Array(
    readFileSync(
        new URL('../../../../public/project/bgms/bgm.opus', import.meta.url)
    )
);

const vorbisFixture = new Uint8Array(
    readFileSync(
        new URL(
            '../../../../public/_server/blockly/media/click.ogg',
            import.meta.url
        )
    )
);

// 读取指定路径的音频样例
function readFixture(path: string): Uint8Array {
    return new Uint8Array(readFileSync(new URL(path, import.meta.url)));
}

// 把 Ogg Opus 的编码包重新封装为 WebM，供 WebM 解码路径测试使用
async function transmuxToWebM(bytes: Uint8Array): Promise<Uint8Array> {
    const input = new Input({
        formats: [OGG],
        source: new BufferSource(bytes)
    });
    const track = await input.getPrimaryAudioTrack();
    const config = await track!.getDecoderConfig();
    const sink = new EncodedPacketSink(track!);
    const output = new Output({
        format: new WebMOutputFormat(),
        target: new BufferTarget()
    });
    const source = new EncodedAudioPacketSource('opus');
    output.addAudioTrack(source);
    await output.start();
    for await (const packet of sink.packets()) {
        await source.add(packet, { decoderConfig: config! });
    }
    await output.finalize();
    input.dispose();
    return new Uint8Array(output.target.buffer!);
}

// 按指定分块大小顺序喂入字节，并使用与生产同形的终止推送收尾
async function feed(
    decoder: AudioStreamDecoder,
    bytes: Uint8Array,
    chunkSize: number
): Promise<IAudioDecodedChunk[]> {
    const chunks: IAudioDecodedChunk[] = [];
    const consume = (async () => {
        for await (const chunk of decoder.chunks) chunks.push(chunk);
    })();
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        await decoder.push(bytes.subarray(offset, offset + chunkSize), false);
    }
    await decoder.push(undefined, true);
    await consume;
    return chunks;
}

// 计算一组数据块的峰值绝对值与总采样数
function summarize(chunks: IAudioDecodedChunk[]) {
    let samples = 0;
    let peak = 0;
    let lastTimestamp = -1;
    let monotonic = true;
    let channels = 0;
    for (const chunk of chunks) {
        samples += chunk.samplesDecoded;
        channels = Math.max(channels, chunk.channelData.length);
        if (chunk.timestamp < lastTimestamp) monotonic = false;
        lastTimestamp = chunk.timestamp;
        for (const channel of chunk.channelData) {
            for (let i = 0; i < channel.length; i++) {
                const abs = Math.abs(channel[i]);
                if (abs > peak) peak = abs;
            }
        }
    }
    return { samples, peak, channels, monotonic };
}

describe('流式解码', () => {
    // Ogg Opus 分块喂入应解出双声道 48 kHz 的非空 PCM
    it('Ogg Opus 分块喂入', async () => {
        const fixture = readFixture('../../../../public/project/bgms/bgm.opus');
        const decoder = new AudioStreamDecoder(new OpusCodecDecoder());
        const chunks = await feed(decoder, fixture, 16 * 1024);
        const result = summarize(chunks);
        expect(chunks.length).toBeGreaterThan(0);
        expect(result.channels).toBe(2);
        expect(chunks[0].sampleRate).toBe(48000);
        expect(result.samples).toBeGreaterThan(48000);
        expect(result.peak).toBeGreaterThan(0.001);
        expect(result.monotonic).toBe(true);
        expect(decoder.info!.codec).toBe('opus');
    });

    // WebM Opus 分块喂入应走同一条流式解码路径
    it('WebM Opus 分块喂入', async () => {
        const webm = await transmuxToWebM(opusFixture);
        const decoder = new AudioStreamDecoder(new OpusCodecDecoder());
        const chunks = await feed(decoder, webm, 16 * 1024);
        const result = summarize(chunks);
        expect(chunks.length).toBeGreaterThan(0);
        expect(result.channels).toBe(2);
        expect(chunks[0].sampleRate).toBe(48000);
        expect(result.peak).toBeGreaterThan(0.001);
    });

    // Ogg Vorbis 任意分块喂入应解出与整文件一致的采样总数
    it('Ogg Vorbis 分块喂入', async () => {
        const decoder = new AudioStreamDecoder(null);
        const chunks = await feed(decoder, vorbisFixture, 333);
        const result = summarize(chunks);
        expect(result.samples).toBe(1772);
        expect(result.channels).toBe(1);
        expect(chunks[0].sampleRate).toBe(44100);
        expect(result.peak).toBeGreaterThan(0.001);
    });

    // 不支持的数据不应产出任何数据块
    it('不支持的数据', async () => {
        const decoder = new AudioStreamDecoder(null);
        const chunks = await feed(decoder, new Uint8Array(64), 64);
        expect(chunks.length).toBe(0);
        expect(decoder.failed).toBe(true);
    });
});
