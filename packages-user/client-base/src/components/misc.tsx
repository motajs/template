import {
    ElementLocator,
    CustomRenderItem,
    MotaOffscreenCanvas2D,
    CanvasStyle,
    RectRCircleParams
} from '@motajs/render';
import {
    cycledTransition,
    DefaultProps,
    lwh,
    onExcitedFunc,
    PathProps
} from '@motajs/render-vue';
import { computed, defineComponent, ref, watch } from 'vue';
import { TextContent, TextContentProps } from './textbox';
import { Scroll, ScrollExpose, ScrollProps } from './scroll';
import { SetupComponentOptions } from '@motajs/system';
import { clamp, isNil } from 'lodash-es';
import { cosh, CurveMode } from '@motajs/animate';
import { ITextureManager } from '../material';

interface ProgressProps extends DefaultProps {
    /** 进度条的位置 */
    loc: ElementLocator;
    /** 进度条的进度，1表示完成，0表示未完成 */
    progress: number;
    /** 已完成部分的样式，默认为绿色（green） */
    success?: CanvasStyle;
    /** 未完成部分的样式，默认为灰色（gray） */
    background?: CanvasStyle;
    /** 线宽度 */
    lineWidth?: number;
}

const progressProps = {
    props: ['progress', 'success', 'background', 'lineWidth']
} satisfies SetupComponentOptions<ProgressProps>;

/**
 * 进度条组件，参数参考 {@link ProgressProps}，用例如下：
 * ```tsx
 * // 定义进度
 * const progress = ref(0);
 *
 * // 显示进度条
 * <Progress loc={[12, 12, 120, 8]} progress={progress.value} />
 * ```
 */
export const Progress = defineComponent<ProgressProps>(props => {
    const element = ref<CustomRenderItem>();

    const render = (canvas: MotaOffscreenCanvas2D) => {
        const { ctx, width, height } = canvas;
        ctx.lineCap = 'round';
        const lineWidth = props.lineWidth ?? 2;
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = props.background ?? 'gray';
        ctx.beginPath();
        ctx.moveTo(lineWidth, height / 2);
        ctx.lineTo(width - lineWidth, height / 2);
        ctx.stroke();
        const progress = clamp(props.progress, 0, 1);
        if (!isNaN(progress)) {
            ctx.strokeStyle = props.success ?? 'green';
            const p = lineWidth + (width - lineWidth * 2) * progress;
            ctx.beginPath();
            ctx.moveTo(lineWidth, height / 2);
            ctx.lineTo(p, height / 2);
            ctx.stroke();
        }
    };

    watch(props, () => {
        element.value?.update();
    });

    return () => {
        return <custom ref={element} render={render}></custom>;
    };
}, progressProps);

export interface ArrowProps extends PathProps {
    /** 箭头的起始和终点坐标，前两个是起始坐标，后两个是终点坐标 */
    arrow: [number, number, number, number];
    /** 箭头的头部大小 */
    head?: number;
    /** 箭头的颜色 */
    color?: CanvasStyle;
}

const arrowProps = {
    props: ['arrow', 'head', 'color']
} satisfies SetupComponentOptions<ArrowProps>;

/**
 * 箭头组件，显示一个箭头，参数参考 {@link ArrowProps}，用例如下：
 * ```tsx
 * // 从 (12, 12) 到 (48, 48) 的箭头
 * <Arrow arrow={[12, 12, 48, 48]} />
 * ```
 */
export const Arrow = defineComponent<ArrowProps>(props => {
    const loc = computed<ElementLocator>(() => {
        const [x1, y1, x2, y2] = props.arrow;
        const left = Math.min(x1, x2);
        const right = Math.max(x1, x2);
        const top = Math.min(y1, y2);
        const bottom = Math.max(y1, y2);
        return [left, top, right - left, bottom - top];
    });
    const path = computed(() => {
        const path = new Path2D();
        const head = props.head ?? 8;
        const [x = 0, y = 0] = loc.value;
        const [x1, y1, x2, y2] = props.arrow;
        path.moveTo(x1 - x, y1 - y);
        path.lineTo(x2 - x, y2 - y);
        const angle = Math.atan2(y2 - y1, x2 - x1);
        path.moveTo(
            x2 - head * Math.cos(angle - Math.PI / 6) - x,
            y2 - head * Math.sin(angle - Math.PI / 6) - y
        );
        path.lineTo(x2 - x, y2 - y);
        path.lineTo(
            x2 - head * Math.cos(angle + Math.PI / 6) - x,
            y2 - head * Math.sin(angle + Math.PI / 6) - y
        );

        return path;
    });

    return () => (
        <g-path
            loc={loc.value}
            path={path.value}
            stroke
            strokeStyle={props.color}
            lineCap="round"
            lineJoin="round"
        />
    );
}, arrowProps);

