// 测试怪物比较器：基础属性全部一致且特殊属性集合深比较相等时判定为相同
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { type IEnemyAttr } from '@user/data-common';
import { type IReadonlyEnemy, type ISpecial } from '@user/data-base';

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
    MainEnemyComparer: typeof import('./comparer').MainEnemyComparer;
}

let modules: TestModules;

beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    const comparerModule = await import('./comparer');
    modules = {
        MainEnemyComparer: comparerModule.MainEnemyComparer
    };
});

/**
 * 创建一个按代码与数值做深比较的内联假特殊属性
 * @param code 特殊属性代码
 * @param value 特殊属性数值
 */
function createSpecial(code: number, value: unknown): ISpecial<any> {
    return {
        code,
        value,
        deepEqualsTo: (other: ISpecial<any>) =>
            other.code === code &&
            JSON.stringify(other.value) === JSON.stringify(value)
    } as never;
}

/**
 * 创建一个只实现比较器所需读取能力的内联假怪物
 * @param attrs 覆盖的怪物属性
 * @param specials 怪物拥有的特殊属性列表
 */
function createEnemy(
    attrs: Partial<IEnemyAttr> = {},
    specials: ISpecial<any>[] = []
): IReadonlyEnemy<IEnemyAttr> {
    const values: IEnemyAttr = {
        hp: 20,
        atk: 8,
        def: 5,
        money: 2,
        exp: 3,
        point: 1,
        guard: new Set(),
        ...attrs
    };
    return {
        id: 'test-enemy',
        code: 1,
        getSpecial: (code: number) =>
            specials.find(special => special.code === code) ?? null,
        hasSpecial: (code: number) =>
            specials.some(special => special.code === code),
        iterateSpecials: () => specials,
        getAttribute: (key: string) => (values as never)[key],
        cloneAttributes: () => structuredClone(values),
        clone: () => createEnemy(attrs, specials)
    } as never;
}

describe('MainEnemyComparer', () => {
    // 验证基础属性与特殊属性都一致时判定为相同
    it('returns true for identical attributes and specials', () => {
        const comparer = new modules.MainEnemyComparer();
        const enemyA = createEnemy({}, [createSpecial(6, 3)]);
        const enemyB = createEnemy({}, [createSpecial(6, 3)]);

        expect(comparer.compare(enemyA, enemyB)).toBe(true);
    });

    // 验证任一基础属性不同都会判定为不同
    it('returns false when any base attribute differs', () => {
        const comparer = new modules.MainEnemyComparer();
        const base = createEnemy();
        const cases: Array<[keyof IEnemyAttr, number]> = [
            ['hp', 21],
            ['atk', 9],
            ['def', 6],
            ['money', 3],
            ['exp', 4],
            ['point', 2]
        ];

        for (const [key, value] of cases) {
            const other = createEnemy({ [key]: value });
            expect(comparer.compare(base, other)).toBe(false);
        }
    });

    // 验证特殊属性数量不同时判定为不同
    it('returns false when the special counts differ', () => {
        const comparer = new modules.MainEnemyComparer();
        const enemyA = createEnemy({}, [createSpecial(6, 3)]);
        const enemyB = createEnemy({}, [
            createSpecial(6, 3),
            createSpecial(7, 0)
        ]);

        expect(comparer.compare(enemyA, enemyB)).toBe(false);
    });

    // 验证特殊属性代码集合不同时判定为不同
    it('returns false when the special codes differ', () => {
        const comparer = new modules.MainEnemyComparer();
        const enemyA = createEnemy({}, [createSpecial(6, 3)]);
        const enemyB = createEnemy({}, [createSpecial(7, 3)]);

        expect(comparer.compare(enemyA, enemyB)).toBe(false);
    });

    // 验证同代码特殊属性数值不同时判定为不同
    it('returns false when a special deep comparison fails', () => {
        const comparer = new modules.MainEnemyComparer();
        const enemyA = createEnemy({}, [createSpecial(6, 3)]);
        const enemyB = createEnemy({}, [createSpecial(6, 5)]);

        expect(comparer.compare(enemyA, enemyB)).toBe(false);
    });
});
