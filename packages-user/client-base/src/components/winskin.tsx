import { DefaultProps } from '@motajs/render-vue';
import { ITextureManager } from '../material';
import { SetupComponentOptions } from '@motajs/system';
import { ITexture, MotaOffscreenCanvas2D } from '@motajs/render';
import { computed, defineComponent, inject } from 'vue';
import { isNil } from 'lodash-es';

export interface IWinskinProps extends DefaultProps {
    /** winskin 图片的名称，带后缀 */
    winskin?: string;
    /** 使用的贴图素材管理器，默认会使用主对象上的贴图管理器 */
    materials?: ITextureManager;
    /** 手动传入贴图对象，如果传入，会忽略 `winskin` 和 `manager` */
    texture?: ITexture;
    /** 边框的宽度，默认为 32 */
    borderSize?: number;
}

const winskinProps = {
    props: ['winskin', 'materials', 'texture', 'borderSize']
} satisfies SetupComponentOptions<IWinskinProps>;

/** winskin 最小单元宽度 */
const CW = 16 / 192;
/** winskin 最小单元高度 */
const CH = 16 / 128;

export const Winskin = defineComponent<IWinskinProps>(props => {
    const defaultMaterials = inject<ITextureManager>('@default/materials');

    /** 使用的贴图管理器 */
    const materials = computed(() => props.materials ?? defaultMaterials);
    /** 边框宽度 */
    const border = computed(() => props.borderSize ?? 32);
    /** 贴图对象 */
    const texture = computed<ITexture | null>(() => {
        if (props.texture) return props.texture;
        if (isNil(props.winskin) || !materials.value) return null;
        return materials.value.getImageByAlias(props.winskin);
    });

    const render = (canvas: MotaOffscreenCanvas2D) => {
        if (!texture.value) return;
        const ctx = canvas.ctx;
        const w = canvas.width;
        const h = canvas.height;
        const pad = border.value / 2;
        const { width, height, source: s } = texture.value;
        const x1 = CW * width; // 16
        const x2 = CW * 2 * width; // 32
        const x3 = CW * 8 * width; // 128
        const x4 = CW * 9 * width; // 144
        const x5 = CW * 11 * width; // 176
        const y1 = CH * height; // 16
        const y2 = CH * 2 * height; // 32
        const y3 = CH * 3 * height; // 48
        const y4 = CH * 8 * height; // 128
        // 背景
        ctx.drawImage(s, 0, 0, x3, y4, 2, 2, w - 4, h - 4);
        // 上下左右边框
        ctx.drawImage(s, x4, 0, x2, y1, pad, 0, w - pad * 2, pad);
        ctx.drawImage(s, x4, y3, x2, y1, pad, h - pad, w - pad * 2, pad);
        ctx.drawImage(s, x3, y1, x1, y2, 0, pad, pad, h - pad * 2);
        ctx.drawImage(s, x5, y1, x1, y2, w - pad, pad, pad, h - pad * 2);
        // 四个角的边框
        ctx.drawImage(s, x3, 0, x1, y1, 0, 0, pad, pad);
        ctx.drawImage(s, x5, 0, x1, y1, w - pad, 0, pad, pad);
        ctx.drawImage(s, x3, y3, x1, y1, 0, h - pad, pad, pad);
        ctx.drawImage(s, x5, y3, x1, y1, w - pad, h - pad, pad, pad);
    };

    return () => (
        <custom
            render={render}
            bindings={[border.value, texture.value]}
        ></custom>
    );
}, winskinProps);
