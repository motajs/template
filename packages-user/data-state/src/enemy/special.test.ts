// 测试怪物特殊属性注册：代码 0-27 全量注册、守卫默认值、名称与描述生成
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { type ISpecial } from '@user/data-base';
import { type IHaloValue } from './special';

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
    registerSpecials: typeof import('./special').registerSpecials;
}

let modules: TestModules;

beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    const specialModule = await import('./special');
    modules = { registerSpecials: specialModule.registerSpecials };
});

type SpecialCreation = (enemy: unknown) => ISpecial<any>;

interface FakeEnemyManager {
    /** 记录注册的属性默认值 */
    defaults: Map<string, unknown>;
    /** 记录注册的代码与创建函数 */
    specials: Map<number, SpecialCreation>;
    /** 记录每个代码的注册次数 */
    registerCounts: Map<number, number>;
    /** 注册一个特殊属性 */
    registerSpecial(code: number, cons: SpecialCreation): void;
    /** 注册一个属性默认值 */
    setAttributeDefaults(name: string, value: unknown): void;
}

/**
 * 创建一个只实现注册接口的内联假怪物管理器
 */
function createManager(): FakeEnemyManager {
    const defaults = new Map<string, unknown>();
    const specials = new Map<number, SpecialCreation>();
    const registerCounts = new Map<number, number>();
    return {
        defaults,
        specials,
        registerCounts,
        registerSpecial: (code, cons) => {
            specials.set(code, cons);
            registerCounts.set(code, (registerCounts.get(code) ?? 0) + 1);
        },
        setAttributeDefaults: (name, value) => {
            defaults.set(name, value);
        }
    };
}

/**
 * 取出注册表中的一个特殊属性创建函数并实例化
 * @param manager 假怪物管理器
 * @param code 特殊属性代码
 */
function createSpecial(
    manager: FakeEnemyManager,
    code: number
): ISpecial<any> {
    const creation = manager.specials.get(code);
    if (!creation) throw new Error(`special ${code} was not registered`);
    return creation(undefined);
}

describe('registerSpecials', () => {
    // 验证代码 0 到 27 每个都被恰好注册一次
    it('registers every special code from 0 to 27 exactly once', () => {
        const manager = createManager();
        modules.registerSpecials(manager as never);

        const codes = [...manager.specials.keys()].sort((a, b) => a - b);
        const counts = [...manager.registerCounts.values()];

        expect(codes).toEqual([...Array(28).keys()]);
        expect(counts).toEqual(Array(28).fill(1));
    });

    // 验证注册时写入守卫属性默认值为空集合
    it('registers an empty set default for the guard attribute', () => {
        const manager = createManager();
        modules.registerSpecials(manager as never);

        expect(manager.defaults.has('guard')).toBe(true);
        expect(manager.defaults.get('guard')).toBeInstanceOf(Set);
        expect((manager.defaults.get('guard') as Set<unknown>).size).toBe(0);
    });

    // 验证每个注册的特殊属性都提供名称与描述方法
    it('provides a name and description accessor for every special', () => {
        const manager = createManager();
        modules.registerSpecials(manager as never);

        for (const code of manager.specials.keys()) {
            const special = createSpecial(manager, code);
            expect(typeof special.getSpecialName).toBe('function');
            expect(typeof special.getDescription).toBe('function');
        }
    });

    // 验证可序列化特殊属性按当前数值生成名称与描述
    it('builds the name and description of a serializable special', () => {
        const manager = createManager();
        modules.registerSpecials(manager as never);
        const combo = createSpecial(manager, 6);

        expect(combo.getSpecialName()).toBe('4连击');
        combo.setValue(5);
        expect(combo.getSpecialName()).toBe('5连击');
        expect(combo.getDescription()).toBe('怪物每回合攻击5次。');
    });

    // 验证光环特殊属性按范围与加成生成描述
    it('builds the description of the halo special from its value', () => {
        const manager = createManager();
        modules.registerSpecials(manager as never);
        const halo = createSpecial(manager, 25);

        expect(halo.getSpecialName()).toBe('光环');
        expect(halo.getDescription()).toContain('同楼层所有怪物');
        expect(halo.getDescription()).toContain('线性叠加。');

        const value: IHaloValue = {
            haloRange: 2,
            haloSquare: true,
            hpBuff: 10,
            atkBuff: 0,
            defBuff: 0
        };
        halo.setValue(value);
        expect(halo.getDescription()).toContain('九宫格2格范围内所有怪物');
        expect(halo.getDescription()).toContain('生命提升10%');
    });

    // 验证无属性特殊属性提供固定名称与描述
    it('provides a fixed name and description for a none-property special', () => {
        const manager = createManager();
        modules.registerSpecials(manager as never);
        const firstStrike = createSpecial(manager, 1);

        expect(firstStrike.getSpecialName()).toBe('先攻');
        expect(firstStrike.getDescription()).toBe('怪物首先攻击。');
    });
});
