// 测试怪物数据模型存读档：Enemy/special/EnemyManager 同实例往返、压缩档与码 119/120
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { SaveCompression } from '@user/data-common';
import {
    type IEnemy,
    type IEnemyLegacyBridge,
    type IEnemyManager,
    type ISpecial
} from './types';

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
    Enemy: typeof import('./enemy').Enemy;
    CommonSerializableSpecial: typeof import('./special').CommonSerializableSpecial;
    NonePropertySpecial: typeof import('./special').NonePropertySpecial;
    EnemyManager: typeof import('./manager').EnemyManager;
    logger: typeof import('@motajs/common').logger;
}

let modules: TestModules;

beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    const enemyModule = await import('./enemy');
    const specialModule = await import('./special');
    const managerModule = await import('./manager');
    const commonModule = await import('@motajs/common');
    modules = {
        Enemy: enemyModule.Enemy,
        CommonSerializableSpecial: specialModule.CommonSerializableSpecial,
        NonePropertySpecial: specialModule.NonePropertySpecial,
        EnemyManager: managerModule.EnemyManager,
        logger: commonModule.logger
    };
});

afterAll(() => {
    vi.unstubAllGlobals();
});

/** 存读档测试覆盖的三档压缩级别 */
const SAVE_COMPRESSIONS = [
    SaveCompression.NoCompression,
    SaveCompression.LowCompression,
    SaveCompression.HighCompression
] as const;

interface IEnemyTestAttr {
    hp: number;
    atk: number;
    tags: string[];
}

/** 仅作为 EnemyManager 必需协作对象的内联假桥接，方法不会被本计划的存读档路径调用 */
const bridge: IEnemyLegacyBridge<IEnemyTestAttr> = {
    fromLegacyEnemy: (_enemy, defaultValue) => ({
        hp: 10,
        atk: 2,
        tags: ['legacy'],
        ...defaultValue
    })
};

/** 构造一个带合成属性的怪物对象 */
function createEnemy(
    id = 'enemy-1',
    code = 1,
    attributes: IEnemyTestAttr = { hp: 20, atk: 8, tags: ['base'] }
): IEnemy<IEnemyTestAttr> {
    return new modules.Enemy<IEnemyTestAttr>(
        id,
        code,
        structuredClone(attributes)
    );
}

/** 构造一个可序列化的数值特殊属性 */
function createSpecial(code: number, value: number): ISpecial<number> {
    return new modules.CommonSerializableSpecial<number>(code, value, {
        getSpecialName: () => `special-${code}`,
        getDescription: () => `description-${code}`,
        fromLegacyEnemy: () => value
    });
}

/** 构造一个独立的怪物管理器实例 */
function createManager(): IEnemyManager<IEnemyTestAttr> {
    return new modules.EnemyManager<IEnemyTestAttr>(bridge);
}

/** 构造一个只按生命值判定相等的内联怪物比较器 */
function createHpComparer() {
    return {
        compare: (
            enemyA: { getAttribute(key: 'hp'): number },
            enemyB: { getAttribute(key: 'hp'): number }
        ) => enemyA.getAttribute('hp') === enemyB.getAttribute('hp')
    };
}

