import { Reactive, reactive, Ref, ref } from 'vue';
import {
    IGameUI,
    IUIDefaultPropsBase,
    IUIInstance,
    UIComponent,
    UIRawProps
} from './types';

/** 自增 UI 实例计数器 */
let counter = 0;

export class UIInstance<
    C extends UIComponent,
    PB extends IUIDefaultPropsBase<C>
> implements IUIInstance<C, PB> {
    readonly key: number = counter++;
    readonly ui: IGameUI<C>;
    readonly hidden: Ref<boolean> = ref(false);
    readonly vBind: Reactive<UIRawProps<C, PB>>;
    readonly alwaysShow: boolean;

    constructor(
        ui: IGameUI<C>,
        vBind: UIRawProps<C, PB>,
        alwaysShow: boolean = false
    ) {
        this.ui = ui;
        this.vBind = reactive(vBind);
        this.alwaysShow = alwaysShow;
    }

    hide(): void {
        if (!this.alwaysShow) this.hidden.value = true;
    }

    show(): void {
        this.hidden.value = false;
    }
}
