// 测试 LayerEventView 的参考基准、dirty 状态和恢复行为
import { describe, expect, it, vi } from 'vitest';
import { LayerEventView } from './eventView';

vi.hoisted(() => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
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
