import { ITileLocator } from '@motajs/common';
import {
    FaceDirection,
    IDataCommon,
    IDataCommonExtended,
    ISaveableContent,
    ITileRawData
} from '@user/data-common';
import { LayerEventView } from './eventView';
import {
    ILayerEventView,
    IMapBlockSaveBase,
    IMapLayer,
    ITileBase
} from './types';

export abstract class MapTileBase<TSave extends IMapBlockSaveBase>
    implements ITileBase, IDataCommonExtended, ISaveableContent<Readonly<TSave>>
{
    readonly state: IDataCommon;
    readonly layer: IMapLayer;
    locator: ITileLocator;
    /** 该图块实例绑定的图块事件 */
    private readonly tileEvents: ILayerEventView;

    constructor(x: number, y: number, layer: IMapLayer) {
        this.layer = layer;
        this.state = layer.state;
        this.locator = { x, y };
        this.tileEvents = new LayerEventView();
        this.tileEvents.markPure();
    }

    abstract num(): number;

    abstract raw(): ITileRawData | null;

    abstract set(num: number): void;

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

    tileEvent(): ILayerEventView {
        return this.tileEvents;
    }

    pointEvent(): ILayerEventView | null {
        return this.layer.event(this.locator.x, this.locator.y);
    }

    abstract saveState(): Readonly<TSave>;

    abstract loadState(save: Readonly<TSave>): void;
}
