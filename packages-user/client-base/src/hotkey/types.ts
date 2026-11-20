import { IHotkeyCommand, IHotkeySystem, KeyCode } from '@motajs/system';
import { ISaveableContent } from '@user/data-common';

export interface IHotkeyCommandGroup {
    /** 按键分组的名称 */
    readonly name: string;
    /** 分组包含的按键指令列表 */
    readonly commands: IHotkeyCommand[];
}

export interface IClientHotkeySave {
    /** 按键指令列表 */
    readonly keys: ReadonlyMap<string, readonly (readonly KeyCode[])[]>;
}

export interface IClientHotkey extends ISaveableContent<IClientHotkeySave> {
    /** 按键系统对象 */
    readonly system: IHotkeySystem;

    /**
     * 设置指定分组的按键指令列表，若不存在分组则创建，若传入空数组则删除
     * @param group 按键分组 id
     * @param name 按键分组名称，用于显示
     * @param commands 分组中包含的按键指令名
     */
    setGroup(group: string, name: string, commands: IHotkeyCommand[]): void;

    /**
     * 向按键分组中添加新的按键指令
     * @param group 按键分组 id
     * @param command 要添加的按键指令
     */
    addCommandToGroup(group: string, command: IHotkeyCommand): void;

    /**
     * 获取指定按键分组中包含的按键
     * @param group 按键分组名
     */
    getGroup(group: string): IHotkeyCommandGroup | null;

    /**
     * 获取未分组的按键列表
     */
    getUngrouped(): Iterable<IHotkeyCommand>;

    /**
     * 迭代所有的按键分组
     */
    iterateGroups(): Iterable<[id: string, group: IHotkeyCommandGroup]>;
}
