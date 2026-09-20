import { IHookable, IHookBase } from '@motajs/common';
import { ILoadManager, LoadDataType, LoadTask } from '@motajs/loader';
import { ICoreStateCoreConfig } from '../common';

export interface IMotaDataLoaderHooks extends IHookBase {
    /**
     * 当核心配置对象加载完毕时触发，往往用于添加自定义配置文件
     * @param coreConfig 核心配置对象
     * @param loader 数据端加载对象
     */
    onCoreConfigLoaded?(
        coreConfig: ICoreStateCoreConfig,
        loader: IMotaDataLoader
    ): Promise<void>;

    /**
     * 当所有的额外配置对象加载完毕后执行，往往用于根据配置文件添加额外加载任务
     * @param loader 数据端加载对象
     */
    onExtraConfigLoaded?(loader: IMotaDataLoader): Promise<void>;
}

export interface IMotaDataLoader extends IHookable<IMotaDataLoaderHooks> {
    /** 当前使用的加载管理器 */
    readonly manager: ILoadManager;

    /**
     * 开始执行加载
     */
    start(): AsyncIterable<number>;

    /**
     * 获取当加载执行完毕时兑现的 `Promise`
     */
    loaded(): Promise<void>;

    /**
     * 添加额外配置文件，仅允许在 `onCoreConfigLoaded` 中调用或在加载前调用，加载中及加载后后调用无效。
     * 文件必须放在 `src/content` 下，并填写相对于 `src/content` 文件夹的路径，文件包含如下要求：
     *
     * - 文件必须为 `jsonc` 格式
     * - 文件的注释必须全部集中在开头
     * - 文件中的最后一行注释必须是 `// --- SYSTEM PREFIX END --- //`
     * @param identifier 加载任务与配置文件的标识符
     * @param url 额外配置文件路径
     */
    addExtraConfig(identifier: string, url: string): void;

    /**
     * 添加自定义加载任务，仅允许在 `onCoreConfigLoaded` 和 `onExtraConfigLoaded` 中调用或在加载前调用，
     * 加载中及加载后后调用无效。所有的自定义加载任务都会在配置文件加载完毕后开始加载。
     * @param task 自定义加载任务实例
     * @returns 任务加载完毕后兑现，兑现值为经过加载处理器处理后的值
     */
    addCustomTask<T>(task: LoadTask<LoadDataType, T>): Promise<T>;

    /**
     * 获取指定配置文件，例如核心配置文件是 `core`，怪物配置文件是 `enemy` 等等
     * @param identifier 配置文件标识符
     */
    getConfig<T>(identifier: string): T | null;
}
