// 测试怪物最终效果：坚固把防御提升到勇士攻击减一、模仿复制勇士攻防、无相关特殊属性时保持不变
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { type IEnemyAttr, type IHeroAttr } from '@user/data-common';
import { type IEnemyHandler } from '@user/data-system';
import {
    type IEnemy,
    type IReadonlyHeroAttribute
} from '@user/data-base';

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
    MainEnemyFinalEffect: typeof import('./final').MainEnemyFinalEffect;
}

let modules: TestModules;

beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    const finalModule = await import('./final');
    modules = {
        MainEnemyFinalEffect: finalModule.MainEnemyFinalEffect
    };
});

interface FakeEnemy {
    /** 可写怪物对象 */
    enemy: IEnemy<IEnemyAttr>;
    /** 当前怪物属性，供断言使用 */
    attrs: IEnemyAttr;
}

/**
 * 创建一个只实现最终效果所需能力的内联假怪物
 * @param attrs 覆盖的怪物属性
 * @param specials 怪物拥有的特殊属性代码
 */
function createEnemy(
    attrs: Partial<IEnemyAttr> = {},
    specials: number[] = []
): FakeEnemy {
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
    const enemy = {
        id: 'test-enemy',
        code: 1,
        getSpecial: () => null,
        hasSpecial: (code: number) => specials.includes(code),
        iterateSpecials: () => [],
        getAttribute: (key: string) => (values as never)[key],
        cloneAttributes: () => structuredClone(values),
        clone: () => enemy,
        addSpecial: () => {},
        deleteSpecial: () => {},
        setAttribute: (key: string, value: unknown) => {
            (values as never)[key] = value;
        },
        addAttribute: (key: string, value: number) => {
            (values as never)[key] += value;
        },
        copyFrom: () => {},
        saveState: () => ({ attrs: structuredClone(values), specials: new Map() }),
        loadState: () => {}
    } as never;
    return { enemy, attrs: values };
}

/**
 * 创建一个只提供最终属性读取的内联假勇士
 * @param attrs 覆盖的勇士属性
 */
function createHero(
    attrs: Partial<IHeroAttr> = {}
): IReadonlyHeroAttribute<IHeroAttr> {
    const values: IHeroAttr = {
        name: 'hero',
        hp: 100,
        hpmax: 100,
        atk: 20,
        def: 7,
        mdef: 0,
        mana: 0,
        manamax: 0,
        money: 0,
        exp: 0,
        ...attrs
    };
    return {
        getBaseAttribute: (name: string) => (values as never)[name],
        getFinalAttribute: (name: string) => (values as never)[name]
    } as never;
}

/**
 * 组装一个最终效果所需的最小信息对象
 * @param enemy 怪物对象
 * @param hero 勇士属性对象
 */
function createHandler(
    enemy: IEnemy<IEnemyAttr>,
    hero: IReadonlyHeroAttribute<IHeroAttr> = createHero()
): IEnemyHandler<IEnemyAttr, IHeroAttr> {
    return { enemy, hero } as never;
}

describe('MainEnemyFinalEffect', () => {
    // 验证最终效果的优先级为 0
    it('reports priority 0', () => {
        const effect = new modules.MainEnemyFinalEffect();

        expect(effect.priority).toBe(0);
    });

    // 验证坚固把低于勇士攻击减一的防御提升到该值
    it('raises defense to hero attack minus one for 坚固', () => {
        const { enemy, attrs } = createEnemy({ def: 5 }, [3]);
        const effect = new modules.MainEnemyFinalEffect();

        effect.apply(createHandler(enemy));

        expect(attrs.def).toBe(19);
    });

    // 验证坚固不会降低已高于勇士攻击减一的防御
    it('keeps a defense already above hero attack minus one for 坚固', () => {
        const { enemy, attrs } = createEnemy({ def: 25 }, [3]);
        const effect = new modules.MainEnemyFinalEffect();

        effect.apply(createHandler(enemy));

        expect(attrs.def).toBe(25);
    });

    // 验证模仿把怪物的攻击与防御改成勇士的最终攻击与防御
    it('copies hero attack and defense for 模仿', () => {
        const { enemy, attrs } = createEnemy({ atk: 3, def: 3 }, [10]);
        const effect = new modules.MainEnemyFinalEffect();

        effect.apply(createHandler(enemy));

        expect(attrs.atk).toBe(20);
        expect(attrs.def).toBe(7);
    });

    // 验证没有相关特殊属性时怪物的攻击与防御保持不变
    it('leaves enemies without the effect specials untouched', () => {
        const { enemy, attrs } = createEnemy({ atk: 3, def: 3 }, [1, 2]);
        const effect = new modules.MainEnemyFinalEffect();

        effect.apply(createHandler(enemy));

        expect(attrs.atk).toBe(3);
        expect(attrs.def).toBe(3);
    });
});
