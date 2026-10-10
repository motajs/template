import { ISaveableContent } from '@user/data-common';

export interface IShopStateSave {
    /** 商店 id */
    readonly id: string;
    /** 当前商店是否已启用 */
    readonly enabled: boolean;
    /** 商店拥有的库存 */
    readonly items: ReadonlyMap<number, number>;
}

export interface IShopState extends ISaveableContent<IShopStateSave> {
    /** 当前商店是否已经启用 */
    readonly enabled: boolean;

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
     * 迭代商店拥有的所有道具
     */
    iterateItems(): Iterable<[number, number]>;

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

export interface IShopManager extends ISaveableContent<IShopManagerSave> {
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
