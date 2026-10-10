import { UIController } from '@motajs/system';
import { IGameUIPropsBase } from '@user/client-base';
import { MainBackgroundUI } from './background';

export const mainUIController = new UIController<IGameUIPropsBase>();

export function createMainController() {
    mainUIController.setBackground(MainBackgroundUI, {});
}
