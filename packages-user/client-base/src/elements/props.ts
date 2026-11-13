import { BaseProps, TagDefine } from '@motajs/render-vue';
import { IRenderItemBaseHooks, SizedCanvasImageSource } from '@motajs/render';
import { IGameMap } from '@user/data-base';
import { IMapRenderer } from '../map';

export interface IconProps extends BaseProps {
    /** 图标 id 或数字 */
    icon: AllNumbers | AllIds;
    /** 显示图标的第几帧 */
    frame?: number;
    /** 是否开启动画，开启后 frame 参数无效 */
    animate?: boolean;
    /** 动画速度 */
    speed?: number;
}

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
            icon: TagDefine<IconProps, IRenderItemBaseHooks>;
            winskin: TagDefine<WinskinProps, IRenderItemBaseHooks>;
            'map-render': TagDefine<MapRenderProps, IRenderItemBaseHooks>;
        }
    }
}
