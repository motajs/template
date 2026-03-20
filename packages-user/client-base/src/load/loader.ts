import {
    ILoadProgressTotal,
    LoadDataType,
    ILoadTask,
    LoadTask,
    ILoadTaskProcessor
} from '@motajs/loader';
import {
    CompressedUsage,
    CustomLoadFunc,
    ICompressedMotaAssetsData,
    ICompressedMotaAssetsLoadList,
    IMotaAssetsLoader
} from './types';
import JSZip from 'jszip';
import {
    LoadAudioProcessor,
    LoadFontProcessor,
    LoadImageProcessor,
    LoadJSONProcessor,
    LoadTextProcessor,
    LoadZipProcessor
} from './processor';
import { IMotaAudioContext, ISoundPlayer } from '@motajs/audio';
import { loading } from '@user/data-base';
import { IMaterialManager } from '../material';
import { ITextureSplitter, Texture, TextureRowSplitter } from '@motajs/render';
import { iconNames } from './data';

interface LoadTaskStore<T extends LoadDataType = LoadDataType, R = any> {
    /** 加载任务对象 */
    readonly task: ILoadTask<T, R>;
    /** 当 `onLoaded` 兑现后兑现的 `Promise` */
    readonly loadPromise: Promise<R>;
    /** 兑现 `loadPromise` */
    readonly loadResolve: (data: R) => void;
    /** 当加载任务完成时执行的函数 */
    readonly onLoaded: CustomLoadFunc<R>;
}

export class MotaAssetsLoader implements IMotaAssetsLoader {
    /** 当前是否正在进行加载 */
    loading: boolean = false;
    /** 当前加载工作是否已经完成 */
    loaded: boolean = false;

    readonly imageProcessor: ILoadTaskProcessor<LoadDataType.Blob, ImageBitmap>;
    readonly audioProcessor: ILoadTaskProcessor<
        LoadDataType.Uint8Array,
        AudioBuffer | null
    >;
    readonly fontProcessor: ILoadTaskProcessor<
        LoadDataType.ArrayBuffer,
        FontFace
    >;
    readonly textProcessor: ILoadTaskProcessor<LoadDataType.Text, string>;
    readonly jsonProcessor: ILoadTaskProcessor<LoadDataType.JSON, any>;
    readonly zipProcessor: ILoadTaskProcessor<LoadDataType.ArrayBuffer, JSZip>;

    /** 当前已添加的加载任务 */
    private readonly tasks: Set<LoadTaskStore> = new Set();

    /** 素材索引 */
    private materialsCounter: number = 0;
    /** 贴图行分割器，用于处理遗留 `icons.png` */
    private readonly rowSplitter: ITextureSplitter<number>;

    constructor(
        readonly progress: ILoadProgressTotal,
        private readonly ac: IMotaAudioContext,
        private readonly sounds: ISoundPlayer<SoundIds>,
        private readonly materials: IMaterialManager
    ) {
        this.imageProcessor = new LoadImageProcessor();
        this.audioProcessor = new LoadAudioProcessor(ac);
        this.fontProcessor = new LoadFontProcessor();
        this.textProcessor = new LoadTextProcessor();
        this.jsonProcessor = new LoadJSONProcessor();
        this.zipProcessor = new LoadZipProcessor();
        this.rowSplitter = new TextureRowSplitter();
    }

    //#region 其他处理

    private splitMaterialIcons(image: ImageBitmap) {
        const tex = new Texture(image);
        const splitted = [...this.rowSplitter.split(tex, 32)];
        for (let i = 0; i < splitted.length; i++) {
            const name = iconNames[i] ? `icon-${iconNames[i]}` : `icons-${i}`;
            // todo: 早晚删除 icons.png
            const index = this.materialsCounter++;
            this.materials.imageStore.addTexture(index, splitted[i]);
            this.materials.imageStore.alias(index, name);
        }
    }

    //#region 加载后处理

    /**
     * 当字体加载完成后的操作
     * @param font 字体名称
     * @param fontFace 字体 `FontFace` 对象
     */
    private fontLoaded(font: string, fontFace: FontFace) {
        const suffix = font.lastIndexOf('.');
        const family = font.slice(0, suffix);
        fontFace.family = family;
        document.fonts.add(fontFace);
        return Promise.resolve();
    }

