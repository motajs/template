import { clamp } from 'lodash-es';
import {
    IChunkData,
    IChunkIndex,
    IChunkInfo,
    IBlockSplitter,
    IChunkSplitterConfig
} from './types';
import { ISearchable8Dir } from '@motajs/common';

export class BlockSplitter<T> implements IBlockSplitter<T> {
    chunkWidth: number = 0;
    chunkHeight: number = 0;
    elWidth: number = 0;
    elHeight: number = 0;
    width: number = 1;
    height: number = 1;

    /** 分块映射 */
    readonly blockMap: Map<number, IChunkData<T>> = new Map();

    /** 数据宽度配置 */
    private splitDataWidth: number = 0;
    /** 数据高度配置 */
    private splitDataHeight: number = 0;
    /** 单个分块的宽度配置 */
    private splitBlockWidth: number = 0;
    /** 单个分块的高度配置 */
    private splitBlockHeight: number = 0;

    /**
     * 检查坐标范围
     * @param x 分块横坐标
     * @param y 分块纵坐标
     */
    private checkLocRange(x: number, y: number) {
        return x >= 0 && y >= 0 && x < this.width && y < this.height;
    }

    getChunkByLoc(x: number, y: number): IChunkData<T> | null {
        if (!this.checkLocRange(x, y)) return null;
        const index = y * this.width + x;
        return this.blockMap.get(index) ?? null;
    }

    getChunkByIndex(index: number): IChunkData<T> | null {
        return this.blockMap.get(index) ?? null;
    }

    setChunkByLoc(data: T, x: number, y: number): IChunkData<T> | null {
        if (!this.checkLocRange(x, y)) return null;
        const index = y * this.width + x;
        const block = this.blockMap.get(index);
        if (!block) return null;
        block.data = data;
        return block;
    }

    setChunkByIndex(data: T, index: number): IChunkData<T> | null {
        const block = this.blockMap.get(index);
        if (!block) return null;
        block.data = data;
        return block;
    }

    *iterateElementsOfChunk(
        x: number,
        y: number
    ): Generator<IChunkIndex, void> {
        if (!this.checkLocRange(x, y)) return;
        const index = y * this.width + x;
        yield* this.iterateElementsOfChunkIndex(index);
    }

    *iterateElementsOfChunkIndex(index: number): Generator<IChunkIndex, void> {
        const block = this.blockMap.get(index);
        if (!block) return;
        const startX = block.x * this.chunkWidth;
        const startY = block.y * this.chunkHeight;
        const endX = startX + block.width;
        const endY = startY + block.height;
        for (let ny = startY; ny < endY; ny++) {
            for (let nx = startX; nx < endX; nx++) {
                const index: IChunkIndex = {
                    x: nx,
                    y: ny,
                    elX: nx * this.chunkWidth,
                    elY: ny * this.chunkHeight,
                    index: ny * this.elWidth + nx
                };
                yield index;
            }
        }
    }

    *iterateElementsOfChunks(
        indices: Iterable<number>
    ): Generator<IChunkIndex, void> {
        for (const index of indices) {
            yield* this.iterateElementsOfChunkIndex(index);
        }
    }

    iterateChunks(): Iterable<IChunkData<T>> {
        return this.blockMap.values();
    }

    *iterateChunksOfElementArea(
        x: number,
        y: number,
        width: number,
        height: number
    ): Generator<IChunkData<T>> {
        const r = this.width - 1;
        const b = this.height - 1;
        const rx = x + width;
        const by = y + height;
        const left = clamp(Math.floor(x / this.chunkWidth), 0, r);
        const top = clamp(Math.floor(y / this.chunkHeight), 0, b);
        const right = clamp(Math.floor(rx / this.chunkWidth), 0, r);
        const bottom = clamp(Math.floor(by / this.chunkHeight), 0, b);
        for (let ny = left; ny <= right; ny++) {
            for (let nx = top; nx <= bottom; nx++) {
                const index = ny * this.width + nx;
                const block = this.blockMap.get(index);
                if (!block) continue;
                yield block;
            }
        }
    }

    getChunkIndexByLoc(x: number, y: number): number {
        if (!this.checkLocRange(x, y)) return -1;
        return y * this.width + x;
    }

    getChunkLocByIndex(index: number): Loc | null {
        if (index >= this.width * this.height) return null;
        return {
            x: index % this.width,
            y: Math.floor(index / this.width)
        };
    }

    getChunkIndicesByLocList(list: Iterable<Loc>): Iterable<number> {
        const res: number[] = [];
        for (const { x, y } of list) {
            res.push(this.getChunkIndexByLoc(x, y));
        }
        return res;
    }

    getChunkLocByIndices(list: Iterable<number>): Iterable<Loc | null> {
        const res: (Loc | null)[] = [];
        for (const index of list) {
            res.push(this.getChunkLocByIndex(index));
        }
        return res;
    }

    getChunkByElementLoc(x: number, y: number): IChunkData<T> | null {
        const bx = Math.floor(x / this.chunkWidth);
        const by = Math.floor(y / this.chunkHeight);
        if (!this.checkLocRange(bx, by)) return null;
        const index = by * this.width + bx;
        return this.blockMap.get(index) ?? null;
    }

    getChunkByElementIndex(index: number): IChunkData<T> | null {
        const x = index % this.elWidth;
        const y = Math.floor(index / this.elWidth);
        return this.getChunkByElementLoc(x, y);
    }

    getIndicesByDataLocList(list: Iterable<Loc>): Set<number> {
        const res = new Set<number>();
        for (const { x, y } of list) {
            const bx = Math.floor(x / this.chunkWidth);
            const by = Math.floor(y / this.chunkHeight);
            if (!this.checkLocRange(bx, by)) continue;
            res.add(bx + by * this.width);
        }
        return res;
    }

