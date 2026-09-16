// 性能测量：真实 13×13 魔塔地图下 CoreState 存读档耗时，只记录不断言
import { afterAll, describe, it, vi } from 'vitest';
import {
    type IHeroAttr,
    type IItemRawData,
    type IMapRawData,
    ItemCategory,
    SaveCompression,
    TileType
} from '@user/data-common';
import { CoreState, createCoreState } from '../src/core';
import floorDataset from './fixtures/floors.json';

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
/** 存读档覆盖的地图数量，阶段 2 扩为 1 / 5 / 13 */
const MAP_SCALES = [1] as const;
/** 清除规则命中的图块编号：普通门 / 资源 / 怪物 / 机关门 */
const CLEAR_CODES: readonly number[] = [2, 3, 4, 6];

/** 一档压缩档位的枚举值与表格展示名 */
interface CompressionCase {
    /** 表格展示名 */
    readonly label: string;
    /** 压缩档位枚举值 */
    readonly value: SaveCompression;
}

/** 存读档覆盖的压缩档，阶段 3 扩为 No / Low / High 三档 */
const COMPRESSIONS: readonly CompressionCase[] = [
    { label: 'NoCompression', value: SaveCompression.NoCompression }
];

/** 数据集条目中本文件需要的字段 */
interface IFloorEntry {
    /** 13×13 的真实图块矩阵 */
    readonly map: number[][];
    /** 数据集记录的 [宽, 高]，矩阵已自洽，故不参与注入 */
    readonly size: number[];
}

/** 数据集文件的松散视图，用于只保留需要的字段 */
interface IFloorDataset {
    /** 数据集编号，仅用于对齐真实文件结构 */
    readonly datasetId: number;
    /** 楼层 id 到条目的映射 */
    readonly data: Record<string, IFloorEntry>;
}

const dataset: IFloorDataset = floorDataset;

/** 只保留 map 与 size 的真实地图条目，键为楼层 id */
const FLOOR_DATA: Record<string, IFloorEntry> = {};
for (const [name, entry] of Object.entries(dataset.data)) {
    FLOOR_DATA[name] = { map: entry.map, size: entry.size };
}

/** 数据集声明顺序即稳定顺序，故「前 N 张」是确定性的选择 */
const FLOOR_NAMES: readonly string[] = Object.keys(FLOOR_DATA);

/** 数据集中出现过的全部非零图块编号，升序去重，与地图数量无关 */
const TILE_CODES: readonly number[] = collectTileCodes();

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
 * 收集数据集中出现过的全部非零图块编号
 * @returns 升序去重后的编号数组
 */
function collectTileCodes(): number[] {
    const codes = new Set<number>();
    for (const entry of Object.values(FLOOR_DATA)) {
        for (const row of entry.map) {
            for (const code of row) {
                if (code !== 0) codes.add(code);
            }
        }
    }
    return [...codes].sort((left, right) => left - right);
}

/**
 * 把二维矩阵转为扁平数组，IMapRawData.map 要求扁平存储
 * @param matrix 二维图块矩阵
 */
function toFlat(matrix: number[][]): number[] {
    return matrix.flat();
}

/**
 * 把实时地图中的门 / 资源 / 怪物 / 机关门置空，保留空地 / 墙壁 / 入口
 * @param flat 扁平图块数组
 */
function clearCodes(flat: readonly number[]): number[] {
    return flat.map(code => (CLEAR_CODES.includes(code) ? 0 : code));
}

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

/**
 * 注册数据集中出现过的全部图块编号，与地图数量无关
 * 动机是夹具真实性（真实游戏里这些编号都有定义），而非消除某条既有告警
 * @param state 顶层数据端状态
 */
function registerTiles(state: CoreState): void {
    for (const num of TILE_CODES) {
        state.tileStore.addTile({
            num,
            id: 'perf-tile-' + num.toString(),
            events: {},
            type: TileType.Terrain,
            pass: { onlyEvents: false, inPass: 15, outPass: 15 },
            eventPass: true
        });
    }
}

/**
 * 构造一个完整的合成道具定义，构件阶段只用到装备分类
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
 * 构造存读档夹具：注册图块后注入前若干张真实地图，
 * 再一次性建立参考基线。实时内容为清除后的矩阵，参考为原始矩阵
 * 装备列表为空时 HeroEquipsStore.loadState 会报 error 58，
 * 故构件阶段也必须至少注册并添加 1 件装备实例
 * @param mapCount 注入的真实地图数量
 */
function createRealMapFixture(mapCount: number): CoreState {
    const state = createCoreState();
    registerTiles(state);
    registerItem(
        state,
        createItemRaw(3000, 'perf-equip-3000', ItemCategory.Equipment)
    );
    state.hero.items.equipment.add(3000);

    const reference = new Map<string, Map<number, Uint32Array>>();
    for (let i = 0; i < mapCount; i++) {
        const floorId = FLOOR_NAMES[i];
        const entry = FLOOR_DATA[floorId];
        const original = toFlat(entry.map);
        const raw: IMapRawData = {
            floorId,
            width: entry.map[0].length,
            map: { 0: clearCodes(original) },
            layerAlias: { 0: 'bg' },
            events: { 0: {} }
        };
        state.maps.fromRaw(raw);
        // saveState 会跳过非 active 楼层，故每张注入的地图都要激活
        state.maps.setMapActiveStatus(floorId, true);
        reference.set(floorId, new Map([[0, new Uint32Array(original)]]));
    }

    // 一次性守卫：必须在全部地图建好之后、且只调用一次
    state.maps.compareWith(reference);
    return state;
}

afterAll(() => {
    console.table(records);
});

describe('真实地图存读档性能', () => {
    for (const mapCount of MAP_SCALES) {
        for (const compression of COMPRESSIONS) {
            const label = `${mapCount}/${compression.label}`;

            // 覆盖前若干张真实地图在该压缩档下的一次完整存档
            it(`saves ${label}`, () => {
                const state = createRealMapFixture(mapCount);

                measureCase('存档', label, () => {
                    state.saveState(compression.value);
                });
            });

            // 覆盖前若干张真实地图在该压缩档下的一次读档，快照在预热前取一次
            it(`loads ${label}`, () => {
                const state = createRealMapFixture(mapCount);
                const snapshot = state.saveState(compression.value);

                measureCase('读档', label, () => {
                    state.loadState(snapshot, compression.value);
                });
            });

            // 覆盖前若干张真实地图在该压缩档下的一次存读档往返
            it(`round trips ${label}`, () => {
                const state = createRealMapFixture(mapCount);

                measureCase('往返', label, () => {
                    const snapshot = state.saveState(compression.value);
                    state.loadState(snapshot, compression.value);
                });
            });
        }
    }
});
