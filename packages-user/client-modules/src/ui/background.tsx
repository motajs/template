import { GameUI, SetupComponentOptions } from '@motajs/system';
import { defineComponent } from 'vue';
import { MainBackgroundProps } from '../render';
import { MAIN_WIDTH, MAIN_HEIGHT } from '../shared';

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
