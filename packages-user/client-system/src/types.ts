import { IClientBase } from '@user/client-base';

export interface IClientSystem extends IClientBase {}

export interface IClientSystemExtended {
    /** 当前对象的渲染端系统层对象（Layer 5 对象） */
    readonly state: IClientSystem;
}
