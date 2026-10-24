import { CoreState, ICoreState, ICoreStateConfig } from '@user/data-state';
import { CORE_URL, HERO_FACE } from './constant';
import { ILoadTaskStarter } from '@motajs/loader';
import { MainDataPlugin } from './initialize';
import { dataPlugins } from './plugin';
import { createEventRegistrations } from './event';

/**
 * 创建数据端配置对象
 * @param starter 加载启动器
 */
export function createCoreStateConfig(
    starter: ILoadTaskStarter
): ICoreStateConfig {
    const config: ICoreStateConfig = {
        loadStarter: starter,
        coreURL: CORE_URL,
        dataPlugins: [new MainDataPlugin(HERO_FACE), ...dataPlugins],
        events: createEventRegistrations()
    };
    return config;
}

/**
 * 创建数据端主对象，返回未经过异步初始化的主对象实例，需要手动调用 `state.load` 初始化
 * @param starter 加载启动器
 */
export function createCoreState(starter: ILoadTaskStarter): ICoreState {
    const config = createCoreStateConfig(starter);
    const state = new CoreState(config);
    return state;
}