export interface ScrollTextProps extends TextContentProps, ScrollProps {
    /** 自动滚动的速度，每秒多少像素 */
    speed: number;
    /** 文字的最大宽度 */
    width: number;
    /** 自动滚动组件的定位 */
    loc: ElementLocator;
    /** 文字滚动入元素之前要先滚动多少像素，默认16像素 */
    pad?: number;
}

export type ScrollTextEmits = {
    /**
     * 当滚动完毕时触发
     */
    scrollEnd: () => void;
};

export interface ScrollTextExpose {
    /**
     * 暂停滚动
     */
    pause(): void;

    /**
     * 继续滚动
     */
    resume(): void;

    /**
     * 设置滚动速度
     */
    setSpeed(speed: number): void;

    /**
     * 立刻重新滚动
     */
    rescroll(): void;
}

const scrollProps = {
    props: ['speed', 'loc', 'x', 'y', 'width', 'height', 'pad'],
    emits: ['scrollEnd']
} satisfies SetupComponentOptions<
    ScrollTextProps,
    ScrollTextEmits,
    keyof ScrollTextEmits
>;

/**
 * 滚动文字，可以用于展示长剧情或者 staff 表，参数参考 {@link ScrollTextProps}，
 * 事件参考 {@link ScrollTextEmits}，函数接口参考 {@link ScrollTextExpose}，用例如下：
 * ```tsx
 * // 用于接受函数接口
 * const scroll = ref<ScrollTextExpose>();
 * // 显示的文字
 * const text = '滚动文字'.repeat(100);
 *
 * onMounted(() => {
 *   // 设置为每秒滚动 100 像素
 *   scroll.value?.setSpeed(100);
 *   // 暂停滚动
 *   scroll.value?.pause();
 * });
 *
 * // 显示滚动文字，每秒滚动 50 像素
 * <ScrollText ref={scroll} text={text} speed={50} loc={[0, 0, 180, 100]} width={180} />
 * ```
 */
export const ScrollText = defineComponent<
    ScrollTextProps,
    ScrollTextEmits,
    keyof ScrollTextEmits
>((props, { emit, expose, attrs }) => {
    const scroll = ref<ScrollExpose>();
    const speed = ref(props.speed);

    const [loc, width, height] = lwh(props);
    const pad = computed(() => props.pad ?? 16);

    let lastFixedTime = -1;
    let lastFixedPos = 0;
    let paused = false;
    let nowScroll = 0;

    onExcitedFunc(time => {
        if (paused || !scroll.value) return;
        if (lastFixedTime === -1) {
            lastFixedTime = time;
            return;
        }
        const dt = time - lastFixedTime;
        nowScroll = (dt / 1000) * speed.value + lastFixedPos;
        scroll.value.scrollTo(nowScroll, 0);
        if (nowScroll >= scroll.value.getScrollLength()) {
            emit('scrollEnd');
            paused = true;
        }
    });

    const pause = () => {
        paused = true;
    };

    const resume = () => {
        paused = false;
        lastFixedPos = nowScroll;
        lastFixedTime = -1;
    };

    const setSpeed = (value: number) => {
        lastFixedPos = nowScroll;
        lastFixedTime = -1;
        speed.value = value;
    };

    const rescroll = () => {
        nowScroll = 0;
        lastFixedTime = -1;
        lastFixedPos = 0;
    };

    expose<ScrollTextExpose>({ pause, resume, setSpeed, rescroll });

    return () => (
        <Scroll
            ref={scroll}
            loc={loc.value}
            padEnd={height.value + pad.value}
            noscroll
        >
            <TextContent
                {...attrs}
                width={width.value}
                loc={[0, height.value + pad.value]}
                autoHeight
            />
        </Scroll>
    );
}, scrollProps);

