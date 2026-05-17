import {
    HookController,
    Hookable,
    IHookController,
    ITileLocator,
    logger
} from '@motajs/common';
import {
    IDynamicLayer,
    IDynamicLayerHooks,
    IDynamicTile,
    IMapLayer
} from './types';
import { FaceDirection, degradeFace } from '../common';
import { DynamicTile } from './dynamicTile';

export class DynamicLayer
    extends Hookable<IDynamicLayerHooks>
    implements IDynamicLayer
{
    /** 坐标到动态图块集合的映射，外层 key = y，内层 key = x，不使用 index 是为了支持地图外图块 */
    private readonly tilePosMap: Map<number, Map<number, Set<IDynamicTile>>> =
        new Map();
    /** 动态图块到其当前坐标的映射 */
    private readonly posTileMap: Map<IDynamicTile, ITileLocator> = new Map();

    constructor(public readonly layer: IMapLayer) {
        super();
    }

    protected createController(
        hook: Partial<IDynamicLayerHooks>
    ): IHookController<IDynamicLayerHooks> {
        return new HookController(this, hook);
    }

    createDynamic(num: number, x: number, y: number): IDynamicTile {
        const tile = new DynamicTile(num, x, y, this);
        tile.setTriggerType(this.layer.getTriggerType(x, y));
        this.addTileToPosMap(tile, x, y);
        this.posTileMap.set(tile, { x, y });
        this.forEachHook(hook => hook.onCreateTile?.(tile, this));
        return tile;
    }

    transferToDynamic(
        x: number,
        y: number,
        keepTrigger: boolean = true
    ): IDynamicTile {
        const num = this.layer.getBlock(x, y);
        const triggerType = keepTrigger ? this.layer.getTriggerType(x, y) : -1;
        if (num === 0) {
            logger.warn(127, x.toString(), y.toString());
        }
        this.layer.setBlock(0, x, y);
        this.layer.revertTrigger(x, y);
        const tile = this.createDynamic(num, x, y);
        tile.setTriggerType(triggerType);
        return tile;
    }

    /**
     * 将动态图块上的触发器同步回当前静态格点
     */
    private syncStaticTrigger(tile: IDynamicTile, keepTrigger: boolean): void {
        if (keepTrigger) {
            this.layer.setTriggerType(tile.triggerType, tile.x, tile.y);
        } else {
            this.layer.revertTrigger(tile.x, tile.y);
        }
    }

    transferToStatic(tile: IDynamicTile, keepTrigger: boolean = true): void {
        const { x, y } = tile;
        const { width, height } = this.layer;
        if (x < 0 || y < 0 || x >= width || y >= height) {
            logger.warn(128, x.toString(), y.toString());
            return;
        }
        if (this.layer.getBlock(x, y) !== 0) {
            logger.warn(129, x.toString(), y.toString());
        }
        this.layer.setBlock(tile.num, x, y);
        this.syncStaticTrigger(tile, keepTrigger);
        this.removeTile(tile);
        this.forEachHook(hook => hook.onDeleteTile?.(tile, this));
    }

    transferToStaticIfSafe(
        tile: IDynamicTile,
        keepTrigger: boolean = true
    ): boolean {
        const { x, y } = tile;
        const { width, height } = this.layer;
        if (x < 0 || y < 0 || x >= width || y >= height) {
            logger.warn(128, x.toString(), y.toString());
            return false;
        }
        if (this.layer.getBlock(tile.x, tile.y) !== 0) return false;
        this.layer.setBlock(tile.num, x, y);
        this.syncStaticTrigger(tile, keepTrigger);
        this.removeTile(tile);
        this.forEachHook(hook => hook.onDeleteTile?.(tile, this));
        return true;
    }

    async deleteDynamic(tile: IDynamicTile): Promise<void> {
        if (!this.posTileMap.has(tile)) {
            logger.warn(130);
            return;
        }
        this.removeTile(tile);
        const hooks = this.forEachHook(hook => hook.onDeleteTile?.(tile, this));
        await Promise.all(hooks);
    }

    getDynamicTilesAt(x: number, y: number): Iterable<IDynamicTile> {
        return this.tilePosMap.get(y)?.get(x) ?? new Set();
    }

    iterateDynamicTiles(): Iterable<IDynamicTile> {
        return this.posTileMap.keys();
    }

    setDynamicDirection(tile: IDynamicTile, direction: FaceDirection): void {
        const numBefore = tile.num;
        tile.setFaceDirection(direction);
        if (tile.num !== numBefore) return;
        const degraded = degradeFace(direction);
        if (degraded !== direction) {
            tile.setFaceDirection(degraded);
        }
    }

    updateDynamicTile(tile: IDynamicTile): void {
        const oldPos = this.posTileMap.get(tile);
        if (oldPos) {
            this.removeTileFromPosMap(tile, oldPos.x, oldPos.y);
            oldPos.x = tile.x;
            oldPos.y = tile.y;
            this.addTileToPosMap(tile, tile.x, tile.y);
        } else {
            this.addTileToPosMap(tile, tile.x, tile.y);
            this.posTileMap.set(tile, { x: tile.x, y: tile.y });
        }
        this.forEachHook(hook => hook.onUpdateTilePosition?.(tile, this));
    }

    /**
     * 将动态图块登记到指定坐标的索引表中
     */
    private addTileToPosMap(tile: IDynamicTile, x: number, y: number): void {
        const xMap = this.tilePosMap.getOrInsertComputed(y, () => new Map());
        const set = xMap.getOrInsertComputed(x, () => new Set());
        set.add(tile);
    }

    /**
     * 将动态图块从指定坐标的索引表中移除
     */
    private removeTileFromPosMap(
        tile: IDynamicTile,
        x: number,
        y: number
    ): void {
        this.tilePosMap.get(y)?.get(x)?.delete(tile);
    }

    /**
     * 从两个内部映射中移除图块记录
     */
    private removeTile(tile: IDynamicTile): void {
        const pos = this.posTileMap.get(tile);
        if (pos) {
            this.removeTileFromPosMap(tile, pos.x, pos.y);
        }
        this.posTileMap.delete(tile);
    }
}
