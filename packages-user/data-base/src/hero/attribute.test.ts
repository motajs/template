// 测试 HeroAttribute 构件：基础/最终属性、修饰器增删排序、存盘开关、克隆、自身存读档与告警码 108/109
import { afterAll, describe, expect, it, vi } from 'vitest';
import { BaseHeroModifier, HeroAttribute } from './attribute';
import { logger } from '@motajs/common';
import { SaveCompression } from '@user/data-common';
import { type IHeroModifier } from './types';

/** 存读档测试覆盖的三档压缩级别 */
const SAVE_COMPRESSIONS = [
    SaveCompression.NoCompression,
    SaveCompression.LowCompression,
    SaveCompression.HighCompression
] as const;

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

interface TestTag {
    id: string;
}

interface TestHero {
    hp: number;
    atk: number;
    tag: TestTag;
}

/** 测试用数值修饰器，按优先级对数值属性做加法 */
class TestModifier extends BaseHeroModifier<number, number> {
    readonly type = '@test/value';

    constructor(
        value: number,
        readonly priority: number = 0
    ) {
        super(value);
    }

    modify(value: number): number {
        return value + this.value;
    }

    clone(): IHeroModifier<number, number> {
        return new TestModifier(this.value, this.priority);
    }
}

/** 测试用对象修饰器，故意返回同一引用以触发告警 109 */
class SameRefModifier extends BaseHeroModifier<TestTag, TestTag> {
    readonly type = '@test/same-ref';
    readonly priority = 0;

    constructor() {
        super({ id: 'same' });
    }

    modify(value: TestTag): TestTag {
        return value;
    }

    clone(): IHeroModifier<TestTag, TestTag> {
        return new SameRefModifier();
    }
}

/** 构造一个带合成数值属性与对象属性的勇士属性对象 */
function createAttribute(): HeroAttribute<TestHero> {
    return new HeroAttribute<TestHero>({
        hp: 100,
        atk: 10,
        tag: { id: 'base' }
    });
}

interface TestNumericHero {
    hp: number;
    atk: number;
}

/** 构造一个仅含数值属性的勇士属性对象，使注册表工厂的具体修饰器可满足泛型签名 */
function createNumericAttribute(): HeroAttribute<TestNumericHero> {
    return new HeroAttribute<TestNumericHero>({ hp: 100, atk: 10 });
}

describe('HeroAttribute base and final values', () => {
    // 验证存在修饰器时 set/add/mul/div 修改基础属性后最终属性同步反映
    it('reflects base attribute changes in the final attribute', () => {
        const attribute = createAttribute();
        attribute.addModifier('hp', new TestModifier(0));
        attribute.addModifier('atk', new TestModifier(0));
        expect(attribute.getBaseAttribute('hp')).toBe(100);
        expect(attribute.getFinalAttribute('hp')).toBe(100);

        attribute.set('hp', 40);
        attribute.add('hp', 5);
        expect(attribute.getBaseAttribute('hp')).toBe(45);
        expect(attribute.getFinalAttribute('hp')).toBe(45);

        attribute.mul('atk', 3);
        attribute.div('atk', 2);
        expect(attribute.getBaseAttribute('atk')).toBe(15);
        expect(attribute.getFinalAttribute('atk')).toBe(15);
    });

    // 验证无修饰器时基础属性变化同步反映到最终属性（#06-05-1）
    it('reflects base-only changes without any modifier', () => {
        const attribute = createAttribute();
        attribute.set('hp', 40);
        attribute.add('hp', 5);

        expect(attribute.getFinalAttribute('hp')).toBe(45);
    });

    // 验证未挂载修饰器时 getModifiers 返回空且 getModifierIndex 返回 -1
    it('returns safe defaults for attributes without modifiers', () => {
        const attribute = createAttribute();
        expect([...attribute.getModifiers('hp')]).toEqual([]);
        expect(attribute.getModifierIndex(new TestModifier(1))).toBe(-1);
    });
});

