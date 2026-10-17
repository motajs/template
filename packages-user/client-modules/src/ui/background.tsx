import {
    GameUI,
    SetupComponentOptions,
    IUIDefaultPropsBase
} from '@motajs/system';
import { DefaultProps } from '@motajs/render-vue';
import { defineComponent } from 'vue';
import { MAIN_WIDTH, MAIN_HEIGHT } from '../shared';

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
