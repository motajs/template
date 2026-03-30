import {
    ILoadProgressTotal,
    ILoadTask,
    ILoadTaskProcessor,
    LoadDataType
} from '@motajs/loader';
import JSZip from 'jszip';

export type CustomLoadFunc<R> = (data: R) => Promise<void>;

export const enum CompressedUsage {
    // ---- 系统加载内容，不可更改
    Font,
    Image,
    Sound,
    Tileset,
    Autotile,
    Material,
    Animate
}

export interface ICompressedMotaAssetsData {
    /** 此内容的名称 */
    readonly name: string;
    /** 此内容应该由什么方式读取 */
    readonly readAs: LoadDataType;
    /** 此内容的应用方式 */
    readonly usage: CompressedUsage;
}

export interface ICompressedMotaAssetsLoadList {
    /** 压缩文件名称 */
    readonly file: string;
    /** 压缩包所包含的内容 */
    readonly content: ICompressedMotaAssetsData[];
}

export interface IMotaAssetsLoader {
    /** 加载进度对象 */
    readonly progress: ILoadProgressTotal;
    /** 当前是否正在加载 */
    readonly loading: boolean;
    /** 当前是否已经加载完毕 */
    readonly loaded: boolean;

    /** 图片处理器 */
    readonly imageProcessor: ILoadTaskProcessor<LoadDataType.Blob, ImageBitmap>;
    /** 音频处理器 */
    readonly audioProcessor: ILoadTaskProcessor<
        LoadDataType.Uint8Array,
        AudioBuffer | null
    >;
    /** 字体处理器 */
    readonly fontProcessor: ILoadTaskProcessor<
        LoadDataType.ArrayBuffer,
        FontFace
    >;
    /** 文字处理器 */
    readonly textProcessor: ILoadTaskProcessor<LoadDataType.Text, string>;
    /** `zip` 压缩包处理器 */
    readonly zipProcessor: ILoadTaskProcessor<LoadDataType.ArrayBuffer, JSZip>;

    /**
     * 初始化系统加载任务
     */
    initSystemLoadTask(): void;

    /**
     * 添加自定义加载任务
     * @param task 自定义加载任务
     * @param onLoad 当任务加载完成时执行
     * @returns 一个 `Promise`，当添加的任务加载完毕，且 `onLoad` 返回的 `Promise` 兑现后兑现
     */
    addCustomLoadTask<R>(
        task: ILoadTask<LoadDataType, R>,
        onLoad: CustomLoadFunc<R>
    ): Promise<R>;

    /**
     * 开始所有加载任务的加载工作
     * @returns 一个 `Promise`，当所有加载任务加载完成后兑现
     */
    load(): Promise<void>;
}
