// 测试勇士吁E��系统存读档�E�同实例往返、压缩档与码E58/59
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

/** 存读档测试要E��皁E��档压缩级别 */
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

/** 极E��一个含图块、E��具存储与假录像系统的公共层假对象 */
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

/** 极E��一份合�E皁E��士基础属性 */
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

/** 极E��一个带合�E裁E��E��性皁E��具定乁E*/
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

/** 极E��一个非裁E��E��道�E定义，用于要E��背包刁E��存读档 */
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

/** 向图块与道具存储注册一个道�E定乁E*/
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

/** 极E��一个裁E�E裁E��E��例存储与勇士裁E��E��象皁E��试环墁E*/
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

/** 极E��一个注册亁E��随老E��块的公共层假对象 */
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

/** 极E��一个裁E�E完�E皁E��士状态对象 */
function createHeroState(): IHeroState<IHeroAttr> {
    return new HeroState<IHeroAttr>(
        createState(),
        new Dir8FaceHandler(),
        new HeroAttribute<IHeroAttr>(createBaseAttr())
    );
}

/** 构造一个已注册装备定义并设置好装备槽的勇士状态对象（基础 atk 为 10） */
function createEquipHero(): IHeroState<IHeroAttr> {
    const env = createEquipEnv();
    registerItem(env, createEquipItem(10, 'sword', [0], [['atk', 5]]));
    const hero = new HeroState<IHeroAttr>(
        env.state,
        new Dir8FaceHandler(),
        new HeroAttribute<IHeroAttr>(createBaseAttr())
    );
    hero.equip.setSlots(['weapon']);
    return hero;
}

/** 在持E��压缩档下对裁E��E��刁E��加成做一次同实例往返，返回读档后的修饰器值 */
function roundTripPercentageModifier(compression: SaveCompression): unknown {
    const env = createEquipEnv();
    const item = createEquipItem(10, 'sword', [0], [], [['hp', 0.5]]);
    registerItem(env, item);
    const state = new EquipmentState<IHeroAttr>(0, item);
    const modifier = [...state.getModifiers()][0][1];
    modifier.setValue(0.9);

    const saved = state.saveState(compression);
    state.loadState(saved, compression);

    const restored = [...state.getModifiers()].find(
        ([, current]) => current instanceof PercentageModifier
    );
    return restored?.[1].getValue();
}

