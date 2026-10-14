import { IShopState, IShopStateSave } from './types';
import { isNil } from 'lodash-es';
import { logger } from '@motajs/common';
import { ICoreState } from '@user/data-state';

export class ShopState implements IShopState {
    enabled: boolean = false;

    /** 此商店拥有的所有道具及其库存 */
    private readonly items: Map<number, number> = new Map();
    /** 此商店中，每个道具的买入价格 */
    private readonly buyPrice: Map<number, number> = new Map();
    /** 此商店中，每个道具的售出价格 */
    private readonly sellPrice: Map<number, number> = new Map();

    constructor(
        readonly id: string,
        readonly state: ICoreState
    ) {}

    addItem(token: number | string, count: number): void {
        const num = this.state.tileStore.num(token);
        if (isNil(num)) {
            logger.warn(196, token.toString());
            return;
        }
        // 注意，这里不把库存为 0 的置空是因为置空之后迭代不到，商店将不再显示这个道具
        // 但是商店理应显示库存为 0 的道具，一是因为玩家可能需要卖出，二是因为玩家可能需要 0 库存这一信息
        const before = this.items.getOrInsert(num, 0);
        this.items.set(num, before + count);
    }

    getCount(token: number | string): number {
        const num = this.state.tileStore.num(token);
        if (isNil(num)) {
            logger.warn(196, token.toString());
            return -1;
        }
        return this.items.get(num) ?? -1;
    }

    iterateItems(): Iterable<[number, number]> {
        return this.items;
    }

    setPrice(item: number | string, buy: number, sell: number): void {
        const num = this.state.tileStore.num(item);
        if (isNil(num)) {
            logger.warn(196, item.toString());
            return;
        }
        this.buyPrice.set(num, buy);
        this.sellPrice.set(num, sell);
    }

    getPrice(item: number | string): [buy: number, sell: number] {
        const num = this.state.tileStore.num(item);
        if (isNil(num)) {
            logger.warn(196, item.toString());
            return [-1, -1];
        }
        const buy = this.buyPrice.get(num);
        const sell = this.sellPrice.get(num);
        if (isNil(buy) || isNil(sell)) return [-1, -1];
        else return [buy, sell];
    }

    enable(): void {
        this.enabled = true;
    }

    disable(): void {
        this.enabled = false;
    }

    saveState(): IShopStateSave {
        return {
            id: this.id,
            enabled: this.enabled,
            items: this.items,
            buyPrice: this.buyPrice,
            sellPrice: this.sellPrice
        };
    }

    loadState(state: IShopStateSave): void {
        if (state.id !== this.id) {
            logger.warn(197, this.id, state.id);
            return;
        }
        this.enabled = state.enabled;
        this.items.clear();
        for (const [key, value] of state.items) {
            this.items.set(key, value);
        }
        this.buyPrice.clear();
        for (const [key, value] of state.buyPrice) {
            this.buyPrice.set(key, value);
        }
        this.sellPrice.clear();
        for (const [key, value] of state.sellPrice) {
            this.sellPrice.set(key, value);
        }
    }
}
