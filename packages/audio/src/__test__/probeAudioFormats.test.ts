// 校验原生格式（MP3 / WAV）的容器与时长探测
import { describe, expect, it } from 'vitest';
import { AudioCodec, AudioContainer } from '../types';
import { probeAudioSource } from '../probe';
// 仓库根类型检查未加载 Node 类型，测试需要在 Node 环境下读取音频样例
// @ts-expect-error 此处缺少 node:fs 的模块声明，仅测试环境使用
import { readFileSync } from 'node:fs';

const mp3Fixture = new Uint8Array(
    readFileSync(
        new URL(
            '../../../../public/_server/blockly/media/click.mp3',
            import.meta.url
        )
    )
);
const wavFixture = new Uint8Array(
    readFileSync(
        new URL(
            '../../../../public/_server/blockly/media/click.wav',
            import.meta.url
        )
    )
);

describe('原生格式探测', () => {
    // MP3 与 WAV 应探测出正确容器与编码，并在头部拿到时长而不扫描整个文件
    it('探测 MP3 与 WAV 容器和时长', async () => {
        const mp3 = await probeAudioSource(mp3Fixture);
        expect(mp3).not.toBeNull();
        expect(mp3!.container).toBe(AudioContainer.Mp3);
        expect(mp3!.codec).toBe(AudioCodec.Mp3);
        expect(mp3!.sampleRate).toBe(44100);
        expect(mp3!.channels).toBe(1);
        expect(mp3!.duration).not.toBeNull();
        expect(Math.abs(mp3!.duration! - 0.0794)).toBeLessThan(0.01);
        const wav = await probeAudioSource(wavFixture);
        expect(wav).not.toBeNull();
        expect(wav!.container).toBe(AudioContainer.Wav);
        expect(wav!.codec).toBe(AudioCodec.Pcm);
        expect(wav!.sampleRate).toBe(44100);
        expect(wav!.channels).toBe(1);
        expect(wav!.duration).not.toBeNull();
        expect(Math.abs(wav!.duration! - 0.0402)).toBeLessThan(0.01);
    });
});
