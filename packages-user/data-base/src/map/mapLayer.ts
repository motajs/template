import { isNil } from 'lodash-es';
import {
    IDynamicBlockSave,
    IDynamicTile,
    IGameMap,
    ILayerEventView,
    ILayerLocation,
    IMapLayerData,
    IMapLayerHookController,
    IMapLayerHooks,
    IMapLayerSave,
    IResizableMapLayer,
    IStaticBlockSave,
    IStaticTile
} from './types';
import { Hookable, HookController, ITileLocator, logger } from '@motajs/common';
import {
    FaceDirection,
    IDataCommon,
    ILocationHelper,
    IRoleFaceBinder,
    MapLocIndexer,
    SaveCompression,
    shouldReplay
} from '@user/data-common';
import { DynamicTile } from './dynamicTile';
import { LayerEventView } from './eventView';
import { StaticTile } from './staticTile';

export class MapLayer
    extends Hookable<IMapLayerHooks, IMapLayerHookController>
    implements IResizableMapLayer
{
    readonly state: IDataCommon;
    readonly indexer: ILocationHelper;

    width: number;
    height: number;
    empty: boolean = true;
    zIndex: number = 0;

    faceBinder: IRoleFaceBinder;

    /** 地图图块数组 */
    private mapArray: Uint32Array;
    /** 地图数据引用 */
    private mapData: IMapLayerData;
    /** 静态图块实例缓存，key = y * width + x */
    private readonly staticTileCache: Map<number, StaticTile> = new Map();
    /** 坐标到动态图块集合的映射，外层 key = y，内层 key = x */
    private readonly tilePosMap: Map<number, Map<number, Set<IDynamicTile>>> =
        new Map();
    /** 图层的所有已缓存位置的动态图块，目的是能够持有更新前的位置，从而在图块更新时能够更新内部存储 */
    private readonly cachedDynamics: Map<IDynamicTile, ITileLocator> =
        new Map();
    /** 图层脏标记 */
    private layerDirty: boolean = false;
    /** 图层参考基准，用于存档压缩对比 */
    private refArray: Uint32Array | null = null;

    /** 点事件视图，key = y * width + x */
    private readonly pointEvents: Map<number, ILayerEventView> = new Map();

    constructor(
        width: number,
        height: number,
        readonly map: IGameMap,
        readonly alias: string
    ) {
        super();
        this.state = map.state;
        this.faceBinder = this.state.roleFace;
        this.width = width;
        this.height = height;
        const area = width * height;
        this.mapArray = new Uint32Array(area);
        this.mapData = {
            expired: false,
            array: this.mapArray
        };
        this.indexer = map.indexer;
    }

    protected createController(
        hook: Partial<IMapLayerHooks>
    ): IMapLayerHookController {
        return new MapLayerHookController(this, hook);
    }

    //#region 事件操作

    /**
     * 将所有已创建的点事件视图恢复到原始纯基准
     */
    private resetPointEvents(): void {
        this.pointEvents.forEach(v => v.reset());
    }

    event(x: number, y: number): ILayerEventView | null {
        if (!this.inMap(x, y)) return null;
        const index = this.indexer.index(x, y);
        let eventView = this.pointEvents.get(index);
        if (!eventView) {
            eventView = new LayerEventView();
            this.pointEvents.set(index, eventView);
        }
        return eventView;
    }

    getPointEvent(x: number, y: number): ReadonlyMap<number, string> | null {
        return this.event(x, y)?.get() ?? null;
    }

    //#endregion

    //#region 静态图层操作

    inMap(x: number, y: number): boolean {
        return x >= 0 && y >= 0 && x < this.width && y < this.height;
    }

    @shouldReplay('Setting map layer block should be replayed.')
    setBlock(block: number, x: number, y: number): void {
        if (!this.inMap(x, y)) return;
        const index = this.indexer.index(x, y);
        if (block === this.mapArray[index]) return;
        this.mapArray[index] = block;
        this.layerDirty = true;
        this.forEachHook(hook => {
            hook.onUpdateBlock?.(block, x, y);
        });
        if (block !== 0) {
            this.empty = false;
        }
    }

    getBlock(x: number, y: number): number {
        if (!this.inMap(x, y)) {
            return -1;
        }
        return this.mapArray[y * this.width + x];
    }

    @shouldReplay('Removing map layer block should be replayed.')
    removeBlock(x: number, y: number): number {
        if (!this.inMap(x, y)) {
            return -1;
        }
        const before = this.getBlock(x, y);
        this.setBlock(0, x, y);
        return before;
    }

    getTile(x: number, y: number): IStaticTile | null {
        if (!this.inMap(x, y)) return null;
        const index = this.map.indexer.index(x, y);
        let staticTile = this.staticTileCache.get(index);
        if (!staticTile) {
            staticTile = new StaticTile(x, y, this);
            this.staticTileCache.set(index, staticTile);
        }
        return staticTile;
    }

    getLocationData(x: number, y: number): ILayerLocation | null {
        if (!this.inMap(x, y)) return null;
        const staticTile = this.getTile(x, y);
        const num = staticTile?.num() ?? 0;
        const dynamics = this.getDynamicTilesAt(x, y);
        return {
            locator: { x, y },
            tile: num,
            dynamics,
            static: staticTile
        };
    }

    @shouldReplay('Setting map layer data should be replayed.')
    putMapData(array: Uint32Array, x: number, y: number, width: number): void {
        if (array.length % width !== 0) {
            logger.warn(8);
        }
        this.layerDirty = true;
        const h = Math.ceil(array.length / width);
        if (width === this.width && h === this.height) {
            this.mapArray.set(array);
            this.staticTileCache.clear();
            this.forEachHook(hook => {
                hook.onUpdateArea?.(x, y, width, h);
            });
            return;
        }
        const w = this.width;
        const r = x + width;
        const b = y + h;
        if (x < 0 || y < 0 || r > w || b > this.height) {
            logger.warn(9);
        }
        const nl = Math.max(x, 0);
        const nt = Math.max(y, 0);
        const nr = Math.min(r, w);
        const nb = Math.min(b, this.height);
        const nw = nr - nl;
        const nh = nb - nt;
        let empty = true;
        for (let ny = 0; ny < nh; ny++) {
            const start = ny * nw;
            const offset = (ny + nt) * w + nl;
            const sub = array.subarray(start, start + nw);
            if (empty && sub.some(v => v !== 0)) {
                empty = false;
            }
            this.mapArray.set(array.subarray(start, start + nw), offset);
        }
        this.forEachHook(hook => {
            hook.onUpdateArea?.(x, y, width, h);
        });
        this.empty &&= empty;
    }

    getMapData(): Uint32Array;
    getMapData(
        x: number,
        y: number,
        width: number,
        height: number
    ): Uint32Array;
    getMapData(
        x?: number,
        y?: number,
        width?: number,
        height?: number
    ): Uint32Array {
        if (isNil(x)) {
            return new Uint32Array(this.mapArray);
        }
        if (isNil(y) || isNil(width) || isNil(height)) {
            logger.warn(80);
            return new Uint32Array();
        }
        const w = this.width;
        const h = this.height;
        const r = x + width;
        const b = y + height;
        if (x < 0 || y < 0 || r > w || b > h) {
            logger.warn(81);
        }
        const nl = Math.max(x, 0);
        const nt = Math.max(y, 0);
        const nr = Math.min(r, w);
        const nb = Math.min(b, this.height);
        const nw = nr - nl;
        const res = new Uint32Array(width * height);
        const arr = this.mapArray;
        for (let ny = nt; ny < nb; ny++) {
            const lineStart = ny * w + nl;
            const dy = ny - y;
            res.set(arr.subarray(lineStart, lineStart + nw), dy * width);
        }
        return res;
    }

    setMapRef(array: Uint32Array): void {
        if (array.length !== this.width * this.height) {
            logger.warn(
                123,
                array.length.toString(),
                (this.width * this.height).toString()
            );
            return;
        }
        this.mapData.expired = true;
        this.mapArray = array;
        this.staticTileCache.clear();
        this.mapData = {
            expired: false,
            array: this.mapArray
        };
        this.empty = !array.some(v => v !== 0);
        this.forEachHook(hook => {
            hook.onUpdateArea?.(0, 0, this.width, this.height);
        });
    }

    getMapRef(): IMapLayerData {
        return this.mapData;
    }

    @shouldReplay('Setting map layer block direction should be replayed.')
    setStaticDirection(x: number, y: number, direction: FaceDirection): number {
        const tile = this.getTile(x, y);
        if (!tile) return -1;
        return tile.setFaceDirection(direction);
    }

    *iterateBlocks(): Iterable<ILayerLocation> {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const num = this.getBlock(x, y);
                if (num !== 0) {
                    yield this.getLocationData(x, y)!;
                }
            }
        }
    }

    //#endregion

    //#region 动态图层操作

    /**
     * 将动态图块登记到索引表中
     * @param tile 动态图块
     */
    private addDynamic(tile: IDynamicTile): void {
        const { x, y } = tile;
        const xMap = this.tilePosMap.getOrInsertComputed(y, () => new Map());
        const set = xMap.getOrInsertComputed(x, () => new Set());
        set.add(tile);
        // 需要使用不同引用的 locator，避免与 tile 本身的 locator 同引用导致缓存位置失效
        // 缓存位置的目的是能在动态图块位置更新时还持有旧位置，能够执行内部存储的移动
        this.cachedDynamics.set(tile, { x, y });
    }

    /**
     * 将动态图块从指定缓存坐标的索引表中移除，注意动态图块本身的位置与其所在的索引表可能不同，
     * 在动态图块位置更新时，指定位置可以用来移除旧位置的动态图块
     * @param tile 动态图块
     * @param x 横坐标
     * @param y 纵坐标
     */
    private removeDynamic(tile: IDynamicTile, x: number, y: number): void {
        this.cachedDynamics.delete(tile);
        this.tilePosMap.get(y)?.get(x)?.delete(tile);
    }

    @shouldReplay('Creating dynamic tile should be replayed.')
    createDynamic(num: number, x: number, y: number): IDynamicTile {
        const tile = new DynamicTile(num, x, y, this);
        this.addDynamic(tile);
        this.forEachHook(hook => hook.onCreateDynamic?.(tile));
        return tile;
    }

    @shouldReplay('Transfering static tile to dynamic should be replayed.')
    transferToDynamic(
        x: number,
        y: number,
        keepEvent: boolean = true
    ): IDynamicTile | null {
        if (!this.inMap(x, y)) {
            logger.warn(128, x.toString(), y.toString());
            return null;
        }
        const num = this.getBlock(x, y);
        if (num === 0) {
            logger.warn(127, x.toString(), y.toString());
        }
        this.setBlock(0, x, y);
        const tile = this.createDynamic(num, x, y);
        if (keepEvent) {
            const staticTile = this.getTile(x, y);
            if (staticTile) {
                tile.syncTileEvent(staticTile);
                staticTile.tileEvent().clear();
            }
        }
        return tile;
    }

    /**
     * 真正执行动态到静态的转换
     * @param tile 动态图块实例
     * @param keepEvent 是否保持图块事件至静态图层
     */
    private toStatic(
        tile: IDynamicTile,
        keepEvent: boolean = true
    ): IStaticTile | null {
        this.setBlock(tile.num(), tile.x, tile.y);
        const staticTile = this.getTile(tile.x, tile.y);
        if (!staticTile) return null;
        if (keepEvent) {
            staticTile.syncTileEvent(tile);
        } else {
            // 不保留事件时，将复用的静态图块重置为默认事件
            staticTile.restoreDefaultEvents();
        }
        this.removeDynamic(tile, tile.x, tile.y);
        this.forEachHook(hook => hook.onDeleteDynamic?.(tile));
        return staticTile;
    }

    @shouldReplay('Transfering dynamic tile to static should be replayed.')
    transferToStatic(
        tile: IDynamicTile,
        keepEvent: boolean = true
    ): IStaticTile | null {
        const { x, y } = tile;
        if (!this.inMap(x, y)) {
            logger.warn(128, x.toString(), y.toString());
            return null;
        }
        if (this.getBlock(x, y) !== 0) {
            logger.warn(129, x.toString(), y.toString());
        }
        return this.toStatic(tile, keepEvent);
    }

    @shouldReplay('Transfering dynamic tile to static should be replayed.')
    transferToStaticIfSafe(
        tile: IDynamicTile,
        keepEvent: boolean = true
    ): IStaticTile | null {
        if (!this.inMap(tile.x, tile.y)) {
            logger.warn(128, tile.x.toString(), tile.y.toString());
            return null;
        }
        if (this.getBlock(tile.x, tile.y) !== 0) return null;
        return this.toStatic(tile, keepEvent);
    }

    @shouldReplay('Deleting dynamic tile should be replayed.')
    async deleteDynamic(tile: IDynamicTile): Promise<void> {
        this.removeDynamic(tile, tile.x, tile.y);
        const hooks = this.forEachHook(hook => hook.onDeleteDynamic?.(tile));
        await Promise.all(hooks);
    }

    getDynamicTilesAt(x: number, y: number): Iterable<IDynamicTile> {
        return this.tilePosMap.get(y)?.get(x) ?? new Set();
    }

    iterateDynamicTiles(): Iterable<IDynamicTile> {
        return this.cachedDynamics.keys();
    }

    @shouldReplay('Updating dynamic tile position should be replayed.')
    updateDynamicTile(tile: IDynamicTile): void {
        const oldPos = this.cachedDynamics.get(tile);
        if (oldPos) {
            this.removeDynamic(tile, oldPos.x, oldPos.y);
            oldPos.x = tile.x;
            oldPos.y = tile.y;
            this.addDynamic(tile);
        } else {
            this.addDynamic(tile);
            this.cachedDynamics.set(tile, { x: tile.x, y: tile.y });
        }
        this.forEachHook(hook => hook.onUpdateDynamicPosition?.(tile));
    }

    //#endregion

    //#region 开关门

    @shouldReplay('Opening door should be replayed.')
    async openDoor(x: number, y: number): Promise<void> {
        const index = this.indexer.index(x, y);
        const num = this.mapArray[index];
        if (num === 0) return;
        await Promise.all(
            this.forEachHook(hook => {
                return hook.onOpenDoor?.(x, y);
            })
        );
        this.setBlock(0, x, y);
    }

    @shouldReplay('Closing door should be replayed.')
    async closeDoor(num: number, x: number, y: number): Promise<void> {
        const index = this.indexer.index(x, y);
        const nowNum = this.mapArray[index];
        if (nowNum !== 0) {
            logger.error(46, x.toString(), y.toString());
            return;
        }
        await Promise.all(
            this.forEachHook(hook => {
                return hook.onCloseDoor?.(num, x, y);
            })
        );
        this.setBlock(num, x, y);
    }

    //#endregion

    //#region 图层操作

    @shouldReplay('Setting z-index of map layer should be replayed.')
    setZIndex(zIndex: number): void {
        this.zIndex = zIndex;
    }

    @shouldReplay('Setting role face binder of map layer should be replayed.')
    setFaceBinder(binder: IRoleFaceBinder | null): void {
        if (!binder) return;
        this.faceBinder = binder;
    }

    dirty(): boolean {
        if (this.layerDirty) return true;
        for (const eventView of this.pointEvents.values()) {
            if (eventView.dirty()) return true;
        }
        return false;
    }

    markDirty(dirty: boolean): void {
        this.layerDirty = dirty;
    }

    /**
     * 判断当前图层的地图矩阵是否与参考基准完全一致
     */
    private isEqualToRef(): boolean {
        const ref = this.refArray;
        if (!ref) return false;
        if (this.mapArray.length !== ref.length) return false;
        return !this.mapArray.some((v, i) => ref[i] !== v);
    }

    compareWith(data: Uint32Array): void {
        if (this.refArray) return;
        this.refArray = data;
        this.layerDirty = !this.isEqualToRef();
    }

    /**
     * 裁剪超出新图层范围的点事件，并按新宽度重建索引
     * @param oldWidth 变更前的图层宽度，用于解码旧索引
     */
    private cropPointEvents(oldWidth: number): void {
        const oldIndex = new MapLocIndexer();
        oldIndex.setWidth(oldWidth);
        for (const [index, eventView] of [...this.pointEvents]) {
            const { x, y } = oldIndex.locator(index);
            this.pointEvents.delete(index);
            if (this.inMap(x, y)) {
                const index = this.indexer.index(x, y);
                this.pointEvents.set(index, eventView);
            }
        }
    }

    @shouldReplay('Resizing map layer should be replayed.')
    resize(width: number, height: number): void {
        if (this.width === width && this.height === height) {
            return;
        }

        // 图层数组
        this.layerDirty = true;
        this.mapData.expired = true;
        const before = this.mapArray;
        const beforeWidth = this.width;
        const beforeHeight = this.height;
        const beforeArea = beforeWidth * beforeHeight;
        this.width = width;
        this.height = height;
        const area = width * height;
        const newArray = new Uint32Array(area);
        this.mapArray = newArray;
        if (beforeArea > area) {
            for (let ny = 0; ny < height; ny++) {
                const begin = ny * beforeWidth;
                newArray.set(before.subarray(begin, begin + width), ny * width);
            }
        } else {
            for (let ny = 0; ny < beforeHeight; ny++) {
                const begin = ny * beforeWidth;
                const end = begin + beforeWidth;
                newArray.set(before.subarray(begin, end), ny * width);
            }
        }
        this.mapData = {
            expired: false,
            array: this.mapArray
        };

        // 其他杂项清理
        this.cropPointEvents(beforeWidth);
        this.staticTileCache.clear();
        this.forEachHook(hook => {
            hook.onResize?.(width, height);
        });
    }

    @shouldReplay('Resizing map layer should be replayed.')
    resize2(width: number, height: number): void {
        this.layerDirty = true;
        if (this.width === width && this.height === height) {
            this.empty = true;
            this.mapArray.fill(0);
            this.pointEvents.clear();
            this.staticTileCache.clear();
            return;
        }

        // 图层数组
        this.mapData.expired = true;
        this.width = width;
        this.height = height;
        this.mapArray = new Uint32Array(width * height);
        this.mapData = {
            expired: false,
            array: this.mapArray
        };
        this.empty = true;

        // 其他杂项清理
        this.pointEvents.clear();
        this.staticTileCache.clear();
        this.forEachHook(hook => {
            hook.onResize?.(width, height);
        });
    }

    //#endregion

    //#region 存读档

    /**
     * 保存静态图块实例
     * @param compression 压缩级别
     */
    private saveStaticTiles(
        compression: SaveCompression
    ): Map<number, IStaticBlockSave> {
        const blocks = new Map<number, IStaticBlockSave>();
        for (const location of this.iterateBlocks()) {
            const tile = location.static;
            if (!tile || !tile.shouldSave()) continue;
            const index = this.map.indexer.locatorToIndex(location.locator);
            blocks.set(index, tile.saveState(compression));
        }
        return blocks;
    }

    /**
     * 保存动态图块实例
     * @param compression 压缩级别
     */
    private saveDynamicTiles(
        compression: SaveCompression
    ): Map<number, IDynamicBlockSave[]> {
        const blocks = new Map<number, IDynamicBlockSave[]>();
        for (const tile of this.iterateDynamicTiles()) {
            const index = this.map.indexer.locatorToIndex(tile.locator);
            const list = blocks.getOrInsert(index, []);
            list.push(tile.saveState(compression));
        }
        return blocks;
    }

    /**
     * 与参考行比较，返回与参考基准不同的行
     * @param refArray 参考基准数组
     */
    private diffRows(refArray: Uint32Array): Map<number, Uint32Array> {
        const rows = new Map<number, Uint32Array>();
        for (let row = 0; row < this.height; row++) {
            const start = row * this.width;
            const end = start + this.width;
            const slice = this.mapArray.subarray(start, end);
            const refSlice = refArray.subarray(start, end);
            const same = refSlice.every((v, i) => slice[i] === v);
            if (!same) {
                rows.set(row, new Uint32Array(slice));
            }
        }
        return rows;
    }

    /**
     * 以无压缩方式序列化当前图层
     */
    private saveNoCompression(): IMapLayerSave {
        return {
            width: this.width,
            height: this.height,
            fullMap: new Uint32Array(this.mapArray),
            staticBlocks: this.saveStaticTiles(SaveCompression.NoCompression),
            dynamicBlocks: this.saveDynamicTiles(SaveCompression.NoCompression),
            pointEvents: this.savePointEvents()
        };
    }

    /**
     * 以低压缩方式序列化当前图层
     */
    private saveLowCompression(): IMapLayerSave {
        const statics = this.saveStaticTiles(SaveCompression.LowCompression);
        const dynamics = this.saveDynamicTiles(SaveCompression.LowCompression);
        if (this.layerDirty && (!this.refArray || !this.isEqualToRef())) {
            return {
                width: this.width,
                height: this.height,
                fullMap: new Uint32Array(this.mapArray),
                staticBlocks: statics,
                dynamicBlocks: dynamics,
                pointEvents: this.savePointEvents()
            };
        } else {
            return {
                width: this.width,
                height: this.height,
                staticBlocks: statics,
                dynamicBlocks: dynamics,
                pointEvents: this.savePointEvents()
            };
        }
    }

    /**
     * 以高压缩方式序列化当前图层
     */
    private saveHighCompression(): IMapLayerSave {
        const statics = this.saveStaticTiles(SaveCompression.HighCompression);
        const dynamics = this.saveDynamicTiles(SaveCompression.HighCompression);
        if (this.layerDirty) {
            if (this.refArray) {
                return {
                    width: this.width,
                    height: this.height,
                    rows: this.diffRows(this.refArray),
                    staticBlocks: statics,
                    dynamicBlocks: dynamics,
                    pointEvents: this.savePointEvents()
                };
            } else {
                return {
                    width: this.width,
                    height: this.height,
                    fullMap: new Uint32Array(this.mapArray),
                    staticBlocks: statics,
                    dynamicBlocks: dynamics,
                    pointEvents: this.savePointEvents()
                };
            }
        } else {
            return {
                width: this.width,
                height: this.height,
                staticBlocks: statics,
                dynamicBlocks: dynamics,
                pointEvents: this.savePointEvents()
            };
        }
    }

    saveState(compression: SaveCompression): IMapLayerSave {
        if (compression === SaveCompression.HighCompression) {
            return this.saveHighCompression();
        } else if (compression === SaveCompression.LowCompression) {
            return this.saveLowCompression();
        } else {
            return this.saveNoCompression();
        }
    }

    /**
     * 读取静态图块实例存档数据
     * @param save 静态图块实例存档
     * @param compression 压缩级别
     */
    private loadStaticTiles(
        save: ReadonlyMap<number, IStaticBlockSave>,
        compression: SaveCompression
    ): void {
        for (const [index, tileSave] of save) {
            const { x, y } = this.map.indexer.locator(index);
            const location = this.getLocationData(x, y);
            if (!location?.static) continue;
            location.static.loadState(tileSave, compression);
        }
    }

    /**
     * 读取动态图块实例存档数据
     * @param save 动态图块实例存档
     * @param compression 压缩级别
     */
    private loadDynamics(
        save: ReadonlyMap<number, IDynamicBlockSave[]>,
        compression: SaveCompression
    ): void {
        for (const [index, dynamics] of save) {
            const { x, y } = this.map.indexer.locator(index);
            for (const block of dynamics) {
                const tile = this.createDynamic(block.num, x, y);
                tile.loadState(block, compression);
            }
        }
    }

    /**
     * 清空本图层全部既有动态图块，使读档后的动态块与存档点一致
     * 逐块复用删除语义，会触发 `onDeleteDynamic` 钩子，但读档为同步流程，不等待钩子完成
     */
    private clearDynamics(): void {
        const tiles = [...this.iterateDynamicTiles()];
        for (const tile of tiles) {
            this.removeDynamic(tile, tile.x, tile.y);
            this.forEachHook(hook => hook.onDeleteDynamic?.(tile));
        }
    }

    /**
     * 收集需要保存的点事件并复制其内部 Map
     */
    private savePointEvents(): Map<number, ReadonlyMap<number, string>> {
        const pointEvents = new Map<number, ReadonlyMap<number, string>>();
        for (const [index, eventView] of this.pointEvents) {
            if (!eventView.dirty()) continue;
            pointEvents.set(index, new Map(eventView.get()));
        }
        return pointEvents;
    }

    /**
     * 在图层基准上叠加点事件存档
     * @param save 点事件存档，可省略
     */
    private loadPointEvents(
        save?: ReadonlyMap<number, ReadonlyMap<number, string>>
    ): void {
        this.resetPointEvents();
        if (!save) return;
        for (const [index, events] of save) {
            const { x, y } = this.indexer.locator(index);
            const eventView = this.event(x, y);
            if (!eventView) continue;
            eventView.clear();
            for (const [priority, id] of events) {
                eventView.set(priority, id);
            }
        }
    }

    // TODO: 不同大小的图层读取

    /**
     * 以无压缩方式读取当前图层
     * @param save 图层存档
     */
    private loadNoCompression(save: IMapLayerSave): void {
        if (save.fullMap) {
            this.setMapRef(new Uint32Array(save.fullMap));
        }
        if (save.staticBlocks) {
            this.loadStaticTiles(
                save.staticBlocks,
                SaveCompression.NoCompression
            );
        }
        if (save.dynamicBlocks) {
            this.loadDynamics(
                save.dynamicBlocks,
                SaveCompression.NoCompression
            );
        }
        this.layerDirty = !this.isEqualToRef();
    }

    /**
     * 以低压缩方式读取当前图层
     * @param save 图层存档
     */
    private loadLowCompression(save: IMapLayerSave): void {
        if (save.fullMap) {
            this.setMapRef(new Uint32Array(save.fullMap));
            this.layerDirty = true;
        } else if (this.refArray) {
            this.setMapRef(new Uint32Array(this.refArray));
            this.layerDirty = false;
        } else {
            logger.warn(124, this.zIndex.toString());
        }

        if (save.staticBlocks) {
            this.loadStaticTiles(
                save.staticBlocks,
                SaveCompression.LowCompression
            );
        }
        if (save.dynamicBlocks) {
            this.loadDynamics(
                save.dynamicBlocks,
                SaveCompression.LowCompression
            );
        }
    }

    /**
     * 以高压缩方式读取当前图层
     * @param save 图层存档
     */
    private loadHighCompression(save: IMapLayerSave): void {
        if (save.rows && save.rows.size > 0) {
            if (this.refArray) {
                const buf = new Uint32Array(this.refArray);
                for (const [rowIdx, rowData] of save.rows) {
                    buf.set(rowData, rowIdx * this.width);
                }
                this.setMapRef(buf);
                this.layerDirty = true;
            } else {
                logger.warn(124, this.zIndex.toString());
            }
        } else if (this.refArray) {
            this.setMapRef(new Uint32Array(this.refArray));
            this.layerDirty = false;
        } else {
            logger.warn(124, this.zIndex.toString());
        }

        if (save.staticBlocks) {
            this.loadStaticTiles(
                save.staticBlocks,
                SaveCompression.HighCompression
            );
        }
        if (save.dynamicBlocks) {
            this.loadDynamics(
                save.dynamicBlocks,
                SaveCompression.HighCompression
            );
        }
    }

    loadState(save: IMapLayerSave, compression: SaveCompression): void {
        this.clearDynamics();
        if (compression === SaveCompression.HighCompression) {
            this.loadHighCompression(save);
        } else if (compression === SaveCompression.LowCompression) {
            this.loadLowCompression(save);
        } else {
            this.loadNoCompression(save);
        }
        this.loadPointEvents(save.pointEvents);
    }

    //#endregion
}

class MapLayerHookController
    extends HookController<IMapLayerHooks>
    implements IMapLayerHookController
{
    hookable: MapLayer;

    constructor(
        readonly layer: MapLayer,
        hook: Partial<IMapLayerHooks>
    ) {
        super(layer, hook);
        this.hookable = layer;
    }

    getMapData(): Readonly<IMapLayerData> {
        return this.layer.getMapRef();
    }
}