describe('Enemy save and load round trips', () => {
    // 验证怪物属性与特殊属性值在三个压缩档下均能同实例恢复
    it('restores attributes and special values on the same instance across all compressions', () => {
        for (const compression of SAVE_COMPRESSIONS) {
            const enemy = createEnemy();
            const special = createSpecial(6, 3);
            enemy.addSpecial(special);
            enemy.setAttribute('hp', 31);

            const saved = enemy.saveState(compression);
            enemy.setAttribute('hp', 2);
            special.setValue(99);
            enemy.loadState(saved, compression);

            expect(enemy.getAttribute('hp')).toBe(31);
            expect(enemy.getAttribute('atk')).toBe(8);
            expect(enemy.getSpecial<number>(6)!.getValue()).toBe(3);
        }
    });

    // 验证 saveState 返回的属性为分离克隆，修改存档不会影响实例
    it('returns separated attribute clones from saveState', () => {
        const enemy = createEnemy();

        const saved = enemy.saveState(SaveCompression.NoCompression);
        saved.attrs.hp = 999;
        saved.attrs.tags.push('mutated');

        expect(enemy.getAttribute('hp')).toBe(20);
        expect(enemy.getAttribute('tags')).toEqual(['base']);
    });

    // 验证实例上存在但存档缺失的特殊属性经 logger.catch 观测到警告码 120
    it('warns code 120 when a special is missing during loadState', () => {
        const enemy = createEnemy();
        const special = createSpecial(6, 3);
        enemy.addSpecial(special);
        const other = createEnemy('other', 2);

        const saved = other.saveState(SaveCompression.NoCompression);
        const result = modules.logger.catch(() =>
            enemy.loadState(saved, SaveCompression.NoCompression)
        );

        expect(result.info.map(info => info.code)).toContain(120);
        expect(enemy.getSpecial<number>(6)!.getValue()).toBe(3);
    });
});

describe('Serializable special save and load round trips', () => {
    // 验证 CommonSerializableSpecial 的数值在三个压缩档下均能同实例恢复
    it('restores a common serializable special value across all compressions', () => {
        for (const compression of SAVE_COMPRESSIONS) {
            const special = createSpecial(6, 3);

            const saved = special.saveState(compression);
            special.setValue(9);
            special.loadState(saved, compression);

            expect(special.getValue()).toBe(3);
        }
    });

    // 验证 NonePropertySpecial 的存读档不改变无属性语义
    it('round-trips a none-property special without changing its value', () => {
        const config = {
            getSpecialName: () => 'none',
            getDescription: () => 'none',
            fromLegacyEnemy: () => {}
        };
        const special = new modules.NonePropertySpecial(7, config);

        for (const compression of SAVE_COMPRESSIONS) {
            const saved = special.saveState(compression);
            special.loadState(saved, compression);

            expect(special.getValue()).toBeUndefined();
            expect(
                special.deepEqualsTo(new modules.NonePropertySpecial(7, config))
            ).toBe(true);
        }
    });
});

describe('EnemyManager save and load round trips', () => {
    // 验证三个压缩档下只序列化脏模板且其属性可同实例恢复
    it('restores dirty prefab attributes on the same manager across all compressions', () => {
        for (const compression of SAVE_COMPRESSIONS) {
            const manager = createManager();
            manager.attachEnemyComparer(createHpComparer());
            manager.addPrefab(
                createEnemy('slime', 1, { hp: 20, atk: 8, tags: [] })
            );
            manager.addPrefab(
                createEnemy('bat', 2, { hp: 30, atk: 9, tags: [] })
            );
            manager.compareWith(
                new Map([
                    [1, createEnemy('slime', 1, { hp: 20, atk: 8, tags: [] })],
                    [2, createEnemy('bat', 2, { hp: 30, atk: 9, tags: [] })]
                ])
            );
            manager.modifyPrefabAttribute(1, prefab => {
                prefab.setAttribute('hp', 50);
                return prefab;
            });

            const saved = manager.saveState(compression);
            expect([...saved.modified.keys()]).toEqual([1]);

            manager.modifyPrefabAttribute(1, prefab => {
                prefab.setAttribute('hp', 1);
                return prefab;
            });
            manager.loadState(saved, compression);

            expect(manager.getPrefab(1)!.getAttribute('hp')).toBe(50);
            expect(manager.getPrefab(2)!.getAttribute('hp')).toBe(30);
        }
    });

    // 验证存档中缺失模板 code 时经 logger.catch 观测到警告码 119
    it('warns code 119 when the prefab is missing during loadState', () => {
        const manager = createManager();
        manager.addPrefab(createEnemy('slime', 1));
        const missing = createEnemy('ghost', 9);

        const saved = {
            modified: new Map([
                [9, missing.saveState(SaveCompression.NoCompression)]
            ])
        };
        const result = modules.logger.catch(() =>
            manager.loadState(saved, SaveCompression.NoCompression)
        );

        expect(result.info.map(info => info.code)).toContain(119);
    });
});
