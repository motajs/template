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

    /**
     * 根据当前图块原始数据恢复默认事件并建立干净基准
     */
    private restoreDefaultEvents(): void {
        this.tileEvent().clear();
        const data = this.raw();
        if (data) {
            for (const [priority, id] of Object.entries(data.events)) {
                this.tileEvent().set(Number(priority), id);
            }
        }
        this.tileEvent().markPure();
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
        return this.tileEvent().dirty();
    }

    saveState(): Readonly<IStaticBlockSave> {
        let save: IStaticBlockSave;
        if (this.tileEvent().dirty()) {
            save = {
                events: new Map(this.tileEvent().get())
            };
        } else {
            save = {};
        }
        return save;
    }

    loadState(save: Readonly<IStaticBlockSave>): void {
        this.restoreDefaultEvents();
        if (save.events) {
            this.tileEvent().clear();
            for (const [priority, id] of save.events) {
                this.tileEvent().set(priority, id);
            }
        }
    }
}
