import {
    IUIController,
    IUIInstance,
    UIComponent,
    UIPropsBaseCreator
} from '@motajs/system';
import { IClientBase, IGameUIPropsBase } from '@user/client-base';

/**
 * 创建游戏 UI 基础参数的构造函数
 * @param state 游戏状态对象
 */
export function createUIPropsBase(
    state: IClientBase
): UIPropsBaseCreator<IGameUIPropsBase> {
    return (
        instance: IUIInstance<UIComponent, IGameUIPropsBase>,
        controller: IUIController<IGameUIPropsBase>
    ): IGameUIPropsBase => {
        return {
            instance,
            controller,
            state
        };
    };
}
