import { SetupComponentOptions } from '@motajs/system';
import { DefaultProps } from '@motajs/render-vue';
import { computed, defineComponent } from 'vue';
import { Winskin } from './winskin';
import { ITextureManager } from '../material';
import { isNil } from 'lodash-es';
import { RectRCircleParams } from '@motajs/render';

export interface BackgroundProps extends DefaultProps {
    /** 使用 winskin 作为背景，此时 `color` 和 `border` 无效 */
    winskin?: string;
    /** 边框宽度，当使用 `winskin` 作为背景时，默认为 32，否则默认为 2 */
    borderWidth?: number;
    /** 填充颜色 */
    color?: CanvasStyle;
    /** 边框颜色 */
    border?: CanvasStyle;
    /** 非 `winskin` 模式下，圆角矩形的参数，默认为 [4] */
    circle?: RectRCircleParams;
    /** 使用的贴图管理器，默认会使用主对象上的贴图管理器 */
    materials?: ITextureManager;
}

const backgroundProps = {
    props: ['winskin', 'borderWidth', 'color', 'border', 'materials', 'circle']
} satisfies SetupComponentOptions<BackgroundProps>;

/**
 * 背景组件，与 Selection 类似，不过绘制的是背景，而不是选择光标，参数参考 {@link BackgroundProps}，用例如下：
 * ```tsx
 * // 使用 winskin2.png 作为背景
 * <Background loc={[8, 8, 160, 160]} winskin="winskin2.png" manager={props.state.materials} />
 * // 使用指定填充和边框颜色作为背景
 * <Background loc={[8, 8, 160, 160]} color="#333" border="gold" />
 * ```
 */
export const Background = defineComponent<BackgroundProps>(props => {
    const isWinskin = computed(() => !isNil(props.winskin));

    return () =>
        isWinskin.value ? (
            <Winskin
                winskin={props.winskin}
                materials={props.materials}
                borderSize={props.borderWidth}
                noanti
            />
        ) : (
            <g-rectr
                fillStyle={props.color}
                strokeStyle={props.border}
                fill
                stroke
                lineWidth={props.borderWidth ?? 2}
                circle={props.circle ?? [4]}
            />
        );
}, backgroundProps);
