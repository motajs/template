// 测试 LayerEventView 的参考基准、dirty 状态和恢复行为
import { afterAll, describe, expect, it, vi } from 'vitest';
import { logger } from '@motajs/common';
import { LayerEventView } from './eventView';

vi.hoisted(() => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
});

afterAll(() => {
    vi.unstubAllGlobals();
});

describe('LayerEventView reference tracking', () => {
    // 验证新增、删除和清空事件时 dirty 状态能随参考基准正确变化
    it('keeps dirty state in sync with set, delete, and clear', () => {
        const view = new LayerEventView();

        expect(view.ref()).toEqual(new Map());
        expect(view.dirty()).toBe(false);

        view.set(10, 'first');
        expect(view.dirty()).toBe(true);
        view.delete(10);
        expect(view.dirty()).toBe(false);

        view.set(10, 'first');
        view.markPure();
        view.set(20, 'second');
        expect(view.dirty()).toBe(true);
        view.clear();
        expect(view.dirty()).toBe(true);
        view.set(10, 'first');
        expect(view.dirty()).toBe(false);
    });

    // 验证 ref 返回稳定快照，并可通过恢复事件内容变回 clean 而不重设基准
    it('exposes a stable reference snapshot and restores it without markPure', () => {
        const view = new LayerEventView();
        view.set(10, 'first');
        view.markPure();
        const reference = view.ref();

        view.set(10, 'changed');
        view.clear();
        for (const [priority, id] of reference) {
            view.set(priority, id);
        }

        expect(view.ref()).toBe(reference);
        expect(view.ref()).toEqual(new Map([[10, 'first']]));
        expect(view.get()).toEqual(new Map([[10, 'first']]));
        expect(view.dirty()).toBe(false);
    });
});

describe('LayerEventView per-priority dirty tracking', () => {
    // 验证多个优先级的脏条目按优先级独立增减，互不影响
    it('tracks dirty entries of different priorities independently', () => {
        const view = new LayerEventView();
        view.set(10, 'alpha');
        view.set(20, 'beta');
        view.markPure();
        expect(view.dirty()).toBe(false);

        view.set(10, 'changed');
        expect(view.dirty()).toBe(true);
        view.set(10, 'alpha');
        expect(view.dirty()).toBe(false);

        view.set(30, 'gamma');
        view.set(40, 'delta');
        expect(view.dirty()).toBe(true);
        view.delete(30);
        expect(view.dirty()).toBe(true);
        view.delete(40);
        expect(view.dirty()).toBe(false);
    });

    // 验证 clear 后逐条恢复参考基准才重新变回 clean
    it('clears every priority and only becomes clean after restoring all', () => {
        const view = new LayerEventView();
        view.set(10, 'alpha');
        view.set(20, 'beta');
        view.markPure();

        view.clear();
        expect(view.get()).toEqual(new Map());
        expect(view.dirty()).toBe(true);

        view.set(10, 'alpha');
        expect(view.dirty()).toBe(true);
        view.set(20, 'beta');
        expect(view.dirty()).toBe(false);
    });

    // 验证删除不存在的优先级不会改变脏状态
    it('ignores deleting an unknown priority', () => {
        const view = new LayerEventView();
        view.set(10, 'alpha');
        view.markPure();

        view.delete(99);

        expect(view.get()).toEqual(new Map([[10, 'alpha']]));
        expect(view.dirty()).toBe(false);
    });

    // 验证重复设置同一优先级会告警 136 并覆盖为最新值
    it('warns code 136 when the same priority is set twice', () => {
        const view = new LayerEventView();
        view.set(10, 'first');

        const result = logger.catch(() => view.set(10, 'second'));

        expect(result.info.map(info => info.code)).toContain(136);
        expect(view.get()).toEqual(new Map([[10, 'second']]));
    });
});
