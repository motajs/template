import { IMapRawData, IMapStore } from './types';

export class MapStore implements IMapStore {
    /** 地图存储映射 */
    private readonly maps: Map<string, IMapRawData> = new Map();

    getMap(floorId: string): IMapRawData | null {
        return this.maps.get(floorId) ?? null;
    }

    addMap(map: IMapRawData): void {
        this.maps.set(map.floorId, map);
    }
}
