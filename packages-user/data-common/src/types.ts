import { IFaceManager, IRoleFaceBinder } from './common';
import { ITileStore } from './store';

export interface IDataCommon {
    /** 图块定义存储 */
    readonly tileStore: ITileStore<MapDataOf<keyof NumberToId>>;
    /** 朝向绑定 */
    readonly roleFace: IRoleFaceBinder;
    /** 朝向管理 */
    readonly faceManager: IFaceManager;
}

export interface IDataCommonExtended {
    /** 当前对象对应的公共层对象（Layer 0 对象） */
    readonly state: IDataCommon;
}
