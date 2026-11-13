import { CanvasStyle, Font, IActionEvent, IRenderItem } from '@motajs/render';
import { DefaultProps } from '@motajs/render-vue';
import { SetupComponentOptions } from '@motajs/system';
import { isNil } from 'lodash-es';
import {
    computed,
    defineComponent,
    onMounted,
    onUnmounted,
    ref,
    watch
} from 'vue';

export interface ISliderProps extends DefaultProps {
    /** 滑动条的当前值 */
    value?: number;
    /** 滑动条的最小值，默认为 100 */
    min?: number;
    /** 滑动条的最大值，默认为 0 */
    max?: number;
    /** 滑动条的步长，即两个值之间最小差多少，默认为 1 */
    step?: number;
    /** 是否在滑动条右侧显示当前值，默认显示 */
    showValue?: boolean;
    /** 滑动条右侧显示当前值的宽度，默认为 40 */
    valueWidth?: number;
    /** 文字的显示字体 */
    font?: Font;
    /** 滑动条的线宽 */
    lineWidth?: number;
    /** 线左右两侧距容器边缘的距离 */
    padding?: number;
    /** 控制点左侧的滑动条样式 */
    filledStyle?: CanvasStyle;
    /** 控制点右侧的滑动条样式 */
    emptyStyle?: CanvasStyle;
    /** 控制点的半径 */
    radius?: number;
}

export type SliderEmits = {
    /**
     * 当滑动条的设置值变化时触发
     * @param value 当前滑动条的设置值
     */
    update: (value: number) => void;

    'update:value': (value: number) => void;
};

const sliderProps = {
    props: [
        'loc',
        'width',
        'height',
        'value',
        'min',
        'max',
        'step',
        'showValue',
        'valueWidth',
        'font',
        'lineWidth',
        'padding',
        'filledStyle',
        'emptyStyle',
        'radius'
    ],
    emits: ['update', 'update:value']
} satisfies SetupComponentOptions<ISliderProps, SliderEmits, keyof SliderEmits>;

/**
 * 滑动条组件，提供一个可控制的滑动条，玩家滑动的时候会调整其值，类似于音量调节的那种滑动条。
 * 注意，一定要专门提供两个按钮可以点击增减滑动条的值，因为移动端操作滑动条会比较困难。
 */
export const Slider = defineComponent<
    ISliderProps,
    SliderEmits,
    keyof SliderEmits
>((props, { emit }) => {
    const min = computed(() => props.min ?? 0);
    const max = computed(() => props.max ?? 0);
    const showValue = computed(() => props.showValue ?? true);
    const font = computed(() => props.font ?? Font.defaults({ size: 12 }));

    /** 当前值 */
    const value = ref(props.value ?? min.value);
    const container = ref<IRenderItem>();

    const width = computed(() => props.loc?.[2] ?? props.width ?? 200);
    const height = computed(() => props.loc?.[3] ?? props.width ?? 200);

    const cy = computed(() => height.value / 2);
    const sx = computed(() => props.padding ?? 4);
    const ex = computed(() => {
        if (showValue.value) {
            return width.value - sx.value - (props.valueWidth ?? 40);
        } else {
            return width.value - sx.value;
        }
    });

    watch(
        () => props.value,
        newValue => {
            if (!isNil(newValue)) {
                value.value = newValue;
            }
        }
    );

    /** 端点横坐标 */
    const fx = computed(() => {
        const ratio = (value.value - min.value) / (max.value - min.value);
        const len = ratio * (ex.value - sx.value);
        return sx.value + len;
    });

    /** 数值显示值 */
    const valueStr = computed(() => {
        const v = Number(value.value.toFixed(8));
        if (v < 1000 && v > 0.01) return value.value.toString();
        else return v.toExponential(2);
    });

    let dragging = false;
    let startX = -1;

    const down = (ev: IActionEvent) => {
        dragging = true;
        startX = ev.absoluteX;
    };

    const up = () => {
        dragging = false;
        startX = -1;
    };

    const move = (ev: IActionEvent) => {
        if (!dragging || startX < 0) return;
        const dx = ev.absoluteX - startX;
        const ratio = (value.value - min.value) / (max.value - min.value);
        const now = ratio * (ex.value - sx.value);
        if (dx < -now) {
            value.value = min.value;
        } else if (dx > ex.value - now) {
            value.value = max.value;
        } else {
            const target = now + dx;
            const ratio = target / (ex.value - sx.value);
            const targetValue = ratio * (max.value - min.value) + min.value;
            const step = props.step ?? 1;
            const steps = Math.round((targetValue - min.value) / step);
            const aligned = steps * step + min.value;
            value.value = aligned;
            emit('update:value', aligned);
        }
    };

    onMounted(() => {
        if (!container.value) return;
        const root = container.value.root;
        if (!root) return;
        root.on('moveCapture', move);
    });

    onUnmounted(() => {
        if (!container.value) return;
        const root = container.value.root;
        if (!root) return;
        root.off('moveCapture', move);
    });

    return () => (
        <container ref={container}>
            <g-line
                line={[sx.value, cy.value, ex.value, cy.value]}
                lineCap="round"
                lineWidth={props.lineWidth}
                strokeStyle={props.emptyStyle ?? '#888'}
                zIndex={0}
            />
            <g-line
                line={[sx.value, cy.value, fx.value, cy.value]}
                lineCap="round"
                lineWidth={props.lineWidth}
                strokeStyle={props.filledStyle ?? '#0ff'}
                zIndex={1}
            />
            <g-circle
                circle={[fx.value, cy.value, props.radius ?? 4]}
                fill
                stroke
                lineWidth={1}
                fillStyle={props.filledStyle ?? '#0ff'}
                strokeStyle={props.emptyStyle ?? '#888'}
                cursor="pointer"
                zIndex={2}
                onDown={down}
                onUp={up}
            />
            <text
                text={valueStr.value}
                hidden={!showValue.value}
                font={font.value}
                loc={[width.value - sx.value, cy.value]}
                anc={[1, 0.5]}
                fillStyle="#fff"
            />
        </container>
    );
}, sliderProps);
