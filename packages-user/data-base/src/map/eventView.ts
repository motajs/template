import { logger } from '@motajs/common';
import { ILayerEventView } from './types';

export class LayerEventView implements ILayerEventView {
    /** 当前绑定的事件 */
    private readonly store: Map<number, string> = new Map();
    /** 用于判断事件是否变化的参考基准 */
    private reference: Map<number, string> | null = null;

    get(): ReadonlyMap<number, string> {
        return this.store;
    }

    set(priority: number, event: string): void {
        if (this.store.has(priority)) {
            logger.warn(136, priority.toString());
        }
        this.store.set(priority, event);
    }

    delete(priority: number): void {
        this.store.delete(priority);
    }

    clear(): void {
        this.store.clear();
    }

    markPure(): void {
        this.reference = new Map(this.store);
    }

    dirty(): boolean {
        const reference = this.reference;
        if (!reference) {
            return this.store.size > 0;
        }
        if (this.store.size !== reference.size) {
            return true;
        }
        for (const [priority, event] of this.store) {
            if (reference.get(priority) !== event) {
                return true;
            }
        }
        return false;
    }
}
