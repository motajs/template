//#region 流传输

export interface IStreamController {
    /** 当前是否正在加载 */
    readonly loading: boolean;

    /**
     * 开始流传输
     */
    start(): Promise<void>;

    /**
     * 主动终止流传输
     * @param reason 终止原因
     */
    cancel(reason?: string): void;
}

export interface IStreamReader {
    /**
     * 接受字节流流传输的数据
     * @param data 传入的字节流数据，只包含本分块的内容
     * @param done 是否传输完成
     */
    pump(
        data: Uint8Array | undefined,
        done: boolean,
        response: Response
    ): Promise<void>;

    /**
     * 当前对象被传递给加载流时执行的函数
     * @param controller 传输流控制对象
     */
    piped(controller: IStreamController): void;

    /**
     * 当前对象取消指定加载流传输时执行的函数
     * @param controller 传输流控制对象
     */
    unpiped(controller: IStreamController): void;

    /**
     * 开始流传输
     * @param stream 传输流对象
     * @param controller 传输流控制对象
     */
    start(
        stream: ReadableStream,
        controller: IStreamController,
        response: Response
    ): Promise<void>;

    /**
     * 结束流传输
     * @param done 是否传输完成，如果为 false 的话，说明可能是由于出现错误导致的终止
     * @param reason 如果没有传输完成，那么表示失败的原因
     */
    end(done: boolean, reason?: string): void;
}

export interface IStreamLoader extends IStreamController {
    /**
     * 将加载流传递给字节流读取对象
     * @param reader 字节流读取对象
     */
    pipe(reader: IStreamReader): void;

    /**
     * 取消一个字节流读取对象的绑定
     * @param reader 字节流读取对象
     */
    unpipe(reader: IStreamReader): void;
}

//#endregion

//#region 加载任务

export const enum LoadDataType {
    ArrayBuffer,
    Uint8Array,
    Blob,
    Text,
    JSON
}

export interface ILoadDataTypeMap {
    [LoadDataType.ArrayBuffer]: ArrayBuffer;
    [LoadDataType.Uint8Array]: Uint8Array<ArrayBuffer>;
    [LoadDataType.Blob]: Blob;
    [LoadDataType.Text]: string;
    [LoadDataType.JSON]: any;
}

export interface ILoadTaskProcessor<T extends LoadDataType, R> {
    /**
     * 处理加载内容
     * @param response 处理前加载结果
     * @param task 加载任务对象
     */
    process(response: ILoadDataTypeMap[T], task: ILoadTask<T, R>): Promise<R>;
}

export interface ILoadTaskProgress<T extends LoadDataType, R> {
    /**
     * 更新加载进度
     * @param task 加载任务对象
     * @param loaded 已加载的字节数
     * @param total 文件总计字节数，如果此值为零说明无法读取到 `Content-Length`
     */
    onProgress(task: ILoadTask<T, R>, loaded: number, total: number): void;
}

export const enum RequestMethod {
    GET = 'GET',
    POST = 'POST',
    HEAD = 'HEAD',
    PUT = 'PUT',
    DELETE = 'DELETE',
    CONNECT = 'CONNECT',
    OPTIONS = 'OPTIONS',
    TRACE = 'TRACE',
    PATCH = 'PATCH'
}

export interface ILoadTaskInit<T extends LoadDataType, R> {
    /** 请求响应格式 */
    readonly dataType: T;
    /** 加载任务标识符 */
    readonly identifier: string;
    /** 加载目标 URL */
    readonly url: string | URL;
    /** 加载的处理对象，用于处理加载结果等 */
    readonly processor: ILoadTaskProcessor<T, R>;
    /** 加载进度对象，用于监控加载进度 */
    readonly progress: ILoadTaskProgress<T, R>;
    /** 请求模式 */
    readonly method?: RequestMethod;
    /** 请求体 */
    readonly body?: BodyInit;
    /** 请求头 */
    readonly headers?: HeadersInit;
}

export interface ILoadTask<T extends LoadDataType, R> extends ILoadTaskInit<
    T,
    R
> {
    /** 当前是否加载完毕 */
    readonly contentLoaded: boolean;
    /** 已经加载的字节数 */
    readonly loadedByte: number;
    /** 该加载任务的总体字节数 */
    readonly totalByte: number;

    /**
     * 开始此加载计划，返回一个 `Promise`，当得到服务器的响应后兑现
     */
    start(): Promise<void>;

    /**
     * 返回一个 `Promise`，当本计划加载完毕后兑现，兑现结果是加载结果
     */
    loaded(): Promise<R>;

    /**
     * 获取加载完成后的加载结果
     */
    getLoadedData(): R | null;
}

//#endregion

//#region 内置组件

export interface ILoadProgressTotal<
    T extends LoadDataType = LoadDataType,
    R = any
> extends ILoadTaskProgress<T, R> {
    /** 已经添加的加载任务对象 */
    readonly addedTasks: Set<ILoadTask<T, R>>;
    /** 当前已经加载完毕的任务对象 */
    readonly loadedTasks: Set<ILoadTask<T, R>>;

    /**
     * 迭代加载进度，当 `yield` 的值被兑现时，说明加载进度更新
     */
    [Symbol.asyncIterator](): AsyncGenerator<void, void, void>;

    /**
     * 向该进度监听器添加加载任务对象
     * @param task 加载任务对象
     */
    addTask(task: ILoadTask<T, R>): void;

    /**
     * 获取总体已加载的字节数
     */
    getLoadedByte(): number;

    /**
     * 获取总体需要加载的字节数
     */
    getTotalByte(): number;

    /**
     * 获取已经加载的字节数与总体需要加载的字节数之比
     */
    getByteRatio(): number;

    /**
     * 获取已经加载完毕的加载任务数量
     */
    getLoadedTasks(): number;

    /**
     * 获取此进度监听器已经添加的加载任务对象
     */
    getAddedTasks(): number;

    /**
     * 获取已经加载完毕的任务数量与已添加的加载任务数量之比
     */
    getTaskRatio(): number;
}

//#endregion
