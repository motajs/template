import {
    ITexture,
    ITextureComposedData,
    ITextureRenderable,
    ITextureStore,
    SizedCanvasImageSource,
    Texture,
    TextureGridSplitter,
    TextureRowSplitter,
    TextureStore
} from '@motajs/render';
import {
    IMaterialData,
    ITextureManager,
    IIndexedIdentifier,
    IMaterialAssetData,
    IAssetBuilder,
    IMaterialFramedData,
    ITrackedAssetData,
    IAutotileProcessor,
    AutotileType
} from './types';
import { ICoreState } from '@user/data-state';
import { logger } from '@motajs/common';
import { isNil } from 'lodash-es';
import { AssetBuilder } from './builder';
import { AutotileProcessor } from './autotile';
import { ITileStore, TileType } from '@user/data-common';

interface ITilesetCache {
    /** 是否已经在贴图库中存在 */
    readonly existed: boolean;
    /** 贴图对象 */
    readonly texture: ITexture;
}

export class TextureManager implements ITextureManager {
    readonly autotile: IAutotileProcessor;

    readonly textures: ITextureStore = new TextureStore();
    readonly tileStore: ITextureStore = new TextureStore();
    readonly tilesetStore: ITextureStore = new TextureStore();
    readonly imageStore: ITextureStore = new TextureStore();
    readonly assetStore: ITextureStore = new TextureStore();

    /** 自动元件图像源映射 */
    readonly autotileSource: Map<number, SizedCanvasImageSource> = new Map();

    /** 图集信息存储 */
    readonly assetDataStore: Map<number, ITextureComposedData> = new Map();
    /** 贴图到图集索引的映射 */
    readonly assetMap: Map<ITexture, number> = new Map();
    /** 带有脏标记追踪的图集对象 */
    readonly trackedAsset: ITrackedAssetData;

    /** tileset 中的偏移索引映射，可以处理超出 Tileset 图块数量单元的 Tileset */
    readonly tilesetOffsetMap: Map<number, number> = new Map();
    /** 图集打包器 */
    readonly assetBuilder: IAssetBuilder;

    /** 图块的默认帧数 */
    readonly defaultFrames: Map<number, number> = new Map();
    /** 每个图块的总帧数 */
    readonly frames: Map<number, number> = new Map();
    /** 每个图块的帧偏移量 */
    readonly tileOffsets: Map<number, number> = new Map();
    /** 每个 Tileset 的 tile 尺寸 */
    readonly tilesetCells: Map<number, [number, number]> = new Map();
    /** 自动元件类型映射 */
    readonly autotileType: Map<number, AutotileType> = new Map();

    /** 网格切分器 */
    readonly gridSplitter: TextureGridSplitter = new TextureGridSplitter();
    /** 行切分器 */
    readonly rowSplitter: TextureRowSplitter = new TextureRowSplitter();

    /** 当前 tileset 索引 */
    private nowTilesetIndex: number = -1;
    /** 当前 tileset 偏移 */
    private nowTilesetOffset: number = 0;
    /** 是否已经构建过素材 */
    private built: boolean = false;

    constructor(
        readonly state: ICoreState,
        readonly tiles: ITileStore,
        readonly tilesetReserve: number,
        readonly tilesetUnit: number
    ) {
        this.autotile = new AutotileProcessor(state);
        this.assetBuilder = new AssetBuilder(this, state);
        this.assetBuilder.pipe(this.assetStore);
        this.trackedAsset = this.assetBuilder.tracked();
    }

    /**
     * 添加经由分割器分割的贴图素材
     * @param splitted 分割器分割后的图像列表
     * @param map 图块的图块数字映射数组
     * @param frames 此素材中每一个贴图使用的帧率
     * @param offsets 此素材中每一个贴图的帧偏移量
     */
    private addSplittedSource(
        splitted: Iterable<ITexture>,
        map: ArrayLike<number>,
        frames: number,
        offsets: number
    ): Iterable<IMaterialData> {
        return [...splitted].map((v, i) => {
            if (isNil(map[i])) {
                return {
                    store: this.tileStore,
                    texture: v,
                    identifier: -1,
                    alias: '@internal-unknown'
                };
            }
            const num = map[i];
            const id = this.tiles.id(num);
            if (isNil(id)) {
                logger.warn(184, num.toString());
                return {
                    store: this.tileStore,
                    texture: v,
                    identifier: -1,
                    alias: '@internal-unknown'
                };
            }
            this.tileStore.addTexture(num, v);
            this.tileStore.alias(num, id);
            this.frames.set(num, frames);
            this.tileOffsets.set(num, offsets);
            const data: IMaterialData = {
                store: this.tileStore,
                texture: v,
                identifier: num,
                alias: id
            };
            return data;
        });
    }

