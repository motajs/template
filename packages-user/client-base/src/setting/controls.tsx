import {
    computed,
    defineComponent,
    onMounted,
    onUnmounted,
    ref,
    watch
} from 'vue';
import { ElementLocator, Font } from '@motajs/render';
import {
    IGameUI,
    SetupComponentOptions,
    UIComponent,
    UIRawProps
} from '@motajs/system';
import { ISettingComponentProps, ISettingItemHooks } from './types';
import { Input } from '../components';
import { Slider } from '../components/slider';
import { clamp } from 'lodash-es';
import { IGameUIPropsBase } from '../types';

/** 内边距，控制组件内容与容器边缘的距离 */
const PADDING = 4;
/** 组件常规内容的高度 */
const HEIGHT = 24;
/** 滑条组件右侧距离容器边缘的距离 */
const SLIDER_RIGHT = 32;
/** 控件内文字使用的字体 */
const defaultFont = Font.defaults({ size: 13 });

//#region 数值设置

export interface INumberSettingProps extends ISettingComponentProps<number> {
    /** 最小数值 */
    readonly min: number;
    /** 最大数值 */
    readonly max: number;
}

const numberSettingProps = {
    props: ['setting', 'controller', 'width', 'loc', 'min', 'max']
} satisfies SetupComponentOptions<INumberSettingProps>;

export const NumberSettingComponent = defineComponent<INumberSettingProps>(
    props => {
        const current = ref(props.setting.getValue().toString());
        /** 当前的提示文字 */
        const hint = ref('');

        const width = computed(() => props.loc?.[2] ?? props.width ?? 200);

        watch(current, value => {
            const num = Number(value);
            if (num === props.setting.getValue()) return;
            if (isNaN(num) || !isFinite(num)) {
                hint.value = '请输入合法数字！';
            } else {
                hint.value = '';
                props.setting.setValue(num);
            }
        });

        const hook: ISettingItemHooks<number> = {
            onUpdateValue(value) {
                current.value = value.toString();
            }
        };

        onMounted(() => {
            props.setting.addHook(hook);
        });

        onUnmounted(() => {
            props.setting.removeHook(hook);
        });

        return () => (
            <container loc={props.loc} width={props.width} nocache>
                <Input
                    loc={[PADDING, PADDING, width.value - PADDING, HEIGHT]}
                    v-model={current.value}
                    placeholder="请输入数值"
                />
                <text
                    loc={[PADDING, PADDING * 2 + HEIGHT]}
                    text={hint.value}
                    fillStyle="#eb8252"
                />
            </container>
        );
    },
    numberSettingProps
);

//#endregion

//#region 布尔值设置

export interface IBooleanSettingProps extends ISettingComponentProps<boolean> {}

const booleanSettingProps = {
    props: ['setting', 'controller', 'width', 'loc']
} satisfies SetupComponentOptions<IBooleanSettingProps>;

export const BooleanSettingComponent = defineComponent<IBooleanSettingProps>(
    props => {
        const current = ref(props.setting.getValue());

        const width = computed(() => props.loc?.[2] ?? props.width ?? 200);

        const currentText = computed(() =>
            current.value ? '当前开启' : '当前关闭'
        );

        const buttonText = computed(() => (current.value ? '关闭' : '开启'));

        const toggle = (): void => {
            current.value = !current.value;
            if (current.value !== props.setting.getValue()) {
                props.setting.setValue(current.value);
            }
        };

        const hook: ISettingItemHooks<boolean> = {
            onUpdateValue(value) {
                current.value = value;
            }
        };

        onMounted(() => {
            props.setting.addHook(hook);
        });

        onUnmounted(() => {
            props.setting.removeHook(hook);
        });

        return () => (
            <container loc={props.loc} width={props.width} nocache>
                <g-rectr
                    loc={[width.value / 2, PADDING, width.value / 2, HEIGHT]}
                    circle={[4]}
                    fillStyle="#17a4cb"
                    cursor="pointer"
                    onClick={toggle}
                    zIndex={0}
                />
                <text
                    text={buttonText.value}
                    loc={[(width.value * 3) / 4, PADDING + HEIGHT / 2]}
                    anc={[0.5, 0.5]}
                    fillStyle="#fff"
                    strokeStyle="#000"
                    font={defaultFont}
                    noevent
                    zIndex={1}
                />
                <text
                    text={currentText.value}
                    loc={[PADDING, PADDING + HEIGHT / 2]}
                    anc={[0, 0.5]}
                    fillStyle="#fff"
                    strokeStyle="#000"
                    font={defaultFont}
                />
            </container>
        );
    },
    booleanSettingProps
);

