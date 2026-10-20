import { IExcitation } from '@motajs/animate';
import { KeyCode } from './keyCodes';

export const enum HotkeyEmitType {
    /** 由按键按下触发 */
    KeyDown,
    /** 由按键抬起触发 */
    KeyUp
}

export const enum HotkeyEmitMode {
    /** 只会触发一次 */
    Once,
    /** 按下后依据激励源进行触发 */
    Excited
}

export interface IHotkeyEmitContext {
    /** 按键触发方式 */
    readonly type: HotkeyEmitType;
    /** 触发此指令的按键 */
    readonly key: KeyCode;
    /** 当前所有正在按下的按键，按照按下的顺序排列，注意如果是抬起事件触发的，那么这里面并不会包含触发事件的那个按键 */
    readonly holding: KeyCode[];
    /** 当前是否按下了 Ctrl 按键 */
    readonly ctrl: boolean;
    /** 当前是否按下了 Shift 按键 */
    readonly shift: boolean;
    /** 当前是否按下了 Alt 按键 */
    readonly alt: boolean;
    /** 当前是否按下了 Windows(Windows) / Command(MacOS) 按键 */
    readonly meta: boolean;
}

export interface IHotkeyEmitInfo {
    /** 按键指令标识符 */
    readonly command: string;
    /** 触发此按键指令的按键组合对应索引 */
    readonly index: number;
    /** 触发此按键指令的按键组合 */
    readonly keys: KeyCode[];
    /** 按键触发上下文 */
    readonly context: IHotkeyEmitContext;
}

export interface IHotkeyCommand {
    /** 当前指令可以被多少种按键组合触发 */
    readonly length: number;

    /**
     * 设置此按键组合数量，如果小于当前值，会导致某些按键触发组合被删除
     * @param count 按键组合数量
     */
    setKeys(count: number): void;

    /**
     * 设置触发此按键指令的按键组合
     * @param index 按键组合索引
     * @param keys 按键组合
     */
    setKeyCombination(index: number, keys: KeyCode[]): void;

    /**
     * 获取指定索引的按键组合，如果组合不存在返回空数组
     * @param index 按键组合索引
     */
    getKeyCombination(index: number): KeyCode[];

    /**
     * 迭代所有的按键组合
     */
    iterateKeyCombinations(): Iterable<[index: number, key: KeyCode[]][]>;

    /**
     * 按下时只触发一次，不会连续触发
     */
    once(): void;

    /**
     * 当按下后立刻进行一次触发，之后在松开前，会按照激励源的激励触发
     * @param excitation 触发激励源
     */
    continuous(excitation: IExcitation<unknown>): void;
}

export interface IHotkeySystem {
    /**
     * 进入新的按键作用域
     */
    enterScope(): symbol;

    /**
     * 离开按键作用域
     * @param sym 指定离开的作用域，不填时默认退出到上一级
     */
    leaveScope(sym?: symbol): void;

    /**
     * 获取指定的按键指令对象
     * @param command 按键指令标识符
     */
    getCommand(command: string): IHotkeyCommand | null;

    /**
     * 添加新的按键指令
     * @param command 按键指令标识符
     */
    addCommand(command: string): IHotkeyCommand;

    /**
     * 删除指定按键指令
     * @param command 按键指令标识符
     */
    deleteCommand(command: string): void;

    /**
     * 实现按键的触发函数，仅在当前作用域生效
     * @param command 按键指令标识符
     * @param func 按键的触发函数
     */
    implement(command: string, func: (ctx: IHotkeyEmitContext) => void): void;

    /**
     * 触发指定按键命令
     * @param command 按键指令标识符
     * @param context 按键的上下文信息
     * @returns 是否执行成功，如果按键命令不存在或上下文条件无法触发指定按键指令，会返回 `false`
     */
    emit(command: string, context: IHotkeyEmitContext): boolean;
}
