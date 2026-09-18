// 测试全局 Flag 系统存读档：同实例往返、占用状态与存档克隆
import { afterAll, describe, expect, it, vi } from 'vitest';
import { FlagSystem } from './system';

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

describe('FlagSystem save and load round trips', () => {
    // 验证字段数值与占用状态在同实例上恢复
    it('restores field values and occupancy on the same instance', () => {
        const system = new FlagSystem();
        system.setFieldValue('score', 7);
        system.addFieldValue('score', 5);
        system.setFieldValue('name', 'hero');

        const saved = system.saveState();
        system.setFieldValue('score', 0);
        system.deleteField('name');
        system.loadState(saved);

        expect(system.getFieldValue<number>('score')).toBe(12);
        expect(system.occupied('score')).toBe(true);
        expect(system.getFieldValue<string>('name')).toBe('hero');
        expect(system.occupied('name')).toBe(true);
    });

    // 验证 saveState 返回分离克隆，修改存档不会影响系统
    it('returns a separated clone from saveState', () => {
        const system = new FlagSystem();
        system.setFieldValue('score', 7);

        const saved = system.saveState();
        saved.fields.set('score', 999);
        saved.fields.set('extra', 1);

        expect(system.getFieldValue<number>('score')).toBe(7);
        expect(system.occupied('extra')).toBe(false);
    });

    // 验证 loadState 在同实例上原地恢复字段值（#06-17-5）
    it('keeps field objects on loadState', () => {
        const system = new FlagSystem();
        const before = system.setField('score', 7);

        const saved = system.saveState();
        system.loadState(saved);

        expect(system.getField('score')).toBe(before);
        expect(system.getFieldValue<number>('score')).toBe(7);
    });
});
