import { IExcitable, IExcitation } from '@motajs/animate';
import { logger } from '@motajs/common';
import { HotkeyCommand } from './command';
import { EVENT_KEY_CODE_MAP, KeyCode } from './keyCodes';
import {
    HotkeyEmitMode,
    IHotkeyCommand,
    IHotkeyCommandInit,
    IHotkeyEmitContext,
    IHotkeyEmitInfo,
    IHotkeySystem
} from './type';

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
    /** 本次触发计时的起点，按下触发时为按下时刻，KeyUp 触发时为抬起时刻 */
    start: number;
    /** 按键组合的索引 */
    keyIndex: number;
    /** 触发此指令的按键组合 */
    keys: readonly KeyCode[];
    /** 按键触发上下文 */
    context: IHotkeyEmitContext;
    /** 按键组合匹配时刻的条件判定结果 */
    matchedWhen: boolean;
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
        // 最后一个按键为主按键，其余为辅助按键
        if (keys.at(-1) !== key) return false;
        return keys.slice(0, -1).every(v => this.holdingSet.has(v));
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
            return;
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

    addCommand(
        command: string,
        name: string,
        init: IHotkeyCommandInit
    ): IHotkeyCommand {
        const existing = this.commands.get(command);
        if (existing) {
            logger.warn(204, command);
            return existing;
        }
        const instance = new HotkeyCommand(command, name, init);
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
     * @param pending 按键指令的 pending 信息
     * @returns 是否成功执行指令
     */
    private emit(pending: IHotkeyCommandPending): boolean {
        if (!pending.matchedWhen) return false;
        const command = pending.command;
        const scope = this.getScope();
        if (!scope) return false;
        const impl = scope.implements.get(command);
        if (!impl) return false;
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
        return true;
    }

    /**
     * 获取能够触发按键指令的按键组合，多组候选时仅返回辅助键精确匹配的那一组
     * @param command 按键指令
     * @param holding 在按下触发的按键之前，有哪些按键正在被按下
     * @param emit 按下的是哪个按键
     */
    private findMatchKeys(
        command: IHotkeyCommand,
        holding: Set<KeyCode>,
        emit: KeyCode
    ): [index: number, readonly KeyCode[]] | [] {
        const candidates: [index: number, readonly KeyCode[]][] = [];
        for (const [index, keys] of command.iterateKeyCombinations()) {
            if (keys.at(-1) !== emit) continue;
            if (!keys.slice(0, -1).every(v => holding.has(v))) continue;
            candidates.push([index, keys]);
        }
        if (candidates.length === 0) return [];
        if (candidates.length === 1) return candidates[0];
        // 多组候选时只认辅助键与当前按住键完全一致的那一组
        for (const candidate of candidates) {
            if (candidate[1].length - 1 === holding.size) {
                return candidate;
            }
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
        const scope = this.getScope();
        if (!scope) return;
        const pending: IHotkeyCommandPending = {
            command,
            start: this.excitation?.payload() ?? 0,
            keyIndex: index,
            keys,
            context: this.createContext(),
            matchedWhen: scope.condition?.() ?? true,
            lastEmit: -Infinity,
            emitted: 0
        };
        this.holdingCmds.set(command, pending);
        if (command.timeout <= 0 && command.mode !== HotkeyEmitMode.KeyUp) {
            // 如果没有 timeout，那么需要立即触发一次
            this.emit(pending);
        }
    }

    /**
     * 当前是否应该进行默认行为阻断
     */
    private shouldPrevent(): boolean {
        const scope = this.getScope();
        if (!scope) return false;
        for (const [command] of this.holdingCmds) {
            const impl = scope.implements.get(command);
            if (impl) return true;
        }
        return false;
    }

    down(key: KeyCode): boolean {
        const scope = this.getScope();
        if (!scope) return false;
        const beforeHolding = new Set(this.holdingSet);
        if (this.holdingSet.has(key)) {
            // 如果有按键可能触发，那么返回 true 来 preventDefault
            return this.holdingCmds.size > 0 || this.waitTimeout.size > 0;
        } else {
            this.holding.push(key);
            this.holdingSet.add(key);
        }
        for (const command of this.commands.values()) {
            const match = this.findMatchKeys(command, beforeHolding, key);
            if (match.length === 0) continue;
            const [index, keys] = match;
            const pending = this.holdingCmds.get(command);

            if (!pending) {
                // 如果之前没有这个按键指令，那么加入执行列表，如果有的话就不管了
                this.addPending(command, index, keys);
                continue;
            }
        }
        // 如果有按键可能触发，那么返回 true 来 preventDefault
        return this.shouldPrevent();
    }

    up(key: KeyCode): boolean {
        const scope = this.getScope();
        if (!scope) return false;
        if (!this.holdingSet.has(key)) return false;
        this.holdingSet.delete(key);
        const index = this.holding.indexOf(key);
        this.holding.splice(index, 1);

        const beforeWait = this.waitTimeout.size;

        const toEmit: IHotkeyCommandPending[] = [];

        // 需要快照
        for (const [command, pending] of new Map(this.holdingCmds)) {
            // 对于 KeyUp，如果有可以触发的，那么按规则触发
            if (command.mode === HotkeyEmitMode.KeyUp) {
                if (!this.matchKeyUp(pending.keys, key)) continue;
                toEmit.push(pending);
                this.holdingCmds.delete(command);
            } else {
                // 对于其他按键，如果一个按下组合按键不再满足，那么需要删除或加入 timeout
                if (this.matchKeys(pending.keys)) continue;
                this.holdingCmds.delete(command);
                if (pending.emitted === 0) {
                    this.waitTimeout.add(pending);
                }
            }
        }

        // 抬起事件要看优先级
        toEmit.sort((a, b) => b.command.priority - a.command.priority);

        let blocking = -Infinity;
        for (const pending of toEmit) {
            if (pending.command.priority < blocking) break;
            if (!pending.matchedWhen) continue;
            // 没有实现的按键不会进行阻断
            const impl = scope.implements.get(pending.command);
            if (!impl) continue;
            if (pending.command.block) {
                blocking = pending.command.priority;
            }
            if (pending.command.timeout === 0) {
                this.emit(pending);
            } else {
                // KeyUp 的 timeout 从抬起时刻开始计时
                pending.start = this.excitation?.payload() ?? 0;
                this.waitTimeout.add(pending);
            }
        }

        // 如果有按键可能触发，那么返回 true 来 preventDefault
        return this.waitTimeout.size > beforeWait || this.shouldPrevent();
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
            if (pending.emitted === 0) {
                if (dt >= command.timeout) this.emit(pending);
                continue;
            }
            if (command.mode !== HotkeyEmitMode.Continuous) continue;
            const dt2 = payload - pending.lastEmit;
            if (pending.emitted === 1) {
                // 先看第二次触发
                if (dt2 >= command.interval) this.emit(pending);
            } else {
                // 其他的要看 dt 了
                if (dt2 >= command.dt) this.emit(pending);
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
