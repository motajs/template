import { ElementLocator, Font, MotaOffscreenCanvas2D } from '@motajs/render';
import {
    computed,
    defineComponent,
    onMounted,
    reactive,
    ref,
    shallowRef,
    watch
} from 'vue';
import { isNil } from 'lodash-es';
import {
    TextContentTyper,
    TyperRenderable,
    TextContentType
} from './textboxTyper';
import { SetupComponentOptions } from '@motajs/system';
import { DefaultProps, lwh, useRendererRoot, xywh } from '@motajs/render-vue';
import { Icon } from './icon';
import { ITextureManager } from '../material';
import { Background } from './background';

// todo: TextContent 应该改成渲染元素？

//#region TextContent

export interface TextContentProps extends DefaultProps {
    /** 显示的文字 */
    text?: string;
    /** 是否填充 */
    fill?: boolean;
    /** 是否描边 */
    stroke?: boolean;
    /** 是否自适应高度，即组件内部计算 height 的值，而非指定，可与滚动条结合 */
    autoHeight?: boolean;
    /** 打字机对象，如果需要自定义配置，那么需要传入，如果不需要自定义配置，不传入也可以 */
    typer?: TextContentTyper;
    /** 素材管理器，用于显示图标 */
    materials?: ITextureManager;
}

export type TextContentEmits = {
    /**
     * 当打字机结束时触发
     */
    typeEnd: () => void;

    /**
     * 当打字机开始打字时触发
     */
    typeStart: () => void;

    /**
     * 当文字发生变动，组件内部重新计算文字高度时触发
     * @param height 更新后的高度
     */
    updateHeight: (height: number) => void;
};

export interface TextContentExpose {
    /**
     * 重新开始打字
     */
    retype(): void;

    /**
     * 立刻显示所有文字
     */
    showAll(): void;

    /**
     * 获取这段 TextContent 的总高度
     */
    getHeight(): number;
}

const textContentOptions = {
    props: [
        'text',
        'fill',
        'stroke',
        'loc',
        'x',
        'y',
        'width',
        'height',
        'autoHeight',
        'materials'
    ],
    emits: ['typeEnd', 'typeStart', 'updateHeight']
} satisfies SetupComponentOptions<
    TextContentProps,
    TextContentEmits,
    keyof TextContentEmits
>;

export const TextContent = defineComponent<
    TextContentProps,
    TextContentEmits,
    keyof TextContentEmits
>((props, { emit, expose }) => {
    const [x, y, width, height] = xywh(props);
    const loc = reactive<ElementLocator>([
        x.value,
        y.value,
        width.value,
        height.value
    ]);

    const root = useRendererRoot();
    const typer = computed(
        () =>
            props.typer ?? new TextContentTyper({ materials: props.materials })
    );
    const renderable = shallowRef<TyperRenderable[]>([]);
    let needUpdate = false;

    watch(
        root,
        (value, old) => {
            old?.excitation.remove(typer.value);
            value?.excitation.add(typer.value);
        },
        { immediate: true }
    );

    watch(
        typer,
        (value, old) => {
            if (old) root.value?.excitation.remove(old);
            root.value?.excitation.add(value);
        },
        { immediate: true }
    );

    /** 从头开始重新打字 */
    const retype = () => {
        if (needUpdate || props.hidden) return;
        needUpdate = true;
        renderable.value = [];

        typer.value.setText(props.text ?? '');
        typer.value.type();
        needUpdate = false;
        updateLoc();
    };

    /** 立刻显示所有文字 */
    const showAll = () => {
        typer.value.typeAll();
    };

    /** 获取当前的文本高度 */
    const getHeight = () => {
        return typer.value.getHeight();
    };

    /** 更新定位 */
    const updateLoc = () => {
        const calculatedHeight = getHeight();
        if (props.autoHeight) {
            loc[3] = calculatedHeight;
        } else {
            loc[3] = height.value;
        }
        emit('updateHeight', calculatedHeight);
    };

    watch(width, updateLoc);

    expose<TextContentExpose>({ retype, showAll, getHeight });

    const renderContent = (canvas: MotaOffscreenCanvas2D) => {
        const ctx = canvas.ctx;
        ctx.textBaseline = 'top';
        ctx.lineWidth = typer.value.config.strokeWidth;
        ctx.lineJoin = 'round';
        for (const data of renderable.value) {
            if (data.cut) break;
            switch (data.type) {
                case TextContentType.Text: {
                    if (data.text.length === 0) continue;
                    ctx.fillStyle = data.fillStyle;
                    ctx.strokeStyle = data.strokeStyle;
                    ctx.font = data.font;

                    const text = data.text.slice(0, data.pointer);

                    if (props.stroke) {
                        ctx.strokeText(text, data.x, data.y);
                    }
                    if (props.fill ?? true) {
                        ctx.fillText(text, data.x, data.y);
                    }
                    break;
                }
                case TextContentType.Icon: {
                    const { renderable: r, x: dx, y: dy, width, height } = data;
                    const w = r.offset;
                    const h = data.height;
                    const source = r.texture.source;
                    ctx.drawImage(source, 0, 0, w, h, dx, dy, width, height);
                    break;
                }
            }
        }
    };

    const renderFunc = (data: TyperRenderable[]) => {
        renderable.value = data;
    };

    typer.value.setRender(renderFunc);
    typer.value.on('typeStart', () => {
        emit('typeStart');
    });
    typer.value.on('typeEnd', () => {
        emit('typeEnd');
    });

    onMounted(retype);

    return () => (
        <custom
            loc={loc}
            render={renderContent}
            bindings={[renderable.value]}
        ></custom>
    );
}, textContentOptions);