    /**
     * 图片加载完成后的操作
     * @param name 图片名称
     * @param image 图片的 `ImageBitmap`
     */
    private customImagesLoaded(name: ImageIds, image: ImageBitmap) {
        core.material.images.images[name] = image;
        this.materials.addImage(image, {
            index: this.materialsCounter++,
            alias: name
        });
        return Promise.resolve();
    }

    /**
     * 音效加载完成后的操作
     * @param name 音效名称
     * @param buffer 音效解析完毕的 `AudioBuffer`
     */
    private soundLoaded(name: SoundIds, buffer: AudioBuffer | null) {
        if (buffer) {
            this.sounds.add(name, buffer);
        }
        return Promise.resolve();
    }

    /**
     * 当 tileset 加载完成后的操作
     * @param name tileset 名称
     * @param image 图片 `ImageBitmap`
     */
    private tilesetLoaded(name: string, image: ImageBitmap) {
        core.material.images.tilesets[name] = image;
        // this.materials.addTileset(image, {
        //     index: this.materialsCounter++,
        //     alias: name
        // });
        return Promise.resolve();
    }

    /**
     * 当自动元件加载完成后的操作
     * @param autotiles 自动元件存储对象
     * @param name 自动元件名称
     * @param image 自动元件的 `ImageBitmap`
     */
    private autotileLoaded(
        autotiles: Partial<Record<AllIdsOf<'autotile'>, ImageBitmap>>,
        name: AllIdsOf<'autotile'>,
        image: ImageBitmap
    ) {
        autotiles[name] = image;
        loading.addAutotileLoaded();
        loading.onAutotileLoaded(autotiles);
        core.material.images.autotile[name] = image;
        // const num = icon.autotile[name];
        // this.materials.addAutotile(image, {
        //     id: name,
        //     num,
        //     cls: 'autotile'
        // });
        return Promise.resolve();
    }

    /**
     * 当素材加载完成后的操作
     * @param name 素材名称
     * @param image 素材 `ImageBitmap`
     */
    private materialLoaded(name: string, image: ImageBitmap) {
        core.material.images[
            name.slice(0, -4) as SelectKey<MaterialImages, ImageBitmap>
        ] = image;
        if (name === 'icons.png') {
            this.splitMaterialIcons(image);
        }
        return Promise.resolve();
    }

    /**
     * 当动画加载完成后的操作
     * @param animation 动画内容
     */
    private animationLoaded(animation: string) {
        const data = data_a1e2fb4a_e986_4524_b0da_9b7ba7c0874d;
        const rows = animation.split('@@@~~~###~~~@@@');
        rows.forEach((value, i) => {
            const id = data.main.animates[i];
            if (value.length === 0) {
                throw new Error(`Cannot find animate: '${id}'`);
            }
            core.material.animates[id] = core.loader._loadAnimate(value);
        });
        return Promise.resolve();
    }

    //#endregion

    //#region 加载流程

