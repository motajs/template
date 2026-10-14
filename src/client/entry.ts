import { ILoadTaskStarter } from '@motajs/loader';
import {
    ClientCore,
    IClientCore,
    IClientCoreConfig
} from '@user/client-modules';
import { CLIENT_CORE_URL, TILESET_RESERVE, TILESET_UNIT } from '../constant';
import { createCoreStateConfig } from '../data/entry';

/**
 * 创建渲染端配置对象
 * @param starter 加载启动器
 */
export function createClientCoreConfig(
    starter: ILoadTaskStarter
): IClientCoreConfig {
    const config: IClientCoreConfig = {
        clientURL: CLIENT_CORE_URL,
        tilesetReserve: TILESET_RESERVE,
        tilesetUnit: TILESET_UNIT,

        ...createCoreStateConfig(starter)
    };
    return config;
}

/**
 * 创建渲染端主对象，返回经过初始化的主对象实例
 * @param starter 加载启动器
 */
export async function createClientCore(
    starter: ILoadTaskStarter
): Promise<IClientCore> {
    const config = createClientCoreConfig(starter);
    const state = new ClientCore(config);
    await state.load();
    return state;
}
