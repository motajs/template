import { isNil } from 'lodash-es';
import {
    FaceDirection,
    IMoverController,
    IObjectMover,
    ITileRawData
} from '@user/data-common';
import {
    IDynamicBlockSave,
    IDynamicTile,
    IMapLayer,
    IStaticTile
} from './types';
import { DynamicTileMover } from './mover';
import { logger } from '@motajs/common';
import { MapTileBase } from './tile';

export class DynamicTile
    extends MapTileBase<IDynamicBlockSave>
    implements IDynamicTile
{
    readonly mover: IObjectMover<IDynamicTile>;

    /** 内部存储的图块数字 */
    private tileNum: number;
    /** 内部存储的原始图块信息 */
    private tileRaw: ITileRawData | null;

    constructor(
        num: number,
        public x: number,
        public y: number,
        layer: IMapLayer
    ) {
        super(x, y, layer);
        this.tileNum = num;
        this.mover = new DynamicTileMover(this);
        const data = this.state.tileStore.getData(num);
        if (!data) {
            logger.warn(143, num.toString());
            this.tileRaw = null;
        } else {
            this.tileRaw = data;
        }
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
        return this.tileNum;
    }

    raw(): ITileRawData | null {
        return this.tileRaw;
    }

    set(num: number): void {
        this.tileNum = num;
        const data = this.state.tileStore.getData(num);
        if (!data) {
            logger.warn(143, num.toString());
            this.tileRaw = null;
        } else {
            this.tileRaw = data;
        }
        this.restoreDefaultEvents();
    }

    setPos(x: number, y: number): void {
        this.x = x;
        this.y = y;
        this.locator = { x, y };
        this.layer.updateDynamicTile(this);
    }

    getCurrentFaceDirection(): FaceDirection {
        const curr = this.layer.faceBinder.getFaceDirection(this.tileNum);
        if (isNil(curr)) {
            return FaceDirection.Unknown;
        } else {
            return curr;
        }
    }

    toStatic(): IStaticTile | null {
        return this.layer.transferToStatic(this);
    }

    toStaticIfSafe(): IStaticTile | null {
        return this.layer.transferToStaticIfSafe(this);
    }

    step(dir: FaceDirection, count?: number): IMoverController | null {
        if (this.mover.moving) return null;
        this.mover.step(dir, count);
        return this.mover.start();
    }

    delete(): Promise<void> {
        return this.layer.deleteDynamic(this);
    }

    saveState(): Readonly<IDynamicBlockSave> {
        let save: IDynamicBlockSave;
        if (this.tileEvent().dirty()) {
            save = {
                num: this.num(),
                events: new Map(this.tileEvent().get())
            };
        } else {
            save = {
                num: this.num()
            };
        }
        return save;
    }

    loadState(save: Readonly<IDynamicBlockSave>): void {
        this.restoreDefaultEvents();
        if (save.events) {
            this.tileEvent().clear();
            for (const [priority, id] of save.events) {
                this.tileEvent().set(priority, id);
            }
        }
    }
}
