import { defineComponent, VNode } from 'vue';
import { IUIController } from './types';
import { SetupComponentOptions } from './types';

export interface IUIContainerProps {
    /** 当前 UI 容器组件所属的控制器 */
    readonly controller: IUIController<any>;
}

const containerConfig = {
    props: ['controller']
} satisfies SetupComponentOptions<IUIContainerProps>;

export const UIContainer = defineComponent<IUIContainerProps>(props => {
    const data = props.controller;
    const back = data.backIns;
    return (): VNode[] => {
        const elements: VNode[] = [];
        const b = back.value;
        if (data.showBack.value && b && !b.hidden) {
            elements.push(
                <b.ui.component
                    {...b.vBind}
                    controller={data}
                    instance={b}
                    key={b.key}
                    hidden={b.hidden && !b.alwaysShow}
                    zIndex={0}
                ></b.ui.component>
            );
        }
        return elements.concat(
            data.stack.map((v, i) => (
                <v.ui.component
                    {...v.vBind}
                    key={v.key}
                    controller={data}
                    instance={v}
                    hidden={v.hidden.value}
                    zIndex={i * 5}
                ></v.ui.component>
            ))
        );
    };
}, containerConfig);
