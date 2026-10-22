import { IHotkeyCommand, IHotkeySystem, KeyCode } from '@motajs/system';
import { ISaveableContent } from '@user/data-common';

export interface IClientHotkeySave {
    /** 按键指令列表 */
    readonly keys: ReadonlyMap<string, readonly (readonly KeyCode[])[]>;
}

export interface IClientHotkey extends ISaveableContent<IClientHotkeySave> {
    /** 按键系统对象 */
    readonly system: IHotkeySystem;

    /**
     * 设置指定分组的按键指令列表，若不存在分组则创建，若传入空数组则删除
     * @param group 按键分组名
     * @param commands 分组中包含的按键指令名
     */
    setGroup(group: string, commands: IHotkeyCommand[]): void;

    /**
     * 获取指定按键分组中包含的按键，如果不存在则返回空数组
     * @param group 按键分组名
     */
    getGroup(group: string): IHotkeyCommand[];

    /**
     * 获取未分组的按键列表
     */
    getUngrouped(): Iterable<IHotkeyCommand>;
}