//#endregion

//#region Textbox

export interface TextboxProps
    extends Omit<TextContentProps, 'autoHeight'>, DefaultProps {
    /** 背景颜色 */
    backColor?: CanvasStyle;
    /** 描边使用的颜色 */
    strokeColor?: CanvasStyle;
    /** 背景 winskin */
    winskin?: ImageIds;
    /** 边框与文字间的距离，默认为8 */
    padding?: number;
    /** 标题 */
    title?: string;
    /** 标题字体 */
    titleFont?: Font;
    /** 标题填充样式 */
    titleFill?: CanvasStyle;
    /** 标题描边样式 */
    titleStroke?: CanvasStyle;
    /** 标题文字与边框间的距离，默认为4 */
    titlePadding?: number;
    /** 图标 */
    icon?: string | number;
}

export interface TextboxExpose {
    /**
     * 重新开始打字
     */
    retype(): void;

    /**
     * 立刻显示所有文字
     */
    showAll(): void;
}

type TextboxEmits = TextContentEmits;

const textboxOptions = {
    props: [
        'text',
        'fill',
        'stroke',
        'backColor',
        'winskin',
        'padding',
        'title',
        'titleFont',
        'titleFill',
        'titleStroke',
        'titlePadding',
        'materials',
        'icon',
        'loc',
        'x',
        'y',
        'width',
        'height'
    ],
    emits: textContentOptions.emits
} satisfies SetupComponentOptions<TextboxProps, {}, string>;

export const Textbox = defineComponent<
    TextboxProps,
    TextboxEmits,
    keyof TextboxEmits
>((props, { expose, emit }) => {
    /** 是否包含标题 */
    const hasTitle = computed(() => !isNil(props.title));
    /** 标题内边距 */
    const titlePadding = computed(() => props.titlePadding ?? 4);
    /** 正文的内边距 */
    const padding = computed(() => props.padding ?? 8);
    /** 标题字体 */
    const titleFont = computed(
        () => props.titleFont ?? Font.defaults({ size: 24 })
    );

    const [loc, width, height] = lwh(props);

    const content = ref<TextContentExpose>();

    /** 标题宽度 */
    const tw = ref(titlePadding.value * 2);
    /** 标题高度 */
    const th = ref(titlePadding.value * 2);
    /** 背景内容的高度 */
    const backHeight = computed(() => height.value - contentY.value);
    /** 正文的高度 */
    const contentHeight = computed(
        () => height.value - padding.value * 2 - contentY.value
    );
    /** 图标信息 */
    const iconData = computed(() => {
        const icon = props.icon;
        const material = props.materials;
        if (isNil(icon) || !material) return null;
        const data = material.tile(icon);
        return data;
    });
    /** 图标定位 */
    const iconLoc = computed<ElementLocator>(() => {
        const y = contentY.value;
        const pad = padding.value;
        const data = iconData.value;
        if (!data) return [];
        const width = data.offset;
        const height = data.texture.height;
        return [pad, pad + y, width, height];
    });
    /** 正文的横坐标 */
    const contentX = computed(() => {
        if (iconData.value) {
            return padding.value + 40;
        } else {
            return padding.value;
        }
    });
    /** 正文的宽度 */
    const contentWidth = computed(() => {
        if (iconData.value) {
            return width.value! - padding.value * 2 - 40;
        } else {
            return width.value! - padding.value * 2;
        }
    });
    /** 正文的纵坐标 */
    const contentY = computed(() => (!isNil(props.title) ? th.value : 0));

    /** 更新标题尺寸 */
    const onUpdateTitleSize = (width: number, height: number) => {
        tw.value = width;
        th.value = height;
    };

    const onTypeStart = () => {
        emit('typeStart');
    };

    const onTypeEnd = () => {
        emit('typeEnd');
    };

    expose<TextboxExpose>({
        retype() {
            content.value?.retype();
        },
        showAll() {
            content.value?.showAll();
        }
    });

    return () => (
        <container loc={loc.value} nocache>
            <container
                hidden={!hasTitle.value}
                zIndex={10}
                loc={[0, 0, tw.value, th.value]}
                nocache
            >
                <Background
                    winskin={props.winskin}
                    color={props.backColor}
                    border={props.strokeColor}
                    circle={[0]}
                    manager={props.materials}
                    loc={[0, 0, tw.value, th.value]}
                />
                <text
                    text={props.title}
                    loc={[titlePadding.value, titlePadding.value]}
                    fillStyle={props.titleFill}
                    strokeStyle={props.titleStroke}
                    font={titleFont.value}
                    strokeWidth={2}
                    onUpdateSize={onUpdateTitleSize}
                ></text>
            </container>

            <Background
                winskin={props.winskin}
                color={props.backColor}
                border={props.strokeColor}
                circle={[0]}
                manager={props.materials}
                loc={[0, contentY.value, width.value, backHeight.value]}
            />

            <Icon
                hidden={!!iconData.value}
                icon={props.icon}
                loc={iconLoc.value}
                manager={props.materials}
                animate
            />
            <g-rect
                hidden={!!iconData.value}
                loc={iconLoc.value}
                strokeStyle="gold"
                fillStyle="#222"
                lineWidth={2}
                fill
                stroke
            />

            <TextContent
                {...props}
                ref={content}
                x={contentX.value}
                y={contentY.value + padding.value}
                width={contentWidth.value}
                height={contentHeight.value}
                onTypeEnd={onTypeEnd}
                onTypeStart={onTypeStart}
            ></TextContent>
        </container>
    );
}, textboxOptions);

//#endregion
