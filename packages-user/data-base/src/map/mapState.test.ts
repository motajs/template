// 测试 MapState 的楼层注册、原始数据校验、激活/分区与参考基准比较
import { afterAll, describe, expect, it, vi } from 'vitest';
import {
    type IDataCommon,
    type IMapRawData,
    type ITileRawData,
    Dir8FaceHandler,
    FaceGroup,
    FaceManager,
    RoleFaceBinder,
    TileStore,
    TileType
} from '@user/data-common';
import { DirectionMapper, logger } from '@motajs/common';
import { MapState } from './mapState';

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

/**
 * 构造一条最小图块原始数据
 * @param num 图块数字
 * @param id 图块字符串 id
 * @param events 默认事件映射
 */
function createTileData(
    num: number,
    id: string,
    events: Record<number, string> = {}
): ITileRawData {
    return {
        num,
        id,
        events,
        type: TileType.Terrain,
        pass: { onlyEvents: false, outPass: 15, inPass: 15 },
        eventPass: true
    };
}

/** 构造一个可用的 MapState 及其底层公共层对象 */
function createFixture(): MapState {
    const tileStore = new TileStore();
    tileStore.addTile(createTileData(1, 'base', { 10: 'base-event' }));
    tileStore.addTile(
        createTileData(2, 'alternate', { 20: 'alternate-event' })
    );
    const faceManager = new FaceManager();
    faceManager.register(FaceGroup.Dir8, new Dir8FaceHandler());
    const state: IDataCommon = {
        tileStore,
        itemStore: {},
        mapStore: {},
        eventStore: {},
        roleFace: new RoleFaceBinder(),
        faceManager,
        directionMapper: new DirectionMapper(),
        saveSystem: {}
    } as never;
    return new MapState(tileStore, state);
}

/** 构造一份合法的楼层原始数据 */
function createRaw(): IMapRawData {
    return {
        floorId: 'F1',
        width: 2,
        map: { 0: [1, 2, 1, 2] },
        layerAlias: { 0: 'event' },
        events: { 0: { 1: { 5: 'point-event' } } }
    };
}

describe('MapState floor registration', () => {
    // 验证 createMap 注册楼层、重复注册告警 121 并覆盖旧实例
    it('registers floors and warns 121 when the floor already exists', () => {
        const mapState = createFixture();

        const first = mapState.createMap('F1', 2, 2);
        expect(mapState.getMap('F1')).toBe(first);
        expect(mapState.maps).toEqual(['F1']);
        expect(mapState.getMap('unknown')).toBeNull();

        const repeated = logger.catch(() => mapState.createMap('F1', 2, 2));
        expect(repeated.info.map(info => info.code)).toContain(121);
        expect(mapState.getMap('F1')).not.toBe(first);
        expect(mapState.maps).toEqual(['F1']);
    });

    // 验证 createMap 创建的地图可直接写入并读取图层、块、点事件与事件层绑定
    it('generates and reads content on a map created by createMap', () => {
        const mapState = createFixture();
        const map = mapState.createMap('F1', 2, 2);
        const layer = map.addLayer();
        map.setLayerAlias(layer, 'event');
        map.setEventLayer(layer);
        layer.setBlock(5, 0, 0);
        layer.setZIndex(0);
        layer.event(1, 0)!.set(9, 'gen-event');

        expect(mapState.getMap('F1')).toBe(map);
        expect(map.getLayerByAlias('event')).toBe(layer);
        expect(map.eventLayer).toBe(layer);
        expect(layer.getBlock(0, 0)).toBe(5);
        expect(layer.getBlock(1, 0)).toBe(0);
        expect(layer.event(1, 0)!.get()).toEqual(new Map([[9, 'gen-event']]));
        expect(map.dirty()).toBe(true);
    });

    // 验证 setMapList 去重并保持传入顺序
    it('stores a de-duplicated ordered floor list', () => {
        const mapState = createFixture();

        mapState.setMapList(['A', 'B', 'A', 'C']);

        expect(mapState.maps).toEqual(['A', 'B', 'C']);
    });

    // 验证 fromRaw 构建楼层、绑定事件层与点事件，并默认处于未激活
    it('builds a floor, binds the event layer and stays inactive by default', () => {
        const mapState = createFixture();

        const map = mapState.fromRaw(createRaw());

        expect(map).not.toBeNull();
        const layer = map!.getLayerByAlias('event');
        expect(layer).not.toBeNull();
        expect(map!.eventLayer).toBe(layer);
        expect(layer!.getPointEvent(1, 0)).toEqual(
            new Map([[5, 'point-event']])
        );
        expect(map!.active).toBe(false);
        expect(mapState.isMapActive('F1')).toBe(false);
        expect(mapState.getActiveMap('F1')).toBeNull();
        expect(mapState.getMap('F1')).toBe(map);
    });
});

