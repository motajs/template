import { ElementLocator, Font } from '@motajs/render';
import { GameUI, IUIController, SetupComponentOptions } from '@motajs/system';
import { computed, defineComponent, ref } from 'vue';
import { Background } from './background';
import {
    Input,
    InputEmits,
    InputProps,
    Selection,
    TextContent,
    TextContentProps,
    IGameUIPropsBase,
    useKey
} from '@user/client-base';

export interface InputBoxProps extends IGameUIPropsBase, TextContentProps {
    /** 输入框对话框的位置 */
    loc: ElementLocator;
    /** 传递给内部 Input 组件的配置参数，用于自定义输入行为 */
    input?: InputProps;
    /** 窗口皮肤图片ID，用于对话框背景绘制 */
    winskin?: ImageIds;
    /** 对话框背景颜色，当未设置 winskin 时生效 */
    color?: CanvasStyle;
    /** 对话框边框颜色，当未设置 winskin 时生效 */
    border?: CanvasStyle;
    /** 对话框内部所有元素的内边距 */
    pad?: number;
    /** 内部输入框区域的高度 */
    inputHeight?: number;
    /** 对话框顶部的提示文本 */
    text?: string;
    /** 确认按钮的显示文本，默认为"确认" */
    yesText?: string;
    /** 取消按钮的显示文本，默认为"取消" */
    noText?: string;
    /** 确认/取消按钮的字体样式 */
    selFont?: Font;
    /** 确认/取消按钮的文本颜色 */
    selFill?: CanvasStyle;
}

export type InputBoxEmits = {
    /**
     * 当确认输入框的内容时触发
     * @param value 输入框的内容
     */
    confirm: (value: string) => void;

    /**
     * 当取消时触发
     * @param value 输入框的内容
     */
    cancel: (value: string) => void;
} & InputEmits;

const inputBoxProps = {
    props: [
        'loc',
        'input',
        'winskin',
        'color',
        'border',
        'pad',
        'inputHeight',
        'text',
        'yesText',
        'noText',
        'selFont',
        'selFill',
        'width',
        'state'
    ],
    emits: ['confirm', 'cancel', 'change', 'input', 'update:value']
} satisfies SetupComponentOptions<
    InputBoxProps,
    InputBoxEmits,
    keyof InputBoxEmits
>;

/**
 * 输入框组件，与 2.x 的 myconfirm 类似，单次调用参考 {@link getInput}。用法与 `ConfirmBox` 类似。
 * 参数参考 {@link InputBoxProps}，事件参考 {@link InputBoxEmits}，用例如下：
 * ```tsx
 * const onConfirm = (value: string) => console.log(value);
 *
 * <ConfirmBox
 *   text="请输入文本："
 *   width={240}
 *   // 输入框会自动计算宽度和高度，因此不需要手动指定，即使手动指定也无效
 *   loc={[240, 240, void 0, void 0, 0.5, 0.5]}
 *   // 使用 winskin 图片作为背景
 *   winskin="winskin.png"
 *   // 使用颜色作为背景和边框，如果设置了 winskin，那么此参数无效
 *   color="#333"
 *   border="gold"
 *   // 设置选项的字体
 *   selFont={new Font('Verdana', 16)}
 *   // 设置选项的文本颜色
 *   selFill="#d48"
 *   // 完全继承 TextContent 的参数，因此可以填写 font 参数指定文本字体
 *   font={new Font('arial')}
 *   onConfirm={onYes}
 *   // 可以使用 input 参数调整输入组件
 *   input={{
 *     // 例如在输入组件中添加占位符（未输入任何东西时显示此内容）
 *     placeholder: '在这里输入你的文本'
 *   }}
 * />
 * ```
 */
export const InputBox = defineComponent<
    InputBoxProps,
    InputBoxEmits,
    keyof InputBoxEmits
