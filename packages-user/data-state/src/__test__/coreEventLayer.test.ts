// 测试 MapState.fromRaw 对事件层的装配与静态矩阵参考基准一致性
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { IMapRawData } from '@user/data-common';
import { WebLoadStarter } from '@motajs/loader';
import { CoreState } from '../core';

function createRaw(floorId: string, offset: number): IMapRawData {
    return {
        floorId,
        width: 2,
        map: {
            0: [offset + 1, offset + 2],
            10: [offset + 3, offset + 4],
            20: [offset + 5, offset + 6],
            30: [offset + 7, offset + 8],
            40: [offset + 9, offset + 10]
        },
        layerAlias: {
            0: 'bg',
            10: 'bg2',
            20: 'event',
            30: 'fg',
            40: 'fg2'
        },
        events: {
            0: {},
            10: {},
            20: { 0: { 1: 'point-event' } },
            30: {},
            40: {}
        }
    };
}

beforeAll(() => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
});

describe('MapState.fromRaw event-layer assembly', () => {
    // 验证 fromRaw 按纵深顺序装配五个别名图层、选中事件层且静态矩阵与参考基准一致
    it('selects the event alias layer without changing map assembly', () => {
        const state = new CoreState({
            loadStarter: new WebLoadStarter(),
            coreURL: 'placeholder'
        });
        const floors = ['F1', 'F2'];
        state.maps.fromRaw(createRaw('F1', 0));
        state.maps.fromRaw(createRaw('F2', 10));

        expect(state.maps.maps).toEqual(floors);
        for (const id of floors) {
            const map = state.maps.getMap(id)!;
            const layers = [...map.layerList];
            expect(layers.map(layer => layer.alias)).toEqual([
                'bg',
                'bg2',
                'event',
                'fg',
                'fg2'
            ]);
            expect(layers.map(layer => layer.zIndex)).toEqual([
                0, 10, 20, 30, 40
            ]);
            expect(map.eventLayer).toBe(layers[2]);
            expect(map.eventLayer!.getPointEvent(0, 0)).toEqual(
                new Map([[1, 'point-event']])
            );
        }

        expect(
            [...state.maps.getMap('F1')!.layerList].map(layer => [
                ...layer.getMapData()
            ])
        ).toEqual([
            [1, 2],
            [3, 4],
            [5, 6],
            [7, 8],
            [9, 10]
        ]);

        state.maps.compareWith(
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
        for (const id of floors) {
            const map = state.maps.getMap(id)!;
            expect([...map.layerList].every(layer => !layer.dirty())).toBe(
                true
            );
        }
    });
});
