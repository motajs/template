import { IClientCore } from '@user/client-modules';
import { defineComponent } from 'vue';
import { MAIN_HEIGHT, MAIN_WIDTH } from '../uiConstant';
import { UIComponent } from '@motajs/system';

export function createRendererScene(state: IClientCore): UIComponent {
    return defineComponent(() => {
        return () => (
            <container width={MAIN_WIDTH} height={MAIN_HEIGHT}>
                {state.sceneController.render()}
            </container>
        );
    });
}
