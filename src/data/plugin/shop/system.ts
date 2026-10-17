import {
    IShopHeroAttr,
    IShopManager,
    IShopState,
    IShopSystem,
    ShopTradeResult
} from './types';
import { logger } from '@motajs/common';
import { isNil } from 'lodash-es';
import { shouldReplay } from '@user/data-common';
import { ICoreState } from '@user/data-state';
import { IHeroState } from '@user/data-base';

export class ShopSystem implements IShopSystem {
    manager: IShopManager | null = null;
    hero: IHeroState<IShopHeroAttr> | null = null;

    private current: IShopState | null = null;

    constructor(readonly state: ICoreState) {}

    bindManager(manager: IShopManager | null): void {
        this.closeShop();
        this.manager = manager;
    }

    bindHero(hero: IHeroState<IShopHeroAttr> | null): void {
        this.closeShop();
        this.hero = hero;
    }

    @shouldReplay('Openning shop should be replayed.')
    openShop(shop: IShopState): void {
        this.current = shop;
    }

    getCurrentShop(): IShopState | null {
        return this.current;
    }

    @shouldReplay('Closing shop should be replayed.')
    closeShop(): void {
        this.current = null;
    }

    @shouldReplay('Buying items should be replayed.')
    buyItem(item: number | string, count: number): ShopTradeResult {
        if (!this.current || !this.hero) {
            logger.warn(199);
            return ShopTradeResult.Invalid;
        }
        const num = this.state.tileStore.num(item);
        if (isNil(num)) {
            logger.warn(200, item.toString());
            return ShopTradeResult.Invalid;
        }

        const shop = this.current;
        const hero = this.hero.getModifiableAttribute();

        const currCount = shop.getCount(count);
        if (currCount < count) return ShopTradeResult.ShopLack;

        const [buyPrice] = shop.getPrice(num);
        if (buyPrice < 0) {
            return ShopTradeResult.Invalid;
        }
        const need = buyPrice * count;
        const owned = hero.getBaseAttribute('money');
        if (owned < need) {
            return ShopTradeResult.MoneyLack;
        }

        hero.add('money', -need);
        shop.addItem(num, -count);
        return ShopTradeResult.Success;
    }

    sellItem(item: number | string, count: number): ShopTradeResult {
        if (!this.current || !this.hero) {
            logger.warn(199);
            return ShopTradeResult.Invalid;
        }
        const num = this.state.tileStore.num(item);
        if (isNil(num)) {
            logger.warn(200, item.toString());
            return ShopTradeResult.Invalid;
        }

        const shop = this.current;
        const hero = this.hero.getModifiableAttribute();
        const pack = this.hero.items;

        const currCount = pack.itemCount(num);
        if (currCount < count) return ShopTradeResult.HeroLack;

        const [, sellPrice] = shop.getPrice(num);
        if (sellPrice < 0) {
            return ShopTradeResult.Invalid;
        }
        const need = sellPrice * count;
        hero.add('money', need);
        shop.addItem(num, count);
        return ShopTradeResult.Success;
    }
}
