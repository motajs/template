import { ISaveableContent } from '@user/data-common';
import {
    IGameUI,
    IUIController,
    UIComponent,
    UIRawProps
} from '@motajs/system';
import { DefineComponent, DefineSetupFnComponent } from 'vue';
import { IGameUIPropsBase } from '../types';
import { DefaultProps } from '@motajs/render-vue';
import { IHookable, IHookBase } from '@motajs/common';

export interface ISettingComponentProps<T> extends DefaultProps {
    /** 当前设置组件对应的设置项 */
    readonly setting: ISettingItem<T>;
    /** 当前设置组件所属的 UI 控制器 */
    readonly controller: IUIController<IGameUIPropsBase>;
}

export interface ISettingComponentEntry<
    T,
    P extends ISettingComponentProps<T> = ISettingComponentProps<T>
> {
    /** 组件对象 */
    readonly component: DefineSetupFnComponent<P> | DefineComponent<P>;
    /** 传递给组件的参数 */
    readonly props: P;
}

export interface ISettingItemHooks<T> extends IHookBase {
    /**
     * 当更新设置的值时触发
     * @param value 更新后的值
     * @param oldValue 更新前的值
     */
    onUpdateValue(value: T, oldValue: T): void;
}

export interface ISettingItem<T = unknown>
    extends IHookable<ISettingItemHooks<T>>, ISaveableContent<T> {
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
    getSettingComponent(
        base: ISettingComponentProps<T>
    ): ISettingComponentEntry<T, any>;
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

export interface ISettingOptionsBase<T> {
    /** 设置项的唯一标识 */
    readonly id: string;
    /** 设置项的名称，用于显示 */
    readonly name: string;
    /** 设置项的说明文本 */
    readonly description: string;
    /** 设置项的默认值 */
    readonly defaultValue: T;
}

export interface ISettingNumberOptions extends ISettingOptionsBase<number> {
    /** 数值的最小值 */
    readonly min: number;
    /** 数值的最大值 */
    readonly max: number;
}

export interface ISettingBooleanOptions extends ISettingOptionsBase<boolean> {}

export interface ISettingRangeOptions extends ISettingOptionsBase<number> {
    /** 设置项允许的最小值 */
    readonly min: number;
    /** 设置项允许的最大值 */
    readonly max: number;
    /** 每次调整设置项时的步长 */
    readonly step: number;
}

export interface ISettingSubPageOptions<
    T extends UIComponent
> extends ISettingOptionsBase<void> {
    /** 点击后打开的目标界面 */
    readonly page: IGameUI<T>;
    /** 打开子页面时传递给它的参数 */
    readonly props: UIRawProps<T, IGameUIPropsBase>;
}
