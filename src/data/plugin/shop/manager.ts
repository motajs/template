import { SaveCompression } from '@user/data-common';
import { IShopManager, IShopManagerSave, IShopState } from './types';
import { logger } from '@motajs/common';
import { ShopState } from './state';
import { isNil } from 'lodash-es';
import { ICoreState } from '@user/data-state';

export class ShopManager implements IShopManager {
    /** 当前管理器包含的商店列表 */
    private readonly shops: Map<string, IShopState> = new Map();

    constructor(readonly state: ICoreState) {}

    /**
     * 传入商店 id 或实例，输出商店实例
     * @param shop 商店的 id 或其实例
     */
    private getShopState(shop: string | IShopState): IShopState | null {
        if (typeof shop === 'string') {
            return this.shops.get(shop) ?? null;
        } else {
            return shop;
        }
    }

    /**
     * 传入商店 id 或实例，输出商店 id
     * @param shop 商店的 id 或其实例
     */
    private getShopId(shop: string | IShopState): string | undefined {
        if (typeof shop === 'string') {
            return shop;
        } else {
            return shop.id;
        }
    }

    addShop(shop: IShopState): void {
        if (this.shops.has(shop.id)) {
            logger.warn(198, shop.id);
            return;
        }
        this.shops.set(shop.id, shop);
    }

    removeShop(shop: string | IShopState): void {
        const id = this.getShopId(shop);
        if (!isNil(id)) this.shops.delete(id);
    }

    getShop(id: string): IShopState | null {
        return this.shops.get(id) ?? null;
    }

    hasShop(shop: string | IShopState): boolean {
        const id = this.getShopId(shop);
        return isNil(id) || this.shops.has(id);
    }

    iterateShops(): Iterable<[string, IShopState]> {
        return this.shops;
    }

    *iterateEnabledShops(): Iterable<[string, IShopState]> {
        for (const [key, state] of this.shops) {
            if (state.enabled) yield [key, state];
        }
    }

    *iterateDisabledShops(): Iterable<[string, IShopState]> {
        for (const [key, state] of this.shops) {
            if (!state.enabled) yield [key, state];
        }
    }

    enableShop(shop: string | IShopState): void {
        const state = this.getShopState(shop);
        if (state) state.enable();
    }

    disableShop(shop: string | IShopState): void {
        const state = this.getShopState(shop);
        if (state) state.disable();
    }

    saveState(compression: SaveCompression): IShopManagerSave {
        const list = [...this.shops.values()].map(v =>
            v.saveState(compression)
        );
        return {
            list
        };
    }

    loadState(state: IShopManagerSave, compression: SaveCompression): void {
        this.shops.clear();
        for (const save of state.list) {
            const shop: IShopState = new ShopState(save.id, this.state);
            shop.loadState(save, compression);
            this.shops.set(save.id, shop);
        }
    }
}
