import { logger } from '@motajs/common';
import { ILayerEventView } from './types';

export class LayerEventView implements ILayerEventView {
    /** 当前绑定的事件 */
    private readonly store: Map<number, string> = new Map();
    /** 用于判断事件是否变化的参考基准 */
    private reference: Map<number, string> = new Map();
    /** 当前存储与参考基准不一致的条目数量 */
    private dirtyEntries: number = 0;

    get(): ReadonlyMap<number, string> {
        return this.store;
    }

    ref(): ReadonlyMap<number, string> {
        return this.reference;
    }

    /**
     * 判断指定优先级当前是否偏离参考基准
     * @param priority 事件优先级
     */
    private isEntryDirty(priority: number): boolean {
        const storeHas = this.store.has(priority);
        const referenceHas = this.reference.has(priority);
        return (
            storeHas !== referenceHas ||
            (storeHas &&
                this.store.get(priority) !== this.reference.get(priority))
        );
    }

    /**
     * 根据指定条目的变更更新脏条目数量
     * @param priority 事件优先级
     * @param before 条目变更前是否脏
     */
    private updateDirtyEntry(priority: number, before: boolean): void {
        const after = this.isEntryDirty(priority);
        if (before !== after) {
            this.dirtyEntries += after ? 1 : -1;
        }
    }

    set(priority: number, event: string): void {
        if (this.store.has(priority)) {
            logger.warn(136, priority.toString());
        }
        const before = this.isEntryDirty(priority);
        this.store.set(priority, event);
        this.updateDirtyEntry(priority, before);
    }

    delete(priority: number): void {
        const before = this.isEntryDirty(priority);
        this.store.delete(priority);
        this.updateDirtyEntry(priority, before);
    }

    clear(): void {
        this.store.clear();
        this.dirtyEntries = this.reference.size;
    }

    markPure(): void {
        this.reference = new Map(this.store);
        this.dirtyEntries = 0;
    }

    dirty(): boolean {
        return this.dirtyEntries > 0;
    }
}
