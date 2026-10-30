import {
    GameUI,
    SetupComponentOptions,
    IUIDefaultPropsBase
} from '@motajs/system';
import { ElementLocator } from '@motajs/render';
import { DefaultProps } from '@motajs/render-vue';
import { computed, defineComponent } from 'vue';
import { MAIN_HEIGHT, MAIN_WIDTH } from '@/client';

export interface MainBackgroundProps
    extends DefaultProps, IUIDefaultPropsBase {}

const mainBackgroundProps = {
    props: ['controller', 'instance']
} satisfies SetupComponentOptions<MainBackgroundProps>;

export const MainBackground = defineComponent<MainBackgroundProps>(() => {
    return () => (
        <g-rect
            loc={[0, 0, MAIN_WIDTH, MAIN_HEIGHT]}
            fill
            fillStyle="rgba(0, 0, 0, 0.8)"
        />
    );
}, mainBackgroundProps);

/** 主 UI 控制器的背景 UI */
export const MainBackgroundUI = new GameUI('main-background', MainBackground);

export interface BackgroundProps extends DefaultProps {
    loc: ElementLocator;
    winskin?: ImageIds;
    color?: CanvasStyle;
    border?: CanvasStyle;
}

const backgroundProps = {
    props: ['loc', 'winskin', 'color', 'border']
} satisfies SetupComponentOptions<BackgroundProps>;

/**
 * 背景组件，与 Selection 类似，不过绘制的是背景，而不是选择光标，参数参考 {@link BackgroundProps}，用例如下：
 * ```tsx
 * // 使用 winskin2.png 作为背景
 * <Background loc={[8, 8, 160, 160]} winskin="winskin2.png" />
 * // 使用指定填充和边框颜色作为背景
 * <Background loc={[8, 8, 160, 160]} color="#333" border="gold" />
 * ```
 */
export const Background = defineComponent<BackgroundProps>(props => {
    const isWinskin = computed(() => !!props.winskin);
    const fixedLoc = computed<ElementLocator>(() => {
        const [x = 0, y = 0, width = 200, height = 200] = props.loc;
        return [x + 2, y + 2, width - 4, height - 4];
    });

    return () =>
        isWinskin.value ? (
            <winskin imageName={props.winskin!} loc={props.loc} noanti />
        ) : (
            <g-rectr
                loc={fixedLoc.value}
                fillStyle={props.color}
                strokeStyle={props.border}
                fill
                stroke
                lineWidth={2}
                circle={[4]}
            />
        );
}, backgroundProps);

export const BackgroundUI = new GameUI('background', Background);
