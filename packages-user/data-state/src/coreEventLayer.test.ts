// 测试 CoreState legacy 地图初始化对 event layer 的绑定
import { beforeAll, describe, expect, it, vi } from 'vitest';

interface TestModules {
    CoreState: typeof import('./core').CoreState;
}

interface FakeLayer {
    zIndex: number;
    alias: string | null;
    map: Uint32Array | null;
    setZIndex(zIndex: number): void;
    setMapRef(map: Uint32Array): void;
}

interface FakeGameMap {
    readonly layers: FakeLayer[];
    eventLayer: FakeLayer | null;
    addLayer(): FakeLayer;
    setLayerAlias(layer: FakeLayer, alias: string): void;
    setEventLayer(layer: FakeLayer | null): void;
    setActiveStatus(active: boolean): void;
}

interface FakeMapState {
    readonly createdMaps: Map<string, FakeGameMap>;
    comparedWith: Map<string, Map<number, Uint32Array>> | null;
    createMap(id: string, width: number, height: number): FakeGameMap;
    compareWith(reference: Map<string, Map<number, Uint32Array>>): void;
}

interface LegacyFloor {
    readonly width: number;
    readonly height: number;
    readonly bgmap: number[][];
    readonly bg2map: number[][];
    readonly map: number[][];
    readonly fgmap: number[][];
    readonly fg2map: number[][];
}

interface CoreInitializer {
    maps: FakeMapState;
    initMapState(floors: string[], data: Record<string, LegacyFloor>): void;
}

vi.mock('./enemy', () => ({
    CommonAuraConverter: class {},
    EnemyLegacyBridge: class {},
    GuardAuraConverter: class {},
    MainDamageCalculator: class {},
    MainEnemyComparer: class {},
    MainEnemyFinalEffect: class {},
    MainMapDamageConverter: class {},
    MainMapDamageReducer: class {},
    registerSpecials: vi.fn()
}));

vi.mock('./legacy', () => ({
    ItemLegacyBridge: class {},
    TileLegacyBridge: class {}
}));

let modules: TestModules;

beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    const coreModule = await import('./core');
    modules = { CoreState: coreModule.CoreState };
});

function createFakeMapState(): FakeMapState {
    const createdMaps = new Map<string, FakeGameMap>();
    return {
        createdMaps,
        comparedWith: null,
        createMap(id, width, height) {
            const map: FakeGameMap = {
                layers: [],
                eventLayer: null,
                addLayer() {
                    const layer: FakeLayer = {
                        zIndex: 0,
                        alias: null,
                        map: new Uint32Array(width * height),
                        setZIndex(zIndex) {
                            layer.zIndex = zIndex;
                        },
                        setMapRef(map) {
                            layer.map = map;
                        }
                    };
                    map.layers.push(layer);
                    return layer;
                },
                setLayerAlias(layer, alias) {
                    layer.alias = alias;
                },
                setEventLayer(layer) {
                    map.eventLayer = layer;
                },
                setActiveStatus() {}
            };
            createdMaps.set(id, map);
            return map;
        },
        compareWith(reference) {
            this.comparedWith = reference;
        }
    };
}

function createFloor(offset: number): LegacyFloor {
    return {
        width: 2,
        height: 1,
        bgmap: [[offset + 1, offset + 2]],
        bg2map: [[offset + 3, offset + 4]],
        map: [[offset + 5, offset + 6]],
        fgmap: [[offset + 7, offset + 8]],
        fg2map: [[offset + 9, offset + 10]]
    };
}

describe('CoreState legacy event-layer initialization', () => {
    it('selects the event alias layer without changing map assembly', () => {
        const maps = createFakeMapState();
        const initializer = Object.create(
            modules.CoreState.prototype
        ) as CoreInitializer;
        initializer.maps = maps;

        const floors = ['F1', 'F2'];
        const data = { F1: createFloor(0), F2: createFloor(10) };
        initializer.initMapState(floors, data);

        expect([...maps.createdMaps.keys()]).toEqual(floors);
        for (const id of floors) {
            const map = maps.createdMaps.get(id)!;
            expect(map.layers.map(layer => layer.alias)).toEqual([
                'bg',
                'bg2',
                'event',
                'fg',
                'fg2'
            ]);
            expect(map.layers.map(layer => layer.zIndex)).toEqual([
                0, 10, 20, 30, 40
            ]);
            expect(map.eventLayer).toBe(map.layers[2]);
        }

        expect(
            maps.createdMaps.get('F1')!.layers.map(layer => layer.map)
        ).toEqual([
            new Uint32Array([1, 2]),
            new Uint32Array([3, 4]),
            new Uint32Array([5, 6]),
            new Uint32Array([7, 8]),
            new Uint32Array([9, 10])
        ]);
        expect(maps.comparedWith).toEqual(
            new Map([
                [
                    'F1',
                    new Map([
                        [0, new Uint32Array([1, 2])],
                        [10, new Uint32Array([3, 4])],
                        [20, new Uint32Array([5, 6])],
                        [30, new Uint32Array([7, 8])],
                        [40, new Uint32Array([9, 10])]
                    ])
                ],
                [
                    'F2',
                    new Map([
                        [0, new Uint32Array([11, 12])],
                        [10, new Uint32Array([13, 14])],
                        [20, new Uint32Array([15, 16])],
                        [30, new Uint32Array([17, 18])],
                        [40, new Uint32Array([19, 20])]
                    ])
                ]
            ])
        );
    });
});
