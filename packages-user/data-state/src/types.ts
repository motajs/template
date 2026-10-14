import { IStateBase } from '@user/data-base';
import { ILoadManager, ILoadTaskStarter } from '@motajs/loader';
import { IStateSystem } from '@user/data-system';
import { ISaveableContent } from '@user/data-common';
import { IMotaDataLoader } from './loader/types';
import { BuiltInFunction } from '@motajs/anon-tokyo';

//#region 插件系统

export const enum PluginStatus {
    /** 还未进行插件同步初始化 */
    NotAwakened,
    /** 已经进行了插件同步初始化，但尚未执行异步初始化 */
    Awakened,
    /** 已经进行了插件异步初始化，但尚未执行加载初始化 */
    Initialized,
    /** 插件已经完全加载完毕 */
    Loaded
}

export interface IDataPlugin<T extends IDataPluginDefine> {
    /** 插件的当前状态 */
    status: PluginStatus;
    /** 插件内容 */
    plugin: T;
}

export interface IDataPluginDefine {
    /** 插件标识符 */
    readonly id: string;
    /** 插件所依赖的其他插件 id。依赖插件不允许循环依赖，否则会抛出错误，且所有在环上的插件都不会初始化 */
    readonly dependencies: string[];

    /**
     * 插件同步初始化，在数据端主对象创建完毕，初始化之前时调用
     * @param state 数据端主对象
     * @param dependencies 此插件的依赖插件对象
     */
    awake(
        state: ICoreState,
        dependencies: IDataPlugin<IDataPluginDefine>[]
    ): void;

    /**
     * 插件异步初始化，在主对象创建完毕，初始化时，加载开始前调用。
     * 此方法具有阻塞效果，如果返回值迟迟不兑现，那么会导致依赖其的插件不会开始异步初始化，游戏加载也不会开始
     * @param state 数据端主对象
     * @param dependencies 此插件的依赖插件对象
     */
    initialize(
        state: ICoreState,
        dependencies: IDataPlugin<IDataPluginDefine>[]
    ): Promise<void>;

    /**
     * 当主对象加载完毕后调用，可以用于依赖加载内容的初始化。
     * 此方法具有阻塞效果，如果返回值迟迟不兑现，那么会导致依赖其的插件不会开始加载初始化，游戏也不会开始
     * @param state 数据端主对象
     * @param dependencies 此插件的依赖插件对象
     */
    afterLoad(
        state: ICoreState,
        dependencies: IDataPlugin<IDataPluginDefine>[]
    ): Promise<void>;
}

//#endregion

export interface ICoreStateConfig {
    /**
     * 加载启动器，用于适配不同加载环境。
     * 例如网页端会使用 Web 加载器，而 node 端会使用专门的 node 加载器
     */
    readonly loadStarter: ILoadTaskStarter;
    /** 核心配置文件的 URL 路径，也就是 `core.jsonc` 的文件路径 */
    readonly coreURL: string;
    /** 设置游戏使用的插件列表 */
    readonly dataPlugins: IDataPluginDefine[];
    /** 游戏的事件内建函数列表 */
    readonly events: Readonly<BuiltInFunction>[];
}

export interface ISaveableExecutor<T> {
    /**
     * 当数据读取后执行的函数，允许对其他存档对象进行读取
     * @param data 对应可存档对象的存档数据
     * @param state 当前的基础状态
     */
    afterLoad(data: T, state: IStateBase): void;
}

export interface ICoreState
    extends IStateSystem, ISaveableContent<ReadonlyMap<string, unknown>> {
    /** 数据端加载对象 */
    readonly loader: IMotaDataLoader;
    /** 加载管理器 */
    readonly loadManager: ILoadManager;

    /**
     * 根据 id 获取已加装的插件
     * @param id 插件的标识符
     */
    getDataPlugin<T extends IDataPluginDefine>(
        id: string
    ): Readonly<IDataPlugin<T>> | null;

    /**
     * 执行数据端主对象的加载行为，并进行必要的初始化
     */
    load(): AsyncGenerator<number, void>;

    /**
     * 将某个存档执行器绑定至指定的可存档对象，一个可存档对象只能绑定一个执行器，
     * 但一个执行器可以绑定多个可存档对象，主要用来在读档后进行一些全局性的操作
     * @param content 可存档对象或其注册 id
     * @param executor 可存档对象对应的执行器
     */
    bindSaveableExecuter<T>(
        content: ISaveableContent<T> | string,
        executor: ISaveableExecutor<T>
    ): void;
}

export interface ICoreStateExtended {
    /** 当前对象对应的数据层主对象（Layer 3 对象） */
    readonly state: ICoreState;
}
