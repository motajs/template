import { IExcitable, IExcitableController, IExcitation } from '@motajs/animate';
import { logger } from '@motajs/common';
import { HotkeyCommand, isAuxiliaryKey } from './command';
import { EVENT_KEY_CODE_MAP, KeyCode } from './keyCodes';
import {
    HotkeyEmitMode,
    HotkeyEmitType,
    IHotkeyCommand,
    IHotkeyCommandInit,
    IHotkeyEmitContext,
    IHotkeyEmitInfo,
    IHotkeySystem
} from './type';

type HotkeyHandler = (ctx: IHotkeyEmitInfo) => void;

type HotkeyListener = (event: KeyboardEvent) => void;

interface IHotkeyScope {
    /** 作用域唯一标识符 */
    symbol: symbol;
    /** 作用域条件，为 `null` 时视为始终满足 */
    condition: (() => boolean) | null;
    /** 作用域内已实现的按键指令 */
    handlers: Map<string, HotkeyHandler>;
}

interface IHotkeyMatch {
    /** 指令标识符 */
    id: string;
    /** 指令对象 */
    command: IHotkeyCommand;
    /** 命中的按键组合索引 */
    index: number;
    /** 命中的按键组合 */
    keys: KeyCode[];
    /** 指令实现 */
    handler: HotkeyHandler;
    /** 关联的待触发项 */
    entry?: IHotkeyPending;
}

interface IHotkeyPending {
    /** 指令标识符 */
    id: string;
    /** 指令对象 */
    command: IHotkeyCommand;
    /** 命中的按键组合索引 */
    index: number;
    /** 命中的按键组合 */
    keys: KeyCode[];
    /** 指令实现 */
    handler: HotkeyHandler;
    /** 触发方式 */
    type: HotkeyEmitType;
    /** 触发此指令的按键 */
    key: KeyCode;
    /** 入队时的作用域 */
    scope: symbol;
    /** 入队时的触发方式快照 */
    mode: HotkeyEmitMode;
    /** 入队时的首次触发延迟快照 */
    timeout: number;
    /** 入队时的首次与第二次触发最小间隔快照 */
    interval: number;
    /** 入队时的节流间隔快照 */
    dt: number;
    /** 入队时刻 */
    time: number;
    /** 上一次真正触发的时刻 */
    last: number;
    /** 已触发的次数 */
    fired: number;
}

export class HotkeySystem implements IHotkeySystem, IExcitable<number> {
    listening: HTMLElement | null = null;

    /** 指令注册表 */
    private commands: Map<string, IHotkeyCommand> = new Map();
    /** 作用域栈 */
    private scopes: IHotkeyScope[] = [];
    /** 当前按下的按键，按按下顺序排列 */
    private holding: KeyCode[] = [];
    /** 待触发项 */
    private pending: IHotkeyPending[] = [];
    /** 最近一次激励负载 */
    private now: number = 0;
    /** 当前激励源控制器 */
    private controller: IExcitableController<number> | null = null;
    /** 键盘按下处理器 */
    private keyDownListener: HotkeyListener = event => {
        if (event.repeat) return;
        const key = this.resolveKeyCode(event.keyCode);
        if (key === null) return;
        if (this.down(key)) event.preventDefault();
    };
    /** 键盘抬起处理器 */
    private keyUpListener: HotkeyListener = event => {
        const key = this.resolveKeyCode(event.keyCode);
        if (key === null) return;
        if (this.up(key)) event.preventDefault();
    };

    //#region 基础

    /** 获取当前栈顶作用域 */
    private getScope(): IHotkeyScope | null {
        return this.scopes.at(-1) ?? null;
    }

    /**
     * 根据当前的按键状态构造触发上下文
     * @param type 触发方式
     * @param key 触发此指令的按键
     */
    private createContext(
        type: HotkeyEmitType,
        key: KeyCode
    ): IHotkeyEmitContext {
        const holding = this.holding.slice();
        return {
            type,
            key,
            holding,
            ctrl: holding.includes(KeyCode.Ctrl),
            shift: holding.includes(KeyCode.Shift),
            alt: holding.includes(KeyCode.Alt),
            meta: holding.includes(KeyCode.Meta)
        };
    }

    //#endregion

    //#region 组合匹配

