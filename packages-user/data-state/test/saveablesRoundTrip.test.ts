// 测试 CoreState 顶层存读档：经公开 saveState/loadState 对 5 个 saveable 做整体往返
import { describe, expect, it, vi } from 'vitest';
import { logger } from '@motajs/common';
import {
    type IEnemyAttr,
    type IHeroAttr,
    type IItemRawData,
    FaceDirection,
    ItemCategory,
    SaveCompression,
    TileType
} from '@user/data-common';
import {
    Enemy,
    ValueModifier,
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

interface ExpectedReplayStep {
    command: number;
    params: readonly (number | string | boolean)[];
}

/** 顶层录像写入的 10 步多样化命令序列，命令与参数类型均不全相同 */
const REPLAY_STEPS: readonly ExpectedReplayStep[] = [
    { command: 0, params: [] },
    { command: 1, params: [] },
    { command: 2, params: [] },
    { command: 3, params: [] },
    { command: 4, params: [2, 3] },
    { command: 5, params: [12] },
    { command: 6, params: [3, 0, true] },
    { command: 7, params: [0] },
    { command: 1, params: [] },
    { command: 5, params: ['potion'] }
];

/** 向顶层录像写入 10 步混合命令，覆盖移动/瞬移/用道具/装备/卸下 */
function seedReplay(state: CoreState): void {
    state.replaySystem.record(0);
    state.replaySystem.record(1);
    state.replaySystem.record(2);
    state.replaySystem.record(3);
    state.replaySystem.record(4, 2, 3);
    state.replaySystem.record(5, 12);
    state.replaySystem.record(6, 3, 0, true);
    state.replaySystem.record(7, 0);
    state.replaySystem.record(1);
    state.replaySystem.record(5, 'potion');
}

/** 为 5 个 saveable 写入已知的全部关键状态 */
function seedState(state: CoreState): SeededState {
    state.hero.registerModifier('@system/value', () => new ValueModifier(5));
    state.hero.createAndInsertModifier('@system/value', 'atk');
    const attribute = state.hero.getModifiableAttribute();
    attribute.set('hp', 88);
    attribute.set('atk', 10);
    attribute.set('def', 6);
    attribute.set('money', 20);
    attribute.set('exp', 30);
    state.hero.location.setPos(3, 4);
    state.hero.location.setFloor('F1');
    state.hero.location.mover.setFaceDir(FaceDirection.Up);

    state.flags.setFieldValue('score', 7);
    state.flags.setFieldValue('coins', 12);
    state.flags.addFieldValue('stage', 2);

    const map = state.maps.createMap('F1', 2, 2);
    const layer = map.addLayer();
    layer.setZIndex(0);
    map.setActiveStatus(true);
    state.maps.compareWith(
        new Map([['F1', new Map([[0, new Uint32Array(4)]])]])
    );
    layer.setBlock(5, 0, 0);
    layer.setBlock(7, 1, 1);

    state.enemyManager.addPrefab(createEnemy());
    state.enemyManager.compareWith(new Map([[1, createEnemy()]]));
    state.enemyManager.modifyPrefabAttribute(1, prefab => {
        prefab.setAttribute('hp', 30);
        prefab.setAttribute('atk', 9);
        return prefab;
    });

    seedReplay(state);
    return { map, layer };
}

/** 保存后修改每个 saveable 的全部关键状态，用于验证读档恢复 */
function mutateState(state: CoreState, seeded: SeededState): void {
    const attribute = state.hero.getModifiableAttribute();
    attribute.set('hp', 1);
    attribute.set('atk', 1);
    attribute.set('def', 0);
    attribute.set('money', 0);
    attribute.set('exp', 0);
    state.hero.location.setPos(9, 9);
    state.hero.location.setFloor('F9');
    state.hero.location.mover.setFaceDir(FaceDirection.Down);

    state.flags.setFieldValue('score', 0);
    state.flags.setFieldValue('coins', 0);
    state.flags.setFieldValue('stage', 0);

    seeded.layer.setBlock(0, 0, 0);
    seeded.layer.setBlock(0, 1, 1);
    seeded.map.setActiveStatus(false);

    state.enemyManager.modifyPrefabAttribute(1, prefab => {
        prefab.setAttribute('hp', 99);
        prefab.setAttribute('atk', 1);
        return prefab;
    });

    state.replaySystem.record(9, 1);
}

/** 向顶层状态注册同引用集成用例使用的 atk+5 装备道具定义 */
function registerIdentityEquipment(state: CoreState): void {
    state.tileStore.addTile({
        num: 9001,
        id: 'identity-sword',
        events: {},
        type: TileType.Item,
        pass: { onlyEvents: false, inPass: 15, outPass: 15 },
        eventPass: true
    });
    const value: [SelectKey<IHeroAttr, number>, number][] = [['atk', 5]];
    const item: IItemRawData<IHeroAttr> = {
        num: 9001,
        id: 'identity-sword',
        category: ItemCategory.Equipment,
        name: 'identity-sword',
        text: 'identity-sword',
        hideInToolbox: false,
        effect: { useEvent: null, useEffect: () => {}, canUse: () => false },
        equip: {
            slots: [0],
            animate: 'sword',
            value: new Map(value),
            percentage: new Map(),
            loadEvent: null,
            unloadEvent: null
        }
    };
    state.itemStore.addItem(item);
}

/** 逐 saveable 严格断言全部关键字段回到存档点 */
function assertRestored(state: CoreState, seeded: SeededState): void {
    const attribute = state.hero.getModifiableAttribute();
    expect(attribute.getBaseAttribute('hp')).toBe(88);
    expect(attribute.getBaseAttribute('atk')).toBe(10);
    expect(attribute.getBaseAttribute('def')).toBe(6);
    expect(attribute.getBaseAttribute('money')).toBe(20);
    expect(attribute.getBaseAttribute('exp')).toBe(30);
    expect(attribute.getFinalAttribute('atk')).toBe(15);
    expect(state.hero.getLocation()).toEqual({
        x: 3,
        y: 4,
        direction: FaceDirection.Up
    });
    expect(state.hero.location.floorId).toBe('F1');

    expect(state.flags.getFieldValue<number>('score')).toBe(7);
    expect(state.flags.getFieldValue<number>('coins')).toBe(12);
    expect(state.flags.getFieldValue<number>('stage')).toBe(2);

    expect(state.maps.isMapActive('F1')).toBe(true);
    expect(seeded.layer.getBlock(0, 0)).toBe(5);
    expect(seeded.layer.getBlock(1, 1)).toBe(7);

    expect(state.enemyManager.getPrefab(1)!.getAttribute('hp')).toBe(30);
    expect(state.enemyManager.getPrefab(1)!.getAttribute('atk')).toBe(9);

    const route = state.replaySystem.route;
    expect(route.length).toBe(REPLAY_STEPS.length);
    REPLAY_STEPS.forEach((step, index) => {
        expect(route.get(index)).toEqual({
            command: step.command,
            params: step.params,
            index
        });
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
        expect(heroSave.attribute.values.hp).toBe(88);
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

describe('CoreState container same-reference load (#06-17-4/5/6)', () => {
    // 验证经顶层 CoreState 三档往返后装备实例、flag 字段与 follower 实例均为同一实例，
    // 且其数值与位置回到存档点
    it('keeps container instances across save and load in every compression', () => {
        for (const compression of COMPRESSIONS) {
            const state = createCoreState();
            registerIdentityEquipment(state);

            const uid = state.hero.items.equipment.add(9001);
            state.hero.equip.setSlots(['weapon']);
            state.hero.equip.equip(uid, 0);
            const equipmentBefore = state.hero.items.equipment.get(uid)!;

            const fieldBefore = state.flags.getOrInsert('identity', 7);

            state.hero.followers.addFollower(9102);
            const followerBefore = state.hero.followers.getFollower(0)!;

            const snapshot = state.saveState(compression);

            // 装备数值只能经读档改变，flag 与 follower 位置则在存档后继续改动
            equipmentBefore.loadState(
                {
                    uid,
                    num: 9001,
                    value: new Map<SelectKey<IHeroAttr, number>, number>([
                        ['atk', 9]
                    ]),
                    percentage: new Map<SelectKey<IHeroAttr, number>, number>()
                },
                SaveCompression.NoCompression
            );
            state.flags.setFieldValue('identity', 99);
            followerBefore.location.setPos(9, 9);

            state.loadState(snapshot, compression);

            expect(state.hero.items.equipment.get(uid)).toBe(equipmentBefore);
            expect([...equipmentBefore.getModifiers()][0][1].getValue()).toBe(
                5
            );
            expect(state.flags.getField('identity')).toBe(fieldBefore);
            expect(fieldBefore.get()).toBe(7);
            expect(state.hero.followers.getFollower(0)).toBe(followerBefore);
            expect(followerBefore.location.x).toBe(0);
            expect(followerBefore.location.y).toBe(0);
        }
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

    // 验证存档缺失 saveable key 时只触发警告码 177，不再误报 178（177/178 语义互斥）
    it('warns code 177 but not 178 when the save data misses a saveable key', () => {
        const state = createCoreState();
        const snapshot = new Map(
            state.saveState(SaveCompression.NoCompression)
        );
        snapshot.delete('@system/flags');

        const result = logger.catch(() =>
            state.loadState(snapshot, SaveCompression.NoCompression)
        );

        const codes = result.info.map(info => info.code);
        expect(codes).toContain(177);
        expect(codes).not.toContain(178);
    });

    // 验证存档含未注册（未加载）key 时经 logger.catch 观测到警告码 178（#06-09-5）
    it('warns code 178 when the save data has keys that are not loaded', () => {
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

describe('CoreState container coverage for compression-less saveables', () => {
    // 验证不接受压缩参数的 flags 与 replay 经容器三档往返均恢复到存档点
    it('restores flags and replay through the container across all compressions', () => {
        for (const compression of COMPRESSIONS) {
            const state = createCoreState();
            state.flags.setFieldValue('score', 5);
            state.flags.addFieldValue('stage', 3);
            state.replaySystem.record(1);
            state.replaySystem.record(2, 7);

            const snapshot = state.saveState(compression);
            state.flags.setFieldValue('score', 0);
            state.flags.setFieldValue('stage', 0);
            state.replaySystem.record(9, 1);

            state.loadState(snapshot, compression);

            expect(state.flags.getFieldValue<number>('score')).toBe(5);
            expect(state.flags.getFieldValue<number>('stage')).toBe(3);
            expect(state.replaySystem.route.length).toBe(2);
            expect(state.replaySystem.route.get(0)).toEqual({
                command: 1,
                params: [],
                index: 0
            });
            expect(state.replaySystem.route.get(1)).toEqual({
                command: 2,
                params: [7],
                index: 1
            });
        }
    });
});