describe('HeroAttribute modifier management', () => {
    // 验证 addModifier 按优先级降序排序并重算最终属性
    it('sorts modifiers by descending priority and recomputes the final value', () => {
        const attribute = createAttribute();
        const low = new TestModifier(5, 0);
        const high = new TestModifier(3, 10);

        attribute.addModifier('hp', low);
        attribute.addModifier('hp', high);

        expect([...attribute.getModifiers('hp')]).toEqual([high, low]);
        expect(attribute.getModifierIndex(high)).toBe(0);
        expect(attribute.getModifierIndex(low)).toBe(1);
        expect(attribute.getFinalAttribute('hp')).toBe(108);
    });

    // 验证 iterateModifiers 携带属性名输出每个已挂载修饰器
    it('iterates every attached modifier with its attribute name', () => {
        const attribute = createAttribute();
        const modifier = new TestModifier(2);
        attribute.addModifier('atk', modifier);

        expect([...attribute.iterateModifiers()]).toEqual([['atk', modifier]]);
    });

    // 验证重复添加已有归属的修饰器告警 108 且被忽略
    it('warns code 108 and ignores a modifier that already has an owner', () => {
        const owner = createAttribute();
        const modifier = new TestModifier(7);
        owner.addModifier('hp', modifier);

        const other = createAttribute();
        const result = logger.catch(() => other.addModifier('hp', modifier));

        expect(result.info.map(info => info.code)).toContain(108);
        expect([...other.getModifiers('hp')]).toEqual([]);
        expect(other.getFinalAttribute('hp')).toBe(100);
    });

    // 验证按引用与按索引删除修饰器都正确移除并重算
    it('removes modifiers by reference and by index', () => {
        const attribute = createAttribute();
        const first = new TestModifier(5, 10);
        const second = new TestModifier(2, 0);
        attribute.addModifier('hp', first);
        attribute.addModifier('hp', second);
        expect(attribute.getFinalAttribute('hp')).toBe(107);

        attribute.deleteModifier('hp', first);
        expect(attribute.getFinalAttribute('hp')).toBe(102);
        expect(attribute.getModifierIndex(second)).toBe(0);

        expect(attribute.deleteModifierByIndex('hp', 0)).toBe(second);
        expect([...attribute.getModifiers('hp')]).toEqual([]);
        expect(attribute.deleteModifierByIndex('hp', 0)).toBeNull();
    });

    // 验证按索引删除后修饰器不再被迭代、索引解析为 -1 且最终属性按剩余修饰器重算
    it('removes a modifier by index from the iterator and the final attribute', () => {
        const attribute = createAttribute();
        const first = new TestModifier(5, 10);
        const second = new TestModifier(2, 0);
        attribute.addModifier('hp', first);
        attribute.addModifier('hp', second);
        expect(attribute.getFinalAttribute('hp')).toBe(107);

        expect(attribute.deleteModifierByIndex('hp', 0)).toBe(first);
        expect([...attribute.iterateModifiers()]).toEqual([['hp', second]]);
        expect(attribute.getModifierIndex(first)).toBe(-1);
        expect(attribute.getFinalAttribute('hp')).toBe(102);
    });

    // 验证被按索引删除的修饰器已解除归属，可以重新挂载且不再被码 108 拒绝
    it('allows an index-deleted modifier to be attached again', () => {
        const attribute = createAttribute();
        const first = new TestModifier(5);
        attribute.addModifier('hp', first);

        expect(attribute.deleteModifierByIndex('hp', 0)).toBe(first);

        const result = logger.catch(() => attribute.addModifier('hp', first));
        expect(result.info.map(info => info.code)).not.toContain(108);
        expect(attribute.getModifierIndex(first)).toBe(0);
        expect(attribute.getFinalAttribute('hp')).toBe(105);
    });

    // 验证索引越界或为负时返回 null 且不删除任何修饰器
    it('keeps every modifier when the index is out of range', () => {
        const attribute = createAttribute();
        const first = new TestModifier(5, 10);
        const second = new TestModifier(2, 0);
        attribute.addModifier('hp', first);
        attribute.addModifier('hp', second);

        expect(attribute.deleteModifierByIndex('hp', -1)).toBeNull();
        expect(attribute.deleteModifierByIndex('hp', 2)).toBeNull();
        expect([...attribute.getModifiers('hp')]).toEqual([first, second]);
        expect(attribute.getFinalAttribute('hp')).toBe(107);
    });

    // 验证按索引删除不存档修饰器时其存盘开关记录被一并清理
    it('clears the save flag of an index-deleted modifier', () => {
        const attribute = createAttribute();
        const unsaved = new TestModifier(3);
        attribute.addModifier('hp', unsaved, false);
        expect(attribute.getModifierSaveEnabled(unsaved)).toBe(false);

        expect(attribute.deleteModifierByIndex('hp', 0)).toBe(unsaved);
        expect(attribute.getModifierSaveEnabled(unsaved)).toBe(true);
    });

    // 验证存盘开关可分别设置与查询
    it('tracks the per-modifier save flag', () => {
        const attribute = createAttribute();
        const saved = new TestModifier(1);
        attribute.addModifier('hp', saved);
        expect(attribute.getModifierSaveEnabled(saved)).toBe(true);
        attribute.setModifierSaveEnabled(saved, false);
        expect(attribute.getModifierSaveEnabled(saved)).toBe(false);

        const unsaved = new TestModifier(1);
        attribute.addModifier('atk', unsaved, false);
        expect(attribute.getModifierSaveEnabled(unsaved)).toBe(false);
        attribute.setModifierSaveEnabled(unsaved, true);
        expect(attribute.getModifierSaveEnabled(unsaved)).toBe(true);
    });

    // 验证修饰器值变化只重算所属属性，未绑定修饰器被安全忽略
    it('recomputes only the owning attribute when a modifier value changes', () => {
        const attribute = createAttribute();
        const modifier = new TestModifier(5);
        attribute.addModifier('hp', modifier);
        attribute.addModifier('atk', new TestModifier(3));
        expect(attribute.getFinalAttribute('hp')).toBe(105);

        modifier.setValue(20);
        expect(attribute.getFinalAttribute('hp')).toBe(120);
        expect(attribute.getFinalAttribute('atk')).toBe(13);

        attribute.markModifierDirty(new TestModifier(99));
        expect(attribute.getFinalAttribute('hp')).toBe(120);
    });
});

