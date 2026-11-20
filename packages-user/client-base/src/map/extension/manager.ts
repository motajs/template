import { IFaceManager } from '@user/data-common';
import { IHeroLocation, IMapLayer } from '@user/data-base';
import {
    IMapDoorRenderer,
    IMapExtensionManager,
    IMapHeroRenderer
} from './types';
import { IMapRenderer } from '../types';
import { MapHeroRenderer } from './hero';
import { logger } from '@motajs/common';
import { MapDoorRenderer } from './door';

export class MapExtensionManager implements IMapExtensionManager {
    /** 勇士状态至勇士渲染器的映射 */
    readonly heroMap: Map<IHeroLocation, IMapHeroRenderer> = new Map();
    /** 地图图层到门渲染器的映射 */
    readonly doorMap: Map<IMapLayer, IMapDoorRenderer> = new Map();

    constructor(readonly renderer: IMapRenderer) {}

    addHero(
        state: IHeroLocation,
        layer: IMapLayer,
        faceManager: IFaceManager
    ): IMapHeroRenderer | null {
        if (this.heroMap.has(state)) {
            logger.error(45, 'hero renderer');
            return null;
        }
        const heroRenderer = new MapHeroRenderer(
            this.renderer,
            layer,
            state,
            faceManager
        );
        this.heroMap.set(state, heroRenderer);
        return heroRenderer;
    }

    removeHero(state: IHeroLocation): void {
        const renderer = this.heroMap.get(state);
        if (!renderer) return;
        renderer.destroy();
        this.heroMap.delete(state);
    }

    addDoor(layer: IMapLayer): IMapDoorRenderer | null {
        if (this.doorMap.has(layer)) {
            logger.error(45, 'door renderer');
            return null;
        }
        const doorRenderer = new MapDoorRenderer(this.renderer, layer);
        this.doorMap.set(layer, doorRenderer);
        return doorRenderer;
    }

    removeDoor(layer: IMapLayer): void {
        const renderer = this.doorMap.get(layer);
        if (!renderer) return;
        renderer.destroy();
        this.doorMap.delete(layer);
    }

    destroy(): void {
        this.heroMap.forEach(v => void v.destroy());
        this.doorMap.forEach(v => void v.destroy());
        this.heroMap.clear();
        this.doorMap.clear();
    }
}
