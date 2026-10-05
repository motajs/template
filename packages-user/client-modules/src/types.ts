import { IClientSystem } from '@user/client-system';

export interface IClientCoreConfig {
    /** 渲染端数据配置文件路径，相对于 `src/content` */
    readonly clientURL: string;
    /** Tileset 预留数量 */
    readonly tilesetReserve: number;
    /** Tileset 单元数量 */
    readonly tilesetUnit: number;
}

export interface IClientCore extends IClientSystem {}
