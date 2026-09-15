// 测试 EnemyManager 的注册表、模板增删改查、复用映射与比较器脏跟踪
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
    type IEnemy,
    type IEnemyComparer,
    type IEnemyLegacyBridge,
    type IEnemyManager
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
    EnemyManager: typeof import('./manager').EnemyManager;
    logger: typeof import('@motajs/common').logger;
}

let modules: TestModules;

beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    const enemyModule = await import('./enemy');
    const managerModule = await import('./manager');
    const commonModule = await import('@motajs/common');
    modules = {
        Enemy: enemyModule.Enemy,
        EnemyManager: managerModule.EnemyManager,
        logger: commonModule.logger
    };
});

afterAll(() => {
    vi.unstubAllGlobals();
});

interface IEnemyTestAttr {
    hp: number;
    atk: number;
    tags: string[];
}

/** 仅作为 EnemyManager 必需协作对象的内联假桥接，方法不会被本计划调用 */
const bridge: IEnemyLegacyBridge<IEnemyTestAttr> = {
    fromLegacyEnemy: (_enemy, defaultValue) => ({
        hp: 10,
        atk: 2,
        tags: ['legacy'],
        ...defaultValue
    })
};

/**
 * 构造一个独立的怪物管理器实例
 */
function createManager(): IEnemyManager<IEnemyTestAttr> {
    return new modules.EnemyManager<IEnemyTestAttr>(bridge);
}

/**
 * 构造一个带合成属性的怪物模板
 * @param code 怪物图块数字
 * @param id 怪物标识符
 * @param attributes 覆盖的怪物属性
 */
function createPrefab(
    code: number,
    id: string,
    attributes: Partial<IEnemyTestAttr> = {}
): IEnemy<IEnemyTestAttr> {
    return new modules.Enemy<IEnemyTestAttr>(id, code, {
        hp: 20,
        atk: 8,
        tags: ['prefab'],
        ...attributes
    });
}

/**
 * 构造一个只按生命值判定相等的内联怪物比较器
 */
function createHpComparer(): IEnemyComparer<IEnemyTestAttr> {
    return {
        compare: (enemyA, enemyB) =>
            enemyA.getAttribute('hp') === enemyB.getAttribute('hp')
    };
}

/**
 * 读取管理器内部的脏模板集合，仅用于观察脏跟踪结果
 * @param manager 怪物管理器
 */
function dirtyCodes(manager: IEnemyManager<IEnemyTestAttr>): number[] {
    const dirty = Reflect.get(manager, 'dirtySet') as Set<number>;
    return [...dirty].sort((a, b) => a - b);
}

describe('EnemyManager registry and attribute defaults', () => {
    // 验证注册与重复注册特殊属性创建函数均不会产生告警或报错
    it('accepts special creators and allows re-registration silently', () => {
        const manager = createManager();
        const creator = () => {
            throw new Error('special creator should not be invoked here');
        };

        const result = modules.logger.catch(() => {
            manager.registerSpecial(6, creator);
            manager.registerSpecial(6, creator);
        });

        expect(result.info).toEqual([]);
    });

    // 验证合法的属性默认值注册不产生报错
    it('accepts serializable default attribute values', () => {
        const manager = createManager();

        const result = modules.logger.catch(() => {
            manager.setAttributeDefaults('hp', 0);
            manager.setAttributeDefaults('tags', []);
        });

        expect(result.info).toEqual([]);
    });

    // 验证函数/符号/bigint/undefined 默认值均报错 53
    it('logs error 53 for non-serializable default attribute values', () => {
        const manager = createManager();

        const result = modules.logger.catch(() => {
            manager.setAttributeDefaults('hp', (() => 1) as never);
            manager.setAttributeDefaults('atk', Symbol('bad') as never);
            manager.setAttributeDefaults('hp', 1n as never);
            manager.setAttributeDefaults('atk', undefined as never);
        });

        expect(result.info.filter(info => info.code === 53)).toHaveLength(4);
    });
});

