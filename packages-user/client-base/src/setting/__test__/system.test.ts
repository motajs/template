import { DefineSetupFnComponent, defineComponent } from 'vue';
import { describe, expect, it } from 'vitest';
import { SaveCompression } from '@user/data-common';
import { SettingSystem } from '../system';
import { ISettingComponentProps, ISettingItem } from '../types';

interface IFakeItemState {
    value: number;
    saveCount: number;
    loadCount: number;
    lastCompression: SaveCompression | null;
}

interface IFakeItem {
    readonly item: ISettingItem<number>;
    readonly state: IFakeItemState;
}

/**
 * 创建一个用于测试的假设置项，记录存取次数与最近一次使用的压缩级别
 * @param id 设置项的 id
 * @param initial 设置项的初始值
 */
function createFakeItem(id: string, initial: number): IFakeItem {
    const state: IFakeItemState = {
        value: initial,
        saveCount: 0,
        loadCount: 0,
        lastCompression: null
    };
    const item: ISettingItem<number> = {
        id,
        name: id,
        description: id,
        getValue(): number {
            return state.value;
        },
        setValue(value: number): void {
            state.value = value;
        },
        getPreviewString(): string {
            return String(state.value);
        },
        getSettingComponent(): DefineSetupFnComponent<ISettingComponentProps> {
            return defineComponent<ISettingComponentProps>(() => () => []);
        },
        saveState(compression: SaveCompression): number {
            state.saveCount++;
            state.lastCompression = compression;
            return state.value;
        },
        loadState(value: number, compression: SaveCompression): void {
            state.loadCount++;
            state.lastCompression = compression;
            state.value = value;
        }
    };
    return { item, state };
}

