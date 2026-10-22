import { IExcitable, IExcitation } from '@motajs/animate';
import { logger, matchArray } from '@motajs/common';
import { HotkeyCommand, isAuxiliaryKey } from './command';
import { EVENT_KEY_CODE_MAP, KeyCode } from './keyCodes';
import {
    HotkeyEmitMode,
    IHotkeyCommand,
    IHotkeyCommandInit,
    IHotkeyEmitContext,
    IHotkeyEmitInfo,
    IHotkeySystem
} from './type';

// TODO: 优先级阻断

interface IHotkeyScope {
    /** 作用域唯一标识符 */
    readonly symbol: symbol;
    /** 作用域内已实现的按键指令 */
    readonly implements: Map<IHotkeyCommand, (info: IHotkeyEmitInfo) => void>;
    /** 作用域条件，为 `null` 时视为始终满足 */
    condition: (() => boolean) | null;
}

interface IHotkeyCommandPending {
    /** 按键指令对象 */
    readonly command: IHotkeyCommand;
    /** 按键组合被按下的时刻 */
    start: number;
    /** 按键组合的索引 */
    keyIndex: number;
    /** 触发此指令的按键组合 */
    keys: readonly KeyCode[];
    /** 按键触发上下文 */
    context: IHotkeyEmitContext;
    /** 当前已经触发了几次 */
    emitted: number;
    /** 上一次的触发时刻 */
    lastEmit: number;
}

export class HotkeySystem implements IHotkeySystem, IExcitable<number> {
    listening: HTMLElement | null = null;
    holding: KeyCode[] = [];

    /** 指令注册表 */
    private commands: Map<string, IHotkeyCommand> = new Map();
    /** 作用域栈 */
    private scopes: IHotkeyScope[] = [];

    /** 当前使用的激励源 */
    private excitation: IExcitation<number> | null = null;

    /** 当前正在按下的按键组成的集合 */
    private holdingSet: Set<KeyCode> = new Set();
    /** 如果按键指令都是按下时触发，那么当前的按键组合下，有可能触发哪些按键 */
    private holdingCmds: Map<IHotkeyCommand, IHotkeyCommandPending> = new Map();
    /** 需要等待 `timeout` 进行一次触发的指令集合 */
    private waitTimeout: Set<IHotkeyCommandPending> = new Set();

    /** 键盘按下监听器 */
    private keyDownListener: (ev: KeyboardEvent) => void;
    /** 键盘抬起监听器 */
    private keyUpListener: (ev: KeyboardEvent) => void;

    constructor() {
        const keyDown = (event: KeyboardEvent) => {
            const key = this.resolveKeyCode(event.keyCode);
            if (this.holding.includes(key)) return;
            if (key === KeyCode.Unknown) return;
            const emitted = this.down(key);
            if (emitted) event.preventDefault();
        };
        const keyUp = (event: KeyboardEvent) => {
            const key = this.resolveKeyCode(event.keyCode);
            if (key === KeyCode.Unknown) return;
            const emitted = this.up(key);
            if (emitted) event.preventDefault();
        };
        this.keyDownListener = keyDown;
        this.keyUpListener = keyUp;
    }

    /**
     * 将浏览器事件的按键码映射为按键枚举，部分浏览器的 Meta 键需要本地映射
     * @param eventKeyCode 浏览器事件的按键码
     */
    private resolveKeyCode(eventKeyCode: number): KeyCode {
        if (
            eventKeyCode === 91 ||
            eventKeyCode === 92 ||
            eventKeyCode === 224
        ) {
            return KeyCode.Meta;
        }
        const key = EVENT_KEY_CODE_MAP[eventKeyCode];
        return key ?? KeyCode.Unknown;
    }

    /**
     * 获取当前栈顶作用域
     */
    private getScope(): IHotkeyScope | null {
        return this.scopes.at(-1) ?? null;
    }

    /**
     * 根据当前的按键状态构造触发上下文
     * @param type 触发方式
     * @param key 触发此指令的按键
     */
    private createContext(): IHotkeyEmitContext {
        return {
            holding: this.holding,
            ctrl: this.holdingSet.has(KeyCode.Ctrl),
            shift: this.holdingSet.has(KeyCode.Shift),
            alt: this.holdingSet.has(KeyCode.Alt),
            meta: this.holdingSet.has(KeyCode.Meta)
        };
    }