describe('EnemyManager prefab CRUD', () => {
    // 验证 addPrefab 存储克隆且同时可按 code 与按 id 查询
    it('adds a prefab clone addressable by code and id', () => {
        const manager = createManager();
        const source = createPrefab(1, 'slime');

        manager.addPrefab(source);

        const byCode = manager.getPrefab(1);
        const byId = manager.getPrefabById('slime');

        expect(byCode).not.toBeNull();
        expect(byId).toBe(byCode);
        expect(byCode).not.toBe(source);

        source.setAttribute('hp', 999);

        expect(manager.getPrefab(1)!.getAttribute('hp')).toBe(20);
    });

    // 验证 code 或 id 已存在时 addPrefab 不做任何操作
    it('ignores a prefab whose code or id already exists', () => {
        const manager = createManager();
        manager.addPrefab(createPrefab(1, 'slime'));

        manager.addPrefab(createPrefab(1, 'other'));
        manager.addPrefab(createPrefab(2, 'slime'));

        expect(manager.getPrefab(1)!.id).toBe('slime');
        expect(manager.getPrefabById('slime')!.code).toBe(1);
        expect(manager.getPrefab(2)).toBeNull();
        expect(manager.getPrefabById('other')).toBeNull();
    });

    // 验证 createEnemy 与 createEnemyById 返回互相独立、与模板独立的克隆，未知返回 null
    it('creates independent enemy clones by code and id', () => {
        const manager = createManager();
        manager.addPrefab(createPrefab(1, 'slime'));

        const first = manager.createEnemy(1);
        const second = manager.createEnemyById('slime');

        expect(first).not.toBeNull();
        expect(second).not.toBeNull();
        expect(first).not.toBe(second);

        first!.setAttribute('hp', 99);

        expect(manager.createEnemy(1)!.getAttribute('hp')).toBe(20);
        expect(manager.getPrefab(1)!.getAttribute('hp')).toBe(20);
        expect(manager.createEnemy(99)).toBeNull();
        expect(manager.createEnemyById('missing')).toBeNull();
    });

    // 验证 deletePrefab 按 code 与按 id 都会移除两个索引
    it('deletes a prefab from both indexes by code or id', () => {
        const manager = createManager();
        manager.addPrefab(createPrefab(1, 'slime'));
        manager.addPrefab(createPrefab(2, 'bat'));

        manager.deletePrefab(1);

        expect(manager.getPrefab(1)).toBeNull();
        expect(manager.getPrefabById('slime')).toBeNull();
        expect(manager.createEnemy(1)).toBeNull();
        expect(manager.getPrefab(2)).not.toBeNull();

        manager.deletePrefab('bat');

        expect(manager.getPrefab(2)).toBeNull();
        expect(manager.getPrefabById('bat')).toBeNull();
    });

    // 验证 changePrefab 替换模板，并在 code 或 id 变化时重建索引
    it('replaces a prefab and reindexes when its code or id changes', () => {
        const manager = createManager();
        manager.addPrefab(createPrefab(1, 'slime'));

        manager.changePrefab(1, createPrefab(1, 'slime', { hp: 50 }));

        expect(manager.getPrefab(1)!.getAttribute('hp')).toBe(50);

        manager.changePrefab(1, createPrefab(2, 'bat', { hp: 70 }));

        expect(manager.getPrefab(1)).toBeNull();
        expect(manager.getPrefabById('slime')).toBeNull();
        expect(manager.getPrefab(2)!.getAttribute('hp')).toBe(70);
        expect(manager.getPrefabById('bat')).not.toBeNull();
    });
});

