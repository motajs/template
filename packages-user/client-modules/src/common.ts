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
