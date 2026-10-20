import { IClientPluginDefine } from '@user/client-modules';
import { Shop, ShopUI } from './shop';

export interface IClientShopPlugin extends IClientPluginDefine {
    /** 商店组件 */
    readonly Shop: typeof Shop;
    /** 商店 UI 对象 */
    readonly ShopUI: typeof ShopUI;
}

export class ClientShopPlugin implements IClientShopPlugin {
    id: string = 'client-shop-plugin';
    clientDeps: readonly string[] = [];
    dataDeps: readonly string[] = [];

    Shop: typeof Shop = Shop;
    ShopUI: typeof ShopUI = ShopUI;

    awake(): void {}

    async initialize(): Promise<void> {}

    async afterLoad(): Promise<void> {}
}
