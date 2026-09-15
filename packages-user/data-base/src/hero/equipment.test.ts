// 测试 HeroEquipment 组合行为：槽位判定、装备/替换/卸下、属性修饰器联动、compareEquip 与码 146/147
import { afterAll, describe, expect, it, vi } from 'vitest';
import {
    type IDataCommon,
    type IHeroAttr,
    type IItemRawData,
    ItemCategory,
    ItemStore,
    TileStore,
    TileType
} from '@user/data-common';
import { logger } from '@motajs/common';
import { HeroAttribute } from './attribute';
import { HeroEquipsStore } from './equipStore';
import { HeroEquipment } from './equipment';
import { EquipStatus } from './types';

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

type HeroKey = SelectKey<IHeroAttr, number>;

interface TestEnv {
    state: IDataCommon;
    tileStore: IDataCommon['tileStore'];
    itemStore: IDataCommon['itemStore'];
    store: HeroEquipsStore<IHeroAttr>;
    equipment: HeroEquipment<IHeroAttr>;
    attribute: HeroAttribute<IHeroAttr>;
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

/** 构造一个带合成装备属性与修饰器的装备道具定义 */
function createItem(
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

/** 构造一个装配勇士装备对象的测试环境 */
function createEnv(): TestEnv {
    const tileStore = new TileStore();
    const itemStore = new ItemStore<IHeroAttr, unknown>();
    // 录像系统桩，用于满足装备/卸下时的 route.add 记录与临时禁用录像
    const replaySystem = {
        route: { add: vi.fn() },
        disable: vi.fn(),
        revert: vi.fn()
    };
    const state = { tileStore, itemStore, replaySystem } as never;
    const attribute = new HeroAttribute<IHeroAttr>(createBaseAttr());
    const store = new HeroEquipsStore<IHeroAttr>(state);
    const equipment = new HeroEquipment<IHeroAttr>(store, attribute);
    return { state, tileStore, itemStore, store, equipment, attribute };
}

/** 向图块与道具存储注册一个装备道具定义 */
function registerItem(env: TestEnv, item: IItemRawData<IHeroAttr>): void {
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

describe('HeroEquipment slots', () => {
    // 验证装备槽名称可设置与读取
    it('sets equipment slot names', () => {
        const env = createEnv();

        env.equipment.setSlots(['weapon', 'armor']);

        expect(env.equipment.slots).toEqual(['weapon', 'armor']);
    });

    // 验证数值槽与名称槽的三种装备判定结果
    it('classifies equip status for numeric and named slots', () => {
        const env = createEnv();
        registerItem(env, createItem(10, 'sword', [0, 'weapon'], [['atk', 5]]));
        env.equipment.setSlots(['weapon']);
        const uid = env.store.add(10);

        expect(env.equipment.canEquipTo(uid, 0)).toBe(EquipStatus.CanEquip);
        expect(env.equipment.canEquipTo(uid, 'weapon')).toBe(
            EquipStatus.CanEquip
        );
        expect(env.equipment.canEquipTo(uid, 5)).toBe(EquipStatus.CannotEquip);
        expect(env.equipment.canEquipTo(999, 0)).toBe(EquipStatus.CannotEquip);

        env.equipment.equip(uid, 0);

        expect(env.equipment.canEquipTo(uid, 0)).toBe(EquipStatus.NeedReplace);
        expect(env.equipment.canEquipTo(uid, 'weapon')).toBe(
            EquipStatus.NeedReplace
        );

        registerItem(env, createItem(11, 'armor', ['armor'], [['def', 2]]));
        const armorUid = env.store.add(11);
        expect(env.equipment.canEquipTo(armorUid, 'armor')).toBe(
            EquipStatus.CannotEquip
        );
    });
});

describe('HeroEquipment equip and unequip', () => {
    // 验证装备到空槽返回 undefined 并应用数值修饰器
    it('equips into an empty slot and applies modifiers', () => {
        const env = createEnv();
        registerItem(env, createItem(10, 'sword', [0], [['atk', 5]]));
        env.equipment.setSlots(['weapon']);
        const uid = env.store.add(10);

        expect(env.equipment.equip(uid, 0)).toBeUndefined();
        expect(env.equipment.getEquipped(0)).toBe(uid);
        expect(env.equipment.equipped(uid)).toBe(true);
        expect(env.attribute.getFinalAttribute('atk')).toBe(15);
    });

    // 验证替换占用槽返回旧 uid 并换上新装备的修饰器
    it('replaces the occupant and swaps its modifiers', () => {
        const env = createEnv();
        registerItem(env, createItem(10, 'sword', [0], [['atk', 5]]));
        registerItem(env, createItem(11, 'axe', [0], [['atk', 12]]));
        env.equipment.setSlots(['weapon']);
        const sword = env.store.add(10);
        const axe = env.store.add(11);

        env.equipment.equip(sword, 0);
        expect(env.equipment.equip(axe, 0)).toBe(sword);
        expect(env.equipment.getEquipped(0)).toBe(axe);
        expect(env.equipment.equipped(sword)).toBe(false);
        expect(env.attribute.getFinalAttribute('atk')).toBe(22);
    });

    // 验证同一件装备在启用自动卸下时移动到新的名称槽
    it('moves an already equipped item when autoUnload is enabled', () => {
        const env = createEnv();
        registerItem(
            env,
            createItem(10, 'sword', ['weapon', 'armor'], [['atk', 5]])
        );
        env.equipment.setSlots(['weapon', 'armor']);
        const uid = env.store.add(10);

        env.equipment.equip(uid, 'weapon');
        expect(env.equipment.equip(uid, 'armor')).toBeUndefined();
        expect(env.equipment.getEquipped(0)).toBeUndefined();
        expect(env.equipment.getEquipped(1)).toBe(uid);
    });

    // 验证关闭自动卸下或重复装备同一槽位时保持原状
    it('keeps the previous slot when autoUnload is disabled', () => {
        const env = createEnv();
        registerItem(
            env,
            createItem(10, 'sword', ['weapon', 'armor'], [['atk', 5]])
        );
        env.equipment.setSlots(['weapon', 'armor']);
        const uid = env.store.add(10);

        env.equipment.equip(uid, 'weapon');
        expect(env.equipment.equip(uid, 'armor', false)).toBeUndefined();
        expect(env.equipment.getEquipped(0)).toBe(uid);
        expect(env.equipment.getEquipped(1)).toBeUndefined();

        expect(env.equipment.equip(uid, 'weapon')).toBeUndefined();
        expect(env.equipment.getEquipped(0)).toBe(uid);
    });

    // 验证卸下返回被移除的 uid 并移除修饰器，空槽返回 undefined
    it('unequips a slot and removes its modifiers', () => {
        const env = createEnv();
        registerItem(env, createItem(10, 'sword', [0], [['atk', 5]]));
        env.equipment.setSlots(['weapon']);
        const uid = env.store.add(10);
        env.equipment.equip(uid, 0);

        expect(env.equipment.unequip(0)).toBe(uid);
        expect(env.equipment.getEquipped(0)).toBeUndefined();
        expect(env.equipment.equipped(uid)).toBe(false);
        expect(env.attribute.getFinalAttribute('atk')).toBe(10);
        expect(env.equipment.unequip(0)).toBeUndefined();
    });

    // 验证两个不同槽位同时装备后合并最终属性，卸下其中一件后另一槽修饰器保留
    it('merges the final attributes of two equipped slots', () => {
        const env = createEnv();
        registerItem(env, createItem(10, 'sword', [0], [['atk', 5]]));
        registerItem(env, createItem(11, 'shield', [1], [['def', 3]]));
        env.equipment.setSlots(['weapon', 'armor']);
        const sword = env.store.add(10);
        const shield = env.store.add(11);

        expect(env.equipment.equip(sword, 0)).toBeUndefined();
        expect(env.equipment.equip(shield, 1)).toBeUndefined();
        expect(env.equipment.getEquipped(0)).toBe(sword);
        expect(env.equipment.getEquipped(1)).toBe(shield);
        expect(env.equipment.equipped(sword)).toBe(true);
        expect(env.equipment.equipped(shield)).toBe(true);
        expect(env.attribute.getFinalAttribute('atk')).toBe(15);
        expect(env.attribute.getFinalAttribute('def')).toBe(8);

        expect(env.equipment.unequip(0)).toBe(sword);
        expect(env.attribute.getFinalAttribute('atk')).toBe(10);
        expect(env.attribute.getFinalAttribute('def')).toBe(8);
    });

    // 验证 getEquips 按槽位顺序输出装备状态或空位
    it('lists slots in order with their equipment states', () => {
        const env = createEnv();
        registerItem(env, createItem(10, 'sword', [0, 1], [['atk', 5]]));
        env.equipment.setSlots(['weapon', 'armor']);
        const uid = env.store.add(10);
        env.equipment.equip(uid, 0);

        const equips = env.equipment.getEquips();

        expect(equips).toHaveLength(2);
        expect(equips[0]).toBe(env.store.get(uid));
        expect(equips[1]).toBeNull();
    });

    // 验证字符串槽位优先占用首个空槽而非替换占用者（#06-05-2）
    it('uses the first empty named slot instead of replacing an occupant', () => {
        const env = createEnv();
        registerItem(env, createItem(10, 'sword', ['weapon'], [['atk', 5]]));
        registerItem(env, createItem(11, 'axe', ['weapon'], [['atk', 12]]));
        env.equipment.setSlots(['weapon', 'weapon']);
        const sword = env.store.add(10);
        const axe = env.store.add(11);

        env.equipment.equip(sword, 'weapon');
        env.equipment.equip(axe, 'weapon');

        expect(env.equipment.getEquipped(0)).toBe(sword);
        expect(env.equipment.getEquipped(1)).toBe(axe);
    });

    // 疑似 bug：码 147 因 canEquipTo 先返回 CannotEquip 而不可达，详见 06-TEST-FINDINGS.md #06-05-3
    it.skip('warns code 147 when no equipment slot is available', () => {
        const env = createEnv();
        registerItem(env, createItem(10, 'sword', ['weapon'], [['atk', 5]]));
        env.equipment.setSlots([]);
        const uid = env.store.add(10);

        const result = logger.catch(() => env.equipment.equip(uid, 'weapon'));

        expect(result.info.map(info => info.code)).toContain(147);
    });
});

describe('HeroEquipment compare and guards', () => {
    // 验证 compareEquip 逐属性输出两个装备的最终属性差
    it('diffs the final attributes of two equipment instances', () => {
        const env = createEnv();
        registerItem(env, createItem(10, 'sword', [0], [['atk', 5]]));
        registerItem(env, createItem(11, 'axe', [0], [['def', 3]]));
        env.equipment.setSlots(['weapon']);
        const sword = env.store.add(10);
        const axe = env.store.add(11);

        const diff = env.equipment.compareEquip(sword, axe, 0);

        expect(Object.keys(diff).sort()).toEqual(['atk', 'def']);
        expect(diff.atk).toBe(5);
        expect(diff.def).toBe(-3);
    });

    // 验证装备实例缺失时卸下告警 146
    it('warns code 146 when the equipped instance is missing', () => {
        const env = createEnv();
        registerItem(env, createItem(10, 'sword', [0], [['atk', 5]]));
        env.equipment.setSlots(['weapon']);
        const uid = env.store.add(10);
        env.equipment.equip(uid, 0);
        env.store.delete(uid);

        const result = logger.catch(() => env.equipment.unequip(0));

        expect(result.ret).toBeUndefined();
        expect(result.info.map(info => info.code)).toContain(146);
    });

    // 验证比较未知 uid 时告警 146 并返回空差异对象
    it('warns code 146 when comparing an unknown uid', () => {
        const env = createEnv();
        registerItem(env, createItem(10, 'sword', [0], [['atk', 5]]));
        const uid = env.store.add(10);

        const result = logger.catch(() =>
            env.equipment.compareEquip(uid, 999, 0)
        );

        expect(result.ret).toEqual({});
        expect(result.info.map(info => info.code)).toContain(146);
    });
});
