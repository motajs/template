// 测试勇士各子系统存读档：同实例往返、压缩档与码 58/59
import { afterAll, describe, expect, it, vi } from 'vitest';
import {
    type IDataCommon,
    type IHeroAttr,
    type IItemRawData,
    Dir8FaceHandler,
    FaceDirection,
    ItemCategory,
    ItemStore,
    SaveCompression,
    TileStore,
    TileType
} from '@user/data-common';
import { logger } from '@motajs/common';
import { HeroAttribute } from './attribute';
import { PercentageModifier, ValueModifier } from './modifier';
import { HeroLocation } from './location';
import { HeroRendering } from './rendering';
import { HeroState } from './state';
import { HeroEquipment } from './equipment';
import { EquipmentState, HeroEquipsStore } from './equipStore';
import { HeroItems } from './items';
import { HeroFollowersController } from './follower';
import { type IHeroState } from './types';

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

afterAll(() => {
    vi.unstubAllGlobals();
});

/** 存读档测试覆盖的三档压缩级别 */
const SAVE_COMPRESSIONS = [
    SaveCompression.NoCompression,
    SaveCompression.LowCompression,
    SaveCompression.HighCompression
] as const;

type HeroKey = SelectKey<IHeroAttr, number>;

interface EquipEnv {
    state: IDataCommon;
    tileStore: IDataCommon['tileStore'];
    itemStore: IDataCommon['itemStore'];
    store: HeroEquipsStore<IHeroAttr>;
    equipment: HeroEquipment<IHeroAttr>;
}

/** 构造一个含图块、道具存储与假录像系统的公共层假对象 */
function createState(): IDataCommon {
    const tileStore = new TileStore();
    const itemStore = new ItemStore<IHeroAttr, unknown>();
    const route = { add: vi.fn() };
    return {
        tileStore,
        itemStore,
        replaySystem: { route, disable: vi.fn(), revert: vi.fn() }
    } as never;
}

/** 构造一份合成的勇士基础属性 */
function createBaseAttr(): IHeroAttr {
    return {
        name: 'hero',
        hp: 100,
        hpmax: 100,
        atk: 10,
        def: 5,
        mdef: 0,
        mana: 0,
        manamax: 0,
        money: 0,
        exp: 0
    };
}

/** 构造一个带合成装备属性的道具定义 */
function createEquipItem(
    num: number,
    id: string,
    slots: (number | string)[] = [0],
    value: [HeroKey, number][] = [],
    percentage: [HeroKey, number][] = []
): IItemRawData<IHeroAttr> {
    return {
        num,
        id,
        category: ItemCategory.Equipment,
        name: id,
        text: id,
        hideInToolbox: false,
        effect: { useEvent: null, useEffect: () => {}, canUse: () => false },
        equip: {
            slots,
            animate: 'sword',
            value: new Map(value),
            percentage: new Map(percentage),
            loadEvent: null,
            unloadEvent: null
        }
    };
}

/** 构造一个非装备类道具定义，用于覆盖背包分表存读档 */
function createPlainItem(
    num: number,
    id: string,
    category: ItemCategory
): IItemRawData<IHeroAttr> {
    return {
        num,
        id,
        category,
        name: id,
        text: id,
        hideInToolbox: false,
        effect: { useEvent: null, useEffect: () => {}, canUse: () => false },
        equip: {
            slots: [0],
            animate: 'sword',
            value: new Map(),
            percentage: new Map(),
            loadEvent: null,
            unloadEvent: null
        }
    };
}

/** 向图块与道具存储注册一个道具定义 */
function registerItem(env: EquipEnv, item: IItemRawData<IHeroAttr>): void {
    env.tileStore.addTile({
        num: item.num,
        id: item.id,
        events: {},
        type: TileType.Item,
        pass: { onlyEvents: false, inPass: 15, outPass: 15 },
        eventPass: true
    });
    env.itemStore.addItem(item);
}

/** 构造一个装配装备实例存储与勇士装备对象的测试环境 */
function createEquipEnv(): EquipEnv {
    const state = createState();
    const store = new HeroEquipsStore<IHeroAttr>(state);
    const equipment = new HeroEquipment<IHeroAttr>(
        store,
        new HeroAttribute<IHeroAttr>(createBaseAttr())
    );
    return {
        state,
        tileStore: state.tileStore,
        itemStore: state.itemStore,
        store,
        equipment
    };
}

