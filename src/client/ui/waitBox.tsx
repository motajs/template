import { logger } from '@motajs/common';
import { ElementLocator } from '@motajs/render';
import { GameUI, IUIController, SetupComponentOptions } from '@motajs/system';
import { computed, defineComponent, ref, SetupContext } from 'vue';
import { Background, BackgroundProps } from './background';
import {
    TextContent,
    TextContentProps,
    IGameUIPropsBase
} from '@user/client-base';

export interface WaitBoxProps<T>
    extends Partial<BackgroundProps>, Partial<TextContentProps> {
    loc: ElementLocator;
    width: number;
    promise?: Promise<T>;
    text?: string;
    pad?: number;
}

export type WaitBoxEmits<T> = {
    resolve: (data: T) => void;
};

export interface WaitBoxExpose<T> {
    /**
     * 手动将此组件兑现，注意调用时如果传入的 Promise 还没有兑现，
     * 当 Promise 兑现后将不会再次触发 resolve 事件，即 resolve 事件只会被触发一次
     * @param data 兑现值
     */
    resolve(data: T): void;
}

const waitBoxProps = {
    props: ['promise', 'loc', 'winskin', 'color', 'border', 'width'],
    emits: ['resolve']
} satisfies SetupComponentOptions<
    WaitBoxProps<unknown>,
    WaitBoxEmits<unknown>,
    keyof WaitBoxEmits<unknown>
>;

/**
 * 等待框，可以等待某个异步操作 (Promise)，操作完毕后触发兑现事件，单次调用参考 {@link waitbox}。
 * 参数参考 {@link WaitBoxProps}，事件参考 {@link WaitBoxEmits}，函数接口参考 {@link WaitBoxExpose}。用例如下：
 * ```tsx
 * // 创建一个等待 1000ms 的 Promise，兑现值是等待完毕时的当前时间刻
 * const promise = new Promise(res => window.setTimeout(() => res(Date.now()), 1000));
 *
 * <WaitBox
 *   // 传入要等待的 Promise
 *   promise={promise}
 *   // 等待框的位置，宽度由 width 参数指定，高度由内部计算得来，不需要手动指定，即使手动指定也无效
 *   loc={[240, 240, void 0, void 0, 0.5, 0.5]}
 *   // 等待框的宽度
 *   width={240}
 *   // 完全继承 Background 的参数，因此可以直接指定背景样式
 *   winskin="winskin2.png"
 *   // 完全继承 TextContent 的参数，因此可以直接指定字体
 *   font={new Font('Verdana', 28)}
 *   // 当传入的 Promise 兑现时触发此事件，注意此事件只可能触发一次，触发后便不会再次触发
 *   onResolve={(time) => console.log(time)}
 * />
 * ```
 */
export const WaitBox = defineComponent<
    WaitBoxProps<unknown>,
    WaitBoxEmits<unknown>,
    keyof WaitBoxEmits<unknown>
>(
    <T,>(
        props: WaitBoxProps<T>,
        { emit, expose, attrs }: SetupContext<WaitBoxEmits<T>>
    ) => {
        const contentHeight = ref(200);

        const text = computed(() => props.text ?? '请等待 ...');
        const pad = computed(() => props.pad ?? 24);
        const containerLoc = computed<ElementLocator>(() => {
            const [x = 0, y = 0, , , ax = 0, ay = 0] = props.loc;
            return [x, y, props.width, contentHeight.value, ax, ay];
        });
        const backLoc = computed<ElementLocator>(() => {
            return [1, 1, props.width - 2, contentHeight.value - 2];
        });
        const contentLoc = computed<ElementLocator>(() => {
            return [
                pad.value,
                pad.value,
                props.width - pad.value * 2,
                contentHeight.value - pad.value * 2
            ];
        });

        let resolved: boolean = false;

        props.promise?.then(
            value => {
                resolve(value);
            },
            reason => {
                logger.warn(63, reason);
            }
        );

        const resolve = (data: T) => {
            if (resolved) return;
            resolved = true;
            emit('resolve', data);
        };

        const onContentHeight = (height: number) => {
            contentHeight.value = height + pad.value * 2;
        };

        expose<WaitBoxExpose<T>>({ resolve });

        return () => (
            <container loc={containerLoc.value}>
                <Background
                    loc={backLoc.value}
                    zIndex={0}
                    winskin={props.winskin}
                    color={props.color}
                    border={props.border}
                />
                <TextContent
                    {...attrs}
                    autoHeight
                    text={text.value}
                    loc={contentLoc.value}
                    width={props.width - pad.value * 2}
                    zIndex={5}
                    onUpdateHeight={onContentHeight}
                />
            </container>
        );
    },
    waitBoxProps
);

/**
 * 打开一个等待框，等待传入的 Promise 兑现后，关闭等待框，并将兑现值返回。
 * 示例，等待 1000ms：
 * ```ts
 * // 创建一个等待 1000ms 的 Promise，兑现值是等待完毕时的当前时间刻
 * const promise = new Promise(res => window.setTimeout(() => res(Date.now()), 1000));
 * const value = await waitbox(
 *   // 在哪个 UI 控制器上打开，对于一般 UI 组件来说，直接填写 props.controller 即可
 *   props.controller,
 *   // 确认框的位置，宽度由下一个参数指定，高度参数由组件内部计算得出，指定无效
 *   [240, 240, void 0, void 0, 0.5, 0.5],
 *   // 确认框的宽度
 *   240,
 *   // 要等待的 Promise
 *   promise,
 *   // 额外的 props，例如填写等待文本，此项可选，参考 WaitBoxProps
 *   { text: '请等待 1000ms' }
 * );
 * console.log(value); // 输出时间刻
 * ```
 * @param controller UI 控制器
 * @param loc 等待框的位置
 * @param width 等待框的宽度
 * @param promise 要等待的 Promise
 * @param props 额外的 props，参考 {@link WaitBoxProps}
 */
export function waitbox<T>(
    controller: IUIController<IGameUIPropsBase>,
    loc: ElementLocator,
    width: number,
    promise: Promise<T>,
    props?: Partial<WaitBoxProps<T>>
): Promise<T> {
    return new Promise<T>(res => {
        const instance = controller.open(WaitBoxUI, {
            ...(props ?? {}),
            loc,
            width,
            promise,
            onResolve: (data: unknown) => {
                controller.close(instance);
                res(data as T);
            }
        });
    });
}

export const WaitBoxUI = new GameUI('wait-box', WaitBox);
