// 校验 Ogg Opus 与 WebM Opus 的格式探测、编码解码器与整文件解码会话
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
import { AudioCodec, AudioContainer } from '../types';
import {
    parseOpusIdentificationHeader,
    createOpusDecodeSession,
    OpusCodecDecoder
} from '../opusSession';
import { probeAudioSource } from '../probe';
// 仓库根类型检查未加载 Node 类型，测试需要在 Node 环境下读取音频样例
// @ts-expect-error 此处缺少 node:fs 的模块声明，仅测试环境使用
import { readFileSync } from 'node:fs';

const fixture = new Uint8Array(
    readFileSync(
        new URL('../../../../public/project/bgms/bgm.opus', import.meta.url)
    )
);

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

describe('opus 解码', () => {
    // 探测 bgm.opus 应识别为 Ogg 容器下的 Opus 编码
    it('探测 Ogg Opus 格式', async () => {
        const info = await probeAudioSource(fixture);
        expect(info).not.toBeNull();
        const format = info!;
        expect(format.container).toBe(AudioContainer.Ogg);
        expect(format.codec).toBe(AudioCodec.Opus);
        expect(format.sampleRate).toBe(48000);
        expect(format.channels).toBe(2);
        expect(format.duration).not.toBeNull();
        expect(Math.abs(format.duration! - 57.66)).toBeLessThan(1);
    });

    // 无法识别的数据应探测为 null
    it('未知数据探测为 null', async () => {
        const info = await probeAudioSource(new Uint8Array(64));
        expect(info).toBeNull();
    });

    // OpusHead 解析应读出预跳过采样数与声道映射
    it('解析 OpusHead', () => {
        const head = new Uint8Array(19);
        head.set([0x4f, 0x70, 0x75, 0x73, 0x48, 0x65, 0x61, 0x64], 0);
        head[8] = 1;
        head[9] = 2;
        head[10] = 0x38;
        head[11] = 0x01;
        const header = parseOpusIdentificationHeader(head)!;
        expect(header.preSkip).toBe(312);
        expect(header.channels).toBe(2);
        expect(header.streamCount).toBe(1);
        expect(header.coupledStreamCount).toBe(1);
        expect(header.channelMappingTable).toEqual([0, 1]);
    });

    // OpusHead 缺失或非法时应解析为 null，不再回退到默认映射
    it('非法 OpusHead 解析为 null', () => {
        expect(parseOpusIdentificationHeader(null)).toBeNull();
        expect(parseOpusIdentificationHeader(new Uint8Array(10))).toBeNull();
        expect(parseOpusIdentificationHeader(new Uint8Array(19))).toBeNull();
    });

    // 不支持的输入类型应探测为 null，不建立解码会话
    it('不支持的输入类型探测为 null', async () => {
        const info = await probeAudioSource(new ReadableStream<Uint8Array>());
        expect(info).toBeNull();
    });

    // 整文件会话应解出非空 PCM，且总采样数与探测时长一致
    it('整文件解码', async () => {
        const info = await probeAudioSource(fixture);
        expect(info).not.toBeNull();
        const session = await createOpusDecodeSession(
            fixture,
            info!,
            new OpusCodecDecoder()
        );
        expect(session).not.toBeNull();
        let samples = 0;
        let channels = 0;
        let lastTimestamp = -1;
        let peak = 0;
        for await (const chunk of session!.chunks) {
            channels = Math.max(channels, chunk.channelData.length);
            samples += chunk.samplesDecoded;
            lastTimestamp = chunk.timestamp;
            for (const channel of chunk.channelData) {
                for (let i = 0; i < channel.length; i++) {
                    const abs = Math.abs(channel[i]);
                    if (abs > peak) peak = abs;
                }
            }
        }
        session!.close();
        expect(channels).toBe(2);
        expect(samples).toBeGreaterThan(48000);
        expect(Math.abs(samples / 48000 - info!.duration!)).toBeLessThan(1);
        expect(lastTimestamp).toBeGreaterThan(0);
        expect(peak).toBeGreaterThan(0.001);
    });

    // 默认注册的 Opus 编码解码器应能在配置后解出单个数据包
    it('默认 Opus 编码解码器可用', async () => {
        const info = await probeAudioSource(fixture);
        expect(info).not.toBeNull();
        const input = new Input({
            formats: [OGG],
            source: new BufferSource(fixture)
        });
        const track = await input.getPrimaryAudioTrack();
        const config = await track!.getDecoderConfig();
        const description = config!.description as Uint8Array;
        const decoder = new OpusCodecDecoder();
        await decoder.configure(info!, description);
        const sink = new EncodedPacketSink(track!);
        const packet = await sink.getFirstPacket({});
        expect(packet).not.toBeNull();
        const chunk = await decoder.decode(
            packet!.data,
            packet!.timestamp,
            packet!.duration
        );
        expect(chunk).not.toBeNull();
        expect(chunk!.channelData.length).toBe(2);
        expect(chunk!.samplesDecoded).toBeGreaterThan(0);
        expect(await decoder.flush()).toBeNull();
        await decoder.destroy();
        input.dispose();
    });

    // 重新封装出的 WebM 应探测为 WebM/Opus，并复用同一条整文件解码路径
    it('WebM Opus 整文件解码', async () => {
        const webm = await transmuxToWebM(fixture);
        const info = await probeAudioSource(webm);
        expect(info).not.toBeNull();
        const format = info!;
        expect(format.container).toBe(AudioContainer.WebM);
        expect(format.codec).toBe(AudioCodec.Opus);
        expect(format.sampleRate).toBe(48000);
        expect(format.channels).toBe(2);
        const session = await createOpusDecodeSession(
            webm,
            format,
            new OpusCodecDecoder()
        );
        expect(session).not.toBeNull();
        let count = 0;
        let samples = 0;
        let channels = 0;
        let peak = 0;
        for await (const chunk of session!.chunks) {
            count++;
            channels = Math.max(channels, chunk.channelData.length);
            samples += chunk.samplesDecoded;
            for (const channel of chunk.channelData) {
                for (let i = 0; i < channel.length; i++) {
                    const abs = Math.abs(channel[i]);
                    if (abs > peak) peak = abs;
                }
            }
            if (count >= 50) break;
        }
        session!.close();
        expect(channels).toBe(2);
        expect(samples).toBeGreaterThan(0);
        expect(peak).toBeGreaterThan(0.001);
    });
});
