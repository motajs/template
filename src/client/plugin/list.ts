import { IClientPluginDefine } from '@user/client-modules';
import { ClientShopPlugin } from './shop';

/** 渲染端插件列表 */
export const clientPlugins: IClientPluginDefine[] = [new ClientShopPlugin()];