describe('Hero modifier save and load round trips', () => {
    // 验证EValueModifier 皁E��值在三个压缩档下均能同实例恢夁E
    it('restores a value modifier across all compressions', () => {
        for (const compression of SAVE_COMPRESSIONS) {
            const modifier = new ValueModifier(5);

            const saved = modifier.saveState(compression);
            modifier.setValue(9);
            modifier.loadState(saved, compression);

            expect(modifier.getValue()).toBe(5);
        }
    });

    // 验证EPercentageModifier 皁E��值在三个压缩档下均能同实例恢夁E
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
    // 验证坐栁E��楼层与朝向在同实例上完整恢夁E
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
    // 验证不透�E度在同实例上恢夁E
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
    // 验证裁E��E��与已裁E��E��封E��同实例上恢复（存盘经结构化�E隁E��拟真实序�E化！E
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

    // 验证 saveState 返回与活对象解耦的深拷贝快照（#06-09-2）
    it('returns an equipment snapshot independent from the live state', () => {
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
    // 验证百刁E��加成在无压缩档下同实例恢复到存档点
    it('restores a percentage modifier on the same instance in NoCompression', () => {
        expect(roundTripPercentageModifier(SaveCompression.NoCompression)).toBe(
            0.5
        );
    });

    // 验证 Low 压缩档读档以装备原始定义为回退基准，未修改的百分比加成不丢失（#06-09-1）
    it('restores a percentage modifier on the same instance in LowCompression', () => {
        expect(
            roundTripPercentageModifier(SaveCompression.LowCompression)
        ).toBe(0.5);
    });

    // 验证 High 压缩档读档以装备原始定义为回退基准，未修改的百分比加成不丢失（#06-09-1）
    it('restores a percentage modifier on the same instance in HighCompression', () => {
        expect(
            roundTripPercentageModifier(SaveCompression.HighCompression)
        ).toBe(0.5);
    });

    // 验证 NoCompression 读档按 value/percentage 分表恢复数值修饰器（#06-09-1）
    it('restores a value modifier on the same instance', () => {
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

    // 验证压缩档读档回退原始定义后未修改的数值修饰器仍保留（#06-09-1）
    it('keeps unchanged value modifiers for compressed snapshots', () => {
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
    // 验证裁E��E��例在三个压缩档下同实例恢复并续接自墁Euid
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

    // 验证存档缺失道�E原始数据时绁Elogger.catch 观测到错误码E59
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

    // 验证存档不含任何裁E��E��例时绁Elogger.catch 观测到错误码E58
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
    // 验证永乁E��消耗道具刁E��在三个压缩档下同实例恢夁E
    it('restores constant and consumable item tables across all compressions', () => {
        for (const compression of SAVE_COMPRESSIONS) {
            const env = createEquipEnv();
            registerItem(
                env,
                createPlainItem(20, 'key', ItemCategory.Constant)
            );
            registerItem(
                env,
                createPlainItem(21, 'potion', ItemCategory.Consumable)
            );
            const items = new HeroItems<IHeroAttr>(env.state);
            items.addItem(20, 3);
            items.addItem(21, 2);

            const saved = items.saveState(compression);
            items.addItem(20, -3);
            items.addItem(21, -2);
            items.loadState(saved, compression);

            expect(items.itemCount(20)).toBe(3);
            expect(items.itemCount(21)).toBe(2);
            expect(items.getItemState(20)?.id).toBe('key');
        }
    });
});

describe('HeroFollower save and load round trips', () => {
    // 验证跟随老E��置、楼层与渲染在同实例上恢夁E
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
    // 验证属性、修饰器与位置在三个压缩档下同实例恢复并重建属性对象
    it('restores attributes, modifiers and location across all compressions', () => {
        for (const compression of SAVE_COMPRESSIONS) {
            const hero = createHeroState();
            hero.registerModifier('@system/value', () => new ValueModifier(5));
            hero.createAndInsertModifier('@system/value', 'atk');
            hero.getModifiableAttribute().set('hp', 88);
            hero.location.setPos(1, 1);
            hero.location.setFloor('F1');
            hero.location.mover.setFaceDir(FaceDirection.Up);

            const saved = hero.saveState(compression);
            hero.getModifiableAttribute().set('hp', 1);
            hero.location.setPos(9, 9);
            hero.loadState(saved, compression);

            expect(hero.getModifiableAttribute().getBaseAttribute('hp')).toBe(
                88
            );
            expect(hero.getModifiableAttribute().getFinalAttribute('atk')).toBe(
                15
            );
            expect(hero.getLocation()).toEqual({
                x: 1,
                y: 1,
                direction: FaceDirection.Up
            });
            expect(hero.location.floorId).toBe('F1');
        }
    });

    // 验证存盘禁用�E�Eave=false�E�的修饰器不进�E存档且读档后不�E存在
    it('excludes save-disabled modifiers from the snapshot', () => {
        const hero = createHeroState();
        hero.registerModifier('@system/value', () => new ValueModifier(5));
        hero.createAndInsertModifier('@system/value', 'atk');
        const disabled = hero.createAndInsertModifier('@system/value', 'atk')!;
        hero.getModifiableAttribute().setModifierSaveEnabled(disabled, false);

        const saved = hero.saveState(SaveCompression.NoCompression);
        expect(saved.attribute.modifiers).toHaveLength(1);

        hero.loadState(saved, SaveCompression.NoCompression);

        const values = [
            ...hero.getModifiableAttribute().getModifiers('atk')
        ].map(modifier => modifier.getValue());
        expect(values).toEqual([5]);
        expect(hero.getModifiableAttribute().getFinalAttribute('atk')).toBe(15);
    });
});

describe('HeroState container save and load coverage for sub systems', () => {
    // 验证不接受压缩参数皁E��位与渲染经勇士容器三档往返均恢复到存档点
    it('restores location and rendering through the container across all compressions', () => {
        for (const compression of SAVE_COMPRESSIONS) {
            const hero = createHeroState();
            hero.location.setPos(2, 3);
            hero.location.setFloor('F2');
            hero.location.mover.setFaceDir(FaceDirection.Right);
            hero.rendering.setAlpha(0.25);

            const saved = hero.saveState(compression);
            hero.location.setPos(9, 9);
            hero.location.setFloor('F9');
            hero.location.mover.setFaceDir(FaceDirection.Down);
            hero.rendering.setAlpha(1);
            hero.loadState(saved, compression);

            expect(hero.location.x).toBe(2);
            expect(hero.location.y).toBe(3);
            expect(hero.location.floorId).toBe('F2');
            expect(hero.location.getCurrentFaceDirection()).toBe(
                FaceDirection.Right
            );
            expect(hero.rendering.alpha).toBe(0.25);
        }
    });

    // 验证经容器三档往返均恢复已装备映射与槽位（#06-09-2）
    it('restores the equipped mapping through the container across all compressions', () => {
        for (const compression of SAVE_COMPRESSIONS) {
            const env = createEquipEnv();
            registerItem(env, createEquipItem(10, 'sword', [0], [['atk', 5]]));
            const hero = new HeroState<IHeroAttr>(
                env.state,
                new Dir8FaceHandler(),
                new HeroAttribute<IHeroAttr>(createBaseAttr())
            );
            hero.equip.setSlots(['weapon']);
            const uid = hero.items.equipment.add(10);
            hero.equip.equip(uid, 0);

            const saved = hero.saveState(compression);
            hero.equip.unequip(0);
            hero.loadState(saved, compression);

            expect(hero.equip.getEquipped(0)).toBe(uid);
            expect(hero.equip.slots).toEqual(['weapon']);
        }
    });
});

describe('HeroState same-reference attribute load (#06-17-1)', () => {
    // 验证三档压缩读档后装备加成仍在且属性对象为同一实例
    it('keeps equipment bonuses and the attribute instance across all compressions', () => {
        for (const compression of SAVE_COMPRESSIONS) {
            const hero = createEquipHero();
            const uid = hero.items.equipment.add(10);
            hero.equip.equip(uid, 0);
            const attrBefore = hero.getModifiableAttribute();
            expect(attrBefore.getFinalAttribute('atk')).toBe(15);

            const saved = hero.saveState(compression);
            hero.equip.unequip(0);
            hero.getModifiableAttribute().set('atk', 1);

            hero.loadState(saved, compression);

            expect(hero.getModifiableAttribute()).toBe(attrBefore);
            expect(attrBefore.getFinalAttribute('atk')).toBe(15);
            expect(attrBefore.getBaseAttribute('atk')).toBe(10);
            expect(hero.equip.getEquipped(0)).toBe(uid);
        }
    });

    // 验证读档后装备增删仍作用于活属性实例
    it('applies equipment changes to the live attribute after load', () => {
        const hero = createEquipHero();
        const uid = hero.items.equipment.add(10);
        hero.equip.equip(uid, 0);
        const attrBefore = hero.getModifiableAttribute();

        const saved = hero.saveState(SaveCompression.NoCompression);
        hero.equip.unequip(0);
        hero.loadState(saved, SaveCompression.NoCompression);
        expect(attrBefore.getFinalAttribute('atk')).toBe(15);

        hero.equip.unequip(0);
        expect(attrBefore.getFinalAttribute('atk')).toBe(10);

        hero.equip.equip(uid, 0);
        expect(attrBefore.getFinalAttribute('atk')).toBe(15);
    });

    // 验证修饰器类型命中注册表时装备加成不翻倍（英雄 5 + 装备 5 → 20 而非 25）
    it('does not double-count equipment bonuses when the type is registered', () => {
        for (const compression of SAVE_COMPRESSIONS) {
            const hero = createEquipHero();
            hero.registerModifier('@system/value', () => new ValueModifier(5));
            hero.createAndInsertModifier('@system/value', 'atk');
            const uid = hero.items.equipment.add(10);
            hero.equip.equip(uid, 0);
            expect(hero.getModifiableAttribute().getFinalAttribute('atk')).toBe(
                20
            );

            const saved = hero.saveState(compression);
            hero.equip.unequip(0);
            hero.getModifiableAttribute().set('atk', 1);
            hero.loadState(saved, compression);

            expect(hero.getModifiableAttribute().getFinalAttribute('atk')).toBe(
                20
            );
            expect([
                ...hero.getModifiableAttribute().getModifiers('atk')
            ]).toHaveLength(2);
        }
    });
});