>((props, { attrs, emit }) => {
    const contentHeight = ref(0);
    const value = ref('');
    const selected = ref(false);
    const yesSize = ref<[number, number]>([0, 0]);
    const noSize = ref<[number, number]>([0, 0]);
    const height = ref(200);

    const yesText = computed(() => props.yesText ?? '确认');
    const noText = computed(() => props.noText ?? '取消');
    const text = computed(() => props.text ?? '请输入内容：');
    const padding = computed(() => props.pad ?? 8);
    const inputHeight = computed(() => props.inputHeight ?? 24);
    const inputLoc = computed<ElementLocator>(() => [
        padding.value,
        padding.value * 2 + contentHeight.value,
        props.width - padding.value * 2,
        inputHeight.value
    ]);
    const yesLoc = computed<ElementLocator>(() => {
        const y = height.value - padding.value;
        return [props.width / 3, y, void 0, void 0, 0.5, 1];
    });
    const noLoc = computed<ElementLocator>(() => {
        const y = height.value - padding.value;
        return [(props.width / 3) * 2, y, void 0, void 0, 0.5, 1];
    });
    const selectionLoc = computed<ElementLocator>(() => {
        if (selected.value) {
            const [x = 0, y = 0] = yesLoc.value;
            const [width, height] = yesSize.value;
            return [x, y + 4, width + 8, height + 8, 0.5, 1];
        } else {
            const [x = 0, y = 0] = noLoc.value;
            const [width, height] = noSize.value;
            return [x, y + 4, width + 8, height + 8, 0.5, 1];
        }
    });
    const boxLoc = computed<ElementLocator>(() => {
        const [x = 0, y = 0, , , ax = 0, ay = 0] = props.loc;
        return [x, y, props.width, height.value, ax, ay];
    });

    const updateHeight = (h: number) => {
        contentHeight.value = h;
        const [, yh] = yesSize.value;
        const [, nh] = noSize.value;
        const buttonHeight = Math.max(yh, nh);
        height.value = h + inputHeight.value + padding.value * 4 + buttonHeight;
    };

    const change = (value: string) => {
        emit('change', value);
    };

    const input = (value: string) => {
        emit('update:value', value);
        emit('input', value);
    };

    const setYes = (width: number, height: number) => {
        yesSize.value = [width, height];
    };

    const setNo = (width: number, height: number) => {
        noSize.value = [width, height];
    };

    const confirm = () => {
        emit('confirm', value.value);
    };

    const cancel = () => {
        emit('cancel', value.value);
    };

    const key = useKey(props.state.hotkey.system)!;
    key.implement('@ui/input-confirm', () => {
        const active = document.activeElement;
        if (
            active instanceof HTMLInputElement ||
            active instanceof HTMLTextAreaElement
        ) {
            active.blur();
        }
    });

    return () => (
        <container loc={boxLoc.value}>
            <Background
                loc={[0, 0, props.width, height.value]}
                winskin={props.winskin}
                color={props.color ?? '#333'}
                border={props.border}
                zIndex={0}
            />
            <TextContent
                {...attrs}
                loc={[padding.value, padding.value]}
                text={text.value}
                width={props.width - padding.value * 2}
                zIndex={5}
                onUpdateHeight={updateHeight}
                autoHeight
            />
            <Input
                {...(props.input ?? {})}
                loc={inputLoc.value}
                v-model={value.value}
                zIndex={10}
                circle={[4]}
                onChange={change}
                onInput={input}
            />
            <Selection
                loc={selectionLoc.value}
                winskin={props.winskin}
                border={props.border}
                noevent
                zIndex={10}
            />
            <text
                loc={yesLoc.value}
                text={yesText.value}
                fillStyle={props.selFill}
                font={props.selFont}
                cursor="pointer"
                zIndex={15}
                onClick={confirm}
                onEnter={() => (selected.value = true)}
                onResize={setYes}
            />
            <text
                loc={noLoc.value}
                text={noText.value}
                fillStyle={props.selFill}
                font={props.selFont}
                cursor="pointer"
                zIndex={15}
                onClick={cancel}
                onEnter={() => (selected.value = false)}
                onResize={setNo}
            />
        </container>
    );
}, inputBoxProps);

/**
 * 弹出一个输入框，然后将结果返回：
 * ```ts
 * const value = await getInput(
 *   // 在哪个 UI 控制器上打开，对于一般 UI 组件来说，直接填写 props.controller 即可
 *   props.controller,
 *   // 提示内容
 *   '请输入文本：',
 *   // 输入框的位置，宽度由下一个参数指定，高度参数由组件内部计算得出，指定无效
 *   [240, 240, void 0, void 0, 0.5, 0.5],
 *   // 宽度设为 240
 *   240,
 *   // 可以给选择框传入其他的 props，例如指定字体，此项可选
 *   { font: new Font('Verdana', 20) }
 * );
 * // 之后，就可以根据 value 来执行不同的操作了
 * console.log(value); // 输出用户输入的内容
 * ```
 * @param controller UI 控制器
 * @param text 确认文本内容
 * @param loc 确认框的位置
 * @param width 确认框的宽度
 * @param props 额外的 props，参考 {@link ConfirmBoxProps}
 */
export function getInput(
    controller: IUIController<IGameUIPropsBase>,
    text: string,
    loc: ElementLocator,
    width: number,
    props?: InputBoxProps
) {
    return new Promise<string>(res => {
        const instance = controller.open(
            InputBoxUI,
            {
                ...(props ?? {}),
                text,
                loc,
                width,
                onConfirm: (value: string) => {
                    controller.close(instance);
                    res(value);
                },
                onCancel: () => {
                    controller.close(instance);
                    res('');
                }
            },
            true
        );
    });
}

/**
 * 与 `getInput` 类似，不过会将结果转为数字。用法参考 {@link getInput}
 * @param controller UI 控制器
 * @param text 确认文本内容
 * @param loc 确认框的位置
 * @param width 确认框的宽度
 * @param props 额外的 props，参考 {@link ConfirmBoxProps}
 */
export async function getInputNumber(
    controller: IUIController<IGameUIPropsBase>,
    text: string,
    loc: ElementLocator,
    width: number,
    props?: InputBoxProps
) {
    const value = await getInput(controller, text, loc, width, props);
    return parseFloat(value);
}

export const InputBoxUI = new GameUI('input-box', InputBox);
