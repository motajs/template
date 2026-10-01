import { IClientSystem } from '@user/client-system';
import { IMapExtensionManager, IMapRenderer } from '@user/client-base';
import { IRendererUsing } from '@motajs/render-vue';
import { UIController } from '@motajs/system';

export interface IClientCoreConfig {
    /** 渲染端数据配置文件路径，相对于 `src/content` */
    readonly clientURL: string;
    /** Tileset 预留数量 */
    readonly tilesetReserve: number;
    /** Tileset 单元数量 */
    readonly tilesetUnit: number;
}

export interface IClientCore extends IClientSystem {
    /** 主地图渲染器，主要用于渲染游戏画面中的地图 */
    readonly mainMapRenderer: IMapRenderer;
    /** 副地图渲染器，主要用于渲染缩略图、浏览地图等内容 */
    // readonly expandMapRenderer: IMapRenderer;
    /** 主地图渲染器的拓展管理对象 */
    readonly mainMapExtension: IMapExtensionManager;
    /** 渲染器使用对象，供组件内注册渲染激励与事件监听 */
    readonly using: IRendererUsing;
    /** 主场景的 UI 控制器，管理游戏主场景的 UI 显示 */
    readonly sceneController: UIController;
    /** 主界面的 UI 控制器，管理游戏主界面的 UI 显示 */
    readonly mainUIController: UIController;
}
