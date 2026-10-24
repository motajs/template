//#region 渲染端主对象

export interface IClientContentDefaultConfig {
    /** 贴图列表中每一项的默认值 */
    readonly textureDefault: string;
    /** 音频列表中每一项的默认值 */
    readonly audioDefault: string;
    /** 动画列表中每一项的默认值 */
    readonly animationDefault: string;
    /** 字体列表中每一项的默认值 */
    readonly fontDefault: string;
}

export interface IClientContentConfig {
    /** 配置的默认对象配置路径 */
    readonly defaults: IClientContentDefaultConfig;
    /** 贴图文件夹路径 */
    readonly textureDir: string;
    /** 贴图列表文件路径 */
    readonly textureListDir: string;
    /** 音频文件夹路径 */
    readonly audioDir: string;
    /** 音频列表文件路径 */
    readonly audioListDir: string;
    /** 动画文件夹路径 */
    readonly animationDir: string;
    /** 动画列表文件路径 */
    readonly animationListDir: string;
    /** 字体文件夹路径 */
    readonly fontDir: string;
    /** 字体列表文件路径 */
    readonly fontListDir: string;
}

export interface IClientConfig {
    /** 渲染端数据配置 */
    readonly content: IClientContentConfig;
    /** 标题界面使用的图片 */
    readonly titleImage: string;
    /** 标题界面使用的背景音乐 */
    readonly titleBGM: string;
    /** 初始状态下勇士使用的默认贴图 */
    readonly heroImage: string;
}

//#endregion

//#region 列表对象

export const enum TextureReadType {
    /** 把整张图片直接读取，不进行切分 */
    Full,
    /** 把整张图片按照网格切分，每格都是独立的图片素材 */
    Grid,
    /** 把整张图片按照网格切分，横向网格组成动画，纵向的组成独立的图片素材 */
    RowAnimate,
    /** 把整张图片按照网格切分，纵向网格组成动画，横向的组成独立的图片素材 */
    ColumnAnimate,
    /** 把整张图片按照网格切分，按照先从左到右，再从上到下的顺序组成动画 */
    ScanAnimate
}

export const enum TextureUsage {
    /** 常规图片，不作任何特殊处理，一般是自定义图片 */
    CommonImage,
    /** 常规图块素材 */
    Tile,
    /** 图块集素材 */
    Tileset
}

export interface IClientTextureListConfig {
    /** 素材图片名称，任何时候都可以通过此值获取指定素材的完整图片 */
    readonly source: string;
    /** 素材的读取方式 */
    readonly read: TextureReadType;
    /** 素材的使用方式 */
    readonly usage: TextureUsage;
    /** 素材使用网格切分时，每格的尺寸，如果不能整除素材尺寸，那么会导致最右侧和最下侧尺寸不符参数 */
    readonly grid?: [width: number, height: number];
    /** 当素材的使用方式为 `Tile` 时，按照切分顺序排序的图块列表，切分顺序为从左到右，再从上到下 */
    readonly tiles?: number[];
}

export const enum ClientAudioType {
    /** 背景音乐，背景音乐或懒加载并进行内存管理 */
    BGM,
    /** 音效，音效会在游戏开头加载，且不会进行内存管理 */
    Sound
}

export interface IClientAudioListConfig {
    /** 音频类型 */
    readonly type: ClientAudioType;
    /** 音频文件名称 */
    readonly source: string;
}

//#endregion
