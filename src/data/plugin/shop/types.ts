import { IHeroState } from '@user/data-base';
import { ISaveableContent } from '@user/data-common';
import { ICoreStateExtended, IDataPluginDefine } from '@user/data-state';

export interface IShopPlugin extends IDataPluginDefine {
    /** 商店插件所使用的商店系统对象 */
    readonly shop: IShopSystem;
    /** 商店插件所使用的商店管理器对象 */
    readonly manager: IShopManager;

    /**
     * 创建商店状态对象
     * @param id 商店状态对象的标识符
     */
    createShopState(id: string): IShopState;
}

export interface IShopStateSave {
    /** 商店 id */
    readonly id: string;
    /** 当前商店是否已启用 */
    readonly enabled: boolean;
    /** 商店拥有的库存 */
    readonly items: ReadonlyMap<number, number>;
    /** 商店道具的买入价 */
    readonly buyPrice: ReadonlyMap<number, number>;
    /** 商店道具的售出价 */
    readonly sellPrice: ReadonlyMap<number, number>;
}

export interface IShopState
    extends ICoreStateExtended, ISaveableContent<IShopStateSave> {
    /** 当前商店是否已经启用 */
    readonly enabled: boolean;
    /** 当前商店的标识符 */
    readonly id: string;

    /**
     * 向此商店添加或减少道具库存，会与原本的库存叠加
     * @param token 道具数字或 id
     * @param count 添加或减少的道具数量，正数表示添加，负数表示减少
     */
    addItem(token: number | string, count: number): void;

    /**
     * 获取指定道具的库存数量，不存在道具则返回 -1
     * @param token 道具数字或 id
     */
    getCount(token: number | string): number;

    /**
     * 迭代商店拥有的所有道具，键表示道具的图块数字，值表示数量
     */
    iterateItems(): Iterable<[number, number]>;

    /**
     * 设置道具价格
     * @param item 道具数字或 id
     * @param buy 道具买入价格
     * @param sell 道具卖出价格
     */
    setPrice(item: number | string, buy: number, sell: number): void;

    /**
     * 获取道具价格，如果道具不存在则返回 -1
     * @param item 道具数字或 id
     */
    getPrice(item: number | string): [buy: number, sell: number];

    /**
     * 启用该商店
     */
    enable(): void;

    /**
     * 禁用该商店
     */
    disable(): void;
}

export interface IShopManagerSave {
    /** 商店状态列表 */
    readonly list: IShopStateSave[];
}

export interface IShopManager
    extends ICoreStateExtended, ISaveableContent<IShopManagerSave> {
    /**
     * 添加新的商店
     * @param shop 商店状态对象
     */
    addShop(shop: IShopState): void;

    /**
     * 移除已有商店
     * @param shop 商店 id 或其状态对象
     */
    removeShop(shop: string | IShopState): void;

    /**
     * 根据商店 id 获取其状态对象
     * @param id 商店 id
     */
    getShop(id: string): IShopState | null;

    /**
     * 判断指定商店是否属于当前管理器
     * @param shop 商店 id 或其状态对象
     */
    hasShop(shop: string | IShopState): boolean;

    /**
     * 迭代当前的所有商店，包括未启用的
     */
    iterateShops(): Iterable<[string, IShopState]>;

    /**
     * 迭代当前所有已启用的商店
     */
    iterateEnabledShops(): Iterable<[string, IShopState]>;

    /**
     * 迭代当前所有未启用的商店
     */
    iterateDisabledShops(): Iterable<[string, IShopState]>;

    /**
     * 启用指定商店
     * @param shop 商店 id 或其状态对象
     */
    enableShop(shop: string | IShopState): void;

    /**
     * 禁用指定商店
     * @param shop 商店 id 或其状态对象
     */
    disableShop(shop: string | IShopState): void;
}

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

export interface IShopSystem extends ICoreStateExtended {
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
