import { gameKey } from '@motajs/system';
import { POP_BOX_WIDTH, CENTER_LOC, FULL_LOC } from '../shared';
import {
    saveSave,
    mainUIController,
    saveLoad,
    openSettings,
    openViewMap,
    openReplay,
    openStatistics
} from './ui';
import { ElementLocator } from '@motajs/render';

export function createAction() {
    gameKey
        .realize('save', () => {
            saveSave(mainUIController, FULL_LOC);
        })
        .realize('statistics', () => {
            openStatistics(mainUIController);
        })
        .realize('load', () => {
            saveLoad(mainUIController, FULL_LOC);
        })
        .realize('menu', () => {
            const loc = CENTER_LOC.slice() as ElementLocator;
            loc[2] = POP_BOX_WIDTH;
            openSettings(mainUIController, loc);
        })
        .realize('replay', () => {
            const loc = CENTER_LOC.slice() as ElementLocator;
            loc[2] = POP_BOX_WIDTH;
            openReplay(mainUIController, loc);
        })
        .realize('viewMap', () => {
            openViewMap(mainUIController, FULL_LOC);
        });
}
