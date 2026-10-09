import { UIController } from '@motajs/system';
import { MainBackgroundUI } from './background';

export const mainUIController = new UIController('main-ui');

export function createMainController() {
    mainUIController.setBackground(MainBackgroundUI, {});
}
