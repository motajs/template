import { ICoreState } from '@user/data-state';
import { IShopManager, IShopPlugin, IShopState, IShopSystem } from './types';
import { ShopManager } from './manager';
import { ShopState } from './state';
import { ShopSystem } from './system';

export class DataShopPlugin implements IShopPlugin {
    id: string = 'data-shop-plugin';
    dataDeps: string[] = [];

    shop!: IShopSystem;
    manager!: IShopManager;

    /** 数据端主对象 */
    private state!: ICoreState;

    createShopState(id: string): IShopState {
        return new ShopState(id, this.state);
    }

    awake(state: ICoreState): void {
        this.state = state;
        this.shop = new ShopSystem(state);
        this.manager = new ShopManager(state);

        state.addSaveableContent('@plugin/shop', this.manager);
    }

    async initialize(): Promise<void> {}

    async afterLoad(): Promise<void> {}
}
