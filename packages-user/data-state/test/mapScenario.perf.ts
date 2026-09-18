// 性能测量：13 张真实地图拼接的单一大图下怪物上下文构建与地图伤害构建耗时，只记录不断言
import { afterAll, describe, it, vi } from 'vitest';
import {
    type IEnemyAttr,
    type IHeroAttr,
    type IMapRawData,
    TileType
} from '@user/data-common';
import {
    Enemy,
    type IEnemy,
    type IReadonlyHeroAttribute,
    type ISpecial
} from '@user/data-base';
import { type IDamageSystem, type IMapDamage } from '@user/data-system';
import { CoreState, createCoreState } from '../src/core';
import { type IHaloValue, type IZoneValue } from '../src/enemy/special';
import floorDataset from './fixtures/floors.json';

vi.hoisted(() => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    // 夹击视图会读全局 core.flags.betweenAttackMax，数据端自身不带该全局对象，
    // 故与 mapDamage.test.ts 同构地在夹具里补一个，否则 16 会直接抛 TypeError
    vi.stubGlobal('core', { flags: { betweenAttackMax: false } });
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
/** 合并地图的规模档：取数据集前 1 / 5 / 13 张地图拼接 */
const MAP_SCALES: readonly number[] = [1, 5, 13];
/** 单张真实地图的边长，数据集实测 13 个条目全部为 13×13 */
const MAP_SIZE = 13;
/** 数据集里代表怪物的图块编号 */
const MONSTER_TILE_CODE = 4;
/** 固定随机种子，保证同一规模的怪物分配每次运行完全一致 */
const PERF_SEED = 20260916;

/** 勇士数值属性的键类型，用于固定属性的构造 */
type HeroKey = SelectKey<IHeroAttr, number>;

/** 勇士固定属性：攻击 10 高于全部模板防御（0–6），保证伤害有限且临界枚举非空 */
const HERO_ATTRIBUTE_VALUES: readonly [HeroKey, number][] = [
    ['hp', 1000],
    ['hpmax', 1000],
    ['atk', 10],
    ['def', 5],
    ['mdef', 3],
    ['mana', 0],
    ['manamax', 0],
    ['money', 0],
    ['exp', 0]
];

/** 数据集条目中本文件需要的字段 */
interface IFloorEntry {
    /** 13×13 的真实图块矩阵 */
    readonly map: number[][];
    /** 数据集记录的 [宽, 高]，矩阵已自洽，故不参与拼接 */
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

/** 数据集中出现过的全部非零图块编号，升序去重，与拼接地图数量无关 */
const TILE_CODES: readonly number[] = collectTileCodes();

/** 怪物模板的基础属性 */
interface IMonsterAttrs {
    /** 怪物生命值 */
    readonly hp: number;
    /** 怪物攻击力 */
    readonly atk: number;
    /** 怪物防御力 */
    readonly def: number;
    /** 怪物金币 */
    readonly money: number;
    /** 怪物经验值 */
    readonly exp: number;
    /** 怪物加点量 */
    readonly point: number;
}

/** 一个真实怪物模板：编号、基础属性与特殊属性列表 */
interface IMonsterPrefab {
    /** 模板 id */
    readonly id: string;
    /** 模板编号 */
    readonly code: number;
    /** 模板基础属性 */
    readonly attrs: IMonsterAttrs;
    /** 模板携带的特殊属性实例列表 */
    readonly specials: readonly ISpecial<any>[];
}

/**
 * 12 个真实怪物模板：4 个带真实光环（25 的三种范围 + 26 支援），
 * 其余覆盖领域 / 阻击 / 激光 / 捕捉 / 夹击五种地图伤害视图与真实伤害分支
 */
const MONSTER_PORTFOLIO: readonly IMonsterPrefab[] = [
    {
        id: 'perf-aura-full',
        code: 100,
        attrs: { hp: 120, atk: 12, def: 3, money: 5, exp: 7, point: 1 },
        specials: [
            // haloRange 为 0 时 25 会落到 FullRange，即同楼层全体光环
            createSpecial<IHaloValue>(25, {
                haloRange: 0,
                haloSquare: false,
                hpBuff: 0,
                atkBuff: 30,
                defBuff: 0
            })
        ]
    },
    {
        id: 'perf-aura-manhattan',
        code: 101,
        attrs: { hp: 90, atk: 9, def: 2, money: 4, exp: 6, point: 1 },
        specials: [
            // 十字范围光环，让光环拓扑随怪物坐标变化而非全图连通
            createSpecial<IHaloValue>(25, {
                haloRange: 3,
                haloSquare: false,
                hpBuff: 20,
                atkBuff: 0,
                defBuff: 0
            })
        ]
    },
    {
        id: 'perf-aura-rect',
        code: 102,
        attrs: { hp: 150, atk: 15, def: 5, money: 8, exp: 12, point: 2 },
        specials: [
            // 九宫格范围光环，与十字范围共用同一转换器但走不同 range 实现
            createSpecial<IHaloValue>(25, {
                haloRange: 2,
                haloSquare: true,
                hpBuff: 0,
                atkBuff: 0,
                defBuff: 25
            }),
            createSpecial<number>(7, 100)
        ]
    },
    {
        id: 'perf-guard',
        code: 103,
        attrs: { hp: 200, atk: 18, def: 6, money: 12, exp: 20, point: 3 },
        specials: [
            // 支援会让相邻怪物的 guard 集合带上来源坐标，从而驱动真实的支援递归
            createSpecial<void>(26, undefined)
        ]
    },
    {
        id: 'perf-zone-cross',
        code: 104,
        attrs: { hp: 60, atk: 6, def: 1, money: 2, exp: 3, point: 1 },
        specials: [
            createSpecial<IZoneValue>(15, {
                zone: 5,
                zoneSquare: false,
                range: 2
            })
        ]
    },
    {
        id: 'perf-zone-square',
        code: 105,
        attrs: { hp: 70, atk: 7, def: 2, money: 3, exp: 4, point: 1 },
        specials: [
            createSpecial<IZoneValue>(15, {
                zone: 8,
                zoneSquare: true,
                range: 1
            }),
            createSpecial<void>(2, undefined)
        ]
    },
    {
        id: 'perf-repulse',
        code: 106,
        attrs: { hp: 80, atk: 8, def: 2, money: 3, exp: 5, point: 1 },
        specials: [
            createSpecial<number>(18, 3),
            createSpecial<number>(22, 7),
            createSpecial<number>(9, 2)
        ]
    },
    {
        id: 'perf-laser',
        code: 107,
        attrs: { hp: 55, atk: 5, def: 1, money: 2, exp: 3, point: 1 },
        specials: [
            createSpecial<number>(24, 4),
            createSpecial<void>(4, undefined)
        ]
    },
    {
        id: 'perf-ambush',
        code: 108,
        attrs: { hp: 65, atk: 6, def: 1, money: 3, exp: 4, point: 1 },
        specials: [
            createSpecial<void>(27, undefined),
            createSpecial<void>(1, undefined)
        ]
    },
    {
        id: 'perf-between',
        code: 109,
        attrs: { hp: 45, atk: 4, def: 0, money: 1, exp: 2, point: 1 },
        specials: [
            createSpecial<void>(16, undefined),
            createSpecial<number>(6, 2)
        ]
    },
    {
        id: 'perf-vampire',
        code: 110,
        attrs: { hp: 110, atk: 11, def: 3, money: 5, exp: 8, point: 1 },
        specials: [
            createSpecial(11, { vampire: 10, add: true }),
            createSpecial<number>(8, 50)
        ]
    },
    {
        id: 'perf-sturdy',
        code: 111,
        attrs: { hp: 140, atk: 13, def: 4, money: 6, exp: 9, point: 1 },
        specials: [
            createSpecial<void>(3, undefined),
            createSpecial<void>(17, undefined)
        ]
    }
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

/** 全图临界计算的汇总记录，总量与单怪均值分开成列 */
interface CriticalRecord {
    /** 测量项名称 */
    readonly case: string;
    /** 规模档位 */
    readonly scale: string;
    /** 该规模的全图怪物数量 */
    readonly monsters: number;
    /** 全图扫一遍的采样中位耗时，单位毫秒 */
    readonly 'total ms': number;
    /** 单怪平均耗时，等于总量除以怪物数，单位毫秒 */
    readonly 'avg ms': number;
}

/** 全图临界计算的汇总记录，由 afterAll 在第二张表打印 */
const criticalRecords: CriticalRecord[] = [];

/** 一次测量所需的完整场景，管理器在工厂里解析一次以免样本内做属性查找 */
interface IScenarioFixture {
    /** 顶层数据端状态 */
    readonly state: CoreState;
    /** 当前绑定的地图伤害管理器 */
    readonly mapDamage: IMapDamage<IEnemyAttr, IHeroAttr>;
    /** 当前绑定的伤害系统 */
    readonly damageSystem: IDamageSystem<IEnemyAttr, IHeroAttr>;
    /** 合并地图宽度 */
    readonly width: number;
    /** 合并地图高度 */
    readonly height: number;
    /** 合并地图上的怪物数量 */
    readonly monsterCount: number;
    /** 当前绑定的勇士数值属性 */
    readonly hero: IReadonlyHeroAttribute<IHeroAttr>;
}

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
 * 把前若干张真实地图按网格拼成单一大图：列数取 ceil(sqrt(n))、
 * 每张按 (列 * 13, 行 * 13) 放置、末尾空位补 0
 * @param mapCount 参与拼接的地图数量
 */
function buildMergedMap(mapCount: number): number[][] {
    const columns = Math.ceil(Math.sqrt(mapCount));
    const rows = Math.ceil(mapCount / columns);
    const width = columns * MAP_SIZE;
    const height = rows * MAP_SIZE;
    const merged: number[][] = [];
    for (let y = 0; y < height; y++) {
        const row: number[] = [];
        for (let x = 0; x < width; x++) {
            row.push(0);
        }
        merged.push(row);
    }
    for (let i = 0; i < mapCount; i++) {
        const source = FLOOR_DATA[FLOOR_NAMES[i]].map;
        const originX = (i % columns) * MAP_SIZE;
        const originY = Math.floor(i / columns) * MAP_SIZE;
        for (let y = 0; y < MAP_SIZE; y++) {
            for (let x = 0; x < MAP_SIZE; x++) {
                merged[originY + y][originX + x] = source[y][x];
            }
        }
    }
    return merged;
}

/**
 * 创建 mulberry32 确定性随机数发生器，返回函数是有意为之：
 * 随机源必须携带内部状态，跨调用持续推进
 * @param seed 固定种子
 */
function createRandom(seed: number): () => number {
    let state = seed;
    return () => {
        state = (state + 0x6d2b79f5) | 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * 创建一个只包含测量所需行为的内联特殊属性，数值可克隆可读写
 * @param code 特殊属性代码
 * @param value 特殊属性数值
 */
function createSpecial<T>(code: number, value: T): ISpecial<T> {
    const special = {
        code,
        value,
        getValue: () => special.value,
        setValue: (next: T) => {
            special.value = next;
        },
        getSpecialName: () => `special-${code}`,
        getDescription: () => `special-${code}`,
        fromLegacyEnemy: () => {},
        clone: () => createSpecial<T>(code, structuredClone(special.value)),
        deepEqualsTo: (other: ISpecial<T>) => other.code === code,
        saveState: () => structuredClone(special.value),
        loadState: (state: T) => {
            special.value = state;
        }
    };
    return special as ISpecial<T>;
}

/**
 * 用真实 Enemy 模型构造模板怪，guard 由 IEnemyAttr 上下文推断为坐标集合，
 * 缺失会让支援光环在施加时抛错
 * @param entry 模板定义
 */
function createPrefab(entry: IMonsterPrefab): IEnemy<IEnemyAttr> {
    const attrs = entry.attrs;
    const enemy = new Enemy<IEnemyAttr>(entry.id, entry.code, {
        hp: attrs.hp,
        atk: attrs.atk,
        def: attrs.def,
        money: attrs.money,
        exp: attrs.exp,
        point: attrs.point,
        guard: new Set()
    });
    for (const special of entry.specials) {
        enemy.addSpecial(special);
    }
    return enemy;
}

/**
 * 注册数据集中出现过的全部图块编号，与拼接地图数量无关
 * 动机是夹具真实性（真实游戏里这些编号都有定义），而非消除某条既有告警
 * @param state 顶层数据端状态
 */
function registerTiles(state: CoreState): void {
    for (const num of TILE_CODES) {
        state.tileStore.addTile({
            num,
            id: 'perf-scenario-tile-' + num.toString(),
            events: {},
            type: TileType.Terrain,
            pass: { onlyEvents: false, inPass: 15, outPass: 15 },
            eventPass: true
        });
    }
}

/**
 * 把 12 个模板逐个注册进真实怪物管理器，重复编号会被 addPrefab 直接忽略
 * @param state 顶层数据端状态
 */
function registerPrefabs(state: CoreState): void {
    for (const entry of MONSTER_PORTFOLIO) {
        state.enemyManager.addPrefab(createPrefab(entry));
    }
}

/**
 * 写入固定勇士属性：挂修饰器会让临界计算的 Infinity 上界叠加成无意义噪声，
 * 故本场景的勇士保持零修饰器
 * @param state 顶层数据端状态
 */
function seedHero(state: CoreState): void {
    const attribute = state.hero.getModifiableAttribute();
    for (const [name, value] of HERO_ATTRIBUTE_VALUES) {
        attribute.set(name, value);
    }
}

/**
 * 把合并矩阵作为单一楼层注入真实地图状态，实时内容保持原始编号
 * @param state 顶层数据端状态
 * @param matrix 合并后的二维矩阵
 * @param width 合并宽度
 */
function injectMergedMap(
    state: CoreState,
    matrix: number[][],
    width: number
): void {
    const raw: IMapRawData = {
        floorId: 'perf-scenario-merged',
        width,
        map: { 0: toFlat(matrix) },
        layerAlias: { 0: 'bg' },
        events: { 0: {} }
    };
    state.maps.fromRaw(raw);
}

/**
 * 按固定种子把每个怪物格分配到一个模板并逐格写入真实怪物上下文，
 * 规模进种子是为了让各档规模的分配互不影响
 * @param state 顶层数据端状态
 * @param matrix 合并后的二维矩阵
 * @param mapCount 参与拼接的地图数量
 */
function placeMonsters(
    state: CoreState,
    matrix: number[][],
    mapCount: number
): number {
    const random = createRandom(PERF_SEED + mapCount);
    let count = 0;
    for (let y = 0; y < matrix.length; y++) {
        const row = matrix[y];
        for (let x = 0; x < row.length; x++) {
            if (row[x] !== MONSTER_TILE_CODE) continue;
            const index = Math.floor(random() * MONSTER_PORTFOLIO.length);
            const entry = MONSTER_PORTFOLIO[index];
            const enemy = state.enemyManager.createEnemy(entry.code);
            // 夹具完整性自检：模板缺失说明夹具本身坏了，与性能判据无关
            if (!enemy) {
                throw new Error(
                    '性能夹具：找不到怪物模板 ' + entry.code.toString()
                );
            }
            state.enemyContext.setEnemyAt({ x, y }, enemy);
            count++;
        }
    }
    return count;
}

/**
 * 测量一次用例：先预热若干次，再采样后取中位数、最小值与 p95，
 * 计时经 performance.mark / performance.measure 成对标记完成，
 * 采样后按名清理标记与测量
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

    // 必须先打标记再测量：对不存在的标记做 measure 会抛错；
    // 标记还必须逐样本清理，否则同名标记会被解析成首次位置而得到累计耗时
    const startTag = 'perf:' + caseName + ':' + scale + ':start';
    const endTag = 'perf:' + caseName + ':' + scale + ':end';
    const measureName = 'perf:' + caseName + ':' + scale;
    const samples: number[] = [];
    for (let i = 0; i < SAMPLE_RUNS; i++) {
        globalThis.performance.mark(startTag);
        run();
        globalThis.performance.mark(endTag);
        const measure = globalThis.performance.measure(
            measureName,
            startTag,
            endTag
        );
        samples.push(measure.duration);
        globalThis.performance.clearMarks(startTag);
        globalThis.performance.clearMarks(endTag);
        globalThis.performance.clearMeasures(measureName);
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
 * 构造一次测量的完整场景：真实装配的 CoreState + 合并尺寸 + 图块 + 模板 +
 * 勇士属性 + 地图注入 + 逐格放置怪物，最后先跑一轮全量构建清掉脏标记
 * @param mapCount 参与拼接的地图数量
 */
function createScenarioFixture(mapCount: number): IScenarioFixture {
    const matrix = buildMergedMap(mapCount);
    const width = matrix[0].length;
    const height = matrix.length;
    const state = createCoreState();
    // 必须在放置怪物之前覆盖 CoreState 默认的 13×13，否则合并坐标会算出越界索引
    state.enemyContext.resize(width, height);
    registerTiles(state);
    registerPrefabs(state);
    seedHero(state);
    injectMergedMap(state, matrix, width);
    const monsterCount = placeMonsters(state, matrix, mapCount);
    // 首轮构建不计时：清掉 needUpdate 后，采样内取计算后怪物才不会带上全量构建
    state.enemyContext.buildup();
    const hero = state.enemyContext.getBindedHero()!;
    const mapDamage = state.enemyContext.getMapDamage()!;
    const damageSystem = state.enemyContext.getDamageSystem()!;
    return {
        state,
        mapDamage,
        damageSystem,
        width,
        height,
        monsterCount,
        hero
    };
}

afterAll(() => {
    console.table(records);
    console.table(criticalRecords);
});

describe('真实大地图战斗场景性能', () => {
    for (const mapCount of MAP_SCALES) {
        // 覆盖前 N 张真实地图合并后的一次全量上下文构建
        it(`measures a buildup over ${mapCount} merged maps`, () => {
            const fixture = createScenarioFixture(mapCount);
            const label = String(mapCount) + '/' + String(fixture.monsterCount);

            measureCase('怪物上下文构建', label, () => {
                // 每样本先重新绑定勇士：bindHero 才会置 needUpdate，
                // 否则 buildup 在脏标记为假时直接早退，样本会退化成空转
                fixture.state.enemyContext.bindHero(fixture.hero);
                fixture.state.enemyContext.buildup();
            });
        });

        // 覆盖前 N 张真实地图合并后的一次地图伤害全量重建与逐怪消费
        it(`measures a map damage build over ${mapCount} merged maps`, () => {
            const fixture = createScenarioFixture(mapCount);
            const label = String(mapCount) + '/' + String(fixture.monsterCount);

            measureCase('地图伤害构建', label, () => {
                fixture.mapDamage.refreshAll();
                for (const entry of fixture.state.enemyContext.iterateEnemy()) {
                    fixture.mapDamage.getSeparatedDamage(entry[0]);
                    fixture.mapDamage.getReducedDamage(entry[0]);
                }
            });
        });

        // 覆盖前 N 张真实地图合并后，对全图每只怪各一次完整临界计算
        it(`measures critical over ${mapCount} merged maps`, () => {
            const fixture = createScenarioFixture(mapCount);
            const label = String(mapCount) + '/' + String(fixture.monsterCount);
            const record = measureCase('全图怪物单次临界计算', label, () => {
                for (const entry of fixture.state.enemyContext.iterateEnemy()) {
                    const view = entry[1];
                    for (const _critical of fixture.damageSystem.calculateCritical(
                        view,
                        'atk'
                    )) {
                        // 必须完整消费生成器，否则测不到临界二分枚举的真实开销
                    }
                }
            });

            // 同规模内怪物数是常量，故「中位总量 / 怪物数」即单怪平均耗时的中位数
            criticalRecords.push({
                case: '全图怪物单次临界计算',
                scale: label,
                monsters: fixture.monsterCount,
                'total ms': record['median ms'],
                'avg ms': Number(
                    (record['median ms'] / fixture.monsterCount).toFixed(3)
                )
            });
        });
    }
});