describe('EnemyManager reuse mapping', () => {
    // 验证复用注册后按复用 code 与复用 id 读取都解析到来源模板
    it('resolves reused codes and ids to the source prefab on reads', () => {
        const manager = createManager();
        manager.addPrefab(createPrefab(1, 'slime'));

        manager.reusePrefab(1, 100, 'slime-reuse');

        expect(manager.getPrefab(100)).toBe(manager.getPrefab(1));
        expect(manager.getPrefabById('slime-reuse')).toBe(
            manager.getPrefabById('slime')
        );
    });

    // 验证来源不存在时复用注册不产生任何映射
    it('ignores reuse registration for an unknown source', () => {
        const manager = createManager();
        manager.addPrefab(createPrefab(1, 'slime'));

        manager.reusePrefab(999, 100, 'missing-reuse');

        expect(manager.getPrefab(100)).toBeNull();
        expect(manager.getPrefabById('missing-reuse')).toBeNull();
    });

    // 验证 createEnemy 按复用 code 解析到来源模板并生成独立怪物
    it('creates enemies for reused codes and ids through the reuse mapping', () => {
        const manager = createManager();
        manager.addPrefab(createPrefab(1, 'slime'));
        manager.reusePrefab(1, 100, 'slime-reuse');

        expect(manager.createEnemy(100)!.id).toBe('slime');
        expect(manager.createEnemyById('slime-reuse')!.id).toBe('slime');
    });

    // 验证同一模板经四个朝向 code 复用后，创建的怪物互相独立且不影响来源模板
    it('creates four independent enemies from one prefab reused by four facing codes', () => {
        const manager = createManager();
        manager.addPrefab(createPrefab(1, 'slime'));
        manager.reusePrefab(1, 100, 'slime-up');
        manager.reusePrefab(1, 101, 'slime-right');
        manager.reusePrefab(1, 102, 'slime-down');
        manager.reusePrefab(1, 103, 'slime-left');

        const source = manager.getPrefab(1);

        for (const code of [100, 101, 102, 103]) {
            expect(manager.getPrefab(code)).toBe(source);
        }
        for (const id of [
            'slime-up',
            'slime-right',
            'slime-down',
            'slime-left'
        ]) {
            expect(manager.getPrefabById(id)).toBe(
                manager.getPrefabById('slime')
            );
        }

        const created = [100, 101, 102, 103].map(code =>
            manager.createEnemy(code)
        );

        expect(created.every(enemy => enemy !== null)).toBe(true);
        expect(created.map(enemy => enemy!.id)).toEqual([
            'slime',
            'slime',
            'slime',
            'slime'
        ]);
        expect(new Set(created).size).toBe(4);
        expect(created.every(enemy => enemy !== source)).toBe(true);

        created[0]!.setAttribute('hp', 99);

        expect(
            created.slice(1).map(enemy => enemy!.getAttribute('hp'))
        ).toEqual([20, 20, 20]);
        expect(manager.getPrefab(1)!.getAttribute('hp')).toBe(20);

        const createdById = [
            'slime-up',
            'slime-right',
            'slime-down',
            'slime-left'
        ].map(id => manager.createEnemyById(id));

        expect(createdById.every(enemy => enemy !== null)).toBe(true);
        expect(createdById.every(enemy => enemy!.id === 'slime')).toBe(true);
        expect(new Set(createdById).size).toBe(4);

        createdById[0]!.setAttribute('hp', 77);

        expect(
            createdById.slice(1).map(enemy => enemy!.getAttribute('hp'))
        ).toEqual([20, 20, 20]);
    });
});

