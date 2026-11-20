import { DefaultProps } from '@motajs/render-vue';
import { SetupComponentOptions, GameUI } from '@motajs/system';
import { IGameUIPropsBase } from '@user/client-base';
import { defineComponent } from 'vue';
import { MAIN_WIDTH, MAIN_HEIGHT } from '../uiConstant';

export interface MainBackgroundProps extends DefaultProps, IGameUIPropsBase {}

const mainBackgroundProps = {
    props: ['controller', 'instance', 'state']
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
