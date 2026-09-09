import { ITileRawData } from '@user/data-common';
import {
    IDynamicTile,
    IMapLayer,
    IStaticBlockSave,
    IStaticTile
} from './types';
import { MapTileBase } from './tile';

export class StaticTile
    extends MapTileBase<IStaticBlockSave>
    implements IStaticTile
{
    constructor(x: number, y: number, layer: IMapLayer) {
        super(x, y, layer);
        this.restoreDefaultEvents();
    }

    num(): number {
        return this.layer.getBlock(this.locator.x, this.locator.y);
    }

    raw(): ITileRawData | null {
        return this.state.tileStore.getData(this.num());
    }

    set(num: number): void {
        this.layer.setBlock(num, this.locator.x, this.locator.y);
        this.restoreDefaultEvents();
    }

    toDynamic(): IDynamicTile {
        return this.layer.transferToDynamic(this.locator.x, this.locator.y)!;
    }

    shouldSave(): boolean {
        const eventView = this.tileEvent();
        return eventView.dirty();
    }

    saveState(): Readonly<IStaticBlockSave> {
        let save: IStaticBlockSave;
        const eventView = this.tileEvent();
        if (eventView.dirty()) {
            save = {
                events: new Map(eventView.get())
            };
        } else {
            save = {};
        }
        return save;
    }

    loadState(save: Readonly<IStaticBlockSave>): void {
        this.restoreDefaultEvents();
        if (save.events) {
            const eventView = this.tileEvent();
            eventView.clear();
            for (const [priority, id] of save.events) {
                eventView.set(priority, id);
            }
        }
    }
}
