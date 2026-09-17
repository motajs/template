// 测试 HeroItems 构件：常量/消耗计数、装备路由、拾取效果、未知输入与 useItem 分类行为
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
import { HeroItems } from './items';

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

interface TestEnv {
    state: IDataCommon;
    tileStore: IDataCommon['tileStore'];
    itemStore: IDataCommon['itemStore'];
    items: HeroItems<IHeroAttr>;
}

interface ItemFixture {
    item: IItemRawData<IHeroAttr>;
    useEffect: ReturnType<typeof vi.fn>;
    canUse: ReturnType<typeof vi.fn>;
}

/** 构造一个装配勇士道具对象的测试环境 */
function createEnv(): TestEnv {
    const tileStore = new TileStore();
    const itemStore = new ItemStore<IHeroAttr>();
    // 录像系统桩，仅用于满足道具使用时的 route.add 记录
    const replaySystem = { route: { add: vi.fn() } };
    const state = { tileStore, itemStore, replaySystem } as never;
    return {
        state,
        tileStore,
        itemStore,
        items: new HeroItems<IHeroAttr>(state)
    };
}

/** 构造一个带可观测效果的内联道具定义 */
function createItem(
    num: number,
    id: string,
    category: ItemCategory,
    allowed: boolean = true
): ItemFixture {
    const useEffect = vi.fn();
    const canUse = vi.fn(() => allowed);
    const item: IItemRawData<IHeroAttr> = {
        num,
        id,
        category,
        name: id,
        text: id,
        hideInToolbox: false,
        effect: { useEvent: null, useEffect, canUse },
        equip: {
            slots: [0],
            animate: 'sword',
            value: new Map(),
            percentage: new Map(),
            loadEvent: null,
            unloadEvent: null
        }
    };
    return { item, useEffect, canUse };
}

/** 向图块与道具存储注册一个道具定义 */
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

describe('HeroItems counting', () => {
    // 验证常量道具叠加计数并在数量归零时删除
    it('increments constant items and deletes them at zero', () => {
        const env = createEnv();
        registerItem(env, createItem(20, 'key', ItemCategory.Constant).item);

        env.items.addItem(20, 2);
        expect(env.items.itemCount(20)).toBe(2);
        expect(env.items.getItemState(20)?.id).toBe('key');

        env.items.addItem(20, 3);
        expect(env.items.itemCount(20)).toBe(5);

        env.items.addItem(20, -5);
        expect(env.items.itemCount(20)).toBe(0);
        expect(env.items.getItemState(20)).toBeNull();
    });

    // 验证 getItem 等价于增加一个道具并支持字符串 id
    it('gets one item through getItem and string ids', () => {
        const env = createEnv();
        registerItem(env, createItem(20, 'key', ItemCategory.Constant).item);

        env.items.getItem('key');

        expect(env.items.itemCount(20)).toBe(1);
        expect(env.items.itemCount('key')).toBe(1);
    });

    // 验证装备类道具被路由到装备实例存储
    it('routes equipment items into the equipment store', () => {
        const env = createEnv();
        registerItem(env, createItem(30, 'sword', ItemCategory.Equipment).item);

        env.items.addItem(30, 2);

        expect(env.items.equipment.count(30)).toBe(2);
        expect(env.items.itemCount(30)).toBe(0);
    });

    // 验证拾取类道具按数量逐个触发效果且不占用背包
    it('triggers pick effects once per added item', () => {
        const env = createEnv();
        const fixture = createItem(40, 'coin', ItemCategory.Pick);
        registerItem(env, fixture.item);

        env.items.addItem(40, 3);

        expect(fixture.useEffect).toHaveBeenCalledTimes(3);
        expect(env.items.itemCount(40)).toBe(0);
    });

    // 验证未知图块、缺失定义与无效 id 都安全忽略
    it('ignores unknown tiles and missing item definitions', () => {
        const env = createEnv();
        env.tileStore.addTile({
            num: 77,
            id: 'ghost',
            events: {},
            type: TileType.Item,
            pass: { onlyEvents: false, inPass: 15, outPass: 15 },
            eventPass: true
        });

        env.items.addItem(99);
        env.items.getItem('missing');
        env.items.addItem(77, 3);

        expect(env.items.itemCount(99)).toBe(0);
        expect(env.items.itemCount(77)).toBe(0);
    });
});

describe('HeroItems useItem', () => {
    // 验证 useItem 仅对常量与可用的消耗类生效，并对装备/拾取/缺失返回 false
    it('uses constant and consumable items only when allowed', () => {
        const env = createEnv();
        const constant = createItem(20, 'key', ItemCategory.Constant);
        const consumable = createItem(21, 'potion', ItemCategory.Consumable);
        const blocked = createItem(
            22,
            'sealed',
            ItemCategory.Consumable,
            false
        );
        const equipment = createItem(30, 'sword', ItemCategory.Equipment);
        const pick = createItem(40, 'coin', ItemCategory.Pick);
        for (const fixture of [
            constant,
            consumable,
            blocked,
            equipment,
            pick
        ]) {
            registerItem(env, fixture.item);
        }

        expect(env.items.useItem(99)).toBe(false);

        env.items.addItem(20);
        expect(env.items.useItem(20)).toBe(true);
        expect(constant.useEffect).toHaveBeenCalledTimes(1);
        expect(env.items.itemCount(20)).toBe(1);

        env.items.addItem(21, 2);
        expect(env.items.useItem(21)).toBe(true);
        expect(env.items.itemCount(21)).toBe(1);
        expect(env.items.useItem(21)).toBe(true);
        expect(env.items.itemCount(21)).toBe(0);
        expect(env.items.getItemState(21)).toBeNull();

        env.items.addItem(22);
        expect(env.items.useItem(22)).toBe(false);
        expect(blocked.useEffect).not.toHaveBeenCalled();

        env.items.addItem(30);
        expect(env.items.useItem(30)).toBe(false);
        expect(env.items.equipment.count(30)).toBe(1);

        env.items.addItem(40);
        expect(env.items.useItem(40)).toBe(false);
        expect(pick.useEffect).toHaveBeenCalledTimes(1);
    });
});
