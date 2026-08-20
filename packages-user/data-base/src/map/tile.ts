import { ITileLocator } from '@motajs/common';
import {
    FaceDirection,
    IDataCommon,
    IDataCommonExtended,
    IMapBlockRawData,
    ISaveableContent,
    ITileRawData
} from '@user/data-common';
import { IMapBlockSaveBase, IMapLayer, ITileBase } from './types';

export abstract class MapTileBase<TSave extends IMapBlockSaveBase>
    implements ITileBase, IDataCommonExtended, ISaveableContent<Readonly<TSave>>
{
    readonly state: IDataCommon;
    readonly layer: IMapLayer;
    locator: ITileLocator;
    triggers: Set<number> | null = null;

    constructor(x: number, y: number, layer: IMapLayer) {
        this.layer = layer;
        this.state = layer.state;
        this.locator = { x, y };
    }

    abstract num(): number;

    abstract raw(): ITileRawData | null;

    abstract set(num: number): void;

    block(): IMapBlockRawData | null {
        return null;
    }

    setFaceDirection(direction: FaceDirection): number {
        const cur = this.num();
        const next = this.layer.faceBinder.getFaceOf(cur, direction);
        if (next) {
            this.set(next.identifier);
            return next.identifier;
        } else {
            return cur;
        }
    }

    clearTrigger(): void {
        this.triggers = null;
    }

    addTrigger(trigger: number): void {
        if (!this.triggers) {
            this.triggers = new Set();
        }
        this.triggers.add(trigger);
    }

    deleteTrigger(trigger: number): void {
        if (!this.triggers) return;
        this.triggers.delete(trigger);
    }

    useEmptyTrigger(): void {
        this.triggers = new Set();
    }

    abstract saveState(): Readonly<TSave>;

    abstract loadState(save: Readonly<TSave>): void;
}
