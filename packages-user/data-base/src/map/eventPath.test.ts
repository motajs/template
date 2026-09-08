import { beforeAll, describe, expect, it, vi } from 'vitest';

interface TestModules {
    MapState: typeof import('./mapState').MapState;
    TileStore: typeof import('@user/data-common').TileStore;
    RoleFaceBinder: typeof import('@user/data-common').RoleFaceBinder;
    logger: typeof import('@motajs/common').logger;
}

let modules: TestModules;

beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
    const mapModule = await import('./mapState');
    const commonModule = await import('@user/data-common');
    const loggerModule = await import('@motajs/common');
    modules = {
        MapState: mapModule.MapState,
        TileStore: commonModule.TileStore,
        RoleFaceBinder: commonModule.RoleFaceBinder,
        logger: loggerModule.logger
    };
});

function createRaw() {
    return {
        floorId: 'F1',
        width: 2,
        map: { 0: [1, 1, 1, 1] },
        layerAlias: { 0: 'event' },
        events: { 0: { 1: { 5: 'point-event' } } }
    };
}

function createMapState() {
    const tileStore = new modules.TileStore();
    const state = {
        tileStore,
        itemStore: {},
        mapStore: {},
        eventStore: {},
        roleFace: new modules.RoleFaceBinder(),
        faceManager: {},
        saveSystem: {}
    };
    return new modules.MapState(tileStore, state);
}

describe('MapState raw event path', () => {
    it('raw point events and event layer', () => {
        const mapState = createMapState();
        const map = mapState.fromRaw(createRaw());
        const layer = map?.eventLayer;

        expect(layer).toBe(map?.getLayerByAlias('event'));
        expect(layer?.getPointEvent(1, 0)).toEqual(
            new Map([[5, 'point-event']])
        );
        expect(layer?.getLocationData(1, 0)?.static.tileEvent().get()).toEqual(
            new Map()
        );
        expect(layer?.event(1, 0)?.dirty()).toBe(false);
    });
});