describe('HeroAttribute cloning and progress', () => {
    // 验证仅复制基础属性、完整复制修饰器以及独立副本互不影响
    it('clones base only or with modifiers independently', () => {
        const attribute = createAttribute();
        attribute.addModifier('hp', new TestModifier(5));

        const baseOnly = attribute.clone({ cloneModifier: false });
        expect(baseOnly.getBaseAttribute('hp')).toBe(100);
        expect(baseOnly.getFinalAttribute('hp')).toBe(100);

        const full = attribute.clone();
        expect(full.getFinalAttribute('hp')).toBe(105);
        full.set('hp', 1);
        expect(attribute.getBaseAttribute('hp')).toBe(100);

        const isolated = attribute.getModifiableClone();
        isolated.add('hp', 50);
        expect(attribute.getBaseAttribute('hp')).toBe(100);
        expect(isolated.getFinalAttribute('hp')).toBe(155);

        const structured = attribute.toStructured();
        structured.hp = 999;
        expect(attribute.getBaseAttribute('hp')).toBe(100);
    });

    // 验证 catchCalculateProgress 输出计算过程且不修改最终属性
    it('iterates calculation progress without touching the final value', () => {
        const attribute = createAttribute();
        const first = new TestModifier(5, 10);
        const second = new TestModifier(2, 0);
        attribute.addModifier('hp', first);
        attribute.addModifier('hp', second);

        const progress = [...attribute.catchCalculateProgress('hp')];
        expect(progress.map(item => item[1])).toEqual([105, 107]);
        expect(progress[0][0]).toBe(first);
        expect(attribute.getFinalAttribute('hp')).toBe(107);
        expect([...attribute.catchCalculateProgress('atk')]).toEqual([]);
    });

    // 验证对象修饰器返回同引用时告警 109
    it('warns code 109 when an object modifier returns the same reference', () => {
        const attribute = createAttribute();
        const result = logger.catch(() =>
            attribute.addModifier('tag', new SameRefModifier())
        );

        expect(result.info.map(info => info.code)).toContain(109);
        expect(attribute.getFinalAttribute('tag')).toEqual({ id: 'base' });
    });
});