//#endregion

//#region 范围值设置

export interface IRangeSettingProps extends ISettingComponentProps<number> {
    /** 最小数值 */
    readonly min: number;
    /** 最大数值 */
    readonly max: number;
    /** 数值步长 */
    readonly step: number;
}

const rangeSettingProps = {
    props: ['setting', 'controller', 'width', 'loc', 'min', 'max', 'step']
} satisfies SetupComponentOptions<IRangeSettingProps>;

export const RangeSettingComponent = defineComponent<IRangeSettingProps>(
    props => {
        const current = ref(props.setting.getValue());

        const w = computed(() => props.loc?.[2] ?? props.width ?? 200);

        /** Button Y */
        const by = computed(() => PADDING * 2 + (HEIGHT * 3) / 2);

        const decrease = () => {
            if (current.value > props.min) {
                current.value = clamp(
                    current.value - props.step,
                    props.min,
                    props.max
                );
            }
        };

        const increase = () => {
            if (current.value < props.max) {
                current.value = clamp(
                    current.value + props.step,
                    props.min,
                    props.max
                );
            }
        };

        const hook: ISettingItemHooks<number> = {
            onUpdateValue(value) {
                current.value = value;
            }
        };

        onMounted(() => {
            props.setting.addHook(hook);
        });

        onUnmounted(() => {
            props.setting.removeHook(hook);
        });

        return () => (
            <container loc={props.loc} width={props.width} nocache>
                <Slider
                    v-model={current.value}
                    loc={[0, 0, w.value, HEIGHT]}
                    min={props.min}
                    max={props.max}
                    step={props.step}
                    valueWidth={SLIDER_RIGHT}
                    padding={PADDING}
                    font={defaultFont}
                    showValue
                />
                <g-rectr
                    loc={[w.value / 2, by.value, w.value / 4, HEIGHT]}
                    anc={[0.5, 0.5]}
                    circle={[4]}
                    fillStyle="#17a4cb"
                    cursor="pointer"
                    onClick={decrease}
                    zIndex={0}
                />
                <text
                    loc={[w.value / 2, by.value, w.value / 4, HEIGHT]}
                    anc={[0.5, 0.5]}
                    text="减少"
                    fillStyle="#fff"
                    strokeStyle="#000"
                    zIndex={1}
                />
                <g-rectr
                    loc={[(w.value * 3) / 2, by.value, w.value / 4, HEIGHT]}
                    anc={[0.5, 0.5]}
                    circle={[4]}
                    fillStyle="#17a4cb"
                    cursor="pointer"
                    onClick={increase}
                    zIndex={0}
                />
                <text
                    loc={[(w.value * 3) / 2, by.value, w.value / 4, HEIGHT]}
                    anc={[0.5, 0.5]}
                    text="增加"
                    fillStyle="#fff"
                    strokeStyle="#000"
                    zIndex={1}
                />
            </container>
        );
    },
    rangeSettingProps
);

//#endregion

//#region 子页面设置

export interface ISubPageSettingProps<
    T extends UIComponent
> extends ISettingComponentProps<void> {
    /** 子页面 UI 对象 */
    readonly page: IGameUI<T>;
    /** 传递给子页面的参数 */
    readonly vBind: UIRawProps<T, IGameUIPropsBase>;
}

const subPageSettingProps = {
    props: ['setting', 'controller', 'width', 'loc']
} satisfies SetupComponentOptions<ISubPageSettingProps<UIComponent>>;

export const SubPageSettingComponent = defineComponent<
    ISubPageSettingProps<UIComponent>
>(<T extends UIComponent>(props: ISubPageSettingProps<T>) => {
    const width = computed(() => props.loc?.[2] ?? props.width ?? 200);
    const buttonLoc = computed(
        (): ElementLocator => [
            width.value / 2,
            PADDING + HEIGHT / 2,
            width.value / 2,
            HEIGHT
        ]
    );

    // 打开闭包中携带的目标界面
    const openPage = () => {
        props.controller.open(props.page, props.vBind);
    };

    return () => (
        <container loc={props.loc} width={props.width}>
            <g-rectr
                loc={buttonLoc.value}
                anc={[0.5, 0.5]}
                circle={[4]}
                fillStyle="#17a4cb"
                cursor="pointer"
                onClick={openPage}
            />
            <text
                text="编辑设置"
                loc={[width.value / 2, PADDING + HEIGHT / 2]}
                anc={[0.5, 0.5]}
                font={defaultFont}
                noevent
            />
        </container>
    );
}, subPageSettingProps);

//#endregion
