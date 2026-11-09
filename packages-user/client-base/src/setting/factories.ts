import { DefineSetupFnComponent } from 'vue';
import { IGameUI, UIComponent, UIRawProps } from '@motajs/system';
import {
    ISettingItem,
    ISettingBooleanOptions,
    ISettingComponentProps,
    ISettingNumberOptions,
    ISettingRangeOptions,
    ISettingSubPageOptions,
    ISettingComponentEntry,
    ISettingItemHooks
} from './types';
import { clamp } from 'lodash-es';
import {
    BooleanSettingComponent,
    INumberSettingProps,
    IRangeSettingProps,
    ISubPageSettingProps,
    NumberSettingComponent,
    RangeSettingComponent,
    SubPageSettingComponent
} from './controls';
import {
    Hookable,
    HookController,
    IHookBase,
    IHookController,
    logger
} from '@motajs/common';
import { IGameUIPropsBase } from '../types';

/**
 * 将数值按步长对齐并收敛到允许的区间内，同时消除浮点计算产生的尾差
 * @param value 原始数值
 * @param min 允许的最小值
 * @param max 允许的最大值
 * @param step 对齐使用的步长
 */
function clampSettingValue(
    value: number,
    min: number,
    max: number,
    step: number
): number {
    const aligned = Math.round((value - min) / step) * step + min;
    const clamped = Math.min(max, Math.max(min, aligned));
    return Number(clamped.toFixed(6));
}

export class NumberSetting
    extends Hookable<ISettingItemHooks<number>>
    implements ISettingItem<number>
{
    readonly id: string;
    readonly name: string;
    readonly description: string;

    /** 数值最小值 */
    private readonly min: number;
    /** 数值最大值 */
    private readonly max: number;

    /** 当前值 */
    private value: number;

    constructor(options: ISettingNumberOptions) {
        super();
        this.id = options.id;
        this.name = options.name;
        this.description = options.description;
        this.min = options.min;
        this.max = options.max;
        this.value = options.defaultValue;
    }

    protected createController(
        hook: Partial<IHookBase>
    ): IHookController<IHookBase> {
        return new HookController(this, hook);
    }

    getValue(): number {
        return this.value;
    }

    setValue(value: number): void {
        const before = this.value;
        this.value = clamp(value, this.min, this.max);
        this.forEachHook(hook => hook.onUpdateValue?.(value, before));
    }

    getPreviewString(): string {
        return this.value.toString();
    }

    getSettingComponent(
        base: ISettingComponentProps<number>
    ): ISettingComponentEntry<number, INumberSettingProps> {
        return {
            component: NumberSettingComponent,
            props: {
                ...base,
                min: this.min,
                max: this.max
            }
        };
    }

    saveState(): number {
        return this.value;
    }

    loadState(state: number): void {
        this.setValue(state);
    }
}

export class BooleanSetting
    extends Hookable<ISettingItemHooks<boolean>>
    implements ISettingItem<boolean>
{
    readonly id: string;
    readonly name: string;
    readonly description: string;

    /** 当前值 */
    private value: boolean;

    constructor(options: ISettingBooleanOptions) {
        super();
        this.id = options.id;
        this.name = options.name;
        this.description = options.description;
        this.value = options.defaultValue;
    }

    protected createController(
        hook: Partial<ISettingItemHooks<boolean>>
    ): IHookController<ISettingItemHooks<boolean>> {
        return new HookController(this, hook);
    }

    getValue(): boolean {
        return this.value;
    }

    setValue(value: boolean): void {
        this.value = value;
    }

    getPreviewString(): string {
        return this.value ? '开' : '关';
    }

    getSettingComponent(
        base: ISettingComponentProps<boolean>
    ): ISettingComponentEntry<boolean> {
        return {
            component: BooleanSettingComponent,
            props: {
                ...base
            }
        };
    }

    saveState(): boolean {
        return this.value;
    }

    loadState(state: boolean): void {
        this.value = state;
    }
}

