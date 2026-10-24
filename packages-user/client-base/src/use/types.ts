import { IHotkeyEmitInfo } from '@motajs/system';

export interface IHotkeyUsing {
    /**
     * 获取本次 `using` 所使用的按键作用域
     */
    scope(): Promise<symbol>;

    /**
     * 实现按键指令
     * @param command 按键指令
     * @param func 按键指令触发时执行的函数
     */
    implement(command: string, func: (info: IHotkeyEmitInfo) => void): this;
}
