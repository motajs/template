import { IDataPluginDefine } from '@user/data-state';
import { DataShopPlugin } from './shop';

/** 数据端插件列表 */
export const dataPlugins: IDataPluginDefine[] = [new DataShopPlugin()];