    getChunkIndicesByElementIndices(list: Iterable<number>): Set<number> {
        const res = new Set<number>();
        for (const index of list) {
            const x = index % this.elWidth;
            const y = Math.floor(index / this.elWidth);
            const bx = Math.floor(x / this.chunkWidth);
            const by = Math.floor(y / this.chunkHeight);
            if (!this.checkLocRange(bx, by)) continue;
            res.add(bx + by * this.width);
        }
        return res;
    }

    getChunksByElementLocList(list: Iterable<Loc>): Set<IChunkData<T>> {
        const res = new Set<IChunkData<T>>();
        for (const { x, y } of list) {
            const bx = Math.floor(x / this.chunkWidth);
            const by = Math.floor(y / this.chunkHeight);
            if (!this.checkLocRange(bx, by)) continue;
            const index = bx + by * this.width;
            const data = this.blockMap.get(index);
            if (data) res.add(data);
        }
        return res;
    }

    getChunksByElementIndices(list: Iterable<number>): Set<IChunkData<T>> {
        const res = new Set<IChunkData<T>>();
        for (const index of list) {
            const x = index % this.elWidth;
            const y = Math.floor(index / this.elWidth);
            const bx = Math.floor(x / this.chunkWidth);
            const by = Math.floor(y / this.chunkHeight);
            if (!this.checkLocRange(bx, by)) continue;
            const blockIndex = bx + by * this.width;
            const data = this.blockMap.get(blockIndex);
            if (data) res.add(data);
        }
        return res;
    }

    configSplitter(config: IChunkSplitterConfig): void {
        this.splitDataWidth = config.elWidth;
        this.splitDataHeight = config.elHeight;
        this.splitBlockWidth = config.chunkWidth;
        this.splitBlockHeight = config.chunkHeight;
    }

    private mapBlock(
        x: number,
        y: number,
        realWidth: number,
        width: number,
        height: number,
        fn: (block: IChunkInfo) => T
    ) {
        const index = y * realWidth + x;
        const block: IChunkInfo = {
            index,
            x,
            y,
            elX: x * this.chunkWidth,
            elY: y * this.chunkHeight,
            width,
            height
        };
        const data = fn(block);
        const blockData = new SplittedBlockData(this, block, data);
        this.blockMap.set(index, blockData);
    }

    splitChunks(mapFn: (block: IChunkInfo) => T): void {
        this.blockMap.clear();
        this.chunkWidth = this.splitBlockWidth;
        this.chunkHeight = this.splitBlockHeight;
        this.elWidth = this.splitDataWidth;
        this.elHeight = this.splitDataHeight;
        const restX = this.splitDataWidth % this.splitBlockWidth;
        const restY = this.splitDataHeight % this.splitBlockHeight;
        const width = Math.floor(this.splitDataWidth / this.splitBlockWidth);
        const height = Math.floor(this.splitDataHeight / this.splitBlockHeight);
        const hasXRest = restX > 0;
        const hasYRest = restY > 0;
        const realWidth = hasXRest ? width + 1 : width;
        const bw = this.chunkWidth;
        const bh = this.chunkHeight;
        this.width = realWidth;
        this.height = hasYRest ? height + 1 : height;
        for (let ny = 0; ny < height; ny++) {
            for (let nx = 0; nx < width; nx++) {
                this.mapBlock(nx, ny, realWidth, bw, bh, mapFn);
            }
        }
        if (hasXRest) {
            for (let ny = 0; ny < height; ny++) {
                this.mapBlock(width, ny, realWidth, restX, bh, mapFn);
            }
        }
        if (hasYRest) {
            for (let nx = 0; nx < width; nx++) {
                this.mapBlock(nx, height, realWidth, bw, restY, mapFn);
            }
        }
        if (hasXRest && hasYRest) {
            this.mapBlock(width, height, realWidth, restX, restY, mapFn);
        }
    }
}

class SplittedBlockData<T> implements IChunkData<T>, ISearchable8Dir {
    width: number;
    height: number;
    x: number;
    y: number;
    elX: number;
    elY: number;
    index: number;
    data: T;

    constructor(
        readonly splitter: BlockSplitter<T>,
        info: IChunkInfo,
        data: T
    ) {
        this.width = info.width;
        this.height = info.height;
        this.x = info.x;
        this.y = info.y;
        this.elX = info.elX;
        this.elY = info.elY;
        this.index = info.index;
        this.data = data;
    }

    left(): IChunkData<T> | null {
        return this.splitter.getChunkByLoc(this.x - 1, this.y);
    }

    right(): IChunkData<T> | null {
        return this.splitter.getChunkByLoc(this.x + 1, this.y);
    }

    up(): IChunkData<T> | null {
        return this.splitter.getChunkByLoc(this.x, this.y - 1);
    }

    down(): IChunkData<T> | null {
        return this.splitter.getChunkByLoc(this.x, this.y + 1);
    }

    leftUp(): IChunkData<T> | null {
        return this.splitter.getChunkByLoc(this.x - 1, this.y - 1);
    }

    leftDown(): IChunkData<T> | null {
        return this.splitter.getChunkByLoc(this.x - 1, this.y + 1);
    }

    rightUp(): IChunkData<T> | null {
        return this.splitter.getChunkByLoc(this.x + 1, this.y - 1);
    }

    rightDown(): IChunkData<T> | null {
        return this.splitter.getChunkByLoc(this.x + 1, this.y + 1);
    }

    next(): IChunkData<T> | null {
        return this.splitter.getChunkByIndex(this.index + 1);
    }
}
