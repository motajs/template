import { logger } from '@motajs/common';
import {
    IItemLegacyConverter,
    IItemRawData,
    IItemStore,
    ItemCategory
} from './types';

export class ItemStore<TLegacy> implements IItemStore<TLegacy> {
    /** 以道具图块数字为键的原始道具定义表 */
    private readonly dataMap: Map<number, IItemRawData> = new Map();

    /** 当前挂载的旧样板道具转换器 */
    private converter: IItemLegacyConverter<TLegacy> | null = null;

    getData(num: number): IItemRawData | null {
        return this.dataMap.get(num) ?? null;
    }

    getCategory(num: number): ItemCategory {
        return this.dataMap.get(num)?.category ?? ItemCategory.Unknown;
    }

    addItem(data: IItemRawData): void {
        this.dataMap.set(data.num, data);
    }

    attachLegacyConverter(converter: IItemLegacyConverter<TLegacy>): void {
        this.converter = converter;
    }

    fromLegacy(num: number, legacy: TLegacy): IItemRawData {
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
