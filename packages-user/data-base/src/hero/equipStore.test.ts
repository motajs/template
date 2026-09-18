// 测试 HeroEquipsStore 构件：实例增删计数、按 uid/排序器排序与 EquipmentState 修饰器生成
import { afterAll, describe, expect, it, vi } from 'vitest';
import {
    type IDataCommon,
    type IHeroAttr,
    type IItemRawData,
    ItemCategory,
    ItemStore,
    SaveCompression,
    TileStore,
    TileType
} from '@user/data-common';
import { HeroEquipsStore } from './equipStore';
import { PercentageModifier, ValueModifier } from './modifier';
import {
    type IEquipmentSortHandler,
    type IEquipmentSorter,
    type IEquipmentStateSave
} from './types';

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

/** 存读档测试覆盖的三档压缩级别 */
const SAVE_COMPRESSIONS = [
    SaveCompression.NoCompression,
    SaveCompression.LowCompression,
    SaveCompression.HighCompression
] as const;

interface TestEnv {
    state: IDataCommon;
    tileStore: IDataCommon['tileStore'];
    itemStore: IDataCommon['itemStore'];
    store: HeroEquipsStore<IHeroAttr>;
}

/** 构造一个仅含图块与道具存储的公共层假对象 */
function createState(): IDataCommon {
    return {
        tileStore: new TileStore(),
        itemStore: new ItemStore()
    } as never;
}

/** 构造一个装配装备实例存储的测试环境 */
function createEnv(): TestEnv {
    const state = createState();
    return {
        state,
        tileStore: state.tileStore,
        itemStore: state.itemStore,
        store: new HeroEquipsStore<IHeroAttr>(state)
    };
}

/** 构造一个带合成装备属性的道具定义 */
function createItem(
    num: number,
    id: string,
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
            slots: [0],
            animate: 'sword',
            value: new Map(value),
            percentage: new Map(percentage),
            loadEvent: null,
            unloadEvent: null
        }
    };
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

/** 一个按 uid 降序排列的测试排序器 */
class FakeSorter implements IEquipmentSorter<IHeroAttr> {
    compare(handler: IEquipmentSortHandler<IHeroAttr>): number {
        return handler.equipB.uid - handler.equipA.uid;
    }
}

describe('HeroEquipsStore instances', () => {
    // 验证 add 分配自增 uid，未知图块或缺失定义返回 -1
    it('allocates increasing uids and rejects unknown items', () => {
        const env = createEnv();
        registerItem(env, createItem(10, 'sword'));
        env.tileStore.addTile({
            num: 12,
            id: 'ghost',
            events: {},
            type: TileType.Item,
            pass: { onlyEvents: false, inPass: 15, outPass: 15 },
            eventPass: true
        });

        expect(env.store.add(10)).toBe(0);
        expect(env.store.add('sword')).toBe(1);
        expect(env.store.add(99)).toBe(-1);
        expect(env.store.add('missing')).toBe(-1);
        expect(env.store.add(12)).toBe(-1);
    });

    // 验证 get/count/delete 按 uid 或图块查询并计数
    it('gets, counts and deletes instances', () => {
        const env = createEnv();
        registerItem(env, createItem(10, 'sword'));
        const first = env.store.add(10);
        env.store.add(10);

        expect(env.store.get(first)?.uid).toBe(first);
        expect(env.store.get(99)).toBeNull();
        expect(env.store.count(10)).toBe(2);
        expect(env.store.count('sword')).toBe(2);
        expect(env.store.count(99)).toBe(0);

        env.store.delete(first);
        expect(env.store.get(first)).toBeNull();
        expect(env.store.count(10)).toBe(1);
    });

    // 验证 instancesOf 只输出指定图块实例，未知图块返回空数组
    it('lists instances filtered by item', () => {
        const env = createEnv();
        registerItem(env, createItem(10, 'sword'));
        registerItem(env, createItem(11, 'axe'));
        const swordA = env.store.add(10);
        const axe = env.store.add(11);
        const swordB = env.store.add(10);

        expect(env.store.instancesOf(10).map(state => state.uid)).toEqual([
            swordA,
            swordB
        ]);
        expect(env.store.instancesOf('axe').map(state => state.uid)).toEqual([
            axe
        ]);
        expect(env.store.instancesOf(99)).toEqual([]);
    });

    // 验证无排序器时按 uid 升序，使用排序器后按其顺序且并列回退 uid
    it('orders instances by uid by default and by the sorter when set', () => {
        const env = createEnv();
        registerItem(env, createItem(10, 'sword'));
        const first = env.store.add(10);
        const second = env.store.add(10);
        const third = env.store.add(10);

        expect(env.store.instances().map(state => state.uid)).toEqual([
            first,
            second,
            third
        ]);

        env.store.useSorter(new FakeSorter());
        expect(env.store.instances().map(state => state.uid)).toEqual([
            third,
            second,
            first
        ]);
        expect(env.store.instancesOf(10).map(state => state.uid)).toEqual([
            third,
            second,
            first
        ]);

        env.store.useSorter({ compare: () => 0 });
        expect(env.store.instances().map(state => state.uid)).toEqual([
            first,
            second,
            third
        ]);

        env.store.useSorter(null);
        expect(env.store.instances().map(state => state.uid)).toEqual([
            first,
            second,
            third
        ]);
    });
});