export interface SelectionProps extends DefaultProps {
    /** 非 `winskin` 模式下，填充颜色 */
    color?: CanvasStyle;
    /** 非 `winskin` 模式下，描边颜色 */
    border?: CanvasStyle;
    /** 非 `winskin` 模式下，圆角矩形的圆角参数，默认为 [4] */
    circle?: RectRCircleParams;
    /** 使用 `winskin` 背景图，会忽略 `color` `border` `circle` 参数 */
    winskin?: string;
    /** 边框宽度，默认为 2 */
    borderSize?: number;
    /** winskin 使用的贴图管理器 */
    manager?: ITextureManager;
    /** 选择图标的不透明度范围 */
    alphaRange?: [number, number];
}

const selectionProps = {
    props: [
        'color',
        'border',
        'circle',
        'winskin',
        'borderSize',
        'manager',
        'alphaRange'
    ]
} satisfies SetupComponentOptions<SelectionProps>;

/**
 * 显示一个选择光标，与 2.x 的 drawUIEventSelector 效果一致，参数参考 {@link SelectionProps}，用例如下：
 * ```tsx
 * // 使用 winskin.png 作为选择光标，光标动画的不透明度范围是 [0.3, 0.8]
 * <Selection loc={[24, 24, 80, 16]} winskin="winskin.png" alphaRange={[0.3, 0.8]} />
 * // 使用指定的填充和边框颜色作为选择光标
 * <Selection loc={[24, 24, 80, 16]} color="#ddd" border="gold" />
 * ```
 */
export const Selection = defineComponent<SelectionProps>(props => {
    const minAlpha = computed(() => props.alphaRange?.[0] ?? 0.25);
    const maxAlpha = computed(() => props.alphaRange?.[1] ?? 0.55);
    const alpha = cycledTransition(
        minAlpha.value,
        maxAlpha.value,
        2000,
        cosh(2, CurveMode.EaseInOut)
    )!;

    const isWinskin = computed(() => !isNil(props.winskin));
    const winskin = computed(() => {
        if (isNil(props.winskin) || !props.manager) {
            return null;
        } else {
            return props.manager.getImageByAlias(props.winskin);
        }
    });

    const renderWinskin = (canvas: MotaOffscreenCanvas2D) => {
        const { ctx, width: w, height: h } = canvas;
        if (!winskin.value) return;
        const { width, height, source: i } = winskin.value;
        // 背景
        const x1 = (2 / 192) * width;
        const x2 = (28 / 192) * width;
        const x3 = (128 / 192) * width;
        const x4 = (130 / 192) * width;
        const x5 = (158 / 192) * width;
        const y1 = (2 / 128) * height;
        const y2 = (28 / 128) * height;
        const y3 = (64 / 128) * height;
        const y4 = (66 / 128) * height;
        const y5 = (94 / 128) * height;
        ctx.drawImage(i, x4, y4, x2, y2, 2, 2, w - 4, h - 4);
        // 四个角
        ctx.drawImage(i, x3, y3, x1, y1, 0, 0, 2, 2);
        ctx.drawImage(i, x5, y3, x1, y1, w - 2, 0, 2, 2);
        ctx.drawImage(i, x3, y5, x1, y1, 0, h - 2, 2, 2);
        ctx.drawImage(i, x5, y5, x1, y1, w - 2, h - 2, 2, 2);
        // 四条边
        ctx.drawImage(i, x4, y3, x2, y1, 2, 0, w - 4, 2);
        ctx.drawImage(i, x4, y5, x2, y1, 2, h - 2, w - 4, 2);
        ctx.drawImage(i, x3, y4, x1, y2, 0, 2, 2, h - 4);
        ctx.drawImage(i, x5, y4, x1, y2, w - 2, 2, 2, h - 4);
    };

    return () =>
        isWinskin.value ? (
            <custom
                render={renderWinskin}
                alpha={alpha.ref.value}
                bindings={[winskin.value]}
                noanti
            />
        ) : (
            <g-rectr
                circle={props.circle ?? [4]}
                alpha={alpha.ref.value}
                fill
                stroke
                fillStyle={props.color}
                strokeStyle={props.border}
                lineWidth={props.borderSize}
            />
        );
}, selectionProps);
