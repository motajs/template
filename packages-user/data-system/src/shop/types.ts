import { IHeroState, IShopManager, IShopState } from '@user/data-base';

export interface IShopHeroAttr {
    /** 勇士拥有的金币 */
    money: number;
}

export interface IShopSystem {
    /**
     * 绑定商店管理器
     * @param manager 商店管理器
     */
    bindManager(manager: IShopManager): void;

    /**
     * 绑定系统使用的勇士状态对象
     * @param hero 勇士状态对象
     */
    bindHero(hero: IHeroState<IShopHeroAttr> | null): void;

    /**
     * 打开指定商店，仅数据端操作，不会打开商店 UI
     * @param shop 商店状态对象
     */
    openShop(shop: IShopState): void;

    /**
     * 关闭当前打开的商店
     */
    closeShop(): void;

    /**
     * 在当前打开的商店里面购买指定道具
     * @param item 道具数字或 id
     * @param count 购买的道具数量
     */
    buyItem(item: number | string, count: number): void;

    /**
     * 在当前打开的商店里面售出指定道具
     * @param item 道具数字或 id
     * @param count 卖出的道具数量
     */
    sellItem(item: number | string, count: number): void;
}