    /**
     * 判断按键组合是否与按键抬起事件匹配
     * @param keys 按键组合
     * @param key 抬起的按键
     */
    private matchKeyUp(keys: KeyCode[], key: KeyCode): boolean {
        if (keys.length === 0) return false;
        const regular = keys.filter(v => !isAuxiliaryKey(v));
        if (regular.length > 1) return false;
        if (regular.length === 0) {
            return keys.length === 1 && keys[0] === key;
        }
        if (regular[0] !== key) return false;
        return keys
            .filter(v => isAuxiliaryKey(v))
            .every(v => this.holding.includes(v));
    }

    /**
     * 判断按键组合是否被当前按下的按键所满足
     * @param keys 按键组合
     */
    private matchKeyDown(keys: KeyCode[]): boolean {
        if (keys.length === 0) return false;
        return keys.every(v => this.holding.includes(v));
    }

    //#endregion

    //#region 待触发

    /**
     * 判断一个待触发项是否已经到期
     * @param item 待触发项
     * @param payload 当前激励负载
     */
    private isPendingDue(item: IHotkeyPending, payload: number): boolean {
        if (item.fired === 0) {
            return payload - item.time >= item.timeout;
        }
        if (item.fired === 1) {
            return payload - item.last >= item.interval;
        }
        if (item.mode === HotkeyEmitMode.Throttle) {
            return payload - item.last >= item.dt;
        }
        return true;
    }

    /** 触发所有已经到期的待触发项 */
    private flushPending(): void {
        this.dropPending();
        const due: IHotkeyPending[] = [];
        const rest: IHotkeyPending[] = [];
        for (const item of this.pending) {
            if (this.isPendingDue(item, this.now)) {
                due.push(item);
            } else {
                rest.push(item);
            }
        }
        this.pending = rest;
        due.sort((a, b) => b.command.priority - a.command.priority);
        let blocked = -Infinity;
        for (const item of due) {
            const priority = item.command.priority;
            if (priority < blocked) continue;
            item.handler({
                command: item.id,
                index: item.index,
                keys: item.keys.slice(),
                context: this.createContext(item.type, item.key)
            });
            item.last = this.now;
            item.fired += 1;
            if (item.command.block) blocked = priority;
            if (
                item.mode === HotkeyEmitMode.Once ||
                item.mode === HotkeyEmitMode.KeyUp
            ) {
                continue;
            }
            this.pending.push(item);
        }
    }

    /** 丢弃已经失效的待触发项 */
    private dropPending(): void {
        const scope = this.getScope();
        const symbol = scope ? scope.symbol : null;
        this.pending = this.pending.filter(item => {
            if (item.scope !== symbol) return false;
            if (item.command.mode !== item.mode) return false;
            if (
                item.mode !== HotkeyEmitMode.KeyUp &&
                !this.matchKeyDown(item.keys)
            ) {
                return false;
            }
            return true;
        });
    }

    //#endregion

    //#region 派发

    /**
     * 执行一批已经按优先级降序排列的匹配项
     * @param matches 匹配项
     * @param type 触发方式
     * @param key 触发此指令的按键
     */
    private runMatches(
        matches: IHotkeyMatch[],
        type: HotkeyEmitType,
        key: KeyCode
    ): boolean {
        const scope = this.getScope();
        if (!scope) return false;
        let blocked = -Infinity;
        let triggered = false;
        for (const item of matches) {
            const priority = item.command.priority;
            if (priority < blocked) break;
            const mode = item.command.mode;
            const timeout = item.command.timeout;
            const immediate = timeout <= 0;
            if (immediate) {
                item.handler({
                    command: item.id,
                    index: item.index,
                    keys: item.keys,
                    context: this.createContext(type, key)
                });
            }
            triggered = true;
            const continuous =
                mode === HotkeyEmitMode.Continuous ||
                mode === HotkeyEmitMode.Throttle;
            if (!immediate || continuous) {
                this.pending.push({
                    id: item.id,
                    command: item.command,
                    index: item.index,
                    keys: item.keys.slice(),
                    handler: item.handler,
                    type,
                    key,
                    scope: scope.symbol,
                    mode,
                    timeout,
                    interval: item.command.interval,
                    dt: item.command.dt,
                    time: this.now,
                    last: immediate ? this.now : 0,
                    fired: immediate ? 1 : 0
                });
            }
            if (item.command.block) blocked = priority;
        }
        return triggered;
    }

