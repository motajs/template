import { ITileLocator } from '@motajs/common';
import { IMapLocIndexer } from './types';

export class MapLocIndexer implements IMapLocIndexer {
    private width: number = 0;

    setWidth(width: number): void {
        this.width = width;
    }

    locToIndex(x: number, y: number): number {
        return y * this.width + x;
    }

    locaterToIndex(locator: ITileLocator): number {
        return locator.y * this.width + locator.x;
    }

    indexToLocator(index: number): ITileLocator {
        return {
            x: index % this.width,
            y: Math.floor(index / this.width)
        };
    }
}
