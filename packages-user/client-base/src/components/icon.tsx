import { DefaultProps } from '@motajs/render-vue';
import { SetupComponentOptions } from '@motajs/system';
import { computed, defineComponent, inject, markRaw } from 'vue';
import { IMaterialFramedData, ITextureManager } from '../material';
import { isNil } from 'lodash-es';
import { ITexture, TextureRowAnimater } from '@motajs/render';

export interface IIconProps extends DefaultProps {
    /** 当前显示的图标 */
    icon?: number | string;
    /** 贴图管理器，默认会使用主对象上的贴图管理器 */
    materials?: ITextureManager;
    /** 是否播放图块动画 */
    animate?: boolean;
    /** 展示图块指定帧数的动画，传入时会忽略 `animate` 的动画 */
    frame?: number;
}

const iconProps = {
    props: ['icon', 'materials', 'animate', 'frame']
} satisfies SetupComponentOptions<IIconProps>;

export const Icon = defineComponent<IIconProps>(props => {
    const animater = markRaw(new TextureRowAnimater());
    const defaultMaterials = inject<ITextureManager | null>(
        '@default/materials',
        null
    );

    /** 贴图管理器 */
    const materials = computed(() => props.materials ?? defaultMaterials);
    /** 图块的渲染数据 */
    const data = computed<IMaterialFramedData | null>(() => {
        if (!materials.value) return null;
        const icon = props.icon ?? 0;
        if (typeof icon === 'number') {
            return materials.value.getTile(icon);
        } else {
            return materials.value.getTileByAlias(icon);
        }
    });
    /** 图块的完整贴图 */
    const texture = computed<ITexture | null>(
        () => data.value?.texture ?? null
    );
    /** 是否播放图块动画 */
    const animate = computed<boolean>(() => {
        const frames = data.value?.frames ?? 1;
        return isNil(props.frame) && !!props.animate && frames > 1;
    });
    /** 当不播放图块动画时，静态使用的贴图 */
    const staticImage = computed<ITexture | null>(() => {
        if (!animate.value || !data.value) return null;
        const frame = props.frame ?? data.value.defaultFrame;
        const o = data.value.offset * frame;
        const tex = data.value.texture;
        return tex.clip({ x: o, y: 0, w: o, h: tex.height });
    });

    return () =>
        animate.value ? (
            <animated
                texture={texture.value}
                animater={animater}
                param={data.value?.offset}
            ></animated>
        ) : (
            <image image={staticImage.value}></image>
        );
}, iconProps);
