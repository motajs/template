import {
    FaceDirection,
    IMoverController,
    IObjectMover,
    ITileRawData,
    shouldReplay
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

    num(): number {
        return this.tileNum;
    }

    raw(): ITileRawData | null {
        return this.tileRaw;
    }

    @shouldReplay('Setting dynamic block num should be replayed.')
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

    @shouldReplay('Setting dynamic block position should be replayed.')
    setPos(x: number, y: number): void {
        this.x = x;
        this.y = y;
        this.locator = { x, y };
        this.layer.updateDynamicTile(this);
    }

    getCurrentFaceDirection(): FaceDirection {
        return this.layer.faceBinder.getFaceDirection(this.tileNum);
    }

    @shouldReplay('Transfering dynamic tile to static should be replayed.')
    toStatic(): IStaticTile | null {
        return this.layer.transferToStatic(this);
    }

    @shouldReplay('Transfering dynamic tile to static should be replayed.')
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
        const eventView = this.tileEvent();
        if (eventView.dirty()) {
            save = {
                num: this.num(),
                events: new Map(eventView.get())
            };
        } else {
            save = {
                num: this.num()
            };
        }
        return save;
    }

    /**
     * 从存档恢复动态图块：先经 `set` 还原图块数字（同时重取原始图块并重建默认事件），
     * 再按存档逐条覆盖事件；`num` 与 `events` 即 `IDynamicBlockSave` 的全部字段。
     */
    loadState(save: Readonly<IDynamicBlockSave>): void {
        this.set(save.num);
        if (save.events) {
            const eventView = this.tileEvent();
            eventView.clear();
            for (const [priority, id] of save.events) {
                eventView.set(priority, id);
            }
        }
    }
}
