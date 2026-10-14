import { IDataPluginDefine } from '@user/data-state';
import { ShopPlugin } from './shop';

/** 数据端插件列表 */
export const dataPlugins: IDataPluginDefine[] = [new ShopPlugin()];