    /**
     * 判断按键组合是否与按键抬起事件匹配
     * @param keys 当前的按键组合
     * @param key 抬起的按键
     */
    private matchKeyUp(keys: readonly KeyCode[], key: KeyCode): boolean {
        if (keys.length === 0) return false;
        // 抬起按键仅允许一个非辅助按键
        const [main, auxiliary] = matchArray(keys, v => isAuxiliaryKey(v));
        if (main.length > 1) return false;

        // 如果只有一个按键，那么可以触发，哪怕它是辅助按键
        if (main.length === 0) {
            return auxiliary.length === 1 && auxiliary[0] === key;
        }

        // 否则需要判断触发的按键
        if (main[0] !== key) return false;
        return auxiliary.every(v => this.holdingSet.has(v));
    }

    /**
     * 判断一个按键组合当前是否满足
     * @param keys 按键组合
     */
    private matchKeys(keys: readonly KeyCode[]) {
        return keys.every(v => this.holdingSet.has(v));
    }

    //#region 作用域

    enterScope(): symbol {
        const symbol = Symbol();
        this.scopes.push({ symbol, condition: null, implements: new Map() });
        this.holdingCmds.clear();
        this.waitTimeout.clear();
        return symbol;
    }

    leaveScope(sym?: symbol): void {
        if (!sym) {
            if (this.scopes.length === 0) {
                logger.warn(205);
                return;
            }
            this.scopes.pop();
            this.holdingCmds.clear();
            this.waitTimeout.clear();
        }
        const index = this.scopes.findIndex(v => v.symbol === sym);
        if (index < 0) {
            logger.warn(205);
            return;
        }
        this.scopes.splice(index + 1);
        this.holdingCmds.clear();
        this.waitTimeout.clear();
    }

    when(func: () => boolean): this {
        const scope = this.getScope();
        if (!scope) {
            logger.warn(201);
            return this;
        }
        scope.condition = func;
        return this;
    }

    implement(command: string, func: (ctx: IHotkeyEmitInfo) => void): this {
        const scope = this.getScope();
        if (!scope) {
            logger.warn(201);
            return this;
        }
        const obj = this.commands.get(command);
        if (!obj) {
            logger.warn(202, command);
            return this;
        }
        scope.implements.set(obj, func);
        return this;
    }

    //#endregion

    //#region 指令注册表

    getCommand(command: string): IHotkeyCommand | null {
        return this.commands.get(command) ?? null;
    }

    addCommand(command: string, init: IHotkeyCommandInit): IHotkeyCommand {
        const existing = this.commands.get(command);
        if (existing) {
            logger.warn(204, command);
            return existing;
        }
        const instance = new HotkeyCommand(command, init);
        this.commands.set(command, instance);
        return instance;
    }

    deleteCommand(command: string): void {
        const obj = this.commands.get(command);
        if (!obj) return;
        this.commands.delete(command);
        this.scopes.forEach(scope => scope.implements.delete(obj));
        this.holdingCmds.delete(obj);
        const toDeleteWait = new Set<IHotkeyCommandPending>();
        this.waitTimeout.forEach(v => {
            if (v.command === obj) {
                toDeleteWait.add(v);
            }
        });
        toDeleteWait.forEach(v => {
            this.waitTimeout.delete(v);
        });
    }

    iterateCommands(): Iterable<IHotkeyCommand> {
        return this.commands.values();
    }

    //#endregion

    //#region 按下与抬起

    /**
     * 触发指定按键指令
     * @param command 按键指令对象
     * @param pending 按键指令的 pending 信息
     */
    private emit(pending: IHotkeyCommandPending) {
        const command = pending.command;
        const scope = this.getScope();
        if (!scope) return;
        const impl = scope.implements.get(command);
        if (!impl) return;
        const info: IHotkeyEmitInfo = {
            mode: command.mode,
            command,
            index: pending.keyIndex,
            keys: pending.keys,
            context: pending.context
        };
        impl(info);
        pending.emitted++;
        pending.lastEmit = this.excitation?.payload() ?? 0;
    }

    /**
     * 获取首个能够触发按键指令的按键组合
     * @param command 按键指令
     */
    private findMatchKeys(
        command: IHotkeyCommand
    ): [index: number, readonly KeyCode[]] | [] {
        for (const [index, keys] of command.iterateKeyCombinations()) {
            const match = keys.every(v => this.holdingSet.has(v));
            if (match) return [index, keys];
        }
        return [];
    }

    /**
     * 添加可能触发的按键指令
     * @param command 按键指令对象
     * @param index 触发的按键索引
     * @param keys 按键组合
     */
    private addPending(
        command: IHotkeyCommand,
        index: number,
        keys: readonly KeyCode[]
    ) {
        const pending: IHotkeyCommandPending = {
            command,
            start: this.excitation?.payload() ?? 0,
            keyIndex: index,
            keys,
            context: this.createContext(),
            lastEmit: -Infinity,
            emitted: 0
        };
        this.holdingCmds.set(command, pending);
        if (command.timeout <= 0 && command.mode !== HotkeyEmitMode.KeyUp) {
            // 如果没有 timeout，那么需要立即触发一次
            this.emit(pending);
        }
    }

