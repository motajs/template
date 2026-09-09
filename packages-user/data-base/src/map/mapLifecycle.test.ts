import { beforeAll, describe, expect, it, vi } from 'vitest';

interface TestModules {
    MapState: typeof import('./mapState').MapState;
    TileStore: typeof import('@user/data-common').TileStore;
    RoleFaceBinder: typeof import('@user/data-common').RoleFaceBinder;
    FaceManager: typeof import('@user/data-common').FaceManager;
    Dir8FaceHandler: typeof import('@user/data-common').Dir8FaceHandler;
    SaveCompression: typeof import('@user/data-common').SaveCompression;
}

let modules: TestModules;

beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    const mapModule = await import('./mapState');
    const commonModule = await import('@user/data-common');
    modules = {
        MapState: mapModule.MapState,
        TileStore: commonModule.TileStore,
        RoleFaceBinder: commonModule.RoleFaceBinder,
        FaceManager: commonModule.FaceManager,
        Dir8FaceHandler: commonModule.Dir8FaceHandler,
        SaveCompression: commonModule.SaveCompression
    };
});

function createMapState(
    pointEvents: Record<number, Record<number, string>> = {},
    blocks: number[] = [1, 1, 1, 1]
) {
    const tileStore = new modules.TileStore();
    tileStore.addTile({
        num: 1,
        id: 'base',
        events: { 10: 'base-event' },
        type: 0,
        pass: { onlyEvents: false, outPass: 15, inPass: 15 },
        eventPass: true
    });
    tileStore.addTile({
        num: 2,
        id: 'alternate',
        events: { 20: 'alternate-event' },
        type: 0,
        pass: { onlyEvents: false, outPass: 15, inPass: 15 },
        eventPass: true
    });
    const faceManager = new modules.FaceManager();
    faceManager.register(1, new modules.Dir8FaceHandler());
    const state = {
        tileStore,
        itemStore: {},
        mapStore: {},
        eventStore: {},
        roleFace: new modules.RoleFaceBinder(),
        faceManager,
        saveSystem: {}
    };
    const mapState = new modules.MapState(tileStore, state);
    const map = mapState.fromRaw({
        floorId: 'F1',
        width: 2,
        map: { 0: blocks },
        layerAlias: { 0: 'event' },
        events: { 0: pointEvents }
    });
    return { map: map!, layer: map!.getLayerByAlias('event')! };
}

describe('MapLayer tile defaults snapshots conversion and movement', () => {
    it('tile defaults snapshots conversion and movement', () => {
        const { layer } = createMapState();
        const staticTile = layer.getTile(0, 0)!;
        expect(staticTile.tileEvent().get()).toEqual(
            new Map([[10, 'base-event']])
        );
        expect(staticTile.tileEvent().dirty()).toBe(false);

        staticTile.set(2);
        expect(staticTile.tileEvent().get()).toEqual(
            new Map([[20, 'alternate-event']])
        );
        expect(staticTile.tileEvent().dirty()).toBe(false);

        const dynamicTile = layer.createDynamic(1, 1, 0);
        expect(dynamicTile.tileEvent().get()).toEqual(
            new Map([[10, 'base-event']])
        );
        dynamicTile.set(2);
        expect(dynamicTile.tileEvent().get()).toEqual(
            new Map([[20, 'alternate-event']])
        );
        expect(dynamicTile.tileEvent().dirty()).toBe(false);

        const cleanSave = dynamicTile.saveState();
        expect(cleanSave.events).toBeUndefined();
        dynamicTile.loadState(cleanSave);
        expect(dynamicTile.tileEvent().get()).toEqual(
            new Map([[20, 'alternate-event']])
        );
        expect(dynamicTile.tileEvent().dirty()).toBe(false);

        dynamicTile.tileEvent().set(30, 'override-event');
        const overrideSave = dynamicTile.saveState();
        const savedEvents = new Map(overrideSave.events!);
        dynamicTile.tileEvent().set(30, 'changed-after-save');
        expect(overrideSave.events).toEqual(savedEvents);
        dynamicTile.loadState(overrideSave);
        expect(dynamicTile.tileEvent().get()).toEqual(
            new Map([
                [20, 'alternate-event'],
                [30, 'override-event']
            ])
        );
        expect(dynamicTile.tileEvent().dirty()).toBe(true);

        staticTile.set(1);
        const discardDynamic = layer.transferToDynamic(0, 0)!;
        discardDynamic.tileEvent().set(30, 'discarded-event');
        const restoredStatic = layer.transferToStatic(discardDynamic, false)!;
        expect(restoredStatic.tileEvent().get()).toEqual(
            new Map([[10, 'base-event']])
        );
        expect(restoredStatic.tileEvent().dirty()).toBe(false);

        const keptDynamic = layer.transferToDynamic(1, 0)!;
        keptDynamic.tileEvent().set(30, 'kept-event');
        const keptStatic = layer.transferToStatic(keptDynamic, true)!;
        expect(keptStatic.tileEvent().get()).toEqual(
            new Map([
                [10, 'base-event'],
                [30, 'kept-event']
            ])
        );
        expect(keptStatic.tileEvent().dirty()).toBe(true);

        const point = layer.event(0, 1)!;
        point.set(5, 'point-event');
        point.markPure();
        layer.getPointEvent(0, 1);
        const moving = layer.transferToDynamic(0, 1)!;
        moving.setPos(1, 1);
        expect(layer.getPointEvent(0, 1)).toEqual(
            new Map([[5, 'point-event']])
        );
        expect(layer.getPointEvent(1, 1)).toEqual(new Map());
    });
});

