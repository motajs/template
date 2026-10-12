import {
    IDataBaseExtended,
    IHeroState,
    IShopManager,
    IShopState
} from '@user/data-base';

export interface IShopHeroAttr {
    /** 勇士拥有的金币 */
    money: number;
}

export const enum ShopTradeResult {
    /** 成功购入或售出 */
    Success,
    /** 操作不合法，一般是因为道具不存在或未打开商店 */
    Invalid,
    /** 商店库存不足，无法购入这么多道具 */
    ShopLack,
    /** 玩家库存不足，无法卖出这么多道具 */
    HeroLack,
    /** 玩家货币不足，无法购入这么多道具 */
    MoneyLack
}

export interface IShopSystem extends IDataBaseExtended {
    /** 当前使用的商店管理器 */
    readonly manager: IShopManager | null;
    /** 当前绑定的勇士状态对象 */
    readonly hero: IHeroState<IShopHeroAttr> | null;

    /**
     * 绑定商店管理器
     * @param manager 商店管理器
     */
    bindManager(manager: IShopManager | null): void;

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
     * 获取当前已打开的商店状态对象
     */
    getCurrentShop(): IShopState | null;

    /**
     * 关闭当前打开的商店
     */
    closeShop(): void;

    /**
     * 在当前打开的商店里面购买指定道具
     * @param item 道具数字或 id
     * @param count 购买的道具数量
     */
    buyItem(item: number | string, count: number): ShopTradeResult;

    /**
     * 在当前打开的商店里面售出指定道具
     * @param item 道具数字或 id
     * @param count 卖出的道具数量
     */
    sellItem(item: number | string, count: number): ShopTradeResult;
}
