import { ElementLocator, Font } from '@motajs/render';
import { computed, defineComponent, inject, ref } from 'vue';
import { cosh } from '@motajs/animate';
import { debounce } from 'lodash-es';
import { SetupComponentOptions } from '@motajs/system';
import { DefaultProps, transitioned, xywh } from '@motajs/render-vue';
import { Icon } from './icon';
import { ITextureManager } from '../material';

export interface TipProps extends DefaultProps {
    /** 边距 */
    pad?: [number, number];
    /** 圆角 */
    corner?: number;
    /** 显示的图标 */
    id?: string;
    /** 贴图管理器 */
    materials?: ITextureManager;
    /** 文字使用的字体 */
    font?: Font;
}

export interface TipExpose {
    /**
     * 显示提示文本
     * @param text 提示文字
     * @param icon 显示的图标，不填则不显示
     */
    drawTip(text: string, icon?: string | number): void;
}

const tipProps = {
    props: [
        'loc',
        'x',
        'y',
        'width',
        'height',
        'pad',
        'corner',
        'id',
        'materials',
        'font'
    ]
} satisfies SetupComponentOptions<TipProps>;

export const Tip = defineComponent<TipProps>((props, { expose }) => {
    const defaultMaterials = inject<ITextureManager | null>(
        '@default/materials',
        null
    );

    /** 贴图管理器 */
    const materials = computed(() => props.materials ?? defaultMaterials);
    /** 图标 id 或数字 */
    const icon = ref<number | string>(0);
    /** 显示的文字 */
    const text = ref<string>('');
    /** 文字的宽度 */
    const textWidth = ref(0);

    /** 当前的不透明度 */
    const alpha = transitioned(0, 500, cosh())!;

    const [x, y, width, height] = xywh(props);
    /** 提示内容的宽度 */
    const contentWidth = ref(width.value);
    /** 内容定位 */
    const loc = computed<ElementLocator>(() => [
        x.value,
        y.value,
        contentWidth.value,
        height.value
    ]);

    /** 使用的字体 */
    const font = computed(
        () => props.font ?? Font.defaults({ size: height.value / 2 })
    );
    /** 内边距 */
    const pad = computed(() => props.pad ?? [4, 4]);
    /** 是否隐藏当前提示元素 */
    const hidden = computed(() => alpha.ref.value === 0);
    /** 当前是否显示图标 */
    const showIcon = computed(() => icon.value !== 0);
    /** 图标的原始尺寸 */
    const iconSize = computed<[number, number]>(() => {
        const manager = materials.value;
        if (!manager) return [0, 0];
        const data = manager.tile(icon.value);
        if (!data) return [0, 0];
        return [data.offset, data.texture.height];
    });
    const iconLoc = computed<ElementLocator>(() => {
        const [w, h] = iconSize.value;
        const aspect = w / h;
        const realHeight = height.value - pad.value[1] * 2;
        const realWidth = realHeight * aspect;
        return [pad.value[0], pad.value[1], realWidth, realHeight];
    });
    const textLoc = computed<ElementLocator>(() => {
        if (showIcon.value) {
            const [, , width] = iconLoc.value;
            const x = width! + pad.value[0] + pad.value[1];
            return [x, height.value / 2];
        } else {
            return [pad.value[0], height.value / 2];
        }
    });
    const rectLoc = computed<ElementLocator>(() => {
        return [1, 1, contentWidth.value - 2, height.value - 2];
    });

    /** 隐藏提示框 */
    const hide = debounce(() => {
        alpha.set(0);
    }, 3000);

    /**
     * 展示提示
     * @param tipText 提示文字内容
     * @param ic 提示展示的图标
     */
    const drawTip = (tipText: string, ic: string | number = 0) => {
        text.value = tipText;
        icon.value = ic;
        alpha.set(0, 0);
        alpha.set(1);
        hide();
    };

    const onSetText = (width: number) => {
        textWidth.value = width;
    };

    const ex: TipExpose = { drawTip };

    expose<TipExpose>(ex);

    return () => (
        <container
            loc={loc.value}
            alpha={alpha.ref.value}
            hidden={hidden.value}
            noevent
            nocache
        >
            <g-rectr
                loc={rectLoc.value}
                circle={[props.corner ?? 4]}
                fillStyle="rgba(0,0,0,0.8)"
            />
            <Icon
                icon={icon.value}
                materials={materials.value ?? void 0}
                hidden={!showIcon.value}
                loc={iconLoc.value}
            />
            <text
                loc={textLoc.value}
                anc={[0, 0.5]}
                text={text.value}
                font={font.value}
                onUpdateSize={onSetText}
            />
        </container>
    );
}, tipProps);
