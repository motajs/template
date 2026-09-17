import { ISaveSystem } from '@user/data-common';
import { ICoreState } from '@user/data-state';

export interface IClientBase extends ICoreState {
    /** 存档系统 */
    readonly save: ISaveSystem;
}

export interface IClientBaseExtended {
    /** 当前对象的渲染端基本层对象（Layer 4 对象） */
    readonly state: IClientBase;
}
