import { Dexie, Table } from 'dexie';
import { isNil } from 'lodash-es';
import {
    IGlobalTrasaction,
    ISaveRead,
    ISaveSystem,
    ISaveSystemConfig,
    ISaveableContent,
    SaveCompression
} from './types';

interface MemorySaveRecord {
    readonly compression: SaveCompression;
    readonly data: Map<string, unknown>;
}

class MemoryGlobalTransaction implements IGlobalTrasaction {
    readonly table!: Table<unknown, string>;

    constructor(private readonly values: Map<string, unknown>) {}

    async get<T>(key: string): Promise<T> {
        return this.values.get(key) as T;
    }

    async set(key: string, value: unknown): Promise<void> {
        this.values.set(key, value);
    }
}

export class MemorySaveSystem implements ISaveSystem {
    db!: Dexie;

    private readonly saves: Map<number, MemorySaveRecord> = new Map();
    private readonly values: Map<string, unknown> = new Map();
    private readonly undoStack: ISaveRead[] = [];
    private readonly redoStack: ISaveRead[] = [];
    private stackSize: number = 20;
    private autosaveLevel: SaveCompression = SaveCompression.LowCompression;
    private commonSaveLevel: SaveCompression = SaveCompression.HighCompression;

    init(): void {}

    config(config: Readonly<Partial<ISaveSystemConfig>>): void {
        if (!isNil(config.autosaveLevel)) {
            this.autosaveLevel = config.autosaveLevel;
        }
        if (!isNil(config.commonSaveLevel)) {
            this.commonSaveLevel = config.commonSaveLevel;
        }
        if (!isNil(config.autosaveStackSize)) {
            this.stackSize = config.autosaveStackSize;
            this.trim(this.undoStack);
            this.trim(this.redoStack);
        }
    }

    undoAutosave(
        current: Map<string, ISaveableContent<unknown>>
    ): ISaveRead | null {
        if (this.undoStack.length === 0) return null;
        this.redoStack.push(this.capture(current, this.autosaveLevel));
        this.trim(this.redoStack);
        return this.undoStack.pop()!;
    }

    redoAutosave(
        current: Map<string, ISaveableContent<unknown>>
    ): ISaveRead | null {
        if (this.redoStack.length === 0) return null;
        this.undoStack.push(this.capture(current, this.autosaveLevel));
        this.trim(this.undoStack);
        return this.redoStack.pop()!;
    }

    getUndoStack(): ISaveRead[] {
        return this.undoStack.slice();
    }

    getRedoStack(): ISaveRead[] {
        return this.redoStack.slice();
    }

    autosave(state: Map<string, ISaveableContent<unknown>>): void {
        this.undoStack.push(this.capture(state, this.autosaveLevel));
        this.redoStack.length = 0;
        this.trim(this.undoStack);
    }

    async saveAutosaveToDB(): Promise<void> {}

    async save(
        id: number,
        state: Map<string, ISaveableContent<unknown>>
    ): Promise<void> {
        this.saves.set(id, this.captureRecord(state, this.commonSaveLevel));
        await this.setGlobal('lastSlot', id);
    }

    async load(id: number): Promise<ISaveRead | null> {
        const record = this.saves.get(id);
        if (!record) return null;
        return { compression: record.compression, data: record.data };
    }

    async deleteSave(id: number): Promise<void> {
        this.saves.delete(id);
    }

    async getLastSlot(): Promise<number> {
        return (await this.getGlobal<number>('lastSlot')) ?? 0;
    }

    async getGlobal<T>(key: string): Promise<T | null> {
        return this.values.has(key) ? (this.values.get(key) as T) : null;
    }

    async setGlobal(key: string, value: unknown): Promise<void> {
        this.values.set(key, value);
    }

    async startGlobalTransaction<R>(
        handle: (transaction: IGlobalTrasaction) => PromiseLike<R>
    ): Promise<R> {
        return handle(new MemoryGlobalTransaction(this.values));
    }

    private capture(
        state: Map<string, ISaveableContent<unknown>>,
        compression: SaveCompression
    ): ISaveRead {
        const record = this.captureRecord(state, compression);
        return { compression: record.compression, data: record.data };
    }

    private captureRecord(
        state: Map<string, ISaveableContent<unknown>>,
        compression: SaveCompression
    ): MemorySaveRecord {
        const data = new Map<string, unknown>();
        for (const [key, content] of state) {
            data.set(key, content.saveState(compression));
        }
        return { compression, data };
    }

    private trim(stack: ISaveRead[]): void {
        if (stack.length > this.stackSize) {
            stack.splice(0, stack.length - this.stackSize);
        }
    }
}
