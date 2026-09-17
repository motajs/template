export const enum SaveCompression {
    /** 不进行压缩，仅提取必要数据 */
    NoCompression,
    /** 进行小幅度压缩，以性能为主要考虑目标 */
    LowCompression,
    /** 进行大幅度压缩，以体积为主要考虑目标 */
    HighCompression
}

export interface ISaveableContent<T> {
    /**
     * 保存对象状态，返回的对象应该经过深拷贝（即 `structuedClone`）
     * @param compression 压缩级别
     */
    saveState(compression: SaveCompression): T;

    /**
     * 读取对象状态
     * @param state 状态对象
     * @param compression 压缩级别
     */
    loadState(state: T, compression: SaveCompression): void;
}
