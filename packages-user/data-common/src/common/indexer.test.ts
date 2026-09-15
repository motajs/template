// 测试 L0 MapLocIndexer 的坐标与索引互转及地图宽度切换
import { describe, expect, it } from 'vitest';
import { MapLocIndexer } from './indexer';

/** 创建索引器并完成地图宽度设置 */
function createIndexer(width: number): MapLocIndexer {
    const indexer = new MapLocIndexer();
    indexer.setWidth(width);
    return indexer;
}

describe('MapLocIndexer', () => {
    // 验证坐标形式与定位符形式对同一位置返回一致的索引
    it('agrees between the coordinate and locator forms', () => {
        const indexer = createIndexer(5);

        expect(indexer.locToIndex(0, 0)).toBe(0);
        expect(indexer.locToIndex(2, 3)).toBe(17);
        expect(indexer.locaterToIndex({ x: 2, y: 3 })).toBe(17);
        expect(indexer.locaterToIndex({ x: 2, y: 3 })).toBe(
            indexer.locToIndex(2, 3)
        );
    });

    // 验证范围内索引可经 indexToLocator 与 locToIndex 无损往返
    it('round-trips every in-range index back to its locator', () => {
        const indexer = createIndexer(5);

        for (let index = 0; index < 20; index++) {
            const locator = indexer.indexToLocator(index);
            expect(indexer.locToIndex(locator.x, locator.y)).toBe(index);
            expect(indexer.locaterToIndex(locator)).toBe(index);
        }
    });

    // 验证扁平索引按宽度拆分为列与行（含行末与次行首）
    it('splits a flat index into its column and row', () => {
        const indexer = createIndexer(4);

        expect(indexer.indexToLocator(0)).toEqual({ x: 0, y: 0 });
        expect(indexer.indexToLocator(3)).toEqual({ x: 3, y: 0 });
        expect(indexer.indexToLocator(4)).toEqual({ x: 0, y: 1 });
        expect(indexer.indexToLocator(9)).toEqual({ x: 1, y: 2 });
    });

    // 验证 setWidth 改变行步长后，同一坐标映射到新索引
    it('changes the row stride after setWidth', () => {
        const indexer = createIndexer(4);

        expect(indexer.locToIndex(1, 2)).toBe(9);

        indexer.setWidth(10);

        expect(indexer.locToIndex(1, 2)).toBe(21);
        expect(indexer.indexToLocator(21)).toEqual({ x: 1, y: 2 });
    });
});