    /**
     * 开发时的加载流程
     */
    private developingLoad() {
        const data = data_a1e2fb4a_e986_4524_b0da_9b7ba7c0874d;
        const icon = icons_4665ee12_3a1f_44a4_bea3_0fccba634dc1;
        // font
        data.main.fonts.forEach(font => {
            const url = `project/fonts/${font}`;
            const task = new LoadTask<LoadDataType.ArrayBuffer, FontFace>({
                url,
                identifier: `@system-font/${font}`,
                dataType: LoadDataType.ArrayBuffer,
                processor: this.fontProcessor,
                progress: this.progress
            });
            this.addCustomLoadTask(task, data => this.fontLoaded(font, data));
        });

        // image
        data.main.images.forEach(image => {
            const url = `project/images/${image}`;
            const task = new LoadTask<LoadDataType.Blob, ImageBitmap>({
                url,
                identifier: `@system-image/${image}`,
                dataType: LoadDataType.Blob,
                processor: this.imageProcessor,
                progress: this.progress
            });
            this.addCustomLoadTask(task, data =>
                this.customImagesLoaded(image, data)
            );
        });

        // sound
        data.main.sounds.forEach(sound => {
            const url = `project/sounds/${sound}`;
            const task = new LoadTask<
                LoadDataType.Uint8Array,
                AudioBuffer | null
            >({
                url,
                identifier: `@system-sound/${sound}`,
                dataType: LoadDataType.Uint8Array,
                processor: this.audioProcessor,
                progress: this.progress
            });
            this.addCustomLoadTask(task, data => this.soundLoaded(sound, data));
        });

        // tileset
        data.main.tilesets.forEach(tileset => {
            const url = `project/tilesets/${tileset}`;
            const task = new LoadTask<LoadDataType.Blob, ImageBitmap>({
                url,
                identifier: `@system-tileset/${tileset}`,
                dataType: LoadDataType.Blob,
                processor: this.imageProcessor,
                progress: this.progress
            });
            this.addCustomLoadTask(task, data =>
                this.tilesetLoaded(tileset, data)
            );
        });

        // autotile
        const autotiles: Partial<Record<AllIdsOf<'autotile'>, ImageBitmap>> =
            {};
        Object.keys(icon.autotile).forEach(key => {
            const url = `project/autotiles/${key}.png`;
            const task = new LoadTask<LoadDataType.Blob, ImageBitmap>({
                url,
                identifier: `@system-autotile/${key}`,
                dataType: LoadDataType.Blob,
                processor: this.imageProcessor,
                progress: this.progress
            });
            this.addCustomLoadTask(task, data =>
                this.autotileLoaded(
                    autotiles,
                    key as AllIdsOf<'autotile'>,
                    data
                )
            );
        });

        // material
        const materialImages = core.materials.slice() as SelectKey<
            MaterialImages,
            ImageBitmap
        >[];
        materialImages.push('keyboard');
        materialImages
            .map(v => `${v}.png`)
            .forEach(materialName => {
                const url = `project/materials/${materialName}`;
                const task = new LoadTask<LoadDataType.Blob, ImageBitmap>({
                    url,
                    identifier: `@system-material/${materialName}`,
                    dataType: LoadDataType.Blob,
                    processor: this.imageProcessor,
                    progress: this.progress
                });
                this.addCustomLoadTask(task, data =>
                    this.materialLoaded(materialName, data)
                );
            });

        // animate
        const animatesUrl = `all/__all_animates__?v=${main.version}&id=${data.main.animates.join(',')}`;
        const animateTask = new LoadTask<LoadDataType.Text, string>({
            url: animatesUrl,
            identifier: '@system-animates',
            dataType: LoadDataType.Text,
            processor: this.textProcessor,
            progress: this.progress
        });
        this.addCustomLoadTask(animateTask, data => this.animationLoaded(data));
    }

    /**
     * 获取 `JSZip` 读取方式
     * @param type 加载类型
     */
    private getZipOutputType(type: LoadDataType): JSZip.OutputType {
        switch (type) {
            case LoadDataType.Text:
            case LoadDataType.JSON:
                return 'string';
            case LoadDataType.ArrayBuffer:
                return 'arraybuffer';
            case LoadDataType.Blob:
                return 'blob';
            case LoadDataType.Uint8Array:
                return 'uint8array';
            default:
                return 'uint8array';
        }
    }

    /**
     * 根据应用方式获取其所在文件夹
     * @param usage 压缩内容的应用方式
     */
    private getZipFolderByUsage(usage: CompressedUsage): string {
        switch (usage) {
            case CompressedUsage.Image:
                return 'image';
            case CompressedUsage.Tileset:
                return 'tileset';
            case CompressedUsage.Autotile:
                return 'autotile';
            case CompressedUsage.Material:
                return 'material';
            case CompressedUsage.Font:
                return 'font';
            case CompressedUsage.Sound:
                return 'sound';
            case CompressedUsage.Animate:
                return 'animate';
        }
    }

