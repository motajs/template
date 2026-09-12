import {
    ITileLegacyConverter,
    ITilePassData,
    ITileRawData,
    PassBit,
    TileType
} from '@user/data-common';

interface ILegacyTileEventData {
    /** 旧样板图块携带的默认事件映射 */
    readonly events?: Record<number, string>;
}

export type LegacyTileData = MapDataOf<keyof NumberToId> & ILegacyTileEventData;

export class TileLegacyBridge implements ITileLegacyConverter<LegacyTileData> {
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

    private getPass(num: number, legacy: LegacyTileData): ITilePassData {
        if (num === 0) {
            // 空图块
            return {
                onlyEvents: true,
                inPass: 0b1111,
                outPass: 0b1111
            };
        } else if (num === 17) {
            // 空气墙
            return {
                onlyEvents: false,
                inPass: 0b0000,
                outPass: 0b0000
            };
        } else {
            // 正常图块
            if (legacy.cannotIn && legacy.cannotOut) {
                let inPass = 0b1111;
                let outPass = 0b1111;
                if (legacy.cannotIn.includes('up')) {
                    inPass &= ~PassBit.Up;
                }
                if (legacy.cannotIn.includes('right')) {
                    inPass &= ~PassBit.Right;
                }
                if (legacy.cannotIn.includes('down')) {
                    inPass &= ~PassBit.Down;
                }
                if (legacy.cannotIn.includes('left')) {
                    inPass &= ~PassBit.Left;
                }
                if (legacy.cannotOut.includes('up')) {
                    outPass &= ~PassBit.Up;
                }
                if (legacy.cannotOut.includes('right')) {
                    outPass &= ~PassBit.Right;
                }
                if (legacy.cannotOut.includes('down')) {
                    outPass &= ~PassBit.Down;
                }
                if (legacy.cannotOut.includes('left')) {
                    outPass &= ~PassBit.Left;
                }
                return {
                    onlyEvents: false,
                    inPass,
                    outPass
                };
            } else {
                return {
                    onlyEvents: true,
                    inPass: 0b1111,
                    outPass: 0b1111
                };
            }
        }
    }

    /** 将旧样板事件输入复制为新的默认事件对象 */
    private getEvents(legacy: LegacyTileData): Record<number, string> {
        const events: Record<number, string> = {};
        for (const [priority, event] of Object.entries(legacy.events ?? {})) {
            const priorityNum = Number(priority);
            if (Number.isInteger(priorityNum) && typeof event === 'string') {
                events[priorityNum] = event;
            }
        }
        return events;
    }

    fromLegacy(num: number, legacy: LegacyTileData): ITileRawData {
        return {
            num,
            id: legacy.id,
            events: this.getEvents(legacy),
            type: this.getTileType(num, legacy),
            pass: this.getPass(num, legacy),
            eventPass: !legacy.noPass
        };
    }
}
