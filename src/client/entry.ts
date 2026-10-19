import { ILoadTaskStarter } from '@motajs/loader';
import {
    ClientCore,
    IClientCore,
    IClientCoreConfig
} from '@user/client-modules';
import {
    CLIENT_CORE_URL,
    RENDER_CANVAS,
    RENDER_HEIGHT,
    RENDER_WIDTH,
    TILESET_RESERVE,
    TILESET_UNIT
} from './constant';
import { createCoreStateConfig } from '../data/entry';
import { MainClientPlugin } from './initialize';
import { clientPlugins } from './plugin';

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
        rendererCanvas: RENDER_CANVAS,
        renderWidth: RENDER_WIDTH,
        renderHeight: RENDER_HEIGHT,
        clientPlugins: [new MainClientPlugin(), ...clientPlugins],

        ...createCoreStateConfig(starter)
    };
    return config;
}

/**
 * 创建渲染端主对象，返回未经过异步初始化的主对象实例，需要手动调用 `state.load` 初始化
 * @param starter 加载启动器
 */
export function createClientCore(starter: ILoadTaskStarter): IClientCore {
    const config = createClientCoreConfig(starter);
    const state = new ClientCore(config);
    return state;
}
