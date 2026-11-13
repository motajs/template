import { IHotkeyEmitInfo } from '@motajs/system';

export interface IHotkeyUsing {
    /**
     * 获取本次 `using` 所使用的按键作用域
     */
    scope(): Promise<symbol>;

    /**
     * 设置当前的按键判断函数，当函数返回 `true` 时，按键才会真正生效
     * @param func 判断函数，返回当前是否应该生效
     */
    when(func: () => boolean): this;

    /**
     * 实现按键指令
     * @param command 按键指令
     * @param func 按键指令触发时执行的函数
     */
    implement(command: string, func: (info: IHotkeyEmitInfo) => void): this;
}
