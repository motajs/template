import { SaveCompression } from '@user/data-common';
import {
    ISettingItem,
    ISettingItemGroup,
    ISettingSystem,
    ISettingSystemSave
} from './types';
import { isNil } from 'lodash-es';
import { logger } from '@motajs/common';

export class SettingSystem implements ISettingSystem {
    /** 所有设置分组，键为分组 id */
    readonly groups: Map<string, ISettingItemGroup> = new Map();

    /** 所有已登记的设置项，键为设置项 id */
    private readonly settings: Map<string, ISettingItem> = new Map();
    /** 设置 id 到其分组的映射 */
    private readonly groupMap: Map<string, string> = new Map();

    setGroup(group: string, name: string, items: ISettingItem[]): void {
        if (items.length > 0) {
            for (const item of items) {
                this.settings.set(item.id, item);
                this.groupMap.set(item.id, group);
            }
            this.groups.set(group, { name, items });
        } else {
            this.groups.delete(group);
        }
    }

    addSettingToGroup(group: string, item: ISettingItem): void {
        const exist = this.groupMap.get(item.id);
        if (exist === group) return;
        if (!isNil(exist) && exist !== group) {
            logger.warn(213, item.id, exist, group);
        }
        const obj = this.groups.getOrInsertComputed(group, () => ({
            name: group,
            items: []
        }));
        this.settings.set(item.id, item);
        this.groups.set(group, { name: obj.name, items: [...obj.items, item] });
    }

    getGroup(group: string): ISettingItemGroup | null {
        return this.groups.get(group) ?? null;
    }

    getSetting(id: string): ISettingItem | null {
        return this.settings.get(id) ?? null;
    }

    iterateGroups(): Iterable<[id: string, group: ISettingItemGroup]> {
        return this.groups.entries();
    }

    getUngrouped(): Iterable<ISettingItem> {
        const grouped = new Set<ISettingItem>();
        for (const group of this.groups.values()) {
            for (const item of group.items) {
                grouped.add(item);
            }
        }
        const ungrouped: ISettingItem[] = [];
        for (const item of this.settings.values()) {
            if (!grouped.has(item)) ungrouped.push(item);
        }
        return ungrouped;
    }

    getValue<T>(id: string): T | undefined {
        const item = this.settings.get(id);
        return item?.getValue() as T;
    }

    setValue<T>(id: string, value: T): void {
        const item = this.settings.get(id);
        if (item) {
            item.setValue(value);
        }
    }

    saveState(compression: SaveCompression): ISettingSystemSave {
        const values: Map<string, unknown> = new Map();
        for (const [id, item] of this.settings) {
            values.set(id, item.saveState(compression));
        }
        return { values };
    }

    loadState(state: ISettingSystemSave, compression: SaveCompression): void {
        for (const [id, value] of state.values) {
            const item = this.settings.get(id);
            // 未登记设置项直接跳过，不写入日志
            if (!item) continue;
            item.loadState(value, compression);
        }
    }
}
