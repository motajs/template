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
    }

    num(): number {
        return this.layer.getBlock(this.locator.x, this.locator.y);
    }

    raw(): ITileRawData | null {
        return this.state.tileStore.getData(this.num());
    }

    set(num: number): void {
        this.layer.setBlock(num, this.locator.x, this.locator.y);
    }

    toDynamic(): IDynamicTile {
        return this.layer.transferToDynamic(this.locator.x, this.locator.y)!;
    }

    shouldSave(): boolean {
        return !!this.triggers;
    }

    saveState(): Readonly<IStaticBlockSave> {
        const save: IStaticBlockSave = {};

        if (this.triggers) {
            save.triggers = this.triggers;
        }

        return save;
    }

    loadState(save: Readonly<IStaticBlockSave>): void {
        if (save.triggers) {
            if (save.triggers.size === 0) {
                this.useEmptyTrigger();
            } else {
                save.triggers.forEach(v => this.addTrigger(v));
            }
        } else {
            this.clearTrigger();
        }
    }
}