describe('EnemyManager modifyPrefabAttribute', () => {
    // 验证修改回调按 code 应用到已有模板
    it('applies a modification callback to an existing prefab', () => {
        const manager = createManager();
        manager.addPrefab(createPrefab(1, 'slime'));

        manager.modifyPrefabAttribute(1, prefab => {
            prefab.setAttribute('hp', 30);
            return prefab;
        });

        expect(manager.getPrefab(1)!.getAttribute('hp')).toBe(30);
    });

    // 验证回调返回新对象且 code 或 id 变化时重建两个索引
    it('rebuilds the indexes when a modification changes code or id', () => {
        const manager = createManager();
        manager.addPrefab(createPrefab(1, 'slime'));

        manager.modifyPrefabAttribute(1, () =>
            createPrefab(2, 'bat', { hp: 40 })
        );

        expect(manager.getPrefab(1)).toBeNull();
        expect(manager.getPrefabById('slime')).toBeNull();
        expect(manager.getPrefab(2)!.getAttribute('hp')).toBe(40);
        expect(manager.getPrefabById('bat')).not.toBeNull();
    });

    // 验证未知 code 的修改回调不会被调用
    it('ignores a modification for an unknown prefab', () => {
        const manager = createManager();
        let called = false;

        manager.modifyPrefabAttribute(99, prefab => {
            called = true;
            return prefab;
        });

        expect(called).toBe(false);
    });
});

describe('EnemyManager comparer and dirty tracking', () => {
    // 验证未附加比较器时 getEnemyComparer 返回 null，附加后返回同一对象
    it('reports the attached comparer and defaults to null', () => {
        const manager = createManager();

        expect(manager.getEnemyComparer()).toBeNull();

        const comparer = createHpComparer();
        manager.attachEnemyComparer(comparer);

        expect(manager.getEnemyComparer()).toBe(comparer);
    });

    // 验证首次 compareWith 之前脏跟踪惰性，之后按比较结果标记与清除
    it('keeps dirty tracking lazy until compareWith then tracks changes', () => {
        const manager = createManager();
        manager.attachEnemyComparer(createHpComparer());
        manager.addPrefab(createPrefab(1, 'slime', { hp: 20 }));

        manager.modifyPrefabAttribute(1, prefab => {
            prefab.setAttribute('hp', 30);
            return prefab;
        });

        expect(dirtyCodes(manager)).toEqual([]);

        manager.compareWith(
            new Map([[1, createPrefab(1, 'slime', { hp: 20 })]])
        );

        expect(dirtyCodes(manager)).toEqual([]);

        manager.modifyPrefabAttribute(1, prefab => {
            prefab.setAttribute('hp', 40);
            return prefab;
        });

        expect(dirtyCodes(manager)).toEqual([1]);

        manager.modifyPrefabAttribute(1, prefab => {
            prefab.setAttribute('hp', 20);
            return prefab;
        });

        expect(dirtyCodes(manager)).toEqual([]);
    });

    // 验证第二次 compareWith 告警 117 并刷新脏集丢弃与参考相等的条目
    it('warns 117 on a repeat compareWith and refreshes the dirty set', () => {
        const manager = createManager();
        let equal = false;
        manager.attachEnemyComparer({
            compare: () => equal
        });
        manager.addPrefab(createPrefab(1, 'slime'));
        manager.compareWith(new Map([[1, createPrefab(1, 'slime')]]));

        manager.changePrefab(1, createPrefab(1, 'slime', { hp: 30 }));

        expect(dirtyCodes(manager)).toEqual([1]);

        equal = true;

        const result = modules.logger.catch(() =>
            manager.compareWith(new Map([[1, createPrefab(1, 'slime')]]))
        );

        expect(result.info.map(info => info.code)).toContain(117);
        expect(dirtyCodes(manager)).toEqual([]);
    });

    // 验证未附加比较器时 updateDirty 告警 118 并标记为脏
    it('warns 118 and marks dirty when no comparer is attached', () => {
        const manager = createManager();
        manager.addPrefab(createPrefab(1, 'slime', { hp: 20 }));
        manager.compareWith(
            new Map([[1, createPrefab(1, 'slime', { hp: 20 })]])
        );

        const result = modules.logger.catch(() =>
            manager.modifyPrefabAttribute(1, prefab => {
                prefab.setAttribute('hp', 30);
                return prefab;
            })
        );

        expect(result.info.map(info => info.code)).toContain(118);
        expect(dirtyCodes(manager)).toEqual([1]);
    });
});
