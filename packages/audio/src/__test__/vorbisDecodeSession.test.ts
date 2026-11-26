// 校验 Ogg Vorbis 的格式探测与整文件解码会话
import { describe, expect, it } from 'vitest';
import { AudioCodec, AudioContainer } from '../types';
import { createVorbisDecodeSession } from '../vorbisSession';
import { probeAudioSource } from '../probe';
// 仓库根类型检查未加载 Node 类型，测试需要在 Node 环境下读取音频样例
// @ts-expect-error 此处缺少 node:fs 的模块声明，仅测试环境使用
import { readFileSync } from 'node:fs';

const fixture = new Uint8Array(
    readFileSync(
        new URL(
            '../../../../public/_server/blockly/media/click.ogg',
            import.meta.url
        )
    )
);
const opusFixture = new Uint8Array(
    readFileSync(
        new URL('../../../../public/project/bgms/bgm.opus', import.meta.url)
    )
);

describe('vorbis 解码', () => {
    // 探测 click.ogg 应识别为 Ogg 容器下的 Vorbis 编码
    it('探测 Ogg Vorbis 格式', async () => {
        const info = await probeAudioSource(fixture);
        expect(info).not.toBeNull();
        const format = info!;
        expect(format.container).toBe(AudioContainer.Ogg);
        expect(format.codec).toBe(AudioCodec.Vorbis);
        expect(format.sampleRate).toBe(44100);
        expect(format.channels).toBe(1);
    });

    // 整文件会话应只产出一个数据块，且含非空 PCM
    it('整文件解码', async () => {
        const info = await probeAudioSource(fixture);
        expect(info).not.toBeNull();
        const session = await createVorbisDecodeSession(fixture, info!);
        expect(session).not.toBeNull();
        let count = 0;
        let samples = 0;
        let channels = 0;
        let timestamp = -1;
        let duration = 0;
        let peak = 0;
        for await (const chunk of session!.chunks) {
            count++;
            samples += chunk.samplesDecoded;
            channels = chunk.channelData.length;
            timestamp = chunk.timestamp;
            duration = chunk.duration;
            for (const channel of chunk.channelData) {
                for (let i = 0; i < channel.length; i++) {
                    const abs = Math.abs(channel[i]);
                    if (abs > peak) peak = abs;
                }
            }
        }
        session!.close();
        expect(count).toBe(1);
        expect(timestamp).toBe(0);
        expect(channels).toBe(1);
        expect(samples).toBeGreaterThan(0);
        expect(duration).toBeCloseTo(samples / 44100, 6);
        expect(Math.abs(duration - info!.duration!)).toBeLessThan(0.01);
        expect(peak).toBeGreaterThan(0.001);
    });

    // 非 Vorbis 编码的数据不应建立 Vorbis 会话
    it('非 Vorbis 数据不建立会话', async () => {
        const info = await probeAudioSource(opusFixture);
        expect(info).not.toBeNull();
        expect(info!.codec).toBe(AudioCodec.Opus);
        const session = await createVorbisDecodeSession(opusFixture, info!);
        expect(session).toBeNull();
    });
});
