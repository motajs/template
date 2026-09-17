import { IItemRawData, IItemStore, ItemCategory } from './types';

export class ItemStore<THero> implements IItemStore<THero> {
    /** 以道具图块数字为键的原始道具定义表 */
    private readonly dataMap: Map<number, IItemRawData<THero>> = new Map();

    getData(num: number): IItemRawData<THero> | null {
        return this.dataMap.get(num) ?? null;
    }

    getCategory(num: number): ItemCategory {
        return this.dataMap.get(num)?.category ?? ItemCategory.Unknown;
    }

    addItem(data: IItemRawData<THero>): void {
        this.dataMap.set(data.num, data);
    }
}
