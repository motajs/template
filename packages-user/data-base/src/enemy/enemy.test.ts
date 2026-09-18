// 测试 Enemy 数据模型：属性单元、特殊属性增删查、克隆与复制行为
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { type IEnemy, type ISpecial } from './types';

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
    logger: typeof import('@motajs/common').logger;
}

let modules: TestModules;

beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    const enemyModule = await import('./enemy');
    const specialModule = await import('./special');
    const commonModule = await import('@motajs/common');
    modules = {
        Enemy: enemyModule.Enemy,
        CommonSerializableSpecial: specialModule.CommonSerializableSpecial,
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

/**
 * 构造一个带合成属性的怪物对象
 * @param id 怪物标识符
 * @param code 怪物图块数字
 * @param attributes 初始属性
 */
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

/**
 * 构造一个可序列化的数值特殊属性，仅使用内联配置
 * @param code 特殊属性代码
 * @param value 特殊属性数值
 */
function createSpecial(code: number, value: number): ISpecial<number> {
    return new modules.CommonSerializableSpecial<number>(code, value, {
        getSpecialName: () => `special-${code}`,
        getDescription: () => `description-${code}`,
        fromLegacyEnemy: () => value
    });
}

describe('Enemy attribute units', () => {
    // 验证 getAttribute 按单个属性键返回构造时写入的初值
    it('reads each attribute key independently', () => {
        const enemy = createEnemy();

        expect(enemy.getAttribute('hp')).toBe(20);
        expect(enemy.getAttribute('atk')).toBe(8);
        expect(enemy.getAttribute('tags')).toEqual(['base']);
    });

    // 验证 setAttribute 只修改指定键且不影响其它属性
    it('updates only the selected attribute key', () => {
        const enemy = createEnemy();

        enemy.setAttribute('hp', 35);

        expect(enemy.getAttribute('hp')).toBe(35);
        expect(enemy.getAttribute('atk')).toBe(8);
        expect(enemy.getAttribute('tags')).toEqual(['base']);
    });

    // 验证 addAttribute 对数字键做增减且支持负值
    it('adds positive and negative deltas to a numeric key', () => {
        const enemy = createEnemy();

        enemy.addAttribute('hp', 5);
        enemy.addAttribute('atk', -3);

        expect(enemy.getAttribute('hp')).toBe(25);
        expect(enemy.getAttribute('atk')).toBe(5);
    });

    // 验证 cloneAttributes 返回深拷贝而非内部属性的别名
    it('returns a deep copy instead of an internal alias', () => {
        const enemy = createEnemy();

        const cloned = enemy.cloneAttributes();
        cloned.hp = 999;
        cloned.tags.push('mutated');

        expect(enemy.getAttribute('hp')).toBe(20);
        expect(enemy.getAttribute('tags')).toEqual(['base']);
        expect(enemy.cloneAttributes()).not.toBe(enemy.cloneAttributes());
    });
});

describe('Enemy special composition', () => {
    // 验证 addSpecial 后可按代码查询、判断存在并迭代取出
    it('adds a special and resolves it by code', () => {
        const enemy = createEnemy();
        const special = createSpecial(6, 3);

        enemy.addSpecial(special);

        expect(enemy.hasSpecial(6)).toBe(true);
        expect(enemy.getSpecial<number>(6)).toBe(special);
        expect([...enemy.iterateSpecials()].map(item => item.code)).toEqual([
            6
        ]);
        expect(enemy.hasSpecial(7)).toBe(false);
        expect(enemy.getSpecial(7)).toBeNull();
    });

    // 验证重复 code 告警 96 且不替换既有特殊属性
    it('warns 96 and keeps the existing special on a duplicate code', () => {
        const enemy = createEnemy();
        enemy.addSpecial(createSpecial(6, 3));

        const result = modules.logger.catch(() =>
            enemy.addSpecial(createSpecial(6, 9))
        );

        expect(result.info.map(info => info.code)).toContain(96);
        expect(enemy.getSpecial<number>(6)!.getValue()).toBe(3);
        expect([...enemy.iterateSpecials()]).toHaveLength(1);
    });

    // 验证 deleteSpecial 支持按对象与按代码删除且未知代码安全无操作
    it('deletes specials by object or code and ignores unknown codes', () => {
        const enemy = createEnemy();
        const first = createSpecial(6, 3);
        enemy.addSpecial(first);
        enemy.addSpecial(createSpecial(7, 5));

        enemy.deleteSpecial(first);

        expect(enemy.hasSpecial(6)).toBe(false);
        expect(enemy.getSpecial(6)).toBeNull();

        enemy.deleteSpecial(7);
        enemy.deleteSpecial(99);

        expect([...enemy.iterateSpecials()]).toHaveLength(0);
    });

    // 验证 clone 复制属性与克隆后的特殊属性且与来源互相独立
    it('clones attributes and specials into an independent enemy', () => {
        const source = createEnemy('source', 1, {
            hp: 20,
            atk: 8,
            tags: ['base']
        });
        source.addSpecial(createSpecial(6, 3));

        const clone = source.clone();

        expect(clone).not.toBe(source);
        expect(clone.id).toBe('source');
        expect(clone.code).toBe(1);
        expect(clone.getSpecial<number>(6)).not.toBe(source.getSpecial(6));
        expect(clone.getAttribute('tags')).not.toBe(
            source.getAttribute('tags')
        );

        clone.setAttribute('hp', 99);
        clone.getSpecial<number>(6)!.setValue(9);
        clone.getAttribute('tags').push('cloned');

        expect(source.getAttribute('hp')).toBe(20);
        expect(source.getSpecial<number>(6)!.getValue()).toBe(3);
        expect(source.getAttribute('tags')).toEqual(['base']);
    });

    // 验证 copyFrom 以来源的属性与克隆后的特殊属性整体替换当前对象
    it('copies attributes and specials from another enemy', () => {
        const target = createEnemy('target', 2, { hp: 1, atk: 1, tags: [] });
        target.addSpecial(createSpecial(7, 5));
        const source = createEnemy('source', 1, {
            hp: 77,
            atk: 5,
            tags: ['copied']
        });
        source.addSpecial(createSpecial(6, 3));

        target.copyFrom(source);

        expect(target.id).toBe('target');
        expect(target.code).toBe(2);
        expect(target.getAttribute('hp')).toBe(77);
        expect(target.getAttribute('tags')).toEqual(['copied']);
        expect(target.hasSpecial(7)).toBe(false);
        expect(target.getSpecial<number>(6)).not.toBe(source.getSpecial(6));
        expect(target.getSpecial<number>(6)!.getValue()).toBe(3);

        source.setAttribute('hp', 1);

        expect(target.getAttribute('hp')).toBe(77);
    });
});
