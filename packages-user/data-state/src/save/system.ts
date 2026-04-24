import Dexie, { Table } from 'dexie';
import { logger } from '@motajs/common';
import {
    IGlobalTrasaction,
    ISaveRead,
    ISaveSystem,
    ISaveSystemConfig
} from './types';
import { ISaveableContent, SaveCompression } from '@user/data-base';
import { isNil } from 'lodash-es';

interface ISaveRecord {
    /** 存档 id */
    readonly id: number;
    /** 存档压缩级别 */
    readonly compression: SaveCompression;
    /** 存档内容 */
    readonly data: Map<string, unknown>;
}

interface IGlobalRecord {
    /** 全局存储的键名 */
    readonly key: string;
    /** 全局存储的内容 */
    readonly value: unknown;
}

export class GlobalTransaction implements IGlobalTrasaction {
    constructor(readonly table: Table<IGlobalRecord, string>) {}

    async get<T>(key: string): Promise<T> {
        const record = await this.table.get(key);
        return record!.value as T;
    }

    async set(key: string, value: unknown): Promise<void> {
        await this.table.put({ key, value });
    }
}

export class SaveSystem implements ISaveSystem {
    db!: Dexie;

    /** 当前的撤回栈 */
    private readonly undoStack: ISaveRead[] = [];
    /** 当前的重做栈 */
    private readonly redoStack: ISaveRead[] = [];

    /** 撤回栈与重做栈的最大长度 */
    private stackSize: number = 20;
    /** 自动存档压缩级别 */
    private autosaveLevel: SaveCompression = SaveCompression.LowCompression;
    /** 普通存档压缩级别 */
    private commonSaveLevel: SaveCompression = SaveCompression.HighCompression;
    /** 普通存档容忍时长 */
    private saveTimeTolerance: number = 100;
    /** 自动存档容忍时长 */
    private autosaveTimeTolerance: number = 50;

    init(name: string) {
        this.db = new Dexie(name);
        this.db.version(1).stores({
            saves: 'id',
            global: 'key'
        });
    }

    config(config: Readonly<Partial<ISaveSystemConfig>>): void {
        if (!isNil(config.autosaveLevel)) {
            this.autosaveLevel = config.autosaveLevel;
        }
        if (!isNil(config.commonSaveLevel)) {
            this.commonSaveLevel = config.commonSaveLevel;
        }
        if (!isNil(config.saveTimeTolerance)) {
            this.saveTimeTolerance = config.saveTimeTolerance;
        }
        if (!isNil(config.autosaveTimeTolerance)) {
            this.autosaveTimeTolerance = config.autosaveTimeTolerance;
        }
        if (!isNil(config.autosaveStackSize)) {
            const size = config.autosaveStackSize;
            this.stackSize = size;
            if (this.undoStack.length > size) {
                this.undoStack.splice(0, this.undoStack.length - size);
            }
            if (this.redoStack.length > size) {
                this.redoStack.splice(0, this.redoStack.length - size);
            }
        }
    }

    undoAutosave(
        current: Map<string, ISaveableContent<unknown>>
    ): ISaveRead | null {
        if (this.undoStack.length === 0) return null;
        const data = new Map<string, unknown>();
        for (const [key, content] of current) {
            data.set(key, content.saveState(this.autosaveLevel));
        }
        this.redoStack.push({ compression: this.autosaveLevel, data });
        if (this.redoStack.length > this.stackSize) {
            this.redoStack.splice(0, this.redoStack.length - this.stackSize);
        }
        return this.undoStack.pop()!;
    }

    redoAutosave(
        current: Map<string, ISaveableContent<unknown>>
    ): ISaveRead | null {
        if (this.redoStack.length === 0) return null;
        const data = new Map<string, unknown>();
        for (const [key, content] of current) {
            data.set(key, content.saveState(this.autosaveLevel));
        }
        this.undoStack.push({ compression: this.autosaveLevel, data });
        if (this.undoStack.length > this.stackSize) {
            this.undoStack.splice(0, this.undoStack.length - this.stackSize);
        }
        return this.redoStack.pop()!;
    }

    getUndoStack(): ISaveRead[] {
        return this.undoStack.slice();
    }

    getRedoStack(): ISaveRead[] {
        return this.redoStack.slice();
    }

    autosave(state: Map<string, ISaveableContent<unknown>>): void {
        const data = new Map<string, unknown>();
        for (const [key, content] of state) {
            data.set(key, content.saveState(this.autosaveLevel));
        }
        this.undoStack.push({ compression: this.autosaveLevel, data });
        this.redoStack.length = 0;
        if (this.undoStack.length > this.stackSize) {
            this.undoStack.splice(0, this.undoStack.length - this.stackSize);
        }
    }

    async saveAutosaveToDB(): Promise<void> {
        if (this.undoStack.length === 0) return;
        const t0 = performance.now();
        const top = this.undoStack[this.undoStack.length - 1];
        const table = this.db.table<ISaveRecord, number>('saves');
        await table.put({
            id: -1,
            compression: top.compression,
            data: top.data
        });
        const t1 = performance.now();
        if (t1 - t0 > this.autosaveTimeTolerance) {
            logger.warn(
                115,
                (t1 - t0).toFixed(0),
                this.autosaveTimeTolerance.toString()
            );
        }
    }

    async save(
        id: number,
        state: Map<string, ISaveableContent<unknown>>
    ): Promise<void> {
        const t0 = performance.now();
        const data = new Map<string, unknown>();
        for (const [key, content] of state) {
            data.set(key, content.saveState(this.commonSaveLevel));
        }
        const table = this.db.table<ISaveRecord, number>('saves');
        await table.put({ id, compression: this.commonSaveLevel, data });
        await this.setGlobal('lastSlot', id);
        const t1 = performance.now();
        if (t1 - t0 > this.saveTimeTolerance) {
            logger.warn(
                114,
                (t1 - t0).toFixed(0),
                this.saveTimeTolerance.toString()
            );
        }
    }

    async load(id: number): Promise<ISaveRead | null> {
        const table = this.db.table<ISaveRecord, number>('saves');
        const record = await table.get(id);
        if (record === undefined) return null;
        return { compression: record.compression, data: record.data };
    }

    async deleteSave(id: number): Promise<void> {
        const table = this.db.table<ISaveRecord, number>('saves');
        await table.delete(id);
    }

    async getLastSlot(): Promise<number> {
        const value = await this.getGlobal<number | undefined>('lastSlot');
        return value ?? 0;
    }

    async getGlobal<T>(key: string): Promise<T | null> {
        const table = this.db.table<IGlobalRecord, string>('global');
        const record = await table.get(key);
        if (!record) return null;
        else return record.value as T;
    }

    async setGlobal(key: string, value: unknown): Promise<void> {
        const table = this.db.table<IGlobalRecord, string>('global');
        await table.put({ key, value });
    }

    async startGlobalTransaction<R>(
        handle: (transaction: IGlobalTrasaction) => PromiseLike<R>
    ): Promise<R> {
        const globalTable = this.db.table<IGlobalRecord, string>('global');
        return this.db.transaction('rw', globalTable, () => {
            return handle(new GlobalTransaction(globalTable));
        });
    }
}
