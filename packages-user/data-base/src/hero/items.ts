import { isNil } from 'lodash-es';
import { IDataCommon, ItemCategory } from '@user/data-common';
import {
    IHeroItems,
    IHeroItemSave,
    IHeroItemsSave,
    IHeroItemState
} from './types';

export class HeroItems<THero> implements IHeroItems<THero> {
    /** 永久道具 */
    private readonly constants: Map<number, IHeroItemState<THero>> = new Map();
    /** 消耗道具 */
    private readonly consumables: Map<number, IHeroItemState<THero>> =
        new Map();
    /** 装备道具 */
    private readonly equipments: Map<number, IHeroItemState<THero>> = new Map();

    constructor(readonly state: IDataCommon) {}

    /**
     * 将 item 参数解析为 num，字符串 id 通过 tileStore 转换为 num
     * @param item 道具图块数字或 id
     */
    private resolveNum(item: number | string): number | null {
        if (typeof item === 'number') return item;
        return this.state.tileStore.idToNumber(item);
    }

    /**
     * 根据道具分类获取对应的分表
     * @param category 道具分类枚举
     */
    private getMap(category: ItemCategory): Map<number, IHeroItemState<THero>> {
        switch (category) {
            case ItemCategory.Constant:
                return this.constants;
            case ItemCategory.Consumable:
                return this.consumables;
            case ItemCategory.Equipment:
                return this.equipments;
            default:
                return this.constants;
        }
    }

    /**
     * 获取指定道具的内部状态，返回可修改引用供内部逻辑使用
     * @param item 道具图块数字或 id
     */
    private internalGetItemState(
        item: number | string
    ): IHeroItemState<THero> | null {
        const num = this.resolveNum(item);
        if (isNil(num)) return null;

        const category = this.state.itemStore.getCategory(num);
        const map = this.getMap(category);
        return map.get(num) ?? null;
    }

    getItemState(
        item: number | string
    ): Readonly<IHeroItemState<THero>> | null {
        return this.internalGetItemState(item);
    }

    itemCount(item: number | string): number {
        return this.getItemState(item)?.count ?? 0;
    }

    addItem(item: number | string, count: number = 1): void {
        const num = this.resolveNum(item);
        if (isNil(num)) return;

        const raw = this.state.itemStore.getData(num);
        if (!raw) return;

        if (raw.category === ItemCategory.Pick) {
            for (let i = 0; i < count; i++) {
                raw.effect.useEffect(raw);
            }
            return;
        }

        const map = this.getMap(raw.category);
        const existing = map.get(num);
        if (existing) {
            existing.count += count;
            if (existing.count <= 0) {
                map.delete(num);
            }
        } else if (count > 0) {
            map.set(num, { id: raw.id, num: raw.num, raw, count });
        }
    }

    getItem(item: number | string): void {
        this.addItem(item, 1);
    }

    useItem(item: number | string): boolean {
        const state = this.internalGetItemState(item);
        if (!state) return false;

        const { raw } = state;
        if (
            raw.category !== ItemCategory.Constant &&
            raw.category !== ItemCategory.Consumable
        ) {
            return false;
        }

        if (!raw.effect.canUse(raw)) return false;

        raw.effect.useEffect(raw);

        if (raw.category === ItemCategory.Consumable) {
            state.count--;
            if (state.count <= 0) {
                this.consumables.delete(raw.num);
            }
        }

        return true;
    }

    /**
     * 将分表转换为存档数组
     * @param map 道具分表
     */
    private mapToSave(
        map: Map<number, IHeroItemState<THero>>
    ): readonly IHeroItemSave[] {
        const result: IHeroItemSave[] = [];
        for (const state of map.values()) {
            result.push({ num: state.num, count: state.count });
        }
        return result;
    }

    /**
     * 从存档数组恢复分表
     * @param map 道具分表
     * @param saves 存档数组
     */
    private loadMap(
        map: Map<number, IHeroItemState<THero>>,
        saves: readonly IHeroItemSave[]
    ): void {
        for (const save of saves) {
            const raw = this.state.itemStore.getData(save.num);
            if (!raw) continue;
            map.set(save.num, {
                id: raw.id,
                num: raw.num,
                raw,
                count: save.count
            });
        }
    }

    saveState(): IHeroItemsSave {
        return {
            constants: this.mapToSave(this.constants),
            consumables: this.mapToSave(this.consumables),
            equipments: this.mapToSave(this.equipments)
        };
    }

    loadState(state: IHeroItemsSave): void {
        this.constants.clear();
        this.consumables.clear();
        this.equipments.clear();
        this.loadMap(this.constants, state.constants);
        this.loadMap(this.consumables, state.consumables);
        this.loadMap(this.equipments, state.equipments);
    }
}
