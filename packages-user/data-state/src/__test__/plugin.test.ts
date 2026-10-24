// 测试数据端插件系统的依赖排序与四段式加载驱动
import { describe, expect, it } from 'vitest';
import { WebLoadStarter } from '@motajs/loader';
import { CoreState } from '../core';
import { IDataPluginDefine, PluginStatus } from '../types';
import { orderPlugins } from '../plugin';

/** 创建一个记录三阶段调用顺序的测试插件定义 */
function createPlugin(
    id: string,
    dependencies: string[],
    calls: string[]
): IDataPluginDefine {
    return {
        id,
        dataDeps: dependencies,
        awake: () => {
            calls.push(`${id}.awake`);
        },
        initialize: async () => {
            calls.push(`${id}.initialize`);
        },
        afterLoad: async () => {
            calls.push(`${id}.afterLoad`);
        }
    };
}

describe('orderPlugins', () => {
    // 验证无依赖插件保持注册顺序，有依赖插件排在其依赖之后
    it('sorts plugins by dependency order', () => {
        const a = { plugin: { id: 'a', dependencies: [] as string[] } };
        const b = { plugin: { id: 'b', dependencies: ['a'] } };
        const result = orderPlugins(
            new Map([
                ['b', b],
                ['a', a]
            ])
        );
        expect(result.cyclic.size).toBe(0);
        expect(result.missing.size).toBe(0);
        expect(result.order.map(holder => holder.plugin.id)).toEqual([
            'a',
            'b'
        ]);
    });

    // 验证处于依赖环中的插件被标记，且不会出现在可初始化序列中
    it('detects dependency cycles', () => {
        const x = { plugin: { id: 'x', dependencies: ['y'] } };
        const y = { plugin: { id: 'y', dependencies: ['x'] } };
        const result = orderPlugins(
            new Map([
                ['x', x],
                ['y', y]
            ])
        );
        expect([...result.cyclic].sort()).toEqual(['x', 'y']);
        expect(result.order).toEqual([]);
    });

    // 验证直接引用不存在依赖的插件及其下游均被排除，并记录缺失依赖
    it('detects missing dependencies and excludes downstream', () => {
        const c = { plugin: { id: 'c', dependencies: ['nope'] } };
        const d = { plugin: { id: 'd', dependencies: ['c'] } };
        const result = orderPlugins(
            new Map([
                ['c', c],
                ['d', d]
            ])
        );
        expect(result.missing.get('c')).toEqual(['nope']);
        expect(result.order).toEqual([]);
    });
});

describe('CoreState plugin driving', () => {
    // 验证插件按拓扑序依次执行同步初始化、异步初始化与加载后初始化
    it('drives plugins through four phases in topological order', async () => {
        const calls: string[] = [];
        const a = createPlugin('a', [], calls);
        const b = createPlugin('b', ['a'], calls);
        const state = new CoreState({
            loadStarter: new WebLoadStarter(),
            coreURL: 'placeholder',
            heroFace: 8,
            dataPlugins: [b, a],
            events: []
        });
        await state.load();
        expect(calls).toEqual([
            'a.awake',
            'b.awake',
            'a.initialize',
            'b.initialize',
            'a.afterLoad',
            'b.afterLoad'
        ]);
        expect(state.getDataPlugin('a')!.status).toBe(PluginStatus.Loaded);
        expect(state.getDataPlugin('b')!.status).toBe(PluginStatus.Loaded);
    });

    // 验证环上插件的三阶段方法均不被调用且状态保持未唤醒
    it('excludes cyclic plugins from every phase', async () => {
        const calls: string[] = [];
        const x = createPlugin('x', ['y'], calls);
        const y = createPlugin('y', ['x'], calls);
        const state = new CoreState({
            loadStarter: new WebLoadStarter(),
            coreURL: 'placeholder',
            heroFace: 8,
            dataPlugins: [x, y],
            events: []
        });
        await state.load();
        expect(calls).toEqual([]);
        expect(state.getDataPlugin('x')!.status).toBe(PluginStatus.NotAwakened);
        expect(state.getDataPlugin('y')!.status).toBe(PluginStatus.NotAwakened);
    });

    // 验证依赖不存在的插件及其下游均不被驱动且状态保持未唤醒
    it('excludes plugins with missing dependencies and downstream', async () => {
        const calls: string[] = [];
        const c = createPlugin('c', ['nope'], calls);
        const d = createPlugin('d', ['c'], calls);
        const state = new CoreState({
            loadStarter: new WebLoadStarter(),
            coreURL: 'placeholder',
            heroFace: 8,
            dataPlugins: [c, d],
            events: []
        });
        await state.load();
        expect(calls).toEqual([]);
        expect(state.getDataPlugin('c')!.status).toBe(PluginStatus.NotAwakened);
        expect(state.getDataPlugin('d')!.status).toBe(PluginStatus.NotAwakened);
    });

    // 验证重复 id 的插件保留先注册者，重复者不会被注册
    it('keeps the first plugin on duplicate id', () => {
        const first = createPlugin('dup', [], []);
        const second = createPlugin('dup', [], []);
        const state = new CoreState({
            loadStarter: new WebLoadStarter(),
            coreURL: 'placeholder',
            heroFace: 8,
            dataPlugins: [first, second],
            events: []
        });
        expect(state.getDataPlugin('dup')!.plugin).toBe(first);
    });

    // 验证省略 plugins 等配置时构造与 load 均不抛错，证明运行时守卫生效
    it('builds and loads without plugin config (runtime guard)', async () => {
        const state = new CoreState({
            loadStarter: new WebLoadStarter(),
            coreURL: 'placeholder'
        } as any);
        await expect(state.load()).resolves.toBeUndefined();
    });
});

