import { IMapExtensionManager, IMapRenderer } from './render/map';
import { IMotaAssetsLoader, IClientBase } from '@user/client-base';
import { IExcitation, IExcitationDivider } from '@motajs/animate';

export interface IClientCore extends IClientBase {
    /** 渲染端加载对象 */
    readonly loader: IMotaAssetsLoader;

    /** 用于渲染系统的 Raf 激励源 */
    readonly rafExcitation: IExcitation<number>;
    /** 用于渲染系统的激励源分频器 */
    readonly excitationDivider: IExcitationDivider<number>;

    /** 主地图渲染器，主要用于渲染游戏画面中的地图 */
    readonly mainMapRenderer: IMapRenderer;
    /** 副地图渲染器，主要用于渲染缩略图、浏览地图等内容 */
    // readonly expandMapRenderer: IMapRenderer;
    /** 主地图渲染器的拓展管理对象 */
    readonly mainMapExtension: IMapExtensionManager;
}
