import { IExcitation } from '@motajs/animate';
import { KeyCode } from './keyCodes';

// 需要注意的是，所有的 “最小触发间隔” 指的都是系统能保证两次按键的触发间隔不小于此值，并不能保证等于此值，
// 更不能保证连续触发 n 次后，总体经过的时间为 n 乘以此间隔。
// 例如，如果触发了 10 次，触发间隔为 100ms，那么经过的时间一定大于等于 1000ms，绝大多数情况下都会大于 1000ms。
// 因此，不要拿这个触发间隔作为精确计时器，需要精确计时器时使用传递给系统的激励源的 `payload` 接口获取。

export const enum HotkeyEmitMode {
    /** 按键抬起时触发 */
    KeyUp,
    /** 按下时只会触发一次 */
    Once,
    /** 按下后依据激励源进行触发 */
    Continuous
}

export interface IHotkeyEmitContext {
    /**
     * 指令触发时，当前所有正在按下的按键，按照按下的顺序排列。如果是抬起事件触发的，那么这里面并不会包含触发事件的那个主要按键。
     * 注意该成员的含义不是当前时刻的按下的按键，对于连续触发以及 `timeout`，依然会包含触发此指令的时刻按下的按键。
     * 也就是说，它并不是当前时刻按下的按键，不要用它获取当前时刻正在按下的按键。参考时间线：
     *
     * ```txt
     * ----------|---------------|---------->
     *           |    timeout    |
     *      指令触发时刻       指令延时触发
     *      记录的是这个        而不是这个
     * ```
     */
    readonly holding: readonly KeyCode[];
    /** 指令触发时是否按下了 Ctrl 按键 */
    readonly ctrl: boolean;
    /** 指令触发时是否按下了 Shift 按键 */
    readonly shift: boolean;
    /** 指令触发时是否按下了 Alt 按键 */
    readonly alt: boolean;
    /** 指令触发时是否按下了 Windows(Windows) / Command(MacOS) 按键 */
    readonly meta: boolean;
}

export interface IHotkeyEmitInfo {
    /** 按键触发方式 */
    readonly mode: HotkeyEmitMode;
    /** 按键指令对象 */
    readonly command: IHotkeyCommand;
    /** 触发此按键指令的按键组合对应索引 */
    readonly index: number;
    /** 触发此按键指令的按键组合。如果有两组按键组合能触发，那么仅包含触发较晚的那一个 */
    readonly keys: readonly KeyCode[];
    /** 按键触发上下文 */
    readonly context: IHotkeyEmitContext;
}

export interface IHotkeyCommandInit {
    /** 按键指令优先级 */
    readonly priority: number;
    /** 默认按键组合，可设置多组 */
    readonly defaults: KeyCode[][];
    /** 是否阻断优先级精确比此按键指令更低的指令的执行，同优先级的会全部执行，并不会阻断，默认不阻断 */
    readonly block?: boolean;
    /** 按键触发方式，默认为抬起时触发 */
    readonly mode?: HotkeyEmitMode;
    /** 从指定按键组合被触发，至指令首次被真正执行期间，最少经过的时间 */
    readonly timeout?: number;
    /** 在按下的持续触发模式或节流触发模式下，首次指令被触发，至第二次指令被触发，最少经过的时间 */
    readonly interval?: number;
    /** 在按下的节流触发模式下，两次指令触发要经过的最少时间 */
    readonly dt?: number;
}

export interface IHotkeyCommand {
    /** 按键指令的标识符 */
    readonly command: string;
    /** 按键指令优先级，越高越先执行，如果同优先级，则无法保证顺序 */
    readonly priority: number;
    /** 触发后，是否阻断优先级比当前优先级更低的按键的触发 */
    readonly block: boolean;
    /** 当前指令可以被多少种按键组合触发 */
    readonly length: number;
    /** 按键触发方式 */
    readonly mode: HotkeyEmitMode;
    /** 首次触发与第二次触发的最小时间间隔 */
    readonly interval: number;
    /** 按下后距离第一次触发的最小时间间隔 */
    readonly timeout: number;
    /** 连续触发模式下，两次触发之间的最小时间间隔 */
    readonly dt: number;

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
    setKeyCombination(index: number, keys: readonly KeyCode[]): void;

    /**
     * 获取指定索引的按键组合，如果组合不存在返回空数组
     * @param index 按键组合索引
     */
    getKeyCombination(index: number): readonly KeyCode[];

    /**
     * 迭代所有的按键组合
     */
    iterateKeyCombinations(): Iterable<
        [index: number, key: readonly KeyCode[]]
    >;

    /**
     * 抬起后，在经过 `timeout` 时间后触发一次
     * @param timeout 抬起后距离首次触发的时间间隔，单位毫秒，默认为 0
     */
    keyUp(timeout?: number): void;

    /**
     * 按下后，在经过 `timeout` 时间后只触发一次，不会连续触发
     * @param timeout 按下后距离首次触发的时间间隔，单位毫秒，默认为 0
     */
    once(timeout?: number): void;

    /**
     * 当按下后，在经过 `timeout` 时间后进行一次触发，之后在松开前，会按照激励源的激励触发
     * @param interval 第一次触发距离第二次触发的最小时间间隔，设置后，按下时会立刻进行一次触发，
     *                 而第二次触发需要等待 `interval` 毫秒才会触发。默认为 0
     * @param dt 节流间隔，默认为 0，即每次激励源的激励都会触发
     * @param timeout 按下后距离首次触发的时间间隔，单位号码，默认为 0
     */
    continuous(interval?: number, dt?: number, timeout?: number): void;
}

export interface IHotkeySystem {
    /** 当前正在监听的元素 */
    readonly listening: HTMLElement | null;
    /** 当前正在按下的按键，按照按下的顺序排序 */
    readonly holding: readonly KeyCode[];

    /**
     * 设置当前按键系统由指定激励源所激励，用于连续触发按下后持续触发等触发场景
     * @param excitation 激励源
     */
    excitedBy(excitation: IExcitation<number> | null): void;

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
     * @param init 指令初始化对象
     */
    addCommand(command: string, init: IHotkeyCommandInit): IHotkeyCommand;

    /**
     * 删除指定按键指令
     * @param command 按键指令标识符
     */
    deleteCommand(command: string): void;

    /**
     * 迭代当前所有注册的按键指令
     */
    iterateCommands(): Iterable<IHotkeyCommand>;

    /**
     * 设置按键指令的触发判断函数，当函数返回 `true` 时才可能触发按键指令
     * @param func 判断函数，返回 `true` 时才可能触发按键指令
     */
    when(func: () => boolean): this;

    /**
     * 实现按键的触发函数，仅在当前作用域生效
     * @param command 按键指令标识符
     * @param func 按键的触发函数
     */
    implement(command: string, func: (ctx: IHotkeyEmitInfo) => void): this;

    /**
     * 按下指定按键
     * @param key 按键码
     * @returns 是否至少有一个已实现的指令被因此触发，包括将要延时触发的
     */
    down(key: KeyCode): boolean;

    /**
     * 松开指定按键
     * @param key 按键码
     * @returns 是否至少有一个已实现的指令被因此触发，包括将要延时触发的
     */
    up(key: KeyCode): boolean;

    /**
     * 监听目标元素
     * @param target 监听的目标元素
     */
    listen(target: HTMLElement | null): void;
}
