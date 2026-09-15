// 测试勇士修饰器构件：数值/百分比公式、默认优先级、类型字符串与绑定重算
import { afterAll, describe, expect, it, vi } from 'vitest';
import { HeroAttribute } from './attribute';
import { PercentageModifier, ValueModifier } from './modifier';

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

interface TestHero {
    hp: number;
    atk: number;
}

/** 构造一个带合成数值属性的勇士属性对象 */
function createAttribute(): HeroAttribute<TestHero> {
    return new HeroAttribute<TestHero>({ hp: 100, atk: 20 });
}

describe('ValueModifier formula', () => {
    // 验证数值修饰器对当前值做加法并保留默认优先级与类型
    it('adds its value with the default priority and value type', () => {
        const modifier = new ValueModifier(7);

        expect(modifier.modify(10)).toBe(17);
        expect(modifier.priority).toBe(0);
        expect(modifier.type).toBe('@system/value');
        expect(modifier.getValue()).toBe(7);
    });

    // 验证显式优先级被保留且克隆出的实例相互独立
    it('keeps an explicit priority and clones independently', () => {
        const modifier = new ValueModifier(3, 25);
        const cloned = modifier.clone();

        expect(cloned.priority).toBe(25);
        expect(cloned.getValue()).toBe(3);

        cloned.setValue(9);
        expect(modifier.getValue()).toBe(3);
        expect(cloned.getValue()).toBe(9);
    });
});

describe('PercentageModifier formula', () => {
    // 验证百分比修饰器按基础属性比例加成并保留默认优先级与类型
    it('adds a percentage of the base value with the default priority', () => {
        const modifier = new PercentageModifier(0.5);

        expect(modifier.modify(10, 100)).toBe(60);
        expect(modifier.priority).toBe(10);
        expect(modifier.type).toBe('@system/percentage');
    });

    // 验证两个修饰器按优先级降序作用于最终属性，且 setValue 触发重算
    it('recomputes the bound attribute when the value changes', () => {
        const attribute = createAttribute();
        const percent = new PercentageModifier(0.5);
        const value = new ValueModifier(5);
        attribute.addModifier('hp', percent);
        attribute.addModifier('hp', value);

        expect(attribute.getFinalAttribute('hp')).toBe(155);

        value.setValue(20);
        expect(attribute.getFinalAttribute('hp')).toBe(170);

        percent.setValue(1);
        expect(attribute.getFinalAttribute('hp')).toBe(220);
    });

    // 验证 bindAttribute 可设置与清空修饰器归属
    it('binds and unbinds its owning attribute', () => {
        const modifier = new ValueModifier(1);
        const attribute = createAttribute();

        modifier.bindAttribute(attribute);
        expect(modifier.owner).toBe(attribute);

        modifier.bindAttribute(null);
        expect(modifier.owner).toBeNull();
    });
});
