import { BaseProps, TagDefine } from '@motajs/render-vue';
import { IRenderItemBaseHooks, SizedCanvasImageSource } from '@motajs/render';
import { IGameMap } from '@user/data-base';
import { IMapRenderer } from '../map';

export interface WinskinProps extends BaseProps {
    /** 直接设置 winskin 图片 */
    image?: SizedCanvasImageSource;
    /** 根据图片名称设置 winskin 图片 */
    imageName?: string;
    /** 边框大小 */
    borderSize?: number;
}

export interface MapRenderProps extends BaseProps {
    map: IGameMap;
    renderer: IMapRenderer;
}

declare module 'vue/jsx-runtime' {
    namespace JSX {
        export interface IntrinsicElements {
            winskin: TagDefine<WinskinProps, IRenderItemBaseHooks>;
            'map-render': TagDefine<MapRenderProps, IRenderItemBaseHooks>;
        }
    }
}