describe('MapState raw validation codes', () => {
    interface MalformedCase {
        name: string;
        mutate(raw: IMapRawData): void;
        code: number;
    }

    const cases: MalformedCase[] = [
        {
            name: 'unequal layer lengths',
            mutate: raw => {
                Reflect.set(raw, 'map', {
                    0: [1, 1, 1, 1],
                    1: [1, 1, 1]
                });
                Reflect.set(raw, 'layerAlias', { 0: 'a', 1: 'b' });
                Reflect.set(raw, 'events', { 0: {}, 1: {} });
            },
            code: 60
        },
        {
            name: 'area not divisible by width',
            mutate: raw => {
                Reflect.set(raw, 'map', { 0: [1, 1, 1, 1, 1] });
                Reflect.set(raw, 'layerAlias', { 0: 'a' });
                Reflect.set(raw, 'events', { 0: {} });
            },
            code: 61
        },
        {
            name: 'non-numeric map layer key',
            mutate: raw => Reflect.set(raw.map, 'bad', [1, 2, 1, 2]),
            code: 62
        },
        {
            name: 'non-numeric event priority',
            mutate: raw => Reflect.set(raw.events[0][1], 'bad', 'event'),
            code: 62
        },
        {
            name: 'missing map container',
            mutate: raw => Reflect.set(raw, 'map', null),
            code: 63
        },
        {
            name: 'missing events container',
            mutate: raw => Reflect.set(raw, 'events', null),
            code: 63
        },
        {
            name: 'missing alias container',
            mutate: raw => Reflect.set(raw, 'layerAlias', null),
            code: 63
        },
        {
            name: 'invalid width',
            mutate: raw => Reflect.set(raw, 'width', 0),
            code: 64
        },
        {
            name: 'non-integer map value',
            mutate: raw => Reflect.set(raw.map, '0', [1, 1, 1.5, 1]),
            code: 64
        },
        {
            name: 'non-string layer alias',
            mutate: raw => Reflect.set(raw.layerAlias, '0', 3),
            code: 64
        },
        {
            name: 'out of range event position',
            mutate: raw => Reflect.set(raw.events[0], '4', { 5: 'event' }),
            code: 64
        },
        {
            name: 'non-string event id',
            mutate: raw => Reflect.set(raw.events[0][1], '5', 3),
            code: 64
        },
        {
            name: 'event layer without map layer',
            mutate: raw => Reflect.set(raw.events, '9', {}),
            code: 64
        }
    ];

    it.each(cases)('$name is rejected with code $code', testCase => {
        const mapState = createFixture();
        const raw = createRaw();
        testCase.mutate(raw);

        const result = logger.catch(() => mapState.fromRaw(raw));

        expect(result.ret).toBeNull();
        expect(result.info.map(info => info.code)).toContain(testCase.code);
        expect(mapState.getMap('F1')).toBeNull();
    });
});

