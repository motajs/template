import { sumBy } from 'lodash-es';
import {
    ILoadDataTypeMap,
    ILoadTask,
    ILoadTaskHooks,
    ILoadTaskInit,
    ILoadTaskProcessor,
    ILoadTaskStarter,
    IResponseLike,
    IResponseReaderLike,
    LoadDataType,
    RequestMethod
} from './types';
import {
    Hookable,
    HookController,
    IHookController,
    logger
} from '@motajs/common';

/** 文字解码 */
const loadTextDecoder = new TextDecoder();

export class LoadTask<T extends LoadDataType, R>
    extends Hookable<ILoadTaskHooks<T, R>>
    implements ILoadTask<T, R>
{
    readonly dataType: T;
    readonly identifier: string;
    readonly url: string;
    readonly method?: RequestMethod;
    readonly body?: BodyInit;
    readonly headers?: HeadersInit;

    processor: ILoadTaskProcessor<T, R> | null = null;
    starter: ILoadTaskStarter | null = null;

    contentLoaded: boolean = false;
    loadedByte: number = 0;
    totalByte: number = 0;

    /** 加载的 `Promise` */
    private readonly loadPromise: Promise<R>;
    /** 兑现加载对象 */
    private readonly loadResolve: (data: R) => void;

    /** 加载结果 */
    private loadedData: R | null = null;

    constructor(init: ILoadTaskInit<T>) {
        super();

        this.dataType = init.dataType;
        this.identifier = init.identifier;
        this.url = init.url;
        this.method = init.method;
        this.body = init.body;
        this.headers = init.headers;

        const { promise, resolve } = Promise.withResolvers<R>();
        this.loadPromise = promise;
        this.loadResolve = resolve;
    }

    protected createController(
        hook: Partial<ILoadTaskHooks<T, R>>
    ): IHookController<ILoadTaskHooks<T, R>> {
        return new HookController(this, hook);
    }

    setProcessor(processor: ILoadTaskProcessor<T, R> | null): void {
        this.processor = processor;
    }

    setStarter(starter: ILoadTaskStarter): void {
        this.starter = starter;
    }

    /**
     * 当不使用流加载时，使用此方法直接处理响应对象
     * @param response 响应体对象
     */
    private processUnstreamableResponse(
        response: IResponseLike
    ): Promise<ILoadDataTypeMap[T]> {
        switch (this.dataType) {
            case LoadDataType.ArrayBuffer:
                return response.arrayBuffer();
            case LoadDataType.Blob:
                return response.blob();
            case LoadDataType.JSON:
                return response.json();
            case LoadDataType.Text:
                return response.text();
            case LoadDataType.Uint8Array:
                return response.bytes();
        }
    }

    /**
     * 当使用流加载时，处理每次流加载的分块
     * @param chunks 流式加载的二进制分块
     */
    private processStreamChunkResponse(
        chunks: Uint8Array<ArrayBuffer>[]
    ): ILoadDataTypeMap[T] {
        if (this.dataType === LoadDataType.Blob) {
            return new Blob(chunks);
        }
        const totalLength = sumBy(chunks, value => value.length);
        const stacked: Uint8Array<ArrayBuffer> = new Uint8Array(totalLength);
        let offset = 0;
        for (let i = 0; i < chunks.length; i++) {
            stacked.set(chunks[i], offset);
            offset += chunks[i].length;
        }
        switch (this.dataType) {
            case LoadDataType.ArrayBuffer:
                return stacked.buffer;
            case LoadDataType.Uint8Array:
                return stacked;
        }
        const text = loadTextDecoder.decode(stacked);
        switch (this.dataType) {
            case LoadDataType.Text:
                return text;
            case LoadDataType.JSON:
                return JSON.parse(text);
        }
    }

    /**
     * 处理加载数据
     * @param data 加载获取的原始数据
     */
    private processData(data: ILoadDataTypeMap[T]): Promise<R> {
        if (this.processor) {
            return this.processor.process(data, this);
        } else {
            return Promise.resolve(data as R);
        }
    }

    /**
     * 使用非流式加载方式进行加载
     * @param response 响应体
     * @param total 加载总字节数
     */
    private async *loadUnstream(
        response: IResponseLike,
        total: number
    ): AsyncGenerator<number, ILoadDataTypeMap[T]> {
        const data = await this.processUnstreamableResponse(response);
        this.loadedByte = this.totalByte;
        this.contentLoaded = true;
        this.forEachHook(hook => hook.onProgress?.(total, total));
        yield total;
        return data;
    }

    /**
     * 使用流式加载方式进行加载
     * @param reader 流式读取器
     * @param total 加载总字节数
     */
    private async *loadStream(
        reader: IResponseReaderLike,
        total: number
    ): AsyncGenerator<number, ILoadDataTypeMap[T]> {
        let received = 0;
        const chunks: Uint8Array<ArrayBuffer>[] = [];
        while (true) {
            const { done, value } = await reader.read();
            if (value) {
                chunks.push(value);
                received += value.byteLength;
            }
            if (done) this.contentLoaded = true;
            this.loadedByte = received;
            this.forEachHook(hook => hook.onProgress?.(received, total));
            yield received;
            if (done) {
                this.loadedByte = total;
                yield total;
                break;
            }
        }
        const data = this.processStreamChunkResponse(chunks);
        return data;
    }

    /**
     * 执行加载任务，自动决定使用流式加载或非流式加载
     * @param response 响应体
     * @param total 加载总字节数
     */
    private loadTask(
        response: IResponseLike,
        total: number
    ): AsyncGenerator<number, ILoadDataTypeMap[T]> {
        const reader = response.body?.getReader();
        if (reader) {
            return this.loadStream(reader, total);
        } else {
            return this.loadUnstream(response, total);
        }
    }

    /**
     * 处理响应体，并进行加载工作
     * @param response 响应体
     */
    private async *processResponse(
        response: IResponseLike
    ): AsyncIterable<number> {
        const contentLength = response.headers.get('Content-Length') ?? '0';
        const total = parseInt(contentLength, 10);
        this.loadedByte = 0;
        this.totalByte = total;
        this.forEachHook(hook => hook.onLoadStart?.(total));
        this.forEachHook(hook => hook.onProgress?.(0, total));

        const iter = this.loadTask(response, total);
        const data = yield* iter;

        const processed = await this.processData(data);
        this.loadedData = processed;
        this.loadResolve(processed);
        this.forEachHook(hook => hook.onLoadEnd?.(processed, data, total));
    }

    async *start(): AsyncIterable<number> {
        if (this.loadedData) return;

        if (!this.starter) {
            logger.error(30);
            return;
        }
        const response = await this.starter.start(this);
        yield* this.processResponse(response);

        // 加载完毕后就可以清空钩子了
        this.forEachHook(hook => hook).forEach(v => this.removeHook(v));
    }

    loaded(): Promise<R> {
        return this.loadPromise;
    }

    getLoadedData(): R | null {
        return this.loadedData;
    }
}
