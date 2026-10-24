import { IHotkeyEmitInfo, IHotkeySystem } from '@motajs/system';
import { IHotkeyUsing } from './types';
import { getCurrentInstance, onMounted, onUnmounted } from 'vue';
import { logger } from '@motajs/common';

class HotkeyUsing implements IHotkeyUsing {
    /** 作用域 Promise */
    private readonly scopePromise: Promise<symbol>;

    /** 当前是否已经挂载 */
    private mounted: boolean = false;
    /** 当前按键作用域 */
    private keyScope: symbol | null = null;
    /** 当前的按键实现对象 */
    private impl: Map<string, (info: IHotkeyEmitInfo) => void> = new Map();

    constructor(
        readonly system: IHotkeySystem,
        clearImpl: boolean
    ) {
        const { promise, resolve } = Promise.withResolvers<symbol>();
        this.scopePromise = promise;

        onMounted(() => {
            this.mounted = true;
            const scope = system.enterScope(clearImpl);
            this.keyScope = scope;
            resolve(scope);
            for (const [command, func] of this.impl) {
                system.implement(command, func);
            }
            this.impl.clear();
        });

        onUnmounted(() => {
            if (this.keyScope) {
                system.leaveScope(this.keyScope);
            } else {
                logger.warn(211);
            }
        });
    }

    scope(): Promise<symbol> {
        return this.scopePromise;
    }

    implement(command: string, func: (info: IHotkeyEmitInfo) => void): this {
        if (this.mounted) {
            this.system.implement(command, func);
        } else {
            this.impl.set(command, func);
        }
        return this;
    }
}

/**
 * 生成仅在当前组件的生命周期中生效的按键指令对象，必须在 Vue 组件中调用，否则会返回 `null`
 * @param system 按键系统
 * @param clearImpl 是否清空上一个作用域的按键实现，默认清空。不清空时，上一个作用域的按键实现依旧在新作用域生效，
 *                  若清空，则不会生效，只有当当前的作用域被释放后才会继续生效。
 */
export function useKey(
    system: IHotkeySystem,
    clearImpl: boolean = true
): IHotkeyUsing | null {
    const instance = getCurrentInstance();
    if (!instance) return null;
    return new HotkeyUsing(system, clearImpl);
}
