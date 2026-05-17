import {
    ITileLegacyConverter,
    ITileRawData,
    TileType
} from '@user/data-common';

export type LegacyTileData = MapDataOf<keyof NumberToId>;

export class TileLegacyBridge implements ITileLegacyConverter<LegacyTileData> {
    fromLegacy(num: number, legacy: LegacyTileData): ITileRawData {
        return {
            num,
            id: legacy.id,
            trigger: -1,
            type: this.getTileType(num, legacy)
        };
    }

    private getTileType(num: number, legacy: LegacyTileData): TileType {
        if (num === 0) return TileType.None;
        switch (legacy.cls) {
            case 'terrains':
                return TileType.Terrain;
            case 'autotile':
                return TileType.Autotile;
            case 'animates':
                return TileType.Animate;
            case 'items':
                return TileType.Item;
            case 'enemys':
            case 'enemy48':
                return TileType.Enemy;
            case 'npcs':
            case 'npc48':
                return TileType.Npc;
            // @ts-expect-error 动态类型声明导致的错误，忽略即可
            case 'tileset':
                return TileType.Tileset;
            default:
                return TileType.Unknown;
        }
    }
}
