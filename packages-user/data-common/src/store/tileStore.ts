import { isNil } from 'lodash-es';
import { logger } from '@motajs/common';
import {
    ITileLegacyConverter,
    ITileRawData,
    ITileStore,
    TileType
} from './types';

export class TileStore<TLegacy = unknown> implements ITileStore<TLegacy> {
    /** 以图块数字为键的原始图块定义表 */
    private readonly dataMap: Map<number, ITileRawData> = new Map();

    /** 由图块 id 反查图块数字的映射表 */
    private readonly idMap: Map<string, number> = new Map();

    /** 由图块数字反查图块 id 的映射表 */
    private readonly numMap: Map<number, string> = new Map();

    /** 当前挂载的旧样板图块转换器 */
    private legacyConverter: ITileLegacyConverter<TLegacy> | null = null;

    getData(num: number): ITileRawData | null {
        return this.dataMap.get(num) ?? null;
    }

    getTrigger(num: number): number {
        return this.dataMap.get(num)?.trigger ?? -1;
    }

    getType(num: number): TileType {
        return this.dataMap.get(num)?.type ?? TileType.Unknown;
    }

    addTile(data: ITileRawData): void {
        const oldData = this.dataMap.get(data.num);
        const oldNum = this.idMap.get(data.id);
        if (oldData) {
            logger.warn(133, data.num.toString(), oldData.id);
            this.deleteBy(oldData.num, oldData.id);
        }
        if (!isNil(oldNum) && oldNum !== data.num) {
            logger.warn(134, data.id, oldNum.toString());
            const oldIdData = this.dataMap.get(oldNum);
            if (oldIdData) {
                this.deleteBy(oldIdData.num, oldIdData.id);
            } else {
                this.idMap.delete(data.id);
                this.numMap.delete(oldNum);
            }
        }
        this.dataMap.set(data.num, data);
        this.idMap.set(data.id, data.num);
        this.numMap.set(data.num, data.id);
    }

    idToNumber(id: string): number | null {
        return this.idMap.get(id) ?? null;
    }

    numberToId(num: number): string | null {
        return this.numMap.get(num) ?? null;
    }

    attachLegacyConverter(converter: ITileLegacyConverter<TLegacy>): void {
        this.legacyConverter = converter;
    }

    fromLegacy(num: number, legacy: TLegacy): ITileRawData {
        const converter = this.legacyConverter;
        if (!converter) {
            logger.error(56);
            throw new Error('Expected a tile legacy converter.');
        }
        const data = converter.fromLegacy(num, legacy);
        this.addTile(data);
        return data;
    }

    /** 删除一组旧的图块定义及其双向索引 */
    private deleteBy(num: number, id: string): void {
        this.dataMap.delete(num);
        this.idMap.delete(id);
        this.numMap.delete(num);
    }
}
