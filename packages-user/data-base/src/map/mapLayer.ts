import { isNil } from 'lodash-es';
import {
    IDynamicBlockSave,
    IDynamicTile,
    IGameMap,
    ILayerEventView,
    ILayerLocation,
    IMapLayer,
    IMapLayerData,
    IMapLayerHookController,
    IMapLayerHooks,
    IMapLayerSave,
    IStaticBlockSave,
    IStaticTile
} from './types';
import { Hookable, HookController, ITileLocator, logger } from '@motajs/common';
import {
    degradeFace,
    FaceDirection,
    IDataCommon,
    IRoleFaceBinder,
    SaveCompression
} from '@user/data-common';
import { DynamicTile } from './dynamicTile';
import { LayerEventView } from './eventView';
import { StaticTile } from './staticTile';

export class MapLayer
    extends Hookable<IMapLayerHooks, IMapLayerHookController>
    implements IMapLayer
{
    readonly state: IDataCommon;

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
    /** 动态图块到其当前坐标的映射 */
    private readonly posTileMap: Map<IDynamicTile, ITileLocator> = new Map();
    /** 图层脏标记 */
    private layerDirty: boolean = false;
    /** 图层参考基准，用于存档压缩对比 */
    private refArray: Uint32Array | null = null;

    /** 点事件视图，key = y * width + x */
    private readonly pointEvents: Map<number, ILayerEventView> = new Map();

    constructor(
        array: Uint32Array,
        width: number,
        height: number,
        public readonly map: IGameMap
    ) {
        super();
        this.state = map.state;
        this.faceBinder = this.state.roleFace;
        this.width = width;
        this.height = height;
        const area = width * height;
        this.mapArray = new Uint32Array(area);
        this.mapArray.set(array);
        this.mapData = {
            expired: false,
            array: this.mapArray
        };
    }

    /**
     * 将动态图块登记到指定坐标的索引表中
     * @param tile 动态图块
     * @param x 横坐标
     * @param y 纵坐标
     */
    private addTileToPosMap(tile: IDynamicTile, x: number, y: number): void {
        let xMap = this.tilePosMap.get(y);
        if (!xMap) {
            xMap = new Map();
            this.tilePosMap.set(y, xMap);
        }
        let set = xMap.get(x);
        if (!set) {
            set = new Set();
            xMap.set(x, set);
        }
        set.add(tile);
    }

    /**
     * 将动态图块从指定坐标的索引表中移除
     * @param tile 动态图块
     * @param x 横坐标
     * @param y 纵坐标
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
     * @param tile 动态图块
     */
    private removeTile(tile: IDynamicTile): void {
        const pos = this.posTileMap.get(tile);
        if (pos) {
            this.removeTileFromPosMap(tile, pos.x, pos.y);
        }
        this.posTileMap.delete(tile);
    }

    //#region 点事件操作

    /**
     * 将动态图块的事件同步回当前静态格点
     * @param tile 动态图块
     * @param keepEvent 是否保留事件
     */
    private syncStaticEvent(tile: IDynamicTile, keepEvent: boolean): void {
        const staticTile = this.getTile(tile.x, tile.y);
        if (!staticTile) return;
        staticTile.set(staticTile.num());
        if (keepEvent) {
            const staticEvent = staticTile.tileEvent();
            const dynamicEvent = tile.tileEvent();
            staticEvent.clear();
            for (const [priority, id] of dynamicEvent.get()) {
                staticEvent.set(priority, id);
            }
        }
    }

    /**
     * 将所有已创建的点事件视图恢复到原始纯基准
     */
    private resetPointEvents(): void {
        for (const eventView of this.pointEvents.values()) {
            const reference = eventView.ref();
            eventView.clear();
            for (const [priority, id] of reference) {
                eventView.set(priority, id);
            }
        }
    }

    /**
     * 裁剪超出新图层范围的点事件，并按新宽度重建索引
     * @param width 新图层宽度
     * @param height 新图层高度
     */
    private cropPointEvents(width: number, height: number): void {
        const pointEvents = new Map<number, ILayerEventView>();
        for (const [index, eventView] of this.pointEvents) {
            const x = index % this.width;
            const y = Math.floor(index / this.width);
            if (x < width && y < height) {
                pointEvents.set(y * width + x, eventView);
            }
        }
        this.pointEvents.clear();
        for (const [index, eventView] of pointEvents) {
            this.pointEvents.set(index, eventView);
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
            const x = index % this.width;
            const y = Math.floor(index / this.width);
            const eventView = this.event(x, y);
            if (!eventView) continue;
            eventView.clear();
            for (const [priority, id] of events) {
                eventView.set(priority, id);
            }
        }
    }

    event(x: number, y: number): ILayerEventView | null {
        if (!this.inMap(x, y)) return null;
        const index = y * this.width + x;
        const getOrInsertComputed = this.pointEvents.getOrInsertComputed;
        if (getOrInsertComputed) {
            return getOrInsertComputed.call(
                this.pointEvents,
                index,
                () => new LayerEventView()
            );
        }
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

    setBlock(block: number, x: number, y: number): void {
        const index = y * this.width + x;
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

    getTile(x: number, y: number): IStaticTile | null {
        if (!this.inMap(x, y)) return null;
        const index = this.map.indexer.locToIndex(x, y);
        let staticTile = this.staticTileCache.get(index);
        if (!staticTile) {
            staticTile = new StaticTile(x, y, this);
            this.staticTileCache.set(index, staticTile);
        }
        return staticTile;
    }

    getLocationData(x: number, y: number): ILayerLocation | null {
        const staticTile = this.getTile(x, y);
        if (!staticTile) return null;
        const num = staticTile.num();
        const dynamics = this.getDynamicTilesAt(x, y);
        return {
            locator: { x, y },
            tile: num,
            dynamics,
            static: staticTile
        };
    }

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
        const res = new Uint32Array(width * height);
        const arr = this.mapArray;
        const nb = Math.min(b, h);
        for (let ny = y; ny < nb; ny++) {
            const lineStart = ny * w + x;
            const lineEnd = lineStart + width;
            const dy = ny - y;
            res.set(arr.subarray(lineStart, lineEnd), dy * width);
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

    createDynamic(num: number, x: number, y: number): IDynamicTile {
        const tile = new DynamicTile(num, x, y, this);
        const location = this.getLocationData(x, y);
        if (location) {
            const tileEvent = tile.tileEvent();
            const staticEvent = location.static.tileEvent();
            tileEvent.clear();
            for (const [priority, id] of staticEvent.get()) {
                tileEvent.set(priority, id);
            }
        }
        this.addTileToPosMap(tile, x, y);
        this.posTileMap.set(tile, { x, y });
        this.forEachHook(hook => hook.onCreateDynamic?.(tile));
        return tile;
    }

    transferToDynamic(
        x: number,
        y: number,
        keepEvent: boolean = true
    ): IDynamicTile | null {
        if (!this.inMap(x, y)) {
            logger.warn(131, x.toString(), y.toString());
            return null;
        }
        const num = this.getBlock(x, y);
        if (num === 0) {
            logger.warn(127, x.toString(), y.toString());
        }
        this.setBlock(0, x, y);
        const tile = this.createDynamic(num, x, y);
        const staticTile = this.getTile(x, y);
        if (staticTile) {
            staticTile.tileEvent().clear();
        }
        if (!keepEvent) {
            tile.tileEvent().clear();
        }
        return tile;
    }

    transferToStatic(
        tile: IDynamicTile,
        keepEvent: boolean = true
    ): IStaticTile | null {
        const x = tile.x;
        const y = tile.y;
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            logger.warn(128, x.toString(), y.toString());
            return null;
        }
        if (this.getBlock(x, y) !== 0) {
            logger.warn(129, x.toString(), y.toString());
        }
        this.setBlock(tile.num(), x, y);
        this.syncStaticEvent(tile, keepEvent);
        this.removeTile(tile);
        this.forEachHook(hook => hook.onDeleteDynamic?.(tile));
        return this.getTile(x, y);
    }

    transferToStaticIfSafe(
        tile: IDynamicTile,
        keepEvent: boolean = true
    ): IStaticTile | null {
        const x = tile.x;
        const y = tile.y;
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            logger.warn(128, x.toString(), y.toString());
            return null;
        }
        if (this.getBlock(tile.x, tile.y) !== 0) return null;
        this.setBlock(tile.num(), x, y);
        this.syncStaticEvent(tile, keepEvent);
        this.removeTile(tile);
        this.forEachHook(hook => hook.onDeleteDynamic?.(tile));
        return this.getTile(x, y);
    }

    async deleteDynamic(tile: IDynamicTile): Promise<void> {
        if (!this.posTileMap.has(tile)) {
            logger.warn(130);
            return;
        }
        this.removeTile(tile);
        const hooks = this.forEachHook(hook => hook.onDeleteDynamic?.(tile));
        await Promise.all(hooks);
    }

    getDynamicTilesAt(x: number, y: number): Iterable<IDynamicTile> {
        return this.tilePosMap.get(y)?.get(x) ?? new Set();
    }

    iterateDynamicTiles(): Iterable<IDynamicTile> {
        return this.posTileMap.keys();
    }

    setDynamicDirection(tile: IDynamicTile, direction: FaceDirection): number {
        const numBefore = tile.num();
        tile.setFaceDirection(direction);
        if (tile.num() !== numBefore) return tile.num();
        const degraded = degradeFace(direction);
        if (degraded !== direction) {
            tile.setFaceDirection(degraded);
        }
        return tile.num();
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
        this.forEachHook(hook => hook.onUpdateDynamicPosition?.(tile));
    }

    //#endregion

    //#region 开关门

    async openDoor(x: number, y: number): Promise<void> {
        const index = y * this.width + x;
        const num = this.mapArray[index];
        if (num === 0) return;
        await Promise.all(
            this.forEachHook(hook => {
                return hook.onOpenDoor?.(x, y);
            })
        );
        this.setBlock(0, x, y);
    }

    async closeDoor(num: number, x: number, y: number): Promise<void> {
        const index = y * this.width + x;
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

    setZIndex(zIndex: number): void {
        this.zIndex = zIndex;
    }

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

    protected createController(
        hook: Partial<IMapLayerHooks>
    ): IMapLayerHookController {
        return new MapLayerHookController(this, hook);
    }

    resize(width: number, height: number): void {
        if (this.width === width && this.height === height) {
            return;
        }
        this.layerDirty = true;
        this.cropPointEvents(width, height);
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
        this.staticTileCache.clear();
        if (beforeArea > area) {
            for (let ny = 0; ny < height; ny++) {
                const begin = ny * beforeWidth;
                newArray.set(before.subarray(begin, begin + width), ny * width);
            }
        } else {
            for (let ny = 0; ny < beforeHeight; ny++) {
                const begin = ny * beforeWidth;
                newArray.set(
                    before.subarray(begin, begin + beforeWidth),
                    ny * width
                );
            }
        }
        this.mapData = {
            expired: false,
            array: this.mapArray
        };
        this.forEachHook(hook => {
            hook.onResize?.(width, height);
        });
    }

    resize2(width: number, height: number): void {
        this.layerDirty = true;
        this.pointEvents.clear();
        if (this.width === width && this.height === height) {
            this.empty = true;
            this.mapArray.fill(0);
            this.staticTileCache.clear();
            return;
        }
        this.mapData.expired = true;
        this.width = width;
        this.height = height;
        this.mapArray = new Uint32Array(width * height);
        this.staticTileCache.clear();
        this.mapData = {
            expired: false,
            array: this.mapArray
        };
        this.empty = true;
        this.forEachHook(hook => {
            hook.onResize?.(width, height);
        });
    }

    //#endregion

    //#region 存读档

    /**
     * 保存静态图块实例
     */
    private saveStatics(): Map<number, IStaticBlockSave> {
        const blocks = new Map<number, IStaticBlockSave>();
        for (const location of this.iterateBlocks()) {
            const tile = location.static;
            if (!tile.shouldSave()) continue;
            const index = this.map.indexer.locaterToIndex(location.locator);
            blocks.set(index, tile.saveState(SaveCompression.NoCompression));
        }
        return blocks;
    }

    /**
     * 保存动态图块实例
     */
    private saveDynamics(): Map<number, IDynamicBlockSave[]> {
        const blocks = new Map<number, IDynamicBlockSave[]>();
        for (const tile of this.iterateDynamicTiles()) {
            const index = this.map.indexer.locaterToIndex(tile.locator);
            let list = blocks.get(index);
            if (!list) {
                list = [];
                blocks.set(index, list);
            }
            list.push(tile.saveState(SaveCompression.NoCompression));
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
            staticBlocks: this.saveStatics(),
            dynamicBlocks: this.saveDynamics(),
            pointEvents: this.savePointEvents()
        };
    }

    /**
     * 以低压缩方式序列化当前图层
     */
    private saveLowCompression(): IMapLayerSave {
        const staticBlocks = this.saveStatics();
        const dynamicBlocks = this.saveDynamics();
        if (this.layerDirty && (!this.refArray || !this.isEqualToRef())) {
            return {
                width: this.width,
                height: this.height,
                fullMap: new Uint32Array(this.mapArray),
                staticBlocks,
                dynamicBlocks,
                pointEvents: this.savePointEvents()
            };
        } else {
            return {
                width: this.width,
                height: this.height,
                staticBlocks,
                dynamicBlocks,
                pointEvents: this.savePointEvents()
            };
        }
    }

    /**
     * 以高压缩方式序列化当前图层
     */
    private saveHighCompression(): IMapLayerSave {
        const staticBlocks = this.saveStatics();
        const dynamicBlocks = this.saveDynamics();
        if (this.layerDirty) {
            if (this.refArray) {
                return {
                    width: this.width,
                    height: this.height,
                    rows: this.diffRows(this.refArray),
                    staticBlocks,
                    dynamicBlocks,
                    pointEvents: this.savePointEvents()
                };
            } else {
                return {
                    width: this.width,
                    height: this.height,
                    fullMap: new Uint32Array(this.mapArray),
                    staticBlocks,
                    dynamicBlocks,
                    pointEvents: this.savePointEvents()
                };
            }
        } else {
            return {
                width: this.width,
                height: this.height,
                staticBlocks,
                dynamicBlocks,
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
     */
    private loadStatics(save: ReadonlyMap<number, IStaticBlockSave>): void {
        for (const [index, tileSave] of save) {
            const { x, y } = this.map.indexer.indexToLocator(index);
            const location = this.getLocationData(x, y);
            if (!location) continue;
            location.static.loadState(tileSave, SaveCompression.NoCompression);
        }
    }

    /**
     * 读取动态图块实例存档数据
     * @param save 动态图块实例存档
     */
    private loadDynamics(save: ReadonlyMap<number, IDynamicBlockSave[]>): void {
        for (const [index, dynamics] of save) {
            const { x, y } = this.map.indexer.indexToLocator(index);
            for (const block of dynamics) {
                const tile = this.createDynamic(block.num, x, y);
                tile.loadState(block, SaveCompression.NoCompression);
            }
        }
    }

    /**
     * 以无压缩方式读取当前图层
     * @param save 图层存档
     */
    private loadNoCompression(save: IMapLayerSave): void {
        if (save.fullMap) {
            this.setMapRef(new Uint32Array(save.fullMap));
        }
        if (save.staticBlocks) {
            this.loadStatics(save.staticBlocks);
        }
        if (save.dynamicBlocks) {
            this.loadDynamics(save.dynamicBlocks);
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
            this.loadStatics(save.staticBlocks);
        }
        if (save.dynamicBlocks) {
            this.loadDynamics(save.dynamicBlocks);
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
            this.loadStatics(save.staticBlocks);
        }
        if (save.dynamicBlocks) {
            this.loadDynamics(save.dynamicBlocks);
        }
    }

    loadState(save: IMapLayerSave, compression: SaveCompression): void {
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
