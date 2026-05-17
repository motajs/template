import { ITileLocator } from '@motajs/common';

//#region 接口定义

export interface ILocationHelper {
    /**
     * 坐标 -> 索引
     * @param x 横坐标
     * @param y 纵坐标
     */
    locToIndex(x: number, y: number): number;

    /**
     * 定位符 -> 索引
     * @param locator 定位符
     */
    locaterToIndex(locator: ITileLocator): number;

    /**
     * 索引 -> 定位符
     * @param index 索引
     */
    indexToLocator(index: number): ITileLocator;
}

export interface ILocationIndexer extends ILocationHelper {
    /**
     * 设置地图宽度
     * @param width 地图宽度
     */
    setWidth(width: number): void;
}

//#endregion

//#region 默认实现

export class MapLocIndexer implements ILocationIndexer {
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

//#endregion
