import { describe, expect, it, vi } from 'vitest';
import { logger } from '@motajs/common';
import { TileStore } from '../tileStore';
import { ItemStore } from '../itemStore';
import { EnemyStore } from '../enemyStore';
import { ITileRawData, TileType } from '../types';

function createTile(
    num: number,
    id: string,
    events: Record<number, string> = {}
): ITileRawData {
    return {
        num,
        id,
        events,
        type: TileType.Terrain,
        pass: { onlyEvents: false, inPass: 0b1111, outPass: 0b1111 },
        eventPass: true
    };
}

describe('TileStore events-map contract', () => {
    // 验证图块注册时会保存并按优先级返回默认事件映射
    it('returns the default events map for a registered tile', () => {
        const store = new TileStore();
        store.addTile(createTile(1, 'floor', { 20: 'late', 10: 'early' }));

        expect(store.getEvent(1)).toEqual(
            new Map([
                [20, 'late'],
                [10, 'early']
            ])
        );
    });

    // 验证查询不存在的图块时返回安全的空事件映射
    it('returns an empty map for a missing tile', () => {
        const store = new TileStore();

        expect(store.getEvent(99)).toEqual(new Map());
        expect(store.getEvent(99).size).toBe(0);
    });

    // 验证图块 id、数字索引和完整数据查询保持一致
    it('keeps id and number indexes aligned with tile data', () => {
        const store = new TileStore();
        const tile = createTile(7, 'blue-wall', { 1: 'touch' });
        store.addTile(tile);

        expect(store.getData(7)).toBe(tile);
        expect(store.idToNumber('blue-wall')).toBe(7);
        expect(store.numberToId(7)).toBe('blue-wall');
        expect(store.num('blue-wall')).toBe(7);
        expect(store.num(7)).toBe(7);
        expect(store.id(7)).toBe('blue-wall');
        expect(store.id('blue-wall')).toBe('blue-wall');
    });

    // 验证按数字或 id 重复注册时旧图块及其事件映射都会被替换
    it('replaces tiles and event maps on number or id conflicts', () => {
        const store = new TileStore();
        store.addTile(createTile(1, 'first', { 1: 'first-event' }));
        store.addTile(createTile(1, 'second', { 2: 'second-event' }));

        expect(store.getData(1)?.id).toBe('second');
        expect(store.idToNumber('first')).toBeUndefined();
        expect(store.getEvent(1)).toEqual(new Map([[2, 'second-event']]));

        store.addTile(createTile(2, 'second', { 3: 'moved-event' }));

        expect(store.getData(1)).toBeNull();
        expect(store.numberToId(1)).toBeUndefined();
        expect(store.getEvent(1)).toEqual(new Map());
        expect(store.getData(2)?.id).toBe('second');
        expect(store.getEvent(2)).toEqual(new Map([[3, 'moved-event']]));
    });

    // 验证调用方修改返回映射不会写入 TileStore 的内部默认事件
    it('does not expose mutable internal event maps', () => {
        const store = new TileStore();
        store.addTile(createTile(3, 'safe-floor', { 4: 'original' }));

        const events = store.getEvent(3);
        const mutableEvents = events as Map<number, string>;
        mutableEvents.set(5, 'external');

        expect(store.getEvent(3)).toEqual(new Map([[4, 'original']]));
        expect(store.getEvent(3)).not.toBe(events);
    });

    // 验证按数字或 id 重复注册时分别告警码 133 与 134
    it('warns code 133 and 134 on number or id conflicts', () => {
        const store = new TileStore();
        const warn = vi.spyOn(logger, 'warn');

        store.addTile(createTile(1, 'first', { 1: 'first-event' }));
        store.addTile(createTile(1, 'second', { 2: 'second-event' }));
        store.addTile(createTile(2, 'second', { 3: 'moved-event' }));

        expect(warn).toHaveBeenCalledWith(133, '1', 'first');
        expect(warn).toHaveBeenCalledWith(134, 'second', '1');
    });
});

describe('ItemStore and EnemyStore duplicate registration', () => {
    // 验证道具存储重复注册同一图块数字时告警码 181 并由后写入覆盖
    it('warns code 181 when an item number is registered twice', () => {
        const store = new ItemStore<never>(new TileStore());
        const warn = vi.spyOn(logger, 'warn');
        const first = { num: 5 } as never;
        const second = { num: 5 } as never;

        store.addItem(first);
        store.addItem(second);

        expect(warn).toHaveBeenCalledWith(181, '5', 'item');
        expect(store.getData(5)).toBe(second);
    });

    // 验证怪物存储重复注册同一图块数字时告警码 181 并由后写入覆盖
    it('warns code 181 when an enemy number is registered twice', () => {
        const store = new EnemyStore<never>(new TileStore());
        const warn = vi.spyOn(logger, 'warn');
        const first = { num: 7, attribute: {}, special: {} } as never;
        const second = { num: 7, attribute: {}, special: {} } as never;

        store.addEnemy(first);
        store.addEnemy(second);

        expect(warn).toHaveBeenCalledWith(181, '7', 'enemy');
        expect(store.getEnemy(7)).toBe(second);
    });
});
