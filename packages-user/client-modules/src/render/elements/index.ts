import { logger } from '@motajs/common';
import { MapRenderItem } from '../map';
import { mainRenderer, tagManager } from '../renderer';
import { createCache } from './cache';
import { Icon, Winskin } from './misc';

export function createElements() {
    createCache();

    // ----- 注册标签
    mainRenderer.registerElement('icon', Icon);
    mainRenderer.registerElement('winskin', Winskin);
    mainRenderer.registerElement('map-render', MapRenderItem);

    tagManager.registerTag(
        'icon',
        tagManager.createStandardElement(false, Icon)
    );
    tagManager.registerTag(
        'winskin',
        tagManager.createStandardElement(false, Winskin)
    );
    tagManager.registerTag('map-render', props => {
        if (!props) {
            logger.error(42, 'layerState');
            throw new Error(`Lack of map-render property.`);
        }
        const { layerState, renderer, extension } = props;
        if (!layerState) {
            logger.error(42, 'layerState');
            throw new Error(`Lack of map-render property.`);
        }
        if (!renderer) {
            logger.error(42, 'renderer');
            throw new Error(`Lack of map-render property.`);
        }
        if (!extension) {
            logger.error(42, 'extension');
            throw new Error(`Lack of map-render property.`);
        }
        return new MapRenderItem(layerState, renderer, extension);
    });
}

export * from './cache';
export * from './misc';
export * from './props';
