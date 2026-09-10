import { describe, expect, it } from 'vitest';
import { TileStore } from '@user/data-common';
import {
    LegacyTileData,
    TileLegacyBridge
} from '../src/legacy/tile';

describe('TileLegacyBridge events-map contract', () => {
    // 验证旧样板事件对象会转换为 TileStore 可消费的默认事件映射
    it('converts legacy events into the TileStore event map', () => {
        const bridge = new TileLegacyBridge();
        const store = new TileStore<LegacyTileData>();
        store.attachLegacyConverter(bridge);
        const legacy: LegacyTileData = {
            id: 'yellowWall',
            cls: 'terrains',
            events: { 10: 'onEnter', 20: 'onTouch' },
            noPass: true
        };

        const converted = store.fromLegacy(1, legacy);

        expect(converted.events).toEqual({ 10: 'onEnter', 20: 'onTouch' });
        expect(store.getEvent(1)).toEqual(
            new Map([
                [10, 'onEnter'],
                [20, 'onTouch']
            ])
        );
        expect(converted.eventPass).toBe(false);
        expect(converted).not.toHaveProperty('trigger');
    });

    // 验证旧样板缺少事件输入时仍生成合法的空事件映射
    it('uses an empty events map when legacy input has no events', () => {
        const bridge = new TileLegacyBridge();
        const legacy: LegacyTileData = {
            id: 'whiteWall',
            cls: 'terrains'
        };

        const converted = bridge.fromLegacy(2, legacy);

        expect(converted.events).toEqual({});
        expect(converted).not.toHaveProperty('trigger');
    });
});