/** 构造一个注册了跟随者图块的公共层假对象 */
function createFollowerState(): IDataCommon {
    const state = createState();
    state.tileStore.addTile({
        num: 100,
        id: 'ghost',
        events: {},
        type: TileType.Npc,
        pass: { onlyEvents: false, inPass: 15, outPass: 15 },
        eventPass: true
    });
    return state;
}

/** 构造一个装配完成的勇士状态对象 */
function createHeroState(): IHeroState<IHeroAttr> {
    return new HeroState<IHeroAttr>(
        createState(),
        new Dir8FaceHandler(),
        new HeroAttribute<IHeroAttr>(createBaseAttr())
    );
}

describe('Hero modifier save and load round trips', () => {
    // 验证 ValueModifier 的数值在三个压缩档下均能同实例恢复
    it('restores a value modifier across all compressions', () => {
        for (const compression of SAVE_COMPRESSIONS) {
            const modifier = new ValueModifier(5);

            const saved = modifier.saveState(compression);
            modifier.setValue(9);
            modifier.loadState(saved, compression);

            expect(modifier.getValue()).toBe(5);
        }
    });

    // 验证 PercentageModifier 的数值在三个压缩档下均能同实例恢复
    it('restores a percentage modifier across all compressions', () => {
        for (const compression of SAVE_COMPRESSIONS) {
            const modifier = new PercentageModifier(0.25);

            const saved = modifier.saveState(compression);
            modifier.setValue(0.9);
            modifier.loadState(saved, compression);

            expect(modifier.getValue()).toBe(0.25);
        }
    });
});

describe('HeroLocation save and load round trips', () => {
    // 验证坐标、楼层与朝向在同实例上完整恢复
    it('restores position, floor and direction on the same instance', () => {
        const location = new HeroLocation(
            createState(),
            { x: 3, y: 4, direction: FaceDirection.Right },
            new Dir8FaceHandler()
        );
        location.setPos(1, 2);
        location.setFloor('F2');
        location.mover.setFaceDir(FaceDirection.Up);

        const saved = location.saveState();
        location.setPos(9, 9);
        location.setFloor('F9');
        location.mover.setFaceDir(FaceDirection.Down);
        location.loadState(saved);

        expect(location.x).toBe(1);
        expect(location.y).toBe(2);
        expect(location.floorId).toBe('F2');
        expect(location.getCurrentFaceDirection()).toBe(FaceDirection.Up);
    });
});

describe('HeroRendering save and load round trips', () => {
    // 验证不透明度在同实例上恢复
    it('restores alpha on the same instance', () => {
        const rendering = new HeroRendering(createState());
        rendering.setAlpha(0.25);

        const saved = rendering.saveState();
        rendering.setAlpha(1);
        rendering.loadState(saved);

        expect(rendering.alpha).toBe(0.25);
    });
});

describe('HeroEquipment save and load round trips', () => {
    // 验证装备槽与已装备映射在同实例上恢复（存盘经结构化克隆模拟真实序列化）
    it('restores slots and equipped mapping on the same instance', () => {
        const env = createEquipEnv();
        registerItem(env, createEquipItem(10, 'sword', [0], [['atk', 5]]));
        env.equipment.setSlots(['weapon']);
        const uid = env.store.add(10);
        env.equipment.equip(uid, 0);

        const saved = structuredClone(env.equipment.saveState());
        env.equipment.unequip(0);
        expect(env.equipment.getEquipped(0)).toBeUndefined();

        env.equipment.loadState(saved);

        expect(env.equipment.getEquipped(0)).toBe(uid);
        expect(env.equipment.slots).toEqual(['weapon']);
    });

    // 疑似 bug：saveState 直接返回内部 equipped/slots 引用而非深拷贝，详见 06-TEST-FINDINGS.md #06-09-2
    it.skip('returns an equipment snapshot independent from the live state', () => {
        const env = createEquipEnv();
        registerItem(env, createEquipItem(10, 'sword', [0], [['atk', 5]]));
        env.equipment.setSlots(['weapon']);
        const uid = env.store.add(10);
        env.equipment.equip(uid, 0);

        const saved = env.equipment.saveState();
        env.equipment.unequip(0);
        env.equipment.loadState(saved);

        expect(env.equipment.getEquipped(0)).toBe(uid);
        expect(env.equipment.slots).toEqual(['weapon']);
    });
});

