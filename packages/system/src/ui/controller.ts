import {
    IGameUI,
    IKeepController,
    IUIInstance,
    IUIController,
    UIComponent,
    IUIDefaultPropsBase,
    IUICustomStrategy,
    UIRawProps
} from './types';
import { UIInstance } from './instance';
import {
    computed,
    h,
    ref,
    Ref,
    shallowReactive,
    shallowRef,
    ShallowRef,
    VNode
} from 'vue';
import { UIContainer } from './container';

export class UIController<
    PB extends IUIDefaultPropsBase<any>
> implements IUIController<PB> {
    readonly stack: IUIInstance<UIComponent, PB>[] = shallowReactive([]);
    readonly backIns: ShallowRef<IUIInstance<UIComponent, PB> | null>;

    background: IGameUI | null = null;
    active: Ref<boolean> = ref(false);

    readonly showBack: Ref<boolean>;

    /** 当前的自定义 UI 控制策略 */
    private strategy: IUICustomStrategy<PB>;

    /** 是否维持背景 UI */
    private keepBack: boolean = false;
    /** 用户是否显示背景 UI */
    private readonly userShowBack: Ref<boolean>;
    /** 系统是否显示背景 UI */
    private readonly sysShowBack: Ref<boolean>;

    constructor() {
        this.backIns = shallowRef(null);
        this.userShowBack = ref(true);
        this.sysShowBack = ref(true);
        this.showBack = computed(
            () => this.userShowBack.value && this.sysShowBack.value
        );
        this.strategy = new UILastOnlyStrategy();
    }

    setBackground<C extends UIComponent>(
        background: IGameUI<C> | null,
        vBind: UIRawProps<C, PB>
    ): IUIInstance<C, PB> | null {
        if (!background) {
            this.background = null;
            this.backIns.value = null;
            return null;
        } else {
            this.background = background;
            const ins = new UIInstance(background, vBind, true);
            this.backIns.value = ins;
            return ins;
        }
    }

    hideBackground() {
        this.userShowBack.value = false;
    }

    showBackground() {
        this.userShowBack.value = true;
    }

    showingBack(): boolean {
        return this.showBack.value;
    }

    render(): VNode {
        return h(UIContainer, { controller: this });
    }

    keep(): IKeepController {
        this.keepBack = true;

        return {
            safelyUnload: () => {
                if (this.stack.length > 0) return;
                this.sysShowBack.value = false;
                this.keepBack = false;
            },
            unload: () => {
                this.sysShowBack.value = false;
                this.keepBack = false;
            }
        };
    }

    open<C extends UIComponent>(
        ui: IGameUI<C>,
        vBind: UIRawProps<C, PB>,
        alwaysShow: boolean = false
    ): IUIInstance<C, PB> {
        const ins = new UIInstance(ui, vBind, alwaysShow);
        this.strategy.open(ins, this.stack);
        this.sysShowBack.value = true;
        this.active.value = true;

        return ins;
    }

    close(ui: IUIInstance<UIComponent, PB>) {
        const index = this.stack.indexOf(ui);
        if (index === -1) return;
        this.strategy.close(ui, this.stack, index);
        if (!this.keepBack && this.stack.length === 0) {
            this.sysShowBack.value = false;
            this.active.value = false;
        }

        this.keepBack = false;
    }

    closeAll(ui?: IGameUI): void {
        if (!ui) {
            const list = this.stack.slice();
            list.forEach(v => this.close(v));
        } else {
            const list = this.stack.filter(v => v.ui === ui);
            list.forEach(v => this.close(v));
        }
    }

    hide(ins: IUIInstance<UIComponent, PB>): void {
        const index = this.stack.indexOf(ins);
        if (index === -1) return;
        this.strategy.hide(ins, this.stack, index);
    }

    show(ins: IUIInstance<UIComponent, PB>): void {
        const index = this.stack.indexOf(ins);
        if (index === -1) return;
        this.strategy.show(ins, this.stack, index);
    }

    lastOnly(stack: boolean = true) {
        this.showCustom(new UILastOnlyStrategy(stack));
    }

    showAll(stack: boolean = false) {
        this.showCustom(new UIShowAllStrategy(stack));
    }

    showCustom(stratygy: IUICustomStrategy<PB>) {
        this.strategy = stratygy;
        stratygy.update(this.stack);
    }
}

class UILastOnlyStrategy implements IUICustomStrategy<any> {
    /** 是否启用栈模式 */
    readonly stack: boolean;

    constructor(stack: boolean = true) {
        this.stack = stack;
    }

    open(
        ins: IUIInstance<UIComponent, any>,
        stack: IUIInstance<UIComponent, any>[]
    ): void {
        stack.push(ins);
        stack.forEach(v => v.hide());
        stack.findLast(v => !v.alwaysShow)?.show();
    }

    close(
        _ins: IUIInstance<UIComponent, any>,
        stack: IUIInstance<UIComponent, any>[],
        index: number
    ): void {
        if (this.stack) {
            stack.splice(index);
        } else {
            stack.splice(index, 1);
        }
        stack.forEach(v => v.hide());
        stack.findLast(v => !v.alwaysShow)?.show();
    }

    hide(ins: IUIInstance<UIComponent, any>): void {
        ins.hide();
    }

    show(ins: IUIInstance<UIComponent, any>): void {
        ins.show();
    }

    update(stack: IUIInstance<UIComponent, any>[]): void {
        stack.forEach(v => v.hide());
        stack.findLast(v => !v.alwaysShow)?.show();
    }
}

class UIShowAllStrategy implements IUICustomStrategy<any> {
    /** 是否启用栈模式 */
    readonly stack: boolean;

    constructor(stack: boolean = true) {
        this.stack = stack;
    }

    open(
        ins: IUIInstance<UIComponent, any>,
        stack: IUIInstance<UIComponent, any>[]
    ): void {
        stack.push(ins);
    }

    close(
        _ins: IUIInstance<UIComponent, any>,
        stack: IUIInstance<UIComponent, any>[],
        index: number
    ): void {
        if (this.stack) {
            stack.splice(index);
        } else {
            stack.splice(index, 1);
        }
    }

    hide(ins: IUIInstance<UIComponent, any>): void {
        ins.hide();
    }

    show(ins: IUIInstance<UIComponent, any>): void {
        ins.show();
    }

    update(stack: IUIInstance<UIComponent, any>[]): void {
        stack.forEach(v => v.show());
    }
}