    down(key: KeyCode): boolean {
        if (this.holdingSet.has(key)) {
            // 如果有按键可能触发，那么返回 true 来 preventDefault
            return this.holdingCmds.size > 0 || this.waitTimeout.size > 0;
        } else {
            this.holding.push(key);
            this.holdingSet.add(key);
        }
        for (const command of this.commands.values()) {
            const match = this.findMatchKeys(command);
            if (match.length === 0) continue;
            const [index, keys] = match;
            const pending = this.holdingCmds.get(command);

            if (pending) {
                // 如果之前有过这个按键指令，那么直接修改现有状态
                pending.keyIndex = index;
                pending.keys = keys;
                pending.context = this.createContext();
            } else {
                // 如果之前没有这个按键指令，那么加入执行列表
                this.addPending(command, index, keys);
                continue;
            }
        }
        // 如果有按键可能触发，那么返回 true 来 preventDefault
        return this.holdingCmds.size > 0 || this.waitTimeout.size > 0;
    }

    up(key: KeyCode): boolean {
        if (!this.holdingSet.has(key)) return false;
        this.holdingSet.delete(key);
        const index = this.holding.indexOf(key);
        this.holding.splice(index, 1);

        // 需要快照
        for (const [command, pending] of new Map(this.holdingCmds)) {
            // 对于 KeyUp，如果有可以触发的，那么按规则触发
            if (command.mode === HotkeyEmitMode.KeyUp) {
                const emit = this.matchKeyUp(pending.keys, key);
                if (emit) {
                    this.emit(pending);
                    this.holdingCmds.delete(command);
                }
            } else {
                // 对于其他按键，如果一个按下组合按键不再满足，那么需要删除或加入 timeout
                if (!this.matchKeys(pending.keys)) {
                    // 松开一个按键，那么并不一定会导致按下指令不再触发
                    const newMatch = this.findMatchKeys(command);
                    if (newMatch.length === 0) {
                        // 没有新的匹配，分两种情况
                        if (pending.emitted === 0) {
                            // 还没触发过，加入 timeout
                            this.waitTimeout.add(pending);
                        } else {
                            // 已经触发过了，直接删除
                            this.holdingCmds.delete(command);
                        }
                    } else {
                        // 如果有新的匹配，那么直接修改状态
                        const [index, keys] = newMatch;
                        pending.context = this.createContext();
                        pending.keyIndex = index;
                        pending.keys = keys;
                    }
                }
            }
        }

        // 如果有按键可能触发，那么返回 true 来 preventDefault
        return this.holdingCmds.size > 0 || this.waitTimeout.size > 0;
    }

    //#endregion

    //#region 激励

    excitedBy(excitation: IExcitation<number> | null): void {
        if (this.excitation) {
            this.excitation.remove(this);
        }
        this.excitation = excitation;
        if (excitation) {
            excitation.add(this);
        }
    }

    excited(payload: number): void {
        // 先判定 timeout，需要快照
        for (const pending of new Set(this.waitTimeout)) {
            const dt = payload - pending.start;
            if (dt >= pending.command.timeout) {
                this.emit(pending);
                this.waitTimeout.delete(pending);
            }
        }

        // 再看 holding，这个不会删，所以不需要快照
        for (const [command, pending] of this.holdingCmds) {
            // 抬起不会在这里触发
            if (command.mode === HotkeyEmitMode.KeyUp) continue;
            // 首次触发
            const dt = payload - pending.start;
            const dt2 = payload - pending.lastEmit;
            if (pending.emitted === 0 && dt < command.timeout) {
                this.emit(pending);
            }
            if (command.mode === HotkeyEmitMode.Continuous) {
                if (pending.emitted === 1) {
                    // 先看第二次触发
                    if (dt2 >= command.interval) {
                        this.emit(pending);
                    }
                } else {
                    // 其他的要看 dt 了
                    if (dt2 >= command.dt) {
                        this.emit(pending);
                    }
                }
            }
        }
    }

    //#endregion

    //#region 监听

    listen(target: HTMLElement | null): void {
        if (this.listening === target) return;

        if (this.listening) {
            this.listening.removeEventListener('keydown', this.keyDownListener);
            this.listening.removeEventListener('keyup', this.keyUpListener);
        }

        if (target) {
            target.addEventListener('keydown', this.keyDownListener);
            target.addEventListener('keyup', this.keyUpListener);
        }

        this.listening = target;
    }

    //#endregion
}
