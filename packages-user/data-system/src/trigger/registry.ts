import { logger } from '@motajs/common';
import {
    ITrigger,
    ITriggerRegistry,
    TriggerFactory,
    TriggerStringFactory
} from './types';

export class TriggerRegistry implements ITriggerRegistry {
    /** 数字类型到触发器工厂的映射 */
    private readonly typeMap: Map<number, TriggerFactory> = new Map();

    /** 字符串 id 到触发器工厂的映射 */
    private readonly stringMap: Map<string, TriggerStringFactory> = new Map();

    register(type: number, factory: TriggerFactory): void {
        if (this.typeMap.has(type)) {
            logger.warn(132, 'type', type.toString());
        }
        this.typeMap.set(type, factory);
    }

    get(type: number): TriggerFactory | null {
        return this.typeMap.get(type) ?? null;
    }

    create(num: number): ITrigger | null {
        const factory = this.get(num);
        if (!factory) return null;
        return factory(num);
    }

    registerString(id: string, factory: TriggerStringFactory): void {
        if (this.stringMap.has(id)) {
            logger.warn(132, 'id', id);
        }
        this.stringMap.set(id, factory);
    }

    getString(id: string): TriggerStringFactory | null {
        return this.stringMap.get(id) ?? null;
    }

    createByString(id: string): ITrigger | null {
        const factory = this.getString(id);
        if (!factory) return null;
        return factory();
    }
}
