import { isNil } from 'lodash-es';
import { IItemRawData, IItemStore, ItemCategory, ITileStore } from './types';
import { logger } from '@motajs/common';

export class ItemStore<THero> implements IItemStore<THero> {
    /** 以道具图块数字为键的原始道具定义表 */
    private readonly dataMap: Map<number, IItemRawData<THero>> = new Map();

    constructor(readonly tileStore: ITileStore) {}

    addItem(data: IItemRawData<THero>): void {
        if (this.dataMap.has(data.num)) {
            logger.warn(181, data.num.toString(), 'item');
        }
        this.dataMap.set(data.num, data);
    }

    getData(token: number | string): IItemRawData<THero> | null {
        const num = this.tileStore.num(token);
        if (isNil(num)) return null;
        return this.dataMap.get(num) ?? null;
    }

    getCategory(num: number): ItemCategory {
        return this.dataMap.get(num)?.category ?? ItemCategory.Unknown;
    }
}