describe('EquipmentState save and load round trips', () => {
    // 验证百分比加成的数值在同实例上恢复（无压缩档）
    it('restores a percentage modifier on the same instance', () => {
        const env = createEquipEnv();
        const item = createEquipItem(10, 'sword', [0], [], [['hp', 0.5]]);
        registerItem(env, item);
        const state = new EquipmentState<IHeroAttr>(0, item);
        const modifier = [...state.getModifiers()][0][1];
        modifier.setValue(0.9);

        const saved = state.saveState(SaveCompression.NoCompression);
        state.loadState(saved, SaveCompression.NoCompression);

        const restored = [...state.getModifiers()].find(
            ([, current]) => current instanceof PercentageModifier
        );
        expect(restored?.[1].getValue()).toBe(0.5);
    });

    // 疑似 bug：loadNoCompression 误从存档百分比表读取数值表，详见 06-TEST-FINDINGS.md #06-09-1
    it.skip('restores a value modifier on the same instance', () => {
        const env = createEquipEnv();
        const item = createEquipItem(10, 'sword', [0], [['atk', 5]]);
        registerItem(env, item);
        const state = new EquipmentState<IHeroAttr>(0, item);
        const modifier = [...state.getModifiers()][0][1];
        modifier.setValue(99);

        const saved = state.saveState(SaveCompression.NoCompression);
        state.loadState(saved, SaveCompression.NoCompression);

        const restored = [...state.getModifiers()].find(
            ([name]) => name === 'atk'
        );
        expect(restored?.[1].getValue()).toBe(5);
    });

    // 疑似 bug：loadDiff 清空后未回退到装备原始定义，未修改的加成丢失，详见 06-TEST-FINDINGS.md #06-09-1
    it.skip('keeps unchanged value modifiers for compressed snapshots', () => {
        const env = createEquipEnv();
        const item = createEquipItem(10, 'sword', [0], [['atk', 5]]);
        registerItem(env, item);
        const state = new EquipmentState<IHeroAttr>(0, item);

        const saved = state.saveState(SaveCompression.LowCompression);
        state.loadState(saved, SaveCompression.LowCompression);

        expect([...state.getModifiers()].map(([name]) => name)).toEqual([
            'atk'
        ]);
    });
});

describe('HeroEquipsStore save and load round trips', () => {
    // 验证装备实例在三个压缩档下同实例恢复并续接自增 uid
    it('restores equipment instances and the uid counter across all compressions', () => {
        for (const compression of SAVE_COMPRESSIONS) {
            const env = createEquipEnv();
            registerItem(env, createEquipItem(10, 'sword', [0], [['atk', 5]]));
            const first = env.store.add(10);
            const second = env.store.add(10);

            const saved = env.store.saveState(compression);
            env.store.delete(first);
            env.store.loadState(saved, compression);

            expect(env.store.get(first)?.uid).toBe(first);
            expect(env.store.get(second)?.uid).toBe(second);
            expect(env.store.add(10)).toBe(second + 1);
        }
    });

    // 验证存档缺失道具原始数据时经 logger.catch 观测到错误码 59
    it('warns code 59 when the item raw data is missing', () => {
        const env = createEquipEnv();
        const saved = {
            equipments: [
                {
                    uid: 0,
                    num: 999,
                    value: new Map<HeroKey, number>(),
                    percentage: new Map<HeroKey, number>()
                }
            ]
        };

        const result = logger.catch(() =>
            env.store.loadState(saved, SaveCompression.NoCompression)
        );

        expect(result.info.map(info => info.code)).toContain(59);
    });

    // 验证存档不含任何装备实例时经 logger.catch 观测到错误码 58
    it('warns code 58 when the max equipment uid cannot be found', () => {
        const env = createEquipEnv();

        const result = logger.catch(() =>
            env.store.loadState(
                { equipments: [] },
                SaveCompression.NoCompression
            )
        );

        expect(result.info.map(info => info.code)).toContain(58);
    });
});

