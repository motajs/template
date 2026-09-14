// 测试 special 数据模型：可序列化特殊属性的数值/名称/描述单元，以及无属性特殊属性
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { type ICommonSpecialConfig } from './special';
import { type ISpecial } from './types';

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
});

interface TestModules {
    defineCommonSerializableSpecial: typeof import('./special').defineCommonSerializableSpecial;
    defineNonePropertySpecial: typeof import('./special').defineNonePropertySpecial;
}

let modules: TestModules;

beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    const specialModule = await import('./special');
    modules = {
        defineCommonSerializableSpecial:
            specialModule.defineCommonSerializableSpecial,
        defineNonePropertySpecial: specialModule.defineNonePropertySpecial
    };
});

afterAll(() => {
    vi.unstubAllGlobals();
});

/**
 * 构造一个按当前数值生成名称与描述的可序列化特殊属性配置
 */
function makeCommonConfig(): ICommonSpecialConfig<number> {
    return {
        getSpecialName: special => `连击${special.getValue()}`,
        getDescription: special => `怪物每回合攻击${special.getValue()}次。`,
        fromLegacyEnemy: () => 0
    };
}

/**
 * 构造一个使用固定名称与描述的无属性特殊属性配置
 */
function makeNoneConfig(): ICommonSpecialConfig<void> {
    return {
        getSpecialName: () => '先攻',
        getDescription: () => '怪物首先攻击。',
        fromLegacyEnemy: () => undefined
    };
}

/**
 * 构造一个内联配置的可序列化数值特殊属性实例
 * @param code 特殊属性代码
 * @param value 特殊属性数值
 */
function createValueSpecial(code: number, value: number): ISpecial<number> {
    return modules.defineCommonSerializableSpecial<number>(
        code,
        value,
        makeCommonConfig()
    )(undefined as never);
}

/**
 * 构造一个内联配置的无属性特殊属性实例
 * @param code 特殊属性代码
 */
function createNoneSpecial(code: number): ISpecial<void> {
    return modules.defineNonePropertySpecial(
        code,
        makeNoneConfig()
    )(undefined as never);
}

describe('CommonSerializableSpecial units', () => {
    // 验证 setValue 更新数值且 getValue 返回最新数值
    it('writes and reads the serializable value', () => {
        const creation = modules.defineCommonSerializableSpecial<number>(
            6,
            4,
            makeCommonConfig()
        );
        const special = creation(undefined as never);

        expect(special.getValue()).toBe(4);

        special.setValue(5);

        expect(special.getValue()).toBe(5);
    });

    // 验证 getSpecialName 委托给配置并反映当前数值
    it('delegates the special name to the config with the current value', () => {
        const creation = modules.defineCommonSerializableSpecial<number>(
            6,
            4,
            makeCommonConfig()
        );
        const special = creation(undefined as never);

        expect(special.getSpecialName()).toBe('连击4');

        special.setValue(5);

        expect(special.getSpecialName()).toBe('连击5');
    });

    // 验证 getDescription 委托给配置并反映当前数值
    it('delegates the description to the config with the current value', () => {
        const creation = modules.defineCommonSerializableSpecial<number>(
            6,
            2,
            makeCommonConfig()
        );
        const special = creation(undefined as never);

        expect(special.getDescription()).toBe('怪物每回合攻击2次。');

        special.setValue(3);

        expect(special.getDescription()).toBe('怪物每回合攻击3次。');
    });
});

describe('NonePropertySpecial units', () => {
    // 验证无属性特殊属性数值恒为 undefined 且 setValue 不产生效果
    it('keeps an undefined value regardless of setValue', () => {
        const creation = modules.defineNonePropertySpecial(1, makeNoneConfig());
        const special = creation(undefined as never);

        expect(special.getValue()).toBeUndefined();

        special.setValue(undefined);

        expect(special.getValue()).toBeUndefined();
    });

    // 验证无属性特殊属性使用配置提供的固定名称与描述
    it('reports the fixed name and description from the config', () => {
        const creation = modules.defineNonePropertySpecial(1, makeNoneConfig());
        const special = creation(undefined as never);

        expect(special.getSpecialName()).toBe('先攻');
        expect(special.getDescription()).toBe('怪物首先攻击。');
    });
});

describe('Special clone and deep equality', () => {
    // 验证可序列化特殊属性的 clone 深拷贝数值且与来源互相独立
    it('clones a serializable special without aliasing its value', () => {
        const source = createValueSpecial(6, 3);
        const clone = source.clone();

        expect(clone).not.toBe(source);
        expect(clone.code).toBe(6);
        expect(clone.getValue()).toBe(3);

        clone.setValue(9);

        expect(source.getValue()).toBe(3);
        expect(clone.getValue()).toBe(9);
    });

    // 验证可序列化特殊属性按 code 与深比较数值判定相等
    it('compares serializable specials by code and value', () => {
        expect(
            createValueSpecial(6, 3).deepEqualsTo(createValueSpecial(6, 3))
        ).toBe(true);
        expect(
            createValueSpecial(6, 3).deepEqualsTo(createValueSpecial(6, 5))
        ).toBe(false);
        expect(
            createValueSpecial(6, 3).deepEqualsTo(createValueSpecial(7, 3))
        ).toBe(false);
    });

    // 验证无属性特殊属性的 clone 独立且 deepEqualsTo 仅按 code 判定
    it('clones a none-property special and compares by code only', () => {
        const source = createNoneSpecial(1);
        const clone = source.clone();

        expect(clone).not.toBe(source);
        expect(clone.code).toBe(1);
        expect(clone.getValue()).toBeUndefined();
        expect(clone.deepEqualsTo(source)).toBe(true);
        expect(clone.deepEqualsTo(createNoneSpecial(2))).toBe(false);
    });
});