describe('MapState activation and areas', () => {
    // 验证激活状态切换、getActiveMap 与三类迭代器
    it('toggles activation and iterates active and inactive floors', () => {
        const mapState = createFixture();
        const first = mapState.createMap('F1', 2, 2);
        const second = mapState.createMap('F2', 2, 2);

        mapState.setMapActiveStatus('F1', true);

        expect(mapState.isMapActive('F1')).toBe(true);
        expect(mapState.getActiveMap('F1')).toBe(first);
        expect(mapState.getActiveMap('F2')).toBeNull();
        expect([...mapState.iterateActiveMaps()]).toEqual([['F1', first]]);
        expect([...mapState.iterateInactiveMaps()]).toEqual([['F2', second]]);
        expect([...mapState.iterateAllMaps()]).toEqual([
            ['F1', first],
            ['F2', second]
        ]);

        mapState.setMapActiveStatus('unknown', true);
        expect(mapState.isMapActive('unknown')).toBe(false);
    });

    // 验证按分区批量激活与取消激活
    it('activates and deactivates every floor of an area', () => {
        const mapState = createFixture();
        mapState.createMap('A', 2, 2);
        mapState.createMap('B', 2, 2);
        mapState.createMap('C', 2, 2);
        mapState.createMap('D', 2, 2);
        mapState.setMapList(['A', 'B', 'C', 'D']);
        mapState.setArea(new Set([[{ start: 0, end: 1 }]]));

        mapState.activeArea('B');
        expect(mapState.isMapActive('A')).toBe(true);
        expect(mapState.isMapActive('B')).toBe(true);
        expect(mapState.isMapActive('C')).toBe(false);

        mapState.deactiveArea('A');
        expect(mapState.isMapActive('A')).toBe(false);
        expect(mapState.isMapActive('B')).toBe(false);

        mapState.activeArea('unknown');
        expect(mapState.isMapActive('C')).toBe(false);
    });

    // 验证自动分区激活器进入新分区时切换激活集
    it('switches the active area when the automator enters another floor', () => {
        const mapState = createFixture();
        mapState.createMap('A', 2, 2);
        mapState.createMap('B', 2, 2);
        mapState.setMapList(['A', 'B']);
        mapState.setArea(
            new Set([[{ start: 0, end: 0 }], [{ start: 1, end: 1 }]])
        );

        mapState.notifyEnterFloor('A');
        expect(mapState.isMapActive('A')).toBe(false);

        mapState.useAutoActivitor(true);
        mapState.notifyEnterFloor('A');
        expect(mapState.isMapActive('A')).toBe(true);

        mapState.notifyEnterFloor('B');
        expect(mapState.isMapActive('A')).toBe(false);
        expect(mapState.isMapActive('B')).toBe(true);

        mapState.useAutoActivitor(false);
        mapState.notifyEnterFloor('A');
        expect(mapState.isMapActive('A')).toBe(false);
    });
});

describe('MapState reference comparison', () => {
    // 验证 compareWith 对缺失楼层标记为脏，且对已有楼层按参考数组判定
    it('marks missing floors dirty and compares registered floors', () => {
        const mapState = createFixture();
        const map = mapState.fromRaw(createRaw())!;

        mapState.compareWith(new Map());
        expect(map.dirty()).toBe(true);

        const compared = createFixture();
        compared.fromRaw(createRaw());
        compared.compareWith(
            new Map([['F1', new Map([[0, new Uint32Array([1, 2, 1, 2])]])]])
        );
        expect(compared.getMap('F1')!.dirty()).toBe(false);
    });

    // 验证 compareWith 只生效一次，之后创建的新楼层直接视为全脏
    it('applies the reference once and marks later floors dirty', () => {
        const mapState = createFixture();
        mapState.compareWith(new Map());

        const late = mapState.createMap('F9', 2, 2);

        expect(late.dirty()).toBe(true);
    });

    // 验证不活跃楼层不会被活跃判定选中，供通行谓词侧读取事件层
    it('exposes the active floor event layer for pass predicates', () => {
        const mapState = createFixture();
        const map = mapState.fromRaw(createRaw())!;
        const activeLayer = () =>
            mapState.getActiveMap('F1')?.eventLayer ?? null;

        expect(activeLayer()).toBeNull();
        mapState.setMapActiveStatus('F1', true);
        expect(activeLayer()).toBe(map.eventLayer);
    });
});