    /**
     * 处理压缩文件
     * @param name 文件名称
     * @param value 文件内容
     * @param usage 文件的应用方式
     */
    private async processZipFile(
        name: string,
        value: unknown,
        usage: CompressedUsage
    ) {
        switch (usage) {
            case CompressedUsage.Image: {
                const image = await createImageBitmap(value as Blob);
                await this.customImagesLoaded(name as ImageIds, image);
                break;
            }
            case CompressedUsage.Tileset: {
                const image = await createImageBitmap(value as Blob);
                await this.tilesetLoaded(name, image);
                break;
            }
            case CompressedUsage.Material: {
                const image = await createImageBitmap(value as Blob);
                await this.materialLoaded(name, image);
                break;
            }
            case CompressedUsage.Font: {
                const fontFace = new FontFace(
                    name.slice(0, -4),
                    value as ArrayBuffer
                );
                await fontFace.load();
                await this.fontLoaded(name, fontFace);
                break;
            }
            case CompressedUsage.Sound: {
                const buffer = await this.ac.decodeToAudioBuffer(
                    value as Uint8Array<ArrayBuffer>
                );
                await this.soundLoaded(name as SoundIds, buffer);
                break;
            }
            case CompressedUsage.Animate: {
                await this.animationLoaded(value as string);
                break;
            }
        }
    }

    /**
     * 处理单个压缩包
     * @param list 当前压缩包中包含的内容
     * @param zip 压缩包
     */
    private async handleZip(list: ICompressedMotaAssetsData[], zip: JSZip) {
        const autotiles: Partial<Record<AllIdsOf<'autotile'>, ImageBitmap>> =
            {};
        const materialImages = core.materials.slice() as SelectKey<
            MaterialImages,
            ImageBitmap
        >[];
        materialImages.push('keyboard');

        const promises = list.map(async item => {
            const { readAs, name, usage } = item;
            const folder = this.getZipFolderByUsage(usage);
            const file = zip.file(`${folder}/${name}`);
            if (!file) return;
            const value = await file.async(this.getZipOutputType(readAs));

            if (usage === CompressedUsage.Autotile) {
                const image = await createImageBitmap(value as Blob);
                await this.autotileLoaded(
                    autotiles,
                    name.slice(0, -4) as AllIdsOf<'autotile'>,
                    image
                );
            }

            await this.processZipFile(name, value, usage);
        });

        await Promise.all(promises);
    }

    /**
     * 游戏中加载（压缩后）
     */
    private async playingLoad() {
        const loadListTask = new LoadTask<
            LoadDataType.JSON,
            ICompressedMotaAssetsLoadList
        >({
            url: `loadList.json`,
            dataType: LoadDataType.JSON,
            identifier: '@system-loadList',
            processor: this.jsonProcessor,
            progress: { onProgress() {} }
        });

        loadListTask.start();
        const loadList = await loadListTask.loaded();

        const zipTask = new LoadTask<LoadDataType.ArrayBuffer, JSZip>({
            url: loadList.file,
            identifier: `@system-zip/${loadList.file}`,
            dataType: LoadDataType.ArrayBuffer,
            processor: this.zipProcessor,
            progress: this.progress
        });

        this.addCustomLoadTask(zipTask, zip => {
            return this.handleZip(loadList.content, zip);
        });
    }

    //#endregion

    //#region 对外接口

    initSystemLoadTask(): void {
        if (import.meta.env.DEV) {
            this.developingLoad();
        } else {
            this.playingLoad();
        }
    }

    addCustomLoadTask<R>(
        task: ILoadTask<LoadDataType, R>,
        onLoaded: CustomLoadFunc<R>
    ): Promise<R> {
        this.progress.addTask(task);
        const { promise, resolve } = Promise.withResolvers<R>();
        const store: LoadTaskStore<LoadDataType, R> = {
            task,
            onLoaded,
            loadPromise: promise,
            loadResolve: resolve
        };
        this.tasks.add(store);
        return promise;
    }

    load(): Promise<any[]> {
        const tasks = [...this.tasks].map(async task => {
            task.task.start();
            const data = await task.task.loaded();
            await task.onLoaded(data);
            task.loadResolve(data);
            return data;
        });
        return Promise.all(tasks);
    }

    //#endregion
}
