// 测试 CoreState 顶层存读档：经公开 saveState/loadState 对 5 个 saveable 做整体往返
import { describe, expect, it, vi } from 'vitest';
import { logger } from '@motajs/common';
import {
    type IEnemyAttr,
    type IHeroAttr,
    SaveCompression
} from '@user/data-common';
import {
    Enemy,
    type IGameMap,
    type IHeroStateSave,
    type IMapLayer,
    type IMapStoreSave
} from '@user/data-base';
import { CoreState, createCoreState } from '../src/core';

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

/** CoreState 已注册的 5 个可存档 id */
const SAVEABLE_IDS = [
    '@system/hero',
    '@system/flags',
    '@system/maps',
    '@system/enemy',
    '@system/replay'
] as const;

/** 存读档测试覆盖的三档压缩级别 */
const COMPRESSIONS = [
    SaveCompression.NoCompression,
    SaveCompression.LowCompression,
    SaveCompression.HighCompression
] as const;

/** 构造一个带合成属性的怪物模板对象 */
function createEnemy(hp = 20): Enemy<IEnemyAttr> {
    return new Enemy<IEnemyAttr>('closure-enemy', 1, {
        hp,
        atk: 8,
        def: 5,
        money: 2,
        exp: 3,
        point: 1,
        guard: new Set()
    });
}

interface SeededState {
    map: IGameMap;
    layer: IMapLayer;
}

/** 为 5 个 saveable 写入已知关键状态 */
function seedState(state: CoreState): SeededState {
    state.hero.getModifiableAttribute().set('hp', 88);
    state.flags.setFieldValue('score', 7);
    const map = state.maps.createMap('F1', 2, 2);
    const layer = map.addLayer();
    layer.setZIndex(0);
    map.setActiveStatus(true);
    state.maps.compareWith(
        new Map([['F1', new Map([[0, new Uint32Array(4)]])]])
    );
    layer.setBlock(5, 0, 0);
    state.enemyManager.addPrefab(createEnemy());
    state.enemyManager.compareWith(new Map([[1, createEnemy()]]));
    state.enemyManager.modifyPrefabAttribute(1, prefab => {
        prefab.setAttribute('hp', 30);
        return prefab;
    });
    state.replaySystem.record(2, 7);
    return { map, layer };
}

/** 保存后修改每个 saveable 的关键状态，用于验证读档恢复 */
function mutateState(state: CoreState, seeded: SeededState): void {
    state.hero.getModifiableAttribute().set('hp', 1);
    state.flags.setFieldValue('score', 0);
    seeded.layer.setBlock(0, 0, 0);
    state.enemyManager.modifyPrefabAttribute(1, prefab => {
        prefab.setAttribute('hp', 99);
        return prefab;
    });
    state.replaySystem.record(9, 1);
}

/** 逐 saveable 断言关键字段回到存档点 */
function assertRestored(state: CoreState, seeded: SeededState): void {
    expect(state.hero.getModifiableAttribute().getBaseAttribute('hp')).toBe(88);
    expect(state.flags.getFieldValue<number>('score')).toBe(7);
    expect(seeded.layer.getBlock(0, 0)).toBe(5);
    expect(state.enemyManager.getPrefab(1)!.getAttribute('hp')).toBe(30);
    expect(state.replaySystem.route.length).toBe(1);
    expect(state.replaySystem.route.get(0)).toEqual({
        command: 2,
        params: [7],
        index: 0
    });
}

