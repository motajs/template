import { DefaultProps } from '@motajs/render-vue';
import { computed, defineComponent, onUnmounted, ref, watch } from 'vue';
import { TextContent, TextContentProps } from './textbox';
import {
    Container,
    ElementLocator,
    MotaRenderer,
    Transform,
    Font,
    RectRCircleParams,
    IRenderItem,
    IRenderTreeRoot
} from '@motajs/render';
// @ts-expect-error render/use.ts 按 D-54 留在实现层，本文件已移入系统层，按 D-68 暂以标注记录，不反向引用、不解耦
import { transitionedColor } from '../use';
import { linear } from '@motajs/animate';
import { SetupComponentOptions } from '@motajs/system';

export interface InputProps extends DefaultProps, Partial<TextContentProps> {
    /** 输入框的提示内容 */
    placeholder?: string;
    /** 输入框的值 */
    value?: string;
    /** 是否是多行输入，多行输入时，允许换行 */
    multiline?: boolean;
    /** 边框颜色 */
    border?: string;
    /** 边框圆角 */
    circle?: RectRCircleParams;
    /** 边框宽度 */
    borderWidth?: number;
    /** 内边距 */
    pad?: number;
}

export type InputEmits = {
    /**
     * 当输入框的值被确认时触发，例如失焦时
     * @param value 输入框的值
     */
    change: (value: string) => void;

    /**
     * 当输入框的值发生改变时触发，例如输入了一个字符，或者删除了一个字母
     * @param value 输入框的值
     */
    input: (value: string) => void;

    'update:value': (value: string) => void;
};

const inputProps = {
    props: [
        'loc',
        'placeholder',
        'value',
        'multiline',
        'border',
        'circle',
        'borderWidth',
        'pad'
    ],
    emits: ['change', 'input', 'update:value']
} satisfies SetupComponentOptions<InputProps, InputEmits, keyof InputEmits>;

/**
 * 输入组件，点击后允许编辑。参数参考 {@link InputProps}，事件参考 {@link InputEmits}。
 * 完全继承 TextContent 组件的参数，用于控制输入内容的显示方式。用法示例：
 * ```tsx
 * const inputValue = ref('');
 * <Input
 *   placeholder="提示词"
 *   // 双向数据绑定，当输入内容改变时，inputValue 会同时改变
 *   v-model={inputValue.value}
 *   // 设置为多行模式
 *   multiline
 *   // 边框颜色
 *   border="#eee"
 *   // 圆角参数，与 g-rectr 参数一致
 *   circle={[4]}
 *   // 边框宽度
 *   borderWidth={3}
 *   // 内边距
 *   pad={8}
 * />
 * ```
 */
export const Input = defineComponent<InputProps, InputEmits, keyof InputEmits>(
    (props, { attrs, emit }) => {
        let ele: HTMLInputElement | HTMLTextAreaElement | null = null;

        const value = ref(props.value ?? '');
        const root = ref<Container>();

        const width = computed(() => props.loc?.[2] ?? 200);
        const height = computed(() => props.loc?.[3] ?? 200);
        const showText = computed(() => value.value || props.placeholder || '');
        const padding = computed(() => props.pad ?? 4);
        const textLoc = computed<ElementLocator>(() => [
            padding.value,
            padding.value,
            width.value - padding.value * 2,
            height.value - padding.value * 2
        ]);
        const rectLoc = computed<ElementLocator>(() => {
            const b = props.borderWidth ?? 1;
            return [b, b, width.value - b * 2, height.value - b * 2];
        });

        const borderColor = transitionedColor(
            props.border ?? '#ddd',
            200,
            linear()
        )!;

        const listenInput = () => {
            if (!ele) return;
            ele.addEventListener('input', () => {
                if (ele) {
                    updateInput(ele.value);
                }
            });
            ele.addEventListener('change', () => {
                if (ele) {
                    updateValue(ele.value);
                }
            });
            ele.addEventListener('blur', () => {
                if (ele) {
                    updateInput(ele.value);
                }
                ele?.remove();
            });
        };

        const createInput = (mul: boolean) => {
            if (mul) {
                ele = document.createElement('textarea');
            } else {
                ele = document.createElement('input');
            }
            // See src/styles.less
            ele.classList.add('motajs-input-element');
            listenInput();
        };

        const updateValue = (newValue: string) => {
            value.value = newValue;
            emit('update:value', newValue);
            emit('change', newValue);
        };

        const updateInput = (newValue: string) => {
            value.value = newValue;
            emit('update:value', newValue);
            emit('input', newValue);
        };

        const click = () => {
            if (!ele) createInput(props.multiline ?? false);
            if (!ele) return;
            // 计算当前绝对位置

            const chain: IRenderItem[] = [];
            let now: IRenderItem | null = root.value ?? null;
            let renderer: IRenderTreeRoot | null = null;
            if (!now) return;
            while (now) {
                chain.unshift(now);
                if (now?.isRoot) {
                    renderer = now as MotaRenderer;
                }
                now = now.parent;
            }

            const canvas = renderer?.getCanvas();
            if (!canvas) return;

            const w = width.value;
            const h = height.value;

            const border = props.borderWidth ?? 1;
            const inputWidth = w - border * 2;
            const inputHeight = h - border * 2;

            // 应用根画布偏移
            const box = canvas.getBoundingClientRect();
            let trans = new Transform();
            trans.translate(box.x, box.y);
            trans.scale(renderer?.getScale() ?? 1);
            for (const item of chain) {
                const { anchorX, anchorY, width, height } = item;
                trans.translate(-anchorX * width, -anchorY * height);
                trans = trans.multiply(item.transform);
            }
            trans.translate(border, border);

            // 构建CSS transform的matrix字符串
            const [a, b, , c, d, , e, f] = trans.mat;
            const str = `matrix(${a},${b},${c},${d},${e},${f})`;

            const font = props.font ?? Font.defaults();
            ele.style.transform = str;
            ele.style.width = `${inputWidth}px`;
            ele.style.height = `${inputHeight}px`;
            ele.style.font = font.string();
            ele.style.color = String(props.fillStyle ?? 'white');
            ele.style.zIndex = '100';
            document.body.appendChild(ele);
            ele.focus();
        };

        const enter = () => {
            borderColor.set('#0ff');
        };

        const leave = () => {
            borderColor.set(props.border ?? '#ddd');
        };

        watch(
            () => props.value,
            newValue => {
                value.value = newValue ?? '';
            }
        );

        watch(
            () => props.multiline,
            value => {
                createInput(value ?? false);
            },
            {
                immediate: true
            }
        );

        onUnmounted(() => {
            ele?.remove();
        });

        return () => (
            <container
                loc={props.loc}
                ref={root}
                cursor="text"
                onClick={click}
                onEnter={enter}
                onLeave={leave}
            >
                <g-rectr
                    loc={rectLoc.value}
                    circle={props.circle}
                    lineWidth={props.borderWidth ?? 1}
                    fill
                    stroke
                    fillStyle="#111"
                    strokeStyle={borderColor.ref.value}
                    zIndex={0}
                />
                <TextContent
                    {...attrs}
                    noevent
                    loc={textLoc.value}
                    width={width.value - padding.value * 2}
                    text={showText.value}
                    fillStyle="white"
                    alpha={value.value.length === 0 ? 0.6 : 1}
                    zIndex={10}
                />
            </container>
        );
    },
    inputProps
);

export async function routedInput() {
    // todo
}

export async function routedInputNumber() {
    // todo
}
