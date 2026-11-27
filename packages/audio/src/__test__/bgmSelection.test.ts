// 校验 BGM 的扩展名识别、流式判定与播放源选择
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioType, IMotaAudioContext } from '../types';

// 可配置的 Audio 替身，support.ts 在模块加载时就会执行 new Audio()
class FakeAudio {
    static table: Record<string, string> = {};

    canPlayType(type: string): string {
        return FakeAudio.table[type] ?? '';
    }
}

// 安装 Audio 全局桩并指定每种 MIME 的原生支持结果
function installAudioStub(table: Record<string, string>): void {
    FakeAudio.table = table;
    (globalThis as any).Audio = FakeAudio;
}

// 伪造的音频上下文，只记录 BGM 选择实际调用的工厂
function createFakeContext() {
    const calls: string[] = [];
    // 源码对象同时具备元素源与流式源用到的方法，两条分支都可用
    const source = {
        setSource() {},
        setLoop() {},
        piped() {},
        unpiped() {}
    };
    const gain = {
        output: {
            gain: {
                cancelScheduledValues() {},
                setTargetAtTime() {}
            }
        },
        setVolume() {},
        getVolume() {}
    };
    const route = {
        addEffect() {},
        addHook() {
            return { unload() {} };
        },
        setEndTime() {}
    };
    const context = {
        createVolumeEffect: () => gain,
        createElementSource: () => {
            calls.push('element');
            return source;
        },
        createStreamSource: () => {
            calls.push('stream');
            return source;
        },
        createRoute: () => route,
        addRoute() {},
        getRoute: () => route,
        ac: { currentTime: 0 }
    };
    return { context, calls };
}

afterEach(() => {
    delete (globalThis as any).Audio;
    vi.resetModules();
});

describe('BGM 选择', () => {
    // .webm 扩展名应识别为 WebM 类型
    it('识别 .webm 扩展名', async () => {
        installAudioStub({});
        vi.resetModules();
        const { guessTypeByExt } = await import('../support');
        expect(guessTypeByExt('x.webm')).toBe(AudioType.WebM);
        expect(guessTypeByExt('X.WEBM')).toBe(AudioType.WebM);
    });

    // 既有扩展名映射不回归，未知扩展名返回空字符串
    it('既有扩展名映射不回归', async () => {
        installAudioStub({});
        vi.resetModules();
        const { guessTypeByExt, isAudioStreamSupport } =
            await import('../support');
        expect(guessTypeByExt('x.ogg')).toBe(AudioType.Ogg);
        expect(guessTypeByExt('x.opus')).toBe(AudioType.Opus);
        expect(guessTypeByExt('x.mp3')).toBe(AudioType.Mp3);
        expect(guessTypeByExt('x.wav')).toBe(AudioType.Wav);
        expect(guessTypeByExt('x.flac')).toBe(AudioType.Flac);
        expect(guessTypeByExt('x.aac')).toBe(AudioType.Aac);
        expect(guessTypeByExt('x.txt')).toBe('');
        expect(isAudioStreamSupport(AudioType.Ogg)).toBe(true);
        expect(isAudioStreamSupport(AudioType.Opus)).toBe(true);
        expect(isAudioStreamSupport(AudioType.WebM)).toBe(true);
        expect(isAudioStreamSupport(AudioType.Mp3)).toBe(false);
        expect(isAudioStreamSupport(AudioType.Wav)).toBe(false);
        expect(isAudioStreamSupport(AudioType.Flac)).toBe(false);
        expect(isAudioStreamSupport(AudioType.Aac)).toBe(false);
        expect(isAudioStreamSupport(AudioType.Unknown)).toBe(false);
    });

    // 原生不支持 Ogg 与 WebM 时 BGM 应选择流式音频源
    it('原生不支持时选择流式音频源', async () => {
        installAudioStub({});
        vi.resetModules();
        const { BGMPlayer } = await import('../bgm');
        const fake = createFakeContext();
        const player = new BGMPlayer(
            fake.context as unknown as IMotaAudioContext
        );
        player.addBGMFromURL('bgm.opus', '/project/bgms/bgm.opus');
        expect(fake.calls).toContain('stream');
        expect(fake.calls).not.toContain('element');
        fake.calls.length = 0;
        player.addBGMFromURL('bgm.webm', '/project/bgms/bgm.webm');
        expect(fake.calls).toContain('stream');
        expect(fake.calls).not.toContain('element');
    });

    // 原生不支持 MP3 时 BGM 仍选择 audio 元素而非流式源
    it('原生不支持时 MP3 选择 audio 元素', async () => {
        installAudioStub({});
        vi.resetModules();
        const { BGMPlayer } = await import('../bgm');
        const fake = createFakeContext();
        const player = new BGMPlayer(
            fake.context as unknown as IMotaAudioContext
        );
        player.addBGMFromURL('bgm.mp3', '/project/bgms/bgm.mp3');
        expect(fake.calls).toContain('element');
        expect(fake.calls).not.toContain('stream');
    });

    // 原生支持 WebM 时 BGM 选择 audio 元素
    it('原生支持 WebM 时选择 audio 元素', async () => {
        installAudioStub({ 'audio/webm; codecs="opus"': 'probably' });
        vi.resetModules();
        const { isAudioSupport } = await import('../support');
        expect(isAudioSupport(AudioType.WebM)).toBe(true);
        const { BGMPlayer } = await import('../bgm');
        const fake = createFakeContext();
        const player = new BGMPlayer(
            fake.context as unknown as IMotaAudioContext
        );
        player.addBGMFromURL('bgm.webm', '/project/bgms/bgm.webm');
        expect(fake.calls).toContain('element');
    });
});