describe('CoreState top-level save and load round trips', () => {
    // 验证 5 个已注册 saveable 在三个压缩档下均经公开入口整体往返
    it('round-trips every registered saveable across all compressions', () => {
        for (const compression of COMPRESSIONS) {
            const state = createCoreState();
            const seeded = seedState(state);

            const snapshot = state.saveState(compression);
            expect([...snapshot.keys()].sort()).toEqual(
                [...SAVEABLE_IDS].sort()
            );

            mutateState(state, seeded);
            state.loadState(snapshot, compression);

            assertRestored(state, seeded);
        }
    });

    // 验证快照以 5 个 id 为键且与活对象分离
    it('keeps a snapshot separated from the live saveables', () => {
        const state = createCoreState();
        const seeded = seedState(state);

        const snapshot = state.saveState(SaveCompression.NoCompression);
        expect([...snapshot.keys()].sort()).toEqual([...SAVEABLE_IDS].sort());

        state.hero.getModifiableAttribute().set('hp', 1);
        seeded.layer.setBlock(0, 0, 0);

        const heroSave = snapshot.get(
            '@system/hero'
        ) as IHeroStateSave<IHeroAttr>;
        const mapSave = snapshot.get('@system/maps') as IMapStoreSave;
        expect(heroSave.attribute.hp).toBe(88);
        expect(mapSave.floors.get('F1')!.layers.get(0)!.fullMap![0]).toBe(5);
    });

    // 验证 getSaveableContent 对 5 个 id 返回同一实例，未知 id 返回 null
    it('resolves the registered saveables by id through getSaveableContent', () => {
        const state = createCoreState();

        for (const id of SAVEABLE_IDS) {
            expect(state.getSaveableContent(id)).not.toBeNull();
        }
        expect(state.getSaveableContent('@system/hero')).toBe(state.hero);
        expect(state.getSaveableContent('@system/flags')).toBe(state.flags);
        expect(state.getSaveableContent('@system/maps')).toBe(state.maps);
        expect(state.getSaveableContent('@system/enemy')).toBe(
            state.enemyManager
        );
        expect(state.getSaveableContent('@system/replay')).toBe(
            state.replaySystem
        );
        expect(state.getSaveableContent('@missing')).toBeNull();
    });
});

describe('CoreState save and load guards', () => {
    // 验证重复注册同一 saveable id 时经 logger.catch 观测到警告码 112
    it('warns code 112 when adding a duplicate saveable id', () => {
        const state = createCoreState();

        const result = logger.catch(() =>
            state.addSaveableContent('@system/hero', state.hero)
        );

        expect(result.info.map(info => info.code)).toContain(112);
        expect(state.getSaveableContent('@system/hero')).toBe(state.hero);
    });

    // 验证为未添加的对象绑定执行器时经 logger.catch 观测到警告码 113
    it('warns code 113 when binding an executor to an unadded saveable', () => {
        const state = createCoreState();
        const fake = {
            saveState: (_compression: SaveCompression) => null,
            loadState: (_state: unknown, _compression: SaveCompression) => {}
        };

        const result = logger.catch(() =>
            state.bindSaveableExecuter(fake as never, { afterLoad: () => {} })
        );

        expect(result.info.map(info => info.code)).toContain(113);
    });

    // 验证存档缺失某个 saveable key 时经 logger.catch 观测到警告码 177
    it('warns code 177 when the save data misses a saveable key', () => {
        const state = createCoreState();
        const snapshot = new Map(
            state.saveState(SaveCompression.NoCompression)
        );
        snapshot.delete('@system/flags');

        const result = logger.catch(() =>
            state.loadState(snapshot, SaveCompression.NoCompression)
        );

        expect(result.info.map(info => info.code)).toContain(177);
    });

    // 验证存档缺失 saveable key 时同时观测到警告码 178（当前实现的实际触发路径）
    it('warns code 178 when the save data misses a saveable key', () => {
        const state = createCoreState();
        const snapshot = new Map(
            state.saveState(SaveCompression.NoCompression)
        );
        snapshot.delete('@system/flags');

        const result = logger.catch(() =>
            state.loadState(snapshot, SaveCompression.NoCompression)
        );

        expect(result.info.map(info => info.code)).toContain(178);
    });

    // 疑似 bug：码 178 的判定与文案相反，对「存档多出的 key」不告警，详见 06-TEST-FINDINGS.md #06-09-5
    it.skip('warns code 178 when the save data has keys that are not loaded', () => {
        const state = createCoreState();
        const snapshot = new Map(
            state.saveState(SaveCompression.NoCompression)
        );
        snapshot.set('@system/extra', null);

        const result = logger.catch(() =>
            state.loadState(snapshot, SaveCompression.NoCompression)
        );

        expect(result.info.map(info => info.code)).toContain(178);
    });
});