    addGrid(
        source: SizedCanvasImageSource,
        map: ArrayLike<number>,
        width: number,
        height: number
    ): Iterable<IMaterialData> {
        const tex = new Texture(source);
        const textures = [...this.gridSplitter.split(tex, [width, height])];
        if (textures.length !== map.length) {
            logger.warn(75, textures.length.toString(), map.length.toString());
        }
        return this.addSplittedSource(textures, map, 1, width);
    }

    addRowAnimate(
        source: SizedCanvasImageSource,
        map: ArrayLike<number>,
        width: number,
        height: number
    ): Iterable<IMaterialData> {
        if (source.width % width !== 0) {
            logger.warn(185, source.width.toString(), width.toString());
            return [];
        }
        const tex = new Texture(source);
        const textures = [...this.rowSplitter.split(tex, height)];
        if (textures.length !== map.length) {
            logger.warn(75, textures.length.toString(), map.length.toString());
        }
        const frames = source.width / width;
        return this.addSplittedSource(textures, map, frames, width);
    }

    addAutotile(
        source: SizedCanvasImageSource,
        num: number,
        type: AutotileType
    ): void {
        const id = this.tiles.id(num);
        if (isNil(id)) {
            logger.warn(184, num.toString());
            return;
        }
        this.autotileSource.set(num, source);
        this.tileStore.alias(num, id);
        this.autotileType.set(num, type);
    }

    addTileset(
        source: SizedCanvasImageSource,
        identifier: IIndexedIdentifier,
        cellWidth: number,
        cellHeight: number
    ): IMaterialData | null {
        const tex = new Texture(source);
        this.tilesetStore.addTexture(identifier.index, tex);
        this.tilesetStore.alias(identifier.index, identifier.alias);
        if (
            source.width % cellWidth !== 0 ||
            source.height % cellHeight !== 0
        ) {
            logger.warn(
                186,
                source.width.toString(),
                source.height.toString(),
                cellWidth.toString(),
                cellHeight.toString()
            );
        }
        // 计算 tile 数量，溢出部分不算
        const width = Math.floor(source.width / cellWidth);
        const height = Math.floor(source.height / cellHeight);
        const count = width * height;
        // 一个 tileset 可能不止 tilesetUnit 个图块，需要计算偏移
        const offset = Math.ceil(count / this.tilesetUnit);
        if (identifier.index === 0) {
            this.tilesetOffsetMap.set(0, 0);
            this.nowTilesetIndex = 0;
            this.nowTilesetOffset = offset;
        } else {
            // 不允许不按顺序追加，因为这会导致图块数字难以维护
            if (identifier.index - 1 !== this.nowTilesetIndex) {
                logger.warn(78);
                return null;
            }
            // 这个 tileset 所包含的所有单位，都应该映射至当前 tileset，所以循环设置这期间的所有映射
            const end = this.nowTilesetOffset + offset;
            for (let i = this.nowTilesetOffset; i < end; i++) {
                this.tilesetOffsetMap.set(i, identifier.index);
            }
            this.nowTilesetOffset = end;
            this.nowTilesetIndex = identifier.index;
        }
        const data: IMaterialData = {
            store: this.tilesetStore,
            texture: tex,
            identifier: identifier.index,
            alias: identifier.alias
        };
        this.tilesetCells.set(identifier.index, [cellWidth, cellHeight]);
        return data;
    }

    addImage(
        source: SizedCanvasImageSource,
        identifier: IIndexedIdentifier
    ): IMaterialData {
        const texture = new Texture(source);
        this.imageStore.addTexture(identifier.index, texture);
        this.imageStore.alias(identifier.index, identifier.alias);
        const data: IMaterialData = {
            store: this.imageStore,
            texture,
            identifier: identifier.index,
            alias: identifier.alias
        };
        return data;
    }

    setDefaultFrame(identifier: number, defaultFrame: number): void {
        this.defaultFrames.set(identifier, defaultFrame);
    }

    getDefaultFrame(identifier: number): number {
        return this.defaultFrames.get(identifier) ?? -1;
    }

    getFrameCount(num: number): number {
        return this.frames.get(num) ?? 0;
    }

