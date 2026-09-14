// 测试 HeroRendering 构件：默认不透明度、setAlpha 与 onSetAlpha 钩子注册/解除
import { afterAll, describe, expect, it, vi } from 'vitest';
import { type IDataCommon, ItemStore, TileStore } from '@user/data-common';
import { HeroRendering } from './rendering';
import { type IHeroRenderingHooks } from './types';

vi.hoisted(() => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    Map.prototype.getOrInsert ??= function <K, V>(
        this: Map<K, V>,
        key: K,
        value: V
    ): V {
        const existing = this.get(key);
        if (existing !== undefined) return existing;
        this.set(key, value);
        return value;
    };
    Map.prototype.getOrInsertComputed ??= function <K, V>(
        this: Map<K, V>,
        key: K,
        callback: (key: K) => V
    ): V {
        const existing = this.get(key);
        if (existing !== undefined) return existing;
        const value = callback(key);
        this.set(key, value);
        return value;
    };
});

afterAll(() => {
    vi.unstubAllGlobals();
});

/** 构造一个仅含图块与道具存储的公共层假对象 */
function createState(): IDataCommon {
    return {
        tileStore: new TileStore(),
        itemStore: new ItemStore()
    } as never;
}

/** 记录 onSetAlpha 调用序列的测试钩子 */
class FakeRenderingHook implements Partial<IHeroRenderingHooks> {
    readonly alphas: number[] = [];

    onSetAlpha(alpha: number): void {
        this.alphas.push(alpha);
    }
}

describe('HeroRendering alpha', () => {
    // 验证构造后不透明度为满值并持有公共层对象
    it('starts at full opacity with the provided state', () => {
        const state = createState();
        const rendering = new HeroRendering(state);

        expect(rendering.alpha).toBe(1);
        expect(rendering.state).toBe(state);
    });

    // 验证 setAlpha 更新不透明度并触发已加载的 onSetAlpha 钩子
    it('updates alpha and notifies the onSetAlpha hook', () => {
        const rendering = new HeroRendering(createState());
        const hook = new FakeRenderingHook();
        rendering.addHook(hook).load();

        rendering.setAlpha(0.25);

        expect(rendering.alpha).toBe(0.25);
        expect(hook.alphas).toEqual([0.25]);
    });

    // 验证钩子控制器解除后不再收到 onSetAlpha
    it('stops notifying after the hook controller unloads', () => {
        const rendering = new HeroRendering(createState());
        const hook = new FakeRenderingHook();
        const controller = rendering.addHook(hook);
        controller.load();
        rendering.setAlpha(0.5);

        controller.unload();
        rendering.setAlpha(0.1);

        expect(rendering.alpha).toBe(0.1);
        expect(hook.alphas).toEqual([0.5]);
    });
});
