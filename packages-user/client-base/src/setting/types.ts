import { ISaveableContent } from '@user/data-common';
import { DefineComponent, DefineSetupFnComponent } from 'vue';

export interface ISettingComponentProps<T = unknown> {
    /** 当前设置组件对应的设置项 */
    readonly setting: ISettingItem<T>;
}

export interface ISettingItem<T = unknown> extends ISaveableContent<T> {
    /** 设置项的唯一标识 */
    readonly id: string;
    /** 设置项的名称，用于显示 */
    readonly name: string;
    /** 设置项的说明文本 */
    readonly description: string;

    /**
     * 获取当前设置项的值
     */
    getValue(): T;

    /**
     * 设置当前设置项的值
     * @param value 新的设置值
     */
    setValue(value: T): void;

    /**
     * 获取当前设置值的预览文本
     */
    getPreviewString(): string;

    /**
     * 获取用于修改此设置项的组件
     */
    getSettingComponent():
        | DefineSetupFnComponent<ISettingComponentProps>
        | DefineComponent<ISettingComponentProps>;
}

export interface ISettingItemGroup {
    /** 设置分组的名称 */
    readonly name: string;
    /** 分组包含的设置项列表 */
    readonly items: readonly ISettingItem[];
}

export interface ISettingSystemSave {
    /** 所有设置项的值，键为设置项 id */
    readonly values: ReadonlyMap<string, unknown>;
}

export interface ISettingSystem extends ISaveableContent<ISettingSystemSave> {
    /** 所有设置分组，键为分组 id */
    readonly groups: ReadonlyMap<string, ISettingItemGroup>;

    /**
     * 设置指定分组的设置项列表，若不存在分组则创建
     * @param group 设置分组 id
     * @param name 设置分组名称，用于显示
     * @param items 分组中包含的设置项
     */
    setGroup(group: string, name: string, items: ISettingItem[]): void;

    /**
     * 向设置分组中添加新的设置项
     * @param group 设置分组 id
     * @param item 要添加的设置项
     */
    addSettingToGroup(group: string, item: ISettingItem): void;

    /**
     * 获取指定的设置分组
     * @param group 设置分组 id
     */
    getGroup(group: string): ISettingItemGroup | null;

    /**
     * 获取不存在于任何分组的设置项
     */
    getUngrouped(): Iterable<ISettingItem>;

    /**
     * 获取指定的设置项
     * @param id 设置项 id
     */
    getSetting(id: string): ISettingItem | null;

    /**
     * 迭代所有的设置分组
     */
    iterateGroups(): Iterable<[id: string, group: ISettingItemGroup]>;

    /**
     * 获取指定设置项的值
     * @param id 设置项 id
     */
    getValue<T>(id: string): T | undefined;

    /**
     * 设置指定设置项的值
     * @param id 设置项 id
     * @param value 新的设置值
     */
    setValue<T>(id: string, value: T): void;
}