    getTile(num: number): Readonly<IMaterialFramedData> | null {
        if (num < this.tilesetReserve) {
            const type = this.tiles.getType(num);
            if (type === TileType.Autotile && this.autotileSource.has(num)) {
                this.cacheAutotile(num);
            }

            const texture = this.tileStore.getTexture(num);
            if (!texture) return null;

            const frames = this.frames.get(num);
            const offset = this.tileOffsets.get(num);

            if (isNil(frames) || isNil(offset)) {
                logger.warn(187);
                return null;
            }

            return {
                texture,
                tileType: type,
                offset,
                frames,
                defaultFrame: this.defaultFrames.get(num) ?? -1
            };
        } else {
            const texture = this.cacheTileset(num);
            if (!texture) return null;
            return {
                texture,
                tileType: TileType.Tileset,
                // Tileset 不需要偏移量
                offset: 0,
                frames: 1,
                defaultFrame: -1
            };
        }
    }

    getTileset(identifier: number): ITexture | null {
        return this.tilesetStore.getTexture(identifier);
    }

    getImage(identifier: number): ITexture | null {
        return this.imageStore.getTexture(identifier);
    }

    getTileByAlias(alias: string): Readonly<IMaterialFramedData> | null {
        if (/X\d{5,}/.test(alias)) {
            return this.getTile(parseInt(alias.slice(1)));
        } else {
            const identifier = this.tileStore.identifierOf(alias);
            if (isNil(identifier)) return null;
            return this.getTile(identifier);
        }
    }

    getTilesetByAlias(alias: string): ITexture | null {
        return this.tilesetStore.fromAlias(alias);
    }

    getImageByAlias(alias: string): ITexture | null {
        return this.imageStore.fromAlias(alias);
    }