describe('设置系统', () => {
    // 登记到分组后可按 id 取到该设置项
    it('returns a registered setting item by id', () => {
        const system = new SettingSystem();
        const a = createFakeItem('a', 1);
        system.setGroup('group', '分组', [a.item]);
        expect(system.getSetting('a')).toBe(a.item);
    });

    // setGroup 整体替换分组内容，并登记分组内的设置项
    it('replaces the group items and registers them', () => {
        const system = new SettingSystem();
        const a = createFakeItem('a', 1);
        const b = createFakeItem('b', 2);
        system.setGroup('group', '分组', [a.item]);
        system.setGroup('group', '新分组', [b.item]);
        const group = system.getGroup('group');
        expect(group?.name).toBe('新分组');
        expect(Array.from(group?.items ?? []).map(item => item.id)).toEqual([
            'b'
        ]);
        expect(system.getSetting('b')).toBe(b.item);
    });

    // 空数组会删除分组，但此前登记的设置项仍可取到并成为未分组项
    it('deletes an empty group while keeping its items registered', () => {
        const system = new SettingSystem();
        const a = createFakeItem('a', 1);
        system.setGroup('group', '分组', [a.item]);
        system.setGroup('group', '分组', []);
        expect(system.getGroup('group')).toBeNull();
        expect(system.getSetting('a')).toBe(a.item);
        expect(Array.from(system.getUngrouped())).toEqual([a.item]);
    });

    // 向不存在的分组添加设置项是空操作，既不报错也不登记
    it('ignores addSettingToGroup for a missing group', () => {
        const system = new SettingSystem();
        const a = createFakeItem('a', 1);
        system.addSettingToGroup('missing', a.item);
        expect(system.getGroup('missing')).toBeNull();
        expect(system.getSetting('a')).toBeNull();
    });

    // 同一设置项重复加入分组不会产生重复项
    it('appends to an existing group without duplicating items', () => {
        const system = new SettingSystem();
        const a = createFakeItem('a', 1);
        const b = createFakeItem('b', 2);
        system.setGroup('group', '分组', [a.item]);
        system.addSettingToGroup('group', b.item);
        system.addSettingToGroup('group', b.item);
        const group = system.getGroup('group');
        expect(Array.from(group?.items ?? []).map(item => item.id)).toEqual([
            'a',
            'b'
        ]);
    });

    // 缺失的分组与设置项都返回 null
    it('returns null for missing groups and settings', () => {
        const system = new SettingSystem();
        expect(system.getGroup('missing')).toBeNull();
        expect(system.getSetting('missing')).toBeNull();
    });

    // iterateGroups 返回全部已登记的分组条目
    it('iterates every registered group', () => {
        const system = new SettingSystem();
        const a = createFakeItem('a', 1);
        const b = createFakeItem('b', 2);
        system.setGroup('first', '第一组', [a.item]);
        system.setGroup('second', '第二组', [b.item]);
        const entries = Array.from(system.iterateGroups());
        expect(entries.map(([id]) => id)).toEqual(['first', 'second']);
        expect(entries.map(([, group]) => group.name)).toEqual([
            '第一组',
            '第二组'
        ]);
    });

    // getUngrouped 不包含已归入分组的设置项
    it('excludes grouped items from the ungrouped list', () => {
        const system = new SettingSystem();
        const a = createFakeItem('a', 1);
        const b = createFakeItem('b', 2);
        system.setGroup('group', '分组', [a.item]);
        system.setGroup('other', '另一组', [b.item]);
        expect(Array.from(system.getUngrouped())).toEqual([]);
    });

    // getValue 与 setValue 都转发给对应的设置项
    it('forwards value reads and writes to the setting item', () => {
        const system = new SettingSystem();
        const a = createFakeItem('a', 1);
        system.setGroup('group', '分组', [a.item]);
        expect(system.getValue<number>('a')).toBe(1);
        system.setValue('a', 7);
        expect(a.state.value).toBe(7);
        expect(system.getValue<number>('a')).toBe(7);
    });

    // 未登记 id 取值返回 undefined，写值不产生任何效果
    it('ignores value access for an unregistered id', () => {
        const system = new SettingSystem();
        expect(system.getValue<number>('missing')).toBeUndefined();
        expect(() => system.setValue('missing', 1)).not.toThrow();
    });

    // saveState 聚合全部已登记设置项，并把压缩级别透传给每个设置项
    it('aggregates every setting item and passes the compression level', () => {
        const system = new SettingSystem();
        const a = createFakeItem('a', 1);
        const b = createFakeItem('b', 2);
        system.setGroup('group', '分组', [a.item, b.item]);
        const save = system.saveState(SaveCompression.LowCompression);
        expect(save.values.get('a')).toBe(1);
        expect(save.values.get('b')).toBe(2);
        expect(a.state.saveCount).toBe(1);
        expect(b.state.saveCount).toBe(1);
        expect(a.state.lastCompression).toBe(SaveCompression.LowCompression);
        expect(b.state.lastCompression).toBe(SaveCompression.LowCompression);
    });

    // loadState 把每个值逐项写回对应的设置项
    it('loads every value back into its setting item', () => {
        const system = new SettingSystem();
        const a = createFakeItem('a', 1);
        const b = createFakeItem('b', 2);
        system.setGroup('group', '分组', [a.item, b.item]);
        const values = new Map<string, unknown>([
            ['a', 10],
            ['b', 20]
        ]);
        system.loadState({ values }, SaveCompression.HighCompression);
        expect(a.state.value).toBe(10);
        expect(b.state.value).toBe(20);
        expect(a.state.lastCompression).toBe(SaveCompression.HighCompression);
    });

    // loadState 遇到未登记的 id 会跳过，且不影响其它设置项
    it('skips unregistered ids while loading state', () => {
        const system = new SettingSystem();
        const a = createFakeItem('a', 1);
        system.setGroup('group', '分组', [a.item]);
        const values = new Map<string, unknown>([
            ['missing', 99],
            ['a', 5]
        ]);
        expect(() =>
            system.loadState({ values }, SaveCompression.NoCompression)
        ).not.toThrow();
        expect(a.state.value).toBe(5);
        expect(a.state.loadCount).toBe(1);
    });
});
