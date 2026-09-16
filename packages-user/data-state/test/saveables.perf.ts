// 性能测量：CoreState 整体存读档随件数与压缩档的耗时，只记录不断言
import { afterAll, describe, it, vi } from 'vitest';
import {
    type IEnemyAttr,
    type IHeroAttr,
    type IItemRawData,
    ItemCategory,
    SaveCompression,
    TileType
} from '@user/data-common';
import { Enemy } from '@user/data-base';
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

/** 预热次数，不计入采样 */
const WARMUP_RUNS = 3;
/** 采样次数，取排序后的下中位数 */
const SAMPLE_RUNS = 20;
/** 存读档覆盖的装备件数与消耗品条目数 */
const ITEM_SCALES = [10, 100, 1000] as const;

/** 一档压缩档位的枚举值与表格展示名 */
interface CompressionCase {
    /** 表格展示名 */
    readonly label: string;
    /** 压缩档位枚举值 */
    readonly value: SaveCompression;
}

/** 存读档覆盖的三档压缩，顺序固定 */
const COMPRESSIONS: readonly CompressionCase[] = [
    { label: 'NoCompression', value: SaveCompression.NoCompression },
    { label: 'LowCompression', value: SaveCompression.LowCompression },
    { label: 'HighCompression', value: SaveCompression.HighCompression }
];

/** 单条性能记录，字段与控制台表格列一一对应 */
interface PerfRecord {
    /** 测量项名称 */
    case: string;
    /** 规模档位 */
    scale: string;
    /** 中位耗时，单位毫秒 */
    'median ms': number;
    /** 最小耗时，单位毫秒 */
    'min ms': number;
    /** 95 分位耗时，单位毫秒 */
    'p95 ms': number;
}

/** 本次运行累积的性能记录，由 afterAll 统一打印 */
const records: PerfRecord[] = [];

/**
 * 测量一次用例：先预热若干次，再采样后取中位数、最小值与 p95
 * @param caseName 测量项名称
 * @param scale 规模档位
 * @param run 单次被测量的操作
 */
function measureCase(
    caseName: string,
    scale: string,
    run: () => void
): PerfRecord {
    for (let i = 0; i < WARMUP_RUNS; i++) {
        run();
    }

    const samples: number[] = [];
    for (let i = 0; i < SAMPLE_RUNS; i++) {
        const start = globalThis.performance.now();
        run();
        samples.push(globalThis.performance.now() - start);
    }

    samples.sort((left, right) => left - right);
    const record: PerfRecord = {
        case: caseName,
        scale,
        'median ms': Number(samples[SAMPLE_RUNS / 2].toFixed(3)),
        'min ms': Number(samples[0].toFixed(3)),
        'p95 ms': Number(samples[Math.ceil(SAMPLE_RUNS * 0.95) - 1].toFixed(3))
    };
    records.push(record);
    return record;
}

/** 构造一个带合成属性的怪物模板对象 */
function createEnemy(hp: number = 20): Enemy<IEnemyAttr> {
    return new Enemy<IEnemyAttr>('perf-enemy', 1, {
        hp,
        atk: 8,
        def: 5,
        money: 2,
        exp: 3,
        point: 1,
        guard: new Set()
    });
}

/**
 * 构造一个完整的合成道具定义，装备与消耗品共用
 * @param num 道具编号
 * @param id 道具 id
 * @param category 道具分类
 */
function createItemRaw(
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

/**
 * 向图块与道具存储注册一个道具定义，
 * 顺序不可颠倒：装备实例化依赖 itemStore 中已存在的定义
 * @param state 顶层数据端状态
 * @param item 道具定义
 */
function registerItem(state: CoreState, item: IItemRawData<IHeroAttr>): void {
    state.tileStore.addTile({
        num: item.num,
        id: item.id,
        events: {},
        type: TileType.Item,
        pass: { onlyEvents: false, inPass: 15, outPass: 15 },
        eventPass: true
    });
    state.itemStore.addItem(item);
}

/**
 * 创建存读档夹具：先建立地图与怪物的合成基线，
 * 再按件数写入等量的装备实例与消耗品条目
 * @param count 装备件数与消耗品条目数
 */
function createSaveablesFixture(count: number): CoreState {
    const state = createCoreState();
    const map = state.maps.createMap('F1', 2, 2);
    map.addLayer();
    state.maps.compareWith(
        new Map([['F1', new Map([[0, new Uint32Array(4)]])]])
    );
    state.enemyManager.compareWith(new Map([[1, createEnemy()]]));
    for (let i = 0; i < count; i++) {
        registerItem(
            state,
            createItemRaw(1000 + i, 'perf-equip-' + i, ItemCategory.Equipment)
        );
        state.hero.items.equipment.add(1000 + i);
    }
    for (let i = 0; i < count; i++) {
        registerItem(
            state,
            createItemRaw(2000 + i, 'perf-item-' + i, ItemCategory.Consumable)
        );
        state.hero.items.addItem(2000 + i, 1);
    }
    return state;
}

afterAll(() => {
    console.table(records);
});

describe('存读档性能', () => {
    for (const scale of ITEM_SCALES) {
        for (const compression of COMPRESSIONS) {
            // 覆盖指定件数的装备与消耗品在该压缩档下的一次完整存读档往返
            it(`measures ${scale} items with ${compression.label}`, () => {
                const state = createSaveablesFixture(scale);
                const label = `${scale}/${compression.label}`;

                measureCase('存读档', label, () => {
                    const snapshot = state.saveState(compression.value);
                    state.loadState(snapshot, compression.value);
                });
            });
        }
    }
});