export class RangeSetting
    extends Hookable<ISettingItemHooks<number>>
    implements ISettingItem<number>
{
    readonly id: string;
    readonly name: string;
    readonly description: string;

    /** 数值的最小值 */
    private readonly min: number;
    /** 数值的最大值 */
    private readonly max: number;
    /** 数值的步长 */
    private readonly step: number;

    /** 当前值 */
    private value: number;

    constructor(options: ISettingRangeOptions) {
        super();
        this.id = options.id;
        this.name = options.name;
        this.description = options.description;
        this.min = options.min;
        this.max = options.max;
        this.step = options.step;
        this.value = options.defaultValue;

        const steps = (this.max - this.min) / this.step;
        if (Math.abs(steps - Math.round(steps)) > 1e-8) {
            logger.warn(
                214,
                this.min.toString(),
                this.max.toString(),
                this.step.toString()
            );
        }
    }

    protected createController(
        hook: Partial<ISettingItemHooks<number>>
    ): IHookController<ISettingItemHooks<number>> {
        return new HookController(this, hook);
    }

    getValue(): number {
        return this.value;
    }

    setValue(value: number): void {
        this.value = clampSettingValue(value, this.min, this.max, this.step);
    }

    getPreviewString(): string {
        return this.value.toString();
    }

    getSettingComponent(
        base: ISettingComponentProps<number>
    ): ISettingComponentEntry<number, IRangeSettingProps> {
        return {
            component: RangeSettingComponent,
            props: {
                ...base,
                min: this.min,
                max: this.max,
                step: this.step
            }
        };
    }

    saveState(): number {
        return this.value;
    }

    loadState(state: number): void {
        this.setValue(state);
    }
}

export class SubPageSetting<T extends UIComponent>
    extends Hookable<ISettingItemHooks<void>>
    implements ISettingItem<void>
{
    readonly id: string;
    readonly name: string;
    readonly description: string;

    /** 打开的子页面 */
    private readonly page: IGameUI<T>;
    /** 传递给子页面的参数 */
    private readonly vBind: UIRawProps<T, IGameUIPropsBase>;

    constructor(options: ISettingSubPageOptions<T>) {
        super();
        this.id = options.id;
        this.name = options.name;
        this.description = options.description;
        this.page = options.page;
        this.vBind = options.props;
    }

    protected createController(
        hook: Partial<ISettingItemHooks<void>>
    ): IHookController<ISettingItemHooks<void>> {
        return new HookController(this, hook);
    }

    getValue(): void {
        return void 0;
    }

    setValue(): void {}

    getPreviewString(): string {
        return '';
    }

    getSettingComponent(
        base: ISettingComponentProps<void>
    ): ISettingComponentEntry<void, ISubPageSettingProps<T>> {
        return {
            // @ts-expect-error 类型一定正确，但是由于常量没办法加泛型，所以无法推导
            component: SubPageSettingComponent as DefineSetupFnComponent<
                ISubPageSettingProps<T>
            >,
            props: {
                ...base,
                page: this.page,
                vBind: this.vBind
            }
        };
    }

    saveState(): void {}

    loadState(): void {}
}

/**
 * 创建一个数值类型的设置项
 * @param options 设置项的配置
 */
export function defineNumberSetting(
    options: ISettingNumberOptions
): ISettingItem<number> {
    return new NumberSetting(options);
}

/**
 * 创建一个布尔类型的设置项
 * @param options 设置项的配置
 */
export function defineBooleanSetting(
    options: ISettingBooleanOptions
): ISettingItem<boolean> {
    return new BooleanSetting(options);
}

/**
 * 创建一个区间类型的设置项
 * @param options 设置项的配置
 */
export function defineRangeSetting(
    options: ISettingRangeOptions
): ISettingItem<number> {
    return new RangeSetting(options);
}

/**
 * 创建一个点击后打开子页面的设置项
 * @param options 设置项的配置
 */
export function defineSubPageSetting(
    options: ISettingSubPageOptions<UIComponent>
): ISettingItem<void> {
    return new SubPageSetting(options);
}
