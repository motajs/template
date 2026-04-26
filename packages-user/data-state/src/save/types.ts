import { ISaveableContent, SaveCompression } from '@user/data-base';
import { Dexie, Table } from 'dexie';

export interface IGlobalTrasaction {
    /** 全局存储对应的表 */
    readonly table: Table<unknown, string>;

    /**
     * 获取指定键值对应的数据
     * @param key 全局键值
     */
    get<T>(key: string): Promise<T>;

    /**
     * 设置指定键值存储的数据
     * @param key 全局键值
     * @param value 存储数据
     */
    set(key: string, value: unknown): Promise<void>;
}

export interface ISaveSystemConfig {
    /** 自动存档使用的压缩等级 */
    autosaveLevel: SaveCompression;
    /** 普通存档使用的压缩等级 */
    commonSaveLevel: SaveCompression;
    /** 可容忍的最大存档耗时，超过此值会抛出警告 */
    saveTimeTolerance: number;
    /** 可容忍的最大自动存档耗时，超过此值会抛出警告 */
    autosaveTimeTolerance: number;
    /** 自动存档栈最大大小 */
    autosaveStackSize: number;
}

export interface ISaveRead {
    /** 该存档的压缩等级 */
    readonly compression: SaveCompression;
    /** 该存档的数据 */
    readonly data: Map<string, unknown>;
}

export interface ISaveSystem {
    /** Dexie 数据库 */
    readonly db: Dexie;

    /**
     * 初始化存档数据库
     * @param name 数据库名称
     */
    init(name: string): void;

    /**
     * 配置此存档系统
     * @param config 配置对象
     */
    config(config: Readonly<Partial<ISaveSystemConfig>>): void;

    /**
     * 从 `undo` 栈读取上一个自动存档，然后将当前状态加入 `redo` 栈
     * @param current 当前游戏状态，需要加入 `redo` 栈
     */
    undoAutosave(
        current: Map<string, ISaveableContent<unknown>>
    ): ISaveRead | null;

    /**
     * 从 `redo` 栈读取自动存档，并将当前状态加入 `undo` 栈
     * @param current 当前游戏状态，需要加入 `undo` 栈
     */
    redoAutosave(
        current: Map<string, ISaveableContent<unknown>>
    ): ISaveRead | null;

    /**
     * 获取当前的撤回栈
     */
    getUndoStack(): ISaveRead[];

    /**
     * 获取当前的重做栈
     */
    getRedoStack(): ISaveRead[];

    /**
     * 进行自动存档，加入撤回栈
     * @param state 状态对象
     */
    autosave(state: Map<string, ISaveableContent<unknown>>): void;

    /**
     * 将 `undo` 栈顶的自动存档真正存入 `IndexedDB`
     */
    saveAutosaveToDB(): Promise<void>;

    /**
     * 将状态对象存入存档
     * @param id 存档 id，用于建立存档索引及查询
     * @param state 状态对象
     */
    save(
        id: number,
        state: Map<string, ISaveableContent<unknown>>
    ): Promise<void>;

    /**
     * 根据 id 读取指定存档
     * @param id 存档 id
     */
    load(id: number): Promise<ISaveRead | null>;

    /**
     * 删除指定存档
     * @param id 存档 id
     */
    deleteSave(id: number): Promise<void>;

    /**
     * 获取最后一次存档的存档栏位
     */
    getLastSlot(): Promise<number>;

    /**
     * 获取指定键值对应的全局存储
     * @param key 全局键值
     */
    getGlobal<T>(key: string): Promise<T | null>;

    /**
     * 设置指定键值对应的全局存储
     * @param key 全局键值
     * @param value 存储数据
     */
    setGlobal(key: string, value: unknown): Promise<void>;

    /**
     * 进行全局存储的事务处理，适用于多内容查询与设置，当出现错误时其中的任何写入操作都不会真正存储
     * @param handle 事务处理函数
     */
    startGlobalTransaction<R>(
        handle: (transaction: IGlobalTrasaction) => PromiseLike<R>
    ): Promise<R>;
}
