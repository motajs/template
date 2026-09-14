// 测试 data-base 全局 Flag 系统的公开接口行为（存读档归 06-09，此处不测）
import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
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
    Map.prototype.getOrInsert ??= function <K, V>(
        this: Map<K, V>,
        key: K,
        defaultValue: V
    ): V {
        const existing = this.get(key);
        if (existing !== undefined) return existing;
        this.set(key, defaultValue);
        return defaultValue;
    };
});

interface TestModules {
    FlagSystem: typeof import('./system').FlagSystem;
    logger: typeof import('@motajs/common').logger;
}

let modules: TestModules;

beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    const systemModule = await import('./system');
    const commonModule = await import('@motajs/common');
    modules = {
        FlagSystem: systemModule.FlagSystem,
        logger: commonModule.logger
    };
});

/** 创建一个 Flag 系统及其中一个已插入字段，便于直接操作字段对象 */
function createField<T>(key: PropertyKey, value: T) {
    const system = new modules.FlagSystem();
    return { system, field: system.insertField(key, value) };
}

describe('FlagSystem field container', () => {
    // 验证新系统的字段初始未占用，插入字段后被占用
    it('tracks field occupancy', () => {
        const system = new modules.FlagSystem();
        expect(system.occupied('score')).toBe(false);

        system.insertField('score', 1);

        expect(system.occupied('score')).toBe(true);
    });

    // 验证 insertField 返回的字段对象支持取值、赋值与结构化克隆
    it('returns a field exposing get, set and toStructured', () => {
        const { field } = createField('nested', { list: [1, 2] });

        expect(field.get()).toEqual({ list: [1, 2] });

        field.set({ list: [3] });

        expect(field.get()).toEqual({ list: [3] });
        const structured = field.toStructured();
        expect(structured).toEqual({ list: [3] });
        expect(structured).not.toBe(field.get());
    });

    // 验证 getField 对未知字段返回 null，getOrInsert 插入默认值且二次调用返回同一实例
    it('gets by key and reuses the same field instance', () => {
        const system = new modules.FlagSystem();
        expect(system.getField('missing')).toBeNull();

        const first = system.getOrInsert('count', 5);
        const second = system.getOrInsert('count', 99);

        expect(first).toBe(second);
        expect(first.get()).toBe(5);
        expect(system.getField('count')).toBe(first);
    });

    // 验证 getOrInsertComputed 把 key 传给默认值函数且仅在字段缺失时执行一次
    it('computes the default only when the field is missing', () => {
        const system = new modules.FlagSystem();
        let calls = 0;
        const compute = (key: string) => {
            calls++;
            return `value:${key}`;
        };

        const field = system.getOrInsertComputed('name', compute);

        expect(field.get()).toBe('value:name');
        expect(system.getOrInsertComputed('name', compute)).toBe(field);
        expect(calls).toBe(1);
    });

    // 验证 deleteField 移除字段并恢复未占用状态
    it('deletes a field', () => {
        const system = new modules.FlagSystem();
        system.insertField('temp', 1);

        system.deleteField('temp');

        expect(system.occupied('temp')).toBe(false);
        expect(system.getField('temp')).toBeNull();
        expect(system.getFieldValue('temp')).toBeUndefined();
    });
});

describe('FlagSystem value accessors', () => {
    // 验证 setFieldValue 覆盖已有值并创建缺失字段
    it('sets values creating or overriding fields', () => {
        const system = new modules.FlagSystem();
        system.setFieldValue('score', 1);
        system.setFieldValue('score', 9);

        expect(system.getFieldValue<number>('score')).toBe(9);
        expect(system.occupied('score')).toBe(true);
    });

    // 验证 addFieldValue 对数值字段累加
    it('accumulates numeric field values', () => {
        const system = new modules.FlagSystem();
        system.addFieldValue('score', 4);
        system.addFieldValue('score', 6);

        expect(system.getFieldValue<number>('score')).toBe(10);
    });

    // 验证对非数值字段调用 addFieldValue 时经 logger 观测告警码 111
    it('warns code 111 when adding to a non-numeric field', () => {
        const system = new modules.FlagSystem();
        system.setFieldValue('name', 'hero');

        const result = modules.logger.catch(() =>
            system.addFieldValue('name', 1)
        );

        expect(result.info.map(info => info.code)).toContain(111);
        expect(system.getFieldValue<string>('name')).toBe('hero');
    });

    // 验证 getFieldValue 对未知字段返回 undefined
    it('returns undefined for an unknown value', () => {
        const system = new modules.FlagSystem();

        expect(system.getFieldValue('missing')).toBeUndefined();
    });

    // 验证 getFieldValueDefaults 返回默认值并以该值插入字段
    it('returns and inserts the default value', () => {
        const system = new modules.FlagSystem();

        const value = system.getFieldValueDefaults('lives', 3);

        expect(value).toBe(3);
        expect(system.occupied('lives')).toBe(true);
        expect(system.getFieldValue<number>('lives')).toBe(3);
    });
});
