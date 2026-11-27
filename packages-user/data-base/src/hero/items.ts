import { isNil } from 'lodash-es';
import {
    IDataCommon,
    ItemCategory,
    ReplayCode,
    SaveCompression,
    shouldReplay
} from '@user/data-common';
import { HeroEquipsStore } from './equipStore';
import {
    IHeroItems,
    IHeroItemSave,
    IHeroItemsSave,
    IHeroItemState
} from './types';
import { logger } from '@motajs/common';

export class HeroItems<THero> implements IHeroItems<THero> {
    /** 当前勇士拥有的所有道具 */
    private readonly items: Map<number, IHeroItemState<THero>> = new Map();

    readonly equipment: HeroEquipsStore<THero>;

    constructor(readonly state: IDataCommon) {
        this.equipment = new HeroEquipsStore<THero>(state);
    }

    /**
     * 获取指定道具的内部状态，返回可修改引用供内部逻辑使用
     * @param item 道具图块数字或 id
     */
    private internalGetItemState(
        item: number | string
    ): IHeroItemState<THero> | null {
        const num = this.state.tileStore.num(item);
        if (isNil(num)) return null;
        return this.items.get(num) ?? null;
    }

    getItemState(
        item: number | string
    ): Readonly<IHeroItemState<THero>> | null {
        return this.internalGetItemState(item);
    }

    iterateItems(): Iterable<[num: number, item: IHeroItemState<THero>]> {
        return this.items;
    }

    itemCount(item: number | string): number {
        return this.getItemState(item)?.count ?? 0;
    }

    @shouldReplay('Adding item to hero should be replayed.')
    addItem(item: number | string, count: number = 1): void {
        const [num, id] = this.state.tileStore.identity(item);
        if (isNil(num) || isNil(id)) return;

        const raw = this.state.itemStore.getData(num);
        if (!raw) return;

        if (raw.category === ItemCategory.Pick) {
            for (let i = 0; i < count; i++) {
                raw.effect.useEffect?.(raw, this.state);
            }
            return;
        }

        if (raw.category === ItemCategory.Equipment) {
            for (let i = 0; i < count; i++) {
                this.equipment.add(item);
            }
            return;
        }

        const existing = this.items.get(num);
        if (existing) {
            existing.count += count;
            if (existing.count <= 0) {
                this.items.delete(num);
            }
        } else if (count > 0) {
            const consumable = raw.category === ItemCategory.Consumable;
            this.items.set(num, { id, num, raw, count, consumable });
        }
    }

    @shouldReplay('Using item should be replayed.')
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

        const can = raw.effect.canUse?.(raw, this.state) ?? true;
        if (!can) return false;

        const replay = this.state.replaySystem;
        replay.array.add(ReplayCode.UseItem, [raw.num]);

        raw.effect.useEffect?.(raw, this.state);

        if (state.consumable) {
            state.count--;
            if (state.count <= 0) {
                this.items.delete(raw.num);
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
            const store = this.state.tileStore;
            const id = store.id(raw.num);
            if (isNil(id)) {
                logger.warn(193, raw.num.toString());
                continue;
            }
            map.set(save.num, {
                id,
                num: raw.num,
                raw,
                count: save.count,
                consumable: raw.category === ItemCategory.Consumable
            });
        }
    }

    saveState(compression: SaveCompression): IHeroItemsSave<THero> {
        return {
            items: this.mapToSave(this.items),
            equipStore: this.equipment.saveState(compression)
        };
    }

    loadState(
        state: IHeroItemsSave<THero>,
        compression: SaveCompression
    ): void {
        this.items.clear();
        this.loadMap(this.items, state.items);
        this.equipment.loadState(state.equipStore, compression);
    }
}