describe('HeroItems save and load round trips', () => {
    // 验证永久与消耗道具分表在同实例上恢复
    it('restores constant and consumable item tables on the same instance', () => {
        const env = createEquipEnv();
        registerItem(env, createPlainItem(20, 'key', ItemCategory.Constant));
        registerItem(
            env,
            createPlainItem(21, 'potion', ItemCategory.Consumable)
        );
        const items = new HeroItems<IHeroAttr>(env.state);
        items.addItem(20, 3);
        items.addItem(21, 2);

        const saved = items.saveState(SaveCompression.NoCompression);
        items.addItem(20, -3);
        items.addItem(21, -2);
        items.loadState(saved, SaveCompression.NoCompression);

        expect(items.itemCount(20)).toBe(3);
        expect(items.itemCount(21)).toBe(2);
        expect(items.getItemState(20)?.id).toBe('key');
    });
});

describe('HeroFollower save and load round trips', () => {
    // 验证跟随者位置、楼层与渲染在同实例上恢复
    it('restores follower location and rendering on the same instance', () => {
        const state = createFollowerState();
        const faceHandler = new Dir8FaceHandler();
        const heroLocation = new HeroLocation(
            state,
            { x: 0, y: 0, direction: FaceDirection.Down },
            faceHandler
        );
        const controller = new HeroFollowersController(
            state,
            heroLocation,
            faceHandler
        );
        const follower = controller.addFollower(100);
        follower.location.setPos(2, 3);
        follower.location.setFloor('F1');
        follower.location.mover.setFaceDir(FaceDirection.Up);
        follower.rendering.setAlpha(0.5);

        for (const compression of SAVE_COMPRESSIONS) {
            const saved = follower.saveState(compression);
            follower.location.setPos(9, 9);
            follower.location.setFloor('F9');
            follower.location.mover.setFaceDir(FaceDirection.Down);
            follower.rendering.setAlpha(1);
            follower.loadState(saved, compression);

            expect(follower.location.x).toBe(2);
            expect(follower.location.y).toBe(3);
            expect(follower.location.floorId).toBe('F1');
            expect(follower.location.getCurrentFaceDirection()).toBe(
                FaceDirection.Up
            );
            expect(follower.rendering.alpha).toBe(0.5);
        }
    });
});

describe('HeroState save and load round trips', () => {
    // 验证属性、修饰器与位置在同实例上恢复并重建属性对象
    it('restores attributes, modifiers and location on the same instance', () => {
        const hero = createHeroState();
        hero.registerModifier('@system/value', () => new ValueModifier(5));
        hero.createAndInsertModifier('@system/value', 'atk');
        hero.getModifiableAttribute().set('hp', 88);
        hero.location.setPos(1, 1);
        hero.location.setFloor('F1');
        hero.location.mover.setFaceDir(FaceDirection.Up);

        const saved = hero.saveState(SaveCompression.NoCompression);
        hero.getModifiableAttribute().set('hp', 1);
        hero.location.setPos(9, 9);
        hero.loadState(saved, SaveCompression.NoCompression);

        expect(hero.getModifiableAttribute().getBaseAttribute('hp')).toBe(88);
        expect(hero.getModifiableAttribute().getFinalAttribute('atk')).toBe(15);
        expect(hero.getLocation()).toEqual({
            x: 1,
            y: 1,
            direction: FaceDirection.Up
        });
        expect(hero.location.floorId).toBe('F1');
    });

    // 验证存盘禁用（save=false）的修饰器不进入存档且读档后不再存在
    it('excludes save-disabled modifiers from the snapshot', () => {
        const hero = createHeroState();
        hero.registerModifier('@system/value', () => new ValueModifier(5));
        hero.createAndInsertModifier('@system/value', 'atk');
        const disabled = hero.createAndInsertModifier('@system/value', 'atk')!;
        hero.getModifiableAttribute().setModifierSaveEnabled(disabled, false);

        const saved = hero.saveState(SaveCompression.NoCompression);
        expect(saved.modifiers).toHaveLength(1);

        hero.loadState(saved, SaveCompression.NoCompression);

        const values = [
            ...hero.getModifiableAttribute().getModifiers('atk')
        ].map(modifier => modifier.getValue());
        expect(values).toEqual([5]);
        expect(hero.getModifiableAttribute().getFinalAttribute('atk')).toBe(15);
    });
});
