// 测试 raw 地图事件校验、点事件加载和 event layer 绑定
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
    type IDataCommon,
    type IMapRawData,
    type ITileStore
} from '@user/data-common';

interface TestModules {
    MapState: typeof import('../mapState').MapState;
    TileStore: typeof import('@user/data-common').TileStore;
    RoleFaceBinder: typeof import('@user/data-common').RoleFaceBinder;
    logger: typeof import('@motajs/common').logger;
}

let modules: TestModules;

beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
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
    const mapModule = await import('../mapState');
    const commonModule = await import('@user/data-common');
    const loggerModule = await import('@motajs/common');
    modules = {
        MapState: mapModule.MapState,
        TileStore: commonModule.TileStore,
        RoleFaceBinder: commonModule.RoleFaceBinder,
        logger: loggerModule.logger
    };
});

function createRaw(): IMapRawData {
    return {
        floorId: 'F1',
        width: 2,
        map: { 0: [1, 1, 1, 1] },
        layerAlias: { 0: 'event' },
        events: { 0: { 1: { 5: 'point-event' } } }
    };
}

function createMapState() {
    const tileStore: ITileStore = new modules.TileStore() as never;
    const state: IDataCommon = {
        tileStore,
        itemStore: {},
        mapStore: {},
        eventStore: {},
        roleFace: new modules.RoleFaceBinder(),
        faceManager: {},
        saveSystem: {}
    } as never;
    return new modules.MapState(state);
}

describe('MapState raw event path', () => {
    // 验证 raw.events 能绑定到点事件视图，并选择 alias=event 的图层
    it('raw point events and event layer', () => {
        const mapState = createMapState();
        const map = mapState.fromRaw(createRaw());
        const layer = map?.eventLayer;

        expect(layer).toBe(
            [...map!.layerList].find(item => item.alias === 'event')
        );
        expect(layer?.getPointEvent(1, 0)).toEqual(
            new Map([[5, 'point-event']])
        );
        expect(layer?.event(1, 0)?.ref()).toEqual(
            new Map([[5, 'point-event']])
        );
        expect(layer?.getLocationData(1, 0)?.static?.tileEvent().get()).toEqual(
            new Map()
        );
        expect(layer?.event(1, 0)?.dirty()).toBe(false);
    });
});

describe('MapState malformed raw event structures', () => {
    interface MalformedCase {
        name: string;
        mutate(raw: IMapRawData): void;
    }

    // 62/63/64 校验已从 shipped fromRaw 移除，事件结构按宽松语义接受
    const cases: MalformedCase[] = [
        {
            name: 'non-object event position container',
            mutate: raw => Reflect.set(raw.events[0], '1', [])
        },
        {
            name: 'non-string event id',
            mutate: raw => Reflect.set(raw.events[0][1], '5', 3)
        }
    ];

    it.each(cases)('$name is accepted leniently', testCase => {
        const mapState = createMapState();
        const raw = createRaw();
        testCase.mutate(raw);

        const result = modules.logger.catch(() => mapState.fromRaw(raw));

        expect(result.ret).not.toBeNull();
        expect(mapState.getMap(raw.floorId)).toBe(result.ret);
    });
});