describe('HeroAttribute same-reference save and load', () => {
    // 验证三档压缩下基础值与已注册修饰器均在自身实例上原地恢复
    it('restores base values and modifiers in place across all compressions', () => {
        for (const compression of SAVE_COMPRESSIONS) {
            const attribute = createNumericAttribute();
            attribute.registerModifier(
                '@test/value',
                () => new TestModifier(5)
            );
            const modifier = attribute.createAndInsertModifier(
                '@test/value',
                'atk'
            )!;
            attribute.set('hp', 88);
            const holder = attribute;

            const saved = attribute.saveState(compression);
            attribute.set('hp', 1);
            attribute.set('atk', 1);
            attribute.deleteModifier('atk', modifier);

            attribute.loadState(saved, compression);

            expect(attribute).toBe(holder);
            expect(holder.getBaseAttribute('hp')).toBe(88);
            expect(holder.getBaseAttribute('atk')).toBe(10);
            expect(holder.getFinalAttribute('atk')).toBe(15);
            expect([...holder.getModifiers('atk')]).toHaveLength(1);
        }
    });

    // 验证读档后基础属性对象仍与存档快照分离（原地重置而非换引用）
    it('keeps the restored base values independent from the snapshot', () => {
        const attribute = createAttribute();
        attribute.set('hp', 88);

        const saved = attribute.saveState(SaveCompression.NoCompression);
        attribute.loadState(saved, SaveCompression.NoCompression);

        expect(attribute.toStructured()).toEqual(saved.values);
        expect(attribute.toStructured()).not.toBe(saved.values);
    });

    // 验证存档禁用的修饰器不进入属性存档，读档后不复存在
    it('excludes save-disabled modifiers from the attribute snapshot', () => {
        const attribute = createAttribute();
        const disabled = new TestModifier(1);
        attribute.addModifier('hp', disabled);
        attribute.setModifierSaveEnabled(disabled, false);

        const saved = attribute.saveState(SaveCompression.NoCompression);
        expect(saved.modifiers).toHaveLength(0);

        attribute.loadState(saved, SaveCompression.NoCompression);

        expect([...attribute.getModifiers('hp')]).toEqual([]);
        expect(attribute.getFinalAttribute('hp')).toBe(100);
    });

    // 验证存档基础值是与活属性分离的深拷贝快照
    it('keeps the saved base values independent from the live attribute', () => {
        const attribute = createAttribute();
        attribute.set('hp', 88);

        const saved = attribute.saveState(SaveCompression.NoCompression);
        attribute.set('hp', 1);

        expect(saved.values.hp).toBe(88);
        expect(attribute.getBaseAttribute('hp')).toBe(1);
    });

    // 验证克隆体复制注册表条目后可独立创建并重建修饰器
    it('carries the modifier registry into cloned attributes', () => {
        const attribute = createNumericAttribute();
        attribute.registerModifier('@test/value', () => new TestModifier(5));

        const clone = attribute.clone({ cloneModifier: false });
        expect(
            clone.createAndInsertModifier('@test/value', 'atk')
        ).not.toBeNull();

        const saved = clone.saveState(SaveCompression.NoCompression);
        expect(saved.modifiers).toHaveLength(1);
        clone.loadState(saved, SaveCompression.NoCompression);

        expect(clone.getFinalAttribute('atk')).toBe(15);
    });
});