    /**
     * 派发一次按键事件
     * @param type 触发方式
     * @param key 触发此指令的按键
     */
    private dispatch(type: HotkeyEmitType, key: KeyCode): boolean {
        const scope = this.getScope();
        if (!scope) return false;
        if (scope.condition !== null && !scope.condition()) return false;
        const matches: IHotkeyMatch[] = [];
        for (const [id, handler] of scope.handlers) {
            const command = this.commands.get(id);
            if (!command) continue;
            const keyDown = command.mode !== HotkeyEmitMode.KeyUp;
            if (keyDown !== (type === HotkeyEmitType.KeyDown)) continue;
            let index = -1;
            let keys: KeyCode[] = [];
            for (const [i, combination] of command.iterateKeyCombinations()) {
                const hit =
                    type === HotkeyEmitType.KeyUp
                        ? this.matchKeyUp(combination, key)
                        : this.matchKeyDown(combination);
                if (hit) {
                    index = i;
                    keys = combination;
                    break;
                }
            }
            if (index < 0) continue;
            matches.push({ id, command, index, keys, handler });
        }
        matches.sort((a, b) => b.command.priority - a.command.priority);
        return this.runMatches(matches, type, key);
    }

    //#endregion

    //#region 作用域

    enterScope(): symbol {
        const symbol = Symbol();
        this.scopes.push({ symbol, condition: null, handlers: new Map() });
        this.dropPending();
        return symbol;
    }

    leaveScope(sym?: symbol): void {
        if (sym === undefined) {
            if (this.scopes.length === 0) {
                logger.warn(205);
                return;
            }
            this.scopes.pop();
            this.dropPending();
            return;
        }
        const index = this.scopes.findIndex(v => v.symbol === sym);
        if (index < 0) {
            logger.warn(205);
            return;
        }
        this.scopes.length = index + 1;
        this.dropPending();
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

    implement(command: string, func: HotkeyHandler): this {
        const scope = this.getScope();
        if (!scope) {
            logger.warn(201);
            return this;
        }
        if (!this.commands.has(command)) {
            logger.warn(202, command);
            return this;
        }
        scope.handlers.set(command, func);
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
        if (!this.commands.delete(command)) return;
        this.scopes.forEach(scope => scope.handlers.delete(command));
        this.pending = this.pending.filter(item => item.id !== command);
    }

    *iterateCommands(): Iterable<IHotkeyCommand> {
        yield* this.commands.values();
    }

    //#endregion

    //#region 按下与抬起

    down(key: KeyCode): boolean {
        if (this.holding.includes(key)) return false;
        this.holding.push(key);
        return this.dispatch(HotkeyEmitType.KeyDown, key);
    }

    up(key: KeyCode): boolean {
        const index = this.holding.indexOf(key);
        if (index < 0) return false;
        this.holding.splice(index, 1);
        this.dropPending();
        return this.dispatch(HotkeyEmitType.KeyUp, key);
    }

    //#endregion

    //#region 激励

    excitedBy(excitation: IExcitation<number>): void {
        if (this.controller) {
            this.controller.revoke();
        }
        this.controller = excitation.add(this);
    }

    excited(payload: number): void {
        this.now = payload;
        this.flushPending();
    }

    //#endregion

    //#region 监听

    /**
     * 将浏览器事件的按键码映射为按键枚举，部分浏览器的 Meta 键需要本地映射
     * @param eventKeyCode 浏览器事件的按键码
     */
    private resolveKeyCode(eventKeyCode: number): KeyCode | null {
        if (
            eventKeyCode === 91 ||
            eventKeyCode === 92 ||
            eventKeyCode === 224
        ) {
            return KeyCode.Meta;
        }
        const key = EVENT_KEY_CODE_MAP[eventKeyCode];
        return key ? key : null;
    }

    listen(target: HTMLElement | null): void {
        if (this.listening === target) return;
        if (this.listening) {
            this.listening.removeEventListener('keydown', this.keyDownListener);
            this.listening.removeEventListener('keyup', this.keyUpListener);
        }
        this.listening = target;
        if (target) {
            target.addEventListener('keydown', this.keyDownListener);
            target.addEventListener('keyup', this.keyUpListener);
        }
    }

    //#endregion
}
