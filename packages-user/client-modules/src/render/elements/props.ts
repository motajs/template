import { BaseProps, TagDefine } from '@motajs/render-vue';
import { ERenderItemEvent, SizedCanvasImageSource } from '@motajs/render';
import { ILayerState } from '@user/data-state';
import { IMapExtensionManager, IMapRenderer } from '../map';

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
    layerState: ILayerState;
    renderer: IMapRenderer;
    extension: IMapExtensionManager;
}

declare module 'vue/jsx-runtime' {
    namespace JSX {
        export interface IntrinsicElements {
            icon: TagDefine<IconProps, ERenderItemEvent>;
            winskin: TagDefine<WinskinProps, ERenderItemEvent>;
            'map-render': TagDefine<MapRenderProps, ERenderItemEvent>;
        }
    }
}
