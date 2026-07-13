import { logger } from '@motajs/common';
import {
    IItemLegacyConverter,
    IItemRawData,
    IItemStore,
    ItemCategory
} from './types';

export class ItemStore<THero, TLegacy> implements IItemStore<THero, TLegacy> {
    /** 以道具图块数字为键的原始道具定义表 */
    private readonly dataMap: Map<number, IItemRawData<THero>> = new Map();

    /** 当前挂载的旧样板道具转换器 */
    private converter: IItemLegacyConverter<THero, TLegacy> | null = null;

    getData(num: number): IItemRawData<THero> | null {
        return this.dataMap.get(num) ?? null;
    }

    getCategory(num: number): ItemCategory {
        return this.dataMap.get(num)?.category ?? ItemCategory.Unknown;
    }

    addItem(data: IItemRawData<THero>): void {
        this.dataMap.set(data.num, data);
    }

    attachLegacyConverter(
        converter: IItemLegacyConverter<THero, TLegacy>
    ): void {
        this.converter = converter;
    }

    fromLegacy(num: number, legacy: TLegacy): IItemRawData<THero> {
        const converter = this.converter;
        if (!converter) {
            logger.error(57);
            throw new Error('Expected a item legacy converter.');
        }
        const data = converter.fromLegacy(num, legacy);
        this.addItem(data);
        return data;
    }
}
