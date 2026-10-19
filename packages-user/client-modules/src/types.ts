import { IClientSystem } from '@user/client-system';
import { ICoreStateConfig, PluginStatus } from '@user/data-state';

//#region 插件系统

export interface IClientPlugin<T extends IClientPluginDefine> {
    /** 插件的当前状态 */
    status: PluginStatus;
    /** 插件内容 */
    plugin: T;
}

export interface IClientPluginDefine {
    /** 插件标识符 */
    readonly id: string;
    /** 插件所依赖的其他插件 id */
    readonly dependencies: readonly string[];

    /**
     * 插件同步初始化，在渲染端主对象创建完毕，初始化之前时调用
     * @param state 渲染端主对象
     * @param dependencies 此插件的依赖插件对象
     */
    awake(
        state: IClientCore,
        dependencies: IClientPlugin<IClientPluginDefine>[]
    ): void;

    /**
     * 插件异步初始化，在主对象创建完毕，初始化时，加载开始前调用。
     * 此方法具有阻塞效果，如果返回值迟迟不兑现，那么会导致依赖其的插件不会开始异步初始化
     * @param state 渲染端主对象
     * @param dependencies 此插件的依赖插件对象
     */
    initialize(
        state: IClientCore,
        dependencies: IClientPlugin<IClientPluginDefine>[]
    ): Promise<void>;

    /**
     * 当主对象加载完毕后调用，可以用于依赖加载内容的初始化。
     * 此方法具有阻塞效果，如果返回值迟迟不兑现，那么会导致依赖其的插件不会开始加载初始化
     * @param state 渲染端主对象
     * @param dependencies 此插件的依赖插件对象
     */
    afterLoad(
        state: IClientCore,
        dependencies: IClientPlugin<IClientPluginDefine>[]
    ): Promise<void>;
}

//#endregion

export interface IClientCoreConfig extends ICoreStateConfig {
    /** 渲染端数据配置文件路径，相对于 `src/content` */
    readonly clientURL: string;
    /** Tileset 预留数量，用于控制最大允许注册多少个普通图块 */
    readonly tilesetReserve: number;
    /** Tileset 单元数量，用于控制一个 Tileset 会占用多少个图块 */
    readonly tilesetUnit: number;
    /** 渲染器挂载至的画布元素 */
    readonly rendererCanvas: string;
    /** 渲染器的渲染宽度 */
    readonly renderWidth: number;
    /** 渲染器的渲染高度 */
    readonly renderHeight: number;
    /** 渲染端插件列表 */
    readonly clientPlugins: IClientPluginDefine[];
}

export interface IClientCore extends IClientSystem {
    /**
     * 根据 id 获取已加装的渲染端插件
     * @param id 插件的标识符
     */
    getClientPlugin<T extends IClientPluginDefine>(
        id: string
    ): Readonly<IClientPlugin<T>> | null;
}

export interface IClientCoreExtended {
    /** 渲染端主对象 */
    readonly state: IClientCore;
}