    private getTilesetOwnTexture(num: number): ITilesetCache | null {
        const texture = this.tileStore.getTexture(num);
        if (texture) return { existed: true, texture };
        // 如果 tileset 不存在，那么执行缓存操作
        const adjustedNum = num - this.tilesetReserve;
        const offset = Math.floor(adjustedNum / this.tilesetUnit);
        const index = this.tilesetOffsetMap.get(offset);
        if (isNil(index)) return null;
        // 获取对应的 tileset 贴图
        const tileset = this.tilesetStore.getTexture(index);
        const cell = this.tilesetCells.get(index);
        if (!tileset || !cell) return null;
        // 计算图块位置，首先计算没有偏移时图块的索引，即假如 Tileset 的左上角是 0，计算 num 的索引应该是什么
        const unoffset = adjustedNum - offset * this.tilesetUnit;
        const { width, height } = tileset;
        const [cellWidth, cellHeight] = cell;
        const tileWidth = Math.floor(width / cellWidth);
        const tileHeight = Math.floor(height / cellHeight);
        // 如果图块位置超出了贴图范围
        if (unoffset > tileWidth * tileHeight) {
            logger.warn(188, num.toString());
            return null;
        }
        // 裁剪 tileset，生成贴图
        const x = unoffset % tileWidth;
        const y = Math.floor(unoffset / tileWidth);
        const newTexture = new Texture(tileset.source);
        newTexture.clip(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
        return { existed: false, texture: newTexture };
    }

    /**
     * 检查图集状态，如果已存在图集则标记为脏，否则新增图集
     * @param data 图集数据
     */
    private checkAssetDirty(data: ITextureComposedData) {
        if (!this.built) return;
        const asset = this.assetDataStore.get(data.index);
        if (!asset) {
            // 如果有新图集，需要添加
            const alias = `asset-${data.index}`;
            this.assetStore.alias(data.index, alias);
            this.assetDataStore.set(data.index, data);
        }
    }

    /**
     * 将指定的贴图列表转换至指定的图集数据中
     * @param composedData 组合数据
     * @param textures 贴图列表
     */
    private cacheToAsset(
        composedData: ITextureComposedData[],
        textures: ITexture[]
    ) {
        textures.forEach(tex => {
            const assetData = composedData.find(v => v.assetMap.has(tex));
            if (!assetData) {
                logger.error(38);
                return;
            }
            tex.toAsset(assetData);
        });
        composedData.forEach(v => this.checkAssetDirty(v));
    }

    cacheTileset(identifier: number): ITexture | null {
        const newTexture = this.getTilesetOwnTexture(identifier);
        if (!newTexture) return null;
        const { existed, texture } = newTexture;
        if (existed) return texture;
        // 缓存贴图
        this.tileStore.addTexture(identifier, texture);
        const data = this.assetBuilder.addTexture(texture);
        texture.toAsset(data);
        this.checkAssetDirty(data);
        return texture;
    }

    cacheTilesetList(
        identifierList: Iterable<number>
    ): Iterable<ITexture | null> {
        const arr = [...identifierList];
        const toAdd: ITexture[] = [];

        arr.forEach(v => {
            const newTexture = this.getTilesetOwnTexture(v);
            if (!newTexture) return;
            const { existed, texture } = newTexture;
            if (existed) return;
            toAdd.push(texture);
            this.tileStore.addTexture(v, texture);
        });

        const data = this.assetBuilder.addTextureList(toAdd);
        const res = [...data];
        this.cacheToAsset(res, toAdd);

        return toAdd;
    }

    /**
     * 获取自动元件展开后的图片，如果图片不存在，或是已经展开并存储至了 `tileStore`，那么返回 `null`
     * @param num 自动元件数字
     */
    private getFlattenedAutotile(num: number): SizedCanvasImageSource | null {
        const type = this.tiles.getType(num);
        if (type !== TileType.Autotile) return null;
        if (this.tileStore.getTexture(num)) return null;
        const source = this.autotileSource.get(num);
        if (!source) return null;
        const autotileType = this.autotileType.get(num);
        const frames = this.frames.get(num);
        if (isNil(autotileType) || isNil(frames)) {
            logger.warn(191);
            return null;
        }
        const flattened = this.autotile.flatten(source, autotileType, frames);
        if (!flattened) return null;
        return flattened;
    }

    cacheAutotile(num: number): ITexture | null {
        const existed = this.tileStore.getTexture(num);
        if (existed) return existed;
        const flattened = this.getFlattenedAutotile(num);
        if (!flattened) return null;
        const tex = new Texture(flattened);
        this.tileStore.addTexture(num, tex);
        const data = this.assetBuilder.addTexture(tex);
        tex.toAsset(data);
        this.autotileSource.delete(num);
        this.checkAssetDirty(data);
        return tex;
    }

    cacheAutotileList(list: Iterable<number>): Iterable<ITexture | null> {
        const arr = [...list];
        const toAdd: ITexture[] = [];

        arr.forEach(v => {
            const flattened = this.getFlattenedAutotile(v);
            if (!flattened) return;
            const tex = new Texture(flattened);
            this.tileStore.addTexture(v, tex);
            toAdd.push(tex);
            this.autotileSource.delete(v);
        });

        const data = this.assetBuilder.addTextureList(toAdd);
        const res = [...data];
        this.cacheToAsset(res, toAdd);

        return toAdd;
    }

    buildAssets(): Iterable<IMaterialAssetData> {
        if (this.built) {
            logger.warn(79);
            return [];
        }
        this.built = true;
        return this.buildListToAsset(this.tileStore.values());
    }

    buildToAsset(texture: ITexture): IMaterialAssetData {
        const data = this.assetBuilder.addTexture(texture);
        const assetData: IMaterialAssetData = {
            data: data,
            identifier: data.index,
            alias: `asset-${data.index}`,
            store: this.assetStore
        };
        this.checkAssetDirty(data);
        texture.toAsset(data);
        return assetData;
    }

    buildListToAsset(
        texture: Iterable<ITexture>
    ): Iterable<IMaterialAssetData> {
        const data = this.assetBuilder.addTextureList(texture);
        const arr = [...data];
        const res: IMaterialAssetData[] = [];
        arr.forEach(v => {
            const alias = `asset-${v.index}`;
            if (!this.assetDataStore.has(v.index)) {
                this.assetDataStore.set(v.index, v);
            }
            const data: IMaterialAssetData = {
                data: v,
                identifier: v.index,
                alias,
                store: this.assetStore
            };
            for (const tex of v.assetMap.keys()) {
                tex.toAsset(v);
            }
            res.push(data);
        });
        arr.forEach(v => {
            this.checkAssetDirty(v);
        });
        return res;
    }

    getAsset(identifier: number): ITextureComposedData | null {
        return this.assetDataStore.get(identifier) ?? null;
    }

    getAssetByAlias(alias: string): ITextureComposedData | null {
        const id = this.assetStore.identifierOf(alias);
        if (isNil(id)) return null;
        return this.assetDataStore.get(id) ?? null;
    }

    private getTextureOf(num: number): ITexture | null {
        const existed = this.tileStore.getTexture(num);
        if (existed) return existed;
        if (num >= this.tilesetReserve) {
            return this.cacheTileset(num);
        } else {
            const type = this.tiles.getType(num);
            if (type === TileType.Autotile) {
                return this.cacheAutotile(num);
            } else {
                return null;
            }
        }
    }

    getRenderable(num: number): ITextureRenderable | null {
        const texture = this.getTextureOf(num);
        if (!texture) return null;
        return texture.render();
    }

    getRenderableByAlias(alias: string): ITextureRenderable | null {
        const num = this.tiles.num(alias);
        if (isNil(num)) return null;
        return this.getRenderable(num);
    }

    assetContainsTexture(texture: ITexture): boolean {
        return this.trackedAsset.skipRef.has(texture.source);
    }

    getTextureAsset(texture: ITexture): number | undefined {
        return this.trackedAsset.skipRef.get(texture.source);
    }
}