/** 构造一份仅指定数值加成的无压缩装备存档，用于把活实例改到指定存档点 */
function createValueSave(
    uid: number,
    atk: number
): IEquipmentStateSave<IHeroAttr> {
    return {
        uid,
        num: 10,
        value: new Map<HeroKey, number>([['atk', atk]]),
        percentage: new Map<HeroKey, number>()
    };
}

describe('HeroEquipsStore same-reference load (#06-17-4)', () => {
    // 验证同 uid 装备实例在三档压缩读档前后为同一实例，且数值恢复到存档点
    it('keeps the same instance and restores values across all compressions', () => {
        for (const compression of SAVE_COMPRESSIONS) {
            const env = createEnv();
            registerItem(env, createItem(10, 'sword', [['atk', 5]]));
            const uid = env.store.add(10);
            const before = env.store.get(uid)!;
            // 装备数值只能经读档改变，先用一份自定义存档把活实例改到 9 作为存档点
            before.loadState(
                createValueSave(uid, 9),
                SaveCompression.NoCompression
            );
            const saved = env.store.saveState(compression);
            before.loadState(
                createValueSave(uid, 1),
                SaveCompression.NoCompression
            );

            env.store.loadState(saved, compression);

            expect(env.store.get(uid)).toBe(before);
            expect([...before.getModifiers()][0][1].getValue()).toBe(9);
        }
    });

    // 验证存档中不存在的装备实例在读档后被删除（以存档为准）
    it('deletes instances absent from the save', () => {
        const env = createEnv();
        registerItem(env, createItem(10, 'sword'));
        const kept = env.store.add(10);
        const before = env.store.get(kept)!;

        const saved = env.store.saveState(SaveCompression.NoCompression);
        const extra = env.store.add(10);

        env.store.loadState(saved, SaveCompression.NoCompression);

        expect(env.store.get(kept)).toBe(before);
        expect(env.store.get(extra)).toBeNull();
        expect(env.store.count(10)).toBe(1);
    });

    // 验证同 uid 但装备图块数字不同的存档无法复用实例，改为替换该实例
    it('replaces the instance when the saved item number differs', () => {
        const env = createEnv();
        registerItem(env, createItem(10, 'sword', [['atk', 5]]));
        registerItem(env, createItem(11, 'axe', [['atk', 3]]));
        const uid = env.store.add(10);
        const before = env.store.get(uid)!;

        const saved = env.store.saveState(SaveCompression.NoCompression);
        const swapped = {
            equipments: saved.equipments.map(v => ({ ...v, num: 11 }))
        };

        env.store.loadState(swapped, SaveCompression.NoCompression);

        expect(env.store.get(uid)).not.toBe(before);
        expect(env.store.get(uid)?.item.num).toBe(11);
    });
});

describe('EquipmentState modifiers', () => {
    // 验证装备实例按定义生成数值与百分比修饰器
    it('builds value and percentage modifiers from the item', () => {
        const env = createEnv();
        const item = createItem(10, 'sword', [['atk', 5]], [['hp', 0.2]]);
        registerItem(env, item);
        const uid = env.store.add(10);
        const state = env.store.get(uid)!;

        const modifiers = [...state.getModifiers()];

        expect(state.uid).toBe(uid);
        expect(state.item).toBe(item);
        expect(modifiers.map(item => item[0])).toEqual(['atk', 'hp']);
        expect(modifiers[0][1]).toBeInstanceOf(ValueModifier);
        expect(modifiers[1][1]).toBeInstanceOf(PercentageModifier);
    });
});