describe('MapLayer point event lifecycle', () => {
    it('point event lifecycle', () => {
        const { layer } = createMapState({ 1: { 5: 'raw-point' } });
        const point = layer.event(1, 0)!;
        expect(point.dirty()).toBe(false);

        point.set(7, 'runtime-point');
        expect(layer.dirty()).toBe(true);
        point.delete(7);
        expect(point.dirty()).toBe(false);
        point.set(5, 'changed-point');
        expect(point.dirty()).toBe(true);
        point.set(5, 'raw-point');
        expect(point.dirty()).toBe(false);
        point.clear();
        expect(point.dirty()).toBe(true);
        point.set(5, 'raw-point');
        expect(point.dirty()).toBe(false);

        const compressionLevels = [
            modules.SaveCompression.NoCompression,
            modules.SaveCompression.LowCompression,
            modules.SaveCompression.HighCompression
        ];
        for (const compression of compressionLevels) {
            point.set(7, 'saved-point');
            const save = layer.saveState(compression);
            expect(save.pointEvents?.get(1)).toEqual(
                new Map([
                    [5, 'raw-point'],
                    [7, 'saved-point']
                ])
            );
            point.set(7, 'changed-after-save');
            layer.loadState(save, compression);
            expect(point.get()).toEqual(
                new Map([
                    [5, 'raw-point'],
                    [7, 'saved-point']
                ])
            );
            expect(point.dirty()).toBe(true);
            point.set(8, 'after-load');
            expect(save.pointEvents?.get(1)).toEqual(
                new Map([
                    [5, 'raw-point'],
                    [7, 'saved-point']
                ])
            );
            point.delete(8);
        }

        point.set(8, 'runtime-only');
        layer.loadState(
            {
                width: 2,
                height: 2,
                fullMap: new Uint32Array([1, 1, 1, 1])
            },
            modules.SaveCompression.NoCompression
        );
        expect(point.get()).toEqual(new Map([[5, 'raw-point']]));
        expect(point.dirty()).toBe(false);
    });

    it('map saves layers containing only point events', () => {
        const { map, layer } = createMapState({}, [0, 0, 0, 0]);
        layer.setZIndex(7);
        const point = layer.event(1, 0)!;

        expect(layer.dirty()).toBe(false);
        point.set(7, 'point-only');
        expect(layer.dirty()).toBe(true);

        const compressionLevels = [
            modules.SaveCompression.LowCompression,
            modules.SaveCompression.HighCompression
        ];
        for (const compression of compressionLevels) {
            const save = map.saveState(compression);
            const layerSave = save.layers.get(7);
            expect(layerSave).toBeDefined();
            expect(layerSave?.fullMap).toBeUndefined();
            expect(layerSave?.rows).toBeUndefined();
            expect(layerSave?.staticBlocks?.size).toBe(0);
            expect(layerSave?.dynamicBlocks?.size).toBe(0);
            expect(layerSave?.pointEvents).toEqual(
                new Map([[1, new Map([[7, 'point-only']])]])
            );
        }
    });

    it('resize preserves in-range point events and resize2 clears them', () => {
        const { layer } = createMapState({
            0: { 1: 'top-left' },
            3: { 1: 'bottom-right' }
        });
        layer.resize(1, 1);
        expect(layer.getPointEvent(0, 0)).toEqual(new Map([[1, 'top-left']]));
        expect(layer.getPointEvent(1, 1)).toBeNull();

        layer.resize2(1, 1);
        expect(layer.getPointEvent(0, 0)).toEqual(new Map());
    });
});
