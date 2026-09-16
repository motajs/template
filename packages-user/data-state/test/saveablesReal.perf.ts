// 性能测量：真实 13×13 魔塔地图下 CoreState 存读档耗时，只记录不断言
import { afterAll, describe, it, vi } from 'vitest';
import {
    type IEnemyAttr,
    type IHeroAttr,
    type IItemRawData,
    type IMapRawData,
    ItemCategory,
    SaveCompression,
    TileType
} from '@user/data-common';
import { Enemy, ValueModifier } from '@user/data-base';
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
/** 存读档覆盖的地图数量，确定性取数据集的前 1 / 5 / 13 张 */
const MAP_SCALES = [1, 5, 13] as const;
/** 清除规则命中的图块编号：普通门 / 资源 / 怪物 / 机关门 */
const CLEAR_CODES: readonly number[] = [2, 3, 4, 6];
/** 固定侧负载：flag 条目数量 */
const FLAG_COUNT = 50;
/** 固定侧负载：装备道具编号，共 3 种 */
const EQUIP_ITEM_NUMS: readonly number[] = [3000, 3001, 3002];
/** 固定侧负载：装备实例编号，共 4 件，其中 3000 出现两次 */
const EQUIP_INSTANCE_NUMS: readonly number[] = [3000, 3001, 3002, 3000];
/** 固定侧负载：4 件装备占用的数字槽位，互不重复才能同时装备 */
const EQUIPPED_SLOTS: readonly number[] = [0, 1, 2, 3];
/** 固定侧负载：消耗品编号起点 */
const OTHER_ITEM_BASE = 3020;
/** 固定侧负载：消耗品种类数，编号 3020..3036，与 3 种装备合共 20 种道具 */
const OTHER_ITEM_KINDS = 17;
/** 固定侧负载：手写修饰器数量，加上 4 件装备各贡献 1 个即 20 个修饰器 */
const MANUAL_MODIFIER_COUNT = 16;
/** 固定侧负载：录像步数，按命令码 0..7 混合循环 */
const REPLAY_STEPS = 1000;
/** 手写修饰器轮转分布的勇士数值属性 */
const HERO_ATTR_NAMES: readonly (keyof IHeroAttr)[] = [
    'hp',
    'hpmax',
    'atk',
    'def',
    'mdef',
    'mana',
    'manamax',
    'money',
    'exp'
];

/** 勇士数值属性的键类型，用于装备 value/percentage 的构造 */
type HeroKey = SelectKey<IHeroAttr, number>;

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
 * 构造一个完整的合成道具定义，装备与消耗品共用
 * value 必须走 [HeroKey, number][] 再 new Map，
 * 直接写 new Map([['atk', 1]]) 会被推断成 Map<string, number>
 * @param num 道具编号
 * @param id 道具 id
 * @param category 道具分类
 * @param value 装备数值加成条目
 */
function createItemRaw(
    num: number,
    id: string,
    category: ItemCategory,
    value: [HeroKey, number][] = []
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
            slots: [...EQUIPPED_SLOTS],
            animate: 'sword',
            value: new Map(value),
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
 * 写入一步混合录像，参数与命令语义匹配，
 * record 只写录像数组、不校验命令是否注册
 * @param state 顶层数据端状态
 * @param step 步序号，按 0..7 轮转命令码
 */
function recordReplayStep(state: CoreState, step: number): void {
    const code = step % 8;
    if (code < 4) {
        state.replaySystem.record(code);
    } else if (code === 4) {
        state.replaySystem.record(code, 2, 3);
    } else if (code === 5) {
        state.replaySystem.record(code, 3000 + (step % 20));
    } else if (code === 6) {
        state.replaySystem.record(code, 0, 0, true);
    } else {
        state.replaySystem.record(code, 0);
    }
}

/**
 * 写入每个 case 逐字相同的固定真实侧负载：
 * 50 个 flag、20 种道具、4 件已装备实例、20 个修饰器、
 * 1000 步混合录像，以及只与参考一致的怪物基线
 * @param state 顶层数据端状态
 */
function seedSideLoad(state: CoreState): void {
    for (let i = 0; i < FLAG_COUNT; i++) {
        state.flags.setFieldValue('perf-flag-' + i.toString(), i);
    }

    // 每种装备恰好 1 个 value 条目，故每件实例只贡献 1 个修饰器
    for (const num of EQUIP_ITEM_NUMS) {
        registerItem(
            state,
            createItemRaw(
                num,
                'perf-equip-' + num.toString(),
                ItemCategory.Equipment,
                [['atk', 1]]
            )
        );
    }
    for (let i = 0; i < OTHER_ITEM_KINDS; i++) {
        const num = OTHER_ITEM_BASE + i;
        registerItem(
            state,
            createItemRaw(
                num,
                'perf-item-' + num.toString(),
                ItemCategory.Consumable
            )
        );
    }

    // 槽位互不重复才能同时装备 4 件，同一槽位的旧装备会被自动卸下
    for (let i = 0; i < EQUIP_INSTANCE_NUMS.length; i++) {
        const uid = state.hero.items.equipment.add(EQUIP_INSTANCE_NUMS[i]);
        state.hero.equip.equip(uid, EQUIPPED_SLOTS[i]);
    }

    // 消耗品件数各不相同，模拟真实背包
    for (let i = 0; i < OTHER_ITEM_KINDS; i++) {
        state.hero.items.addItem(OTHER_ITEM_BASE + i, 1 + (i % 5));
    }

    // 每次都用新实例注册，避免同一修饰器被重复挂载
    state.hero.registerModifier('@system/value', () => new ValueModifier(5));
    for (let i = 0; i < MANUAL_MODIFIER_COUNT; i++) {
        state.hero.createAndInsertModifier(
            '@system/value',
            HERO_ATTR_NAMES[i % HERO_ATTR_NAMES.length]
        );
    }

    // 最后写入录像，避免 equip 内部的 record 混进这 1000 步
    for (let i = 0; i < REPLAY_STEPS; i++) {
        recordReplayStep(state, i);
    }

    // 与参考一致的怪物模板不会进入 dirtySet，故存档里没有怪物条目
    state.enemyManager.addPrefab(createEnemy());
    state.enemyManager.compareWith(new Map([[1, createEnemy()]]));
}

/**
 * 构造存读档夹具：注册图块后注入前若干张真实地图，
 * 再一次性建立参考基线。实时内容为清除后的矩阵，参考为原始矩阵
 * 侧负载与地图注入次序无关，但每个 case 都必须逐字相同地执行一遍
 * @param mapCount 注入的真实地图数量
 */
function createRealMapFixture(mapCount: number): CoreState {
    const state = createCoreState();
    registerTiles(state);
    seedSideLoad(state);

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
