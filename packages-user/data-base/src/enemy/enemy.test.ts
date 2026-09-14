// 测试 Enemy 数据模型：属性单元、特殊属性增删查、克隆与复制行为
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { type IEnemy } from './types';

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
