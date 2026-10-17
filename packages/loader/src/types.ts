//#region 流传输

import { IHookable, IHookBase } from '@motajs/common';

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

export interface ILoadDataTypeMap {
    [LoadDataType.ArrayBuffer]: ArrayBuffer;
    [LoadDataType.Uint8Array]: Uint8Array<ArrayBuffer>;
    [LoadDataType.Blob]: Blob;
    [LoadDataType.Text]: string;
    [LoadDataType.JSON]: any;
}

export interface ILoadTaskRequest {
    /** 加载目标 URL */
    readonly url: string;
    /** 请求模式 */
    readonly method?: RequestMethod;
    /** 请求体 */
    readonly body?: BodyInit;
    /** 请求头 */
    readonly headers?: HeadersInit;
}

export interface ILoadTaskProcessor<T extends LoadDataType, R> {
    /**
     * 处理加载内容
     * @param response 处理前加载结果
     * @param task 加载任务对象
     */
    process(response: ILoadDataTypeMap[T], task: ILoadTask<T, R>): Promise<R>;
}

export interface IResponseReaderLike {
    /**
     * 进行下一个分块的读取
     */
    read(): Promise<ReadableStreamReadResult<Uint8Array<ArrayBuffer>>>;
}

export interface IResponseBodyLike {
    /**
     * 获取流式读取器
     */
    getReader(): ReadableStreamDefaultReader;
}

export interface IResponseHeadersLike {
    /**
     * 获取指定响应头的内容
     * @param name 响应头字段名称
     */
    get(name: string): string | null;
}

export interface IResponseLike {
    /** 请求地址 */
    readonly url: string;
    /** 响应体 */
    readonly body: IResponseBodyLike | null;
    /** 响应头 */
    readonly headers: IResponseHeadersLike;

    /**
     * 输出为 `ArrayBuffer`
     */
    arrayBuffer(): Promise<ArrayBuffer>;

    /**
     * 输出为 `Blob`
     */
    blob(): Promise<Blob>;

    /**
     * 输出为 `Uint8Array`
     */
    bytes(): Promise<Uint8Array<ArrayBuffer>>;

    /**
     * 输出为 `JSON`
     */
    json(): Promise<any>;

    /**
     * 输出为纯文本
     */
    text(): Promise<string>;
}

export interface ILoadTaskStarter {
    /**
     * 进行加载请求，获取 `Response` 对象
     * @param request 请求配置
     */
    start(request: ILoadTaskRequest): Promise<IResponseLike>;
}

export interface ILoadTaskInit<
    T extends LoadDataType
> extends ILoadTaskRequest {
    /** 请求响应格式 */
    readonly dataType: T;
    /** 加载任务标识符 */
    readonly identifier: string;
}

export interface ILoadTaskHooks<T extends LoadDataType, R> extends IHookBase {
    /**
     * 当加载开始时触发
     * @param total 加载总字节数
     */
    onLoadStart?(total: number): void;

    /**
     * 当加载进度变动时触发
     * @param loaded 已加载的字节数
     * @param total 加载总字节数
     */
    onProgress?(loaded: number, total: number): void;

    /**
     * 当加载完成时触发
     * @param data 经过处理后的加载内容
     * @param raw 加载完毕时获取的原始数据
     * @param total 加载总字节数
     */
    onLoadEnd?(data: R, raw: ILoadDataTypeMap[T], total: number): void;
}

export interface ILoadTask<T extends LoadDataType = LoadDataType, R = any>
    extends ILoadTaskInit<T>, IHookable<ILoadTaskHooks<T, R>> {
    /** 当前是否加载完毕 */
    readonly contentLoaded: boolean;
    /** 已经加载的字节数 */
    readonly loadedByte: number;
    /** 该加载任务的总体字节数 */
    readonly totalByte: number;
    /** 当前任务使用的数据处理器 */
    readonly processor: ILoadTaskProcessor<T, R> | null;
    /** 当前任务使用的加载启动器 */
    readonly starter: ILoadTaskStarter | null;

    /**
     * 设置当前任务使用的数据处理器
     * @param processor 数据处理器
     */
    setProcessor(processor: ILoadTaskProcessor<T, R> | null): void;

    /**
     * 设置当前任务使用的加载启动器
     * @param starter 加载启动器
     */
    setStarter(starter: ILoadTaskStarter): void;

    /**
     * 开始此加载计划，返回一个 `Promise`，当得到服务器的响应后兑现
     * @returns 异步迭代器，当加载进度变动时进行一次迭代，迭代值为当前加载的字节数
     */
    start(): AsyncIterable<number>;

    /**
     * 返回一个 `Promise`，当本计划加载完毕后兑现，兑现结果是加载结果
     */
    loaded(): Promise<R>;

    /**
     * 获取加载完成后的加载结果
     */
    getLoadedData(): R | null;
}

export interface ILoadManagerHooks extends IHookBase {
    /**
     * 当开始加载时触发
     */
    onStartLoad?(): void;

    /**
     * 当加载进度发生变化时触发
     * @param loaded 已加载的字节数
     * @param total 加载总字节数，此数值可能不准确，因为必须等所有的加载全部连接完成时才能够得知总字节数
     */
    onProgress?(loaded: number, total: number): void;

    /**
     * 当所有加载任务完成时触发
     * @param total 加载的总字节数
     */
    onLoadEnd?(total: number): void;
}

export interface ILoadManager extends IHookable<ILoadManagerHooks> {
    /** 已经添加的加载任务对象 */
    readonly addedTasks: Set<ILoadTask>;
    /** 当前已经加载完毕的任务对象 */
    readonly loadedTasks: Set<ILoadTask>;

    /**
     * 向该进度监听器添加加载任务对象
     * @param task 加载任务对象
     */
    addTask(task: ILoadTask): void;

    /**
     * 开始执行加载
     * @returns 加载的异步迭代器，当加载进度更新时迭代，迭代值为当前已加载的总字节数
     */
    load(): AsyncIterable<number>;

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
