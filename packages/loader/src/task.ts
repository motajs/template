import { sumBy } from 'lodash-es';
import {
    ILoadDataTypeMap,
    ILoadTask,
    ILoadTaskInit,
    ILoadTaskProcessor,
    ILoadTaskProgress,
    LoadDataType,
    RequestMethod
} from './types';

/** 文字解码 */
const loadTextDecoder = new TextDecoder();

export class LoadTask<T extends LoadDataType, R> implements ILoadTask<T, R> {
    readonly dataType: T;
    readonly identifier: string;
    readonly url: string | URL;
    readonly processor: ILoadTaskProcessor<T, R>;
    readonly progress: ILoadTaskProgress<T, R>;
    readonly method?: RequestMethod;
    readonly body?: BodyInit;
    readonly headers?: HeadersInit;

    contentLoaded: boolean = false;
    loadedByte: number = 0;
    totalByte: number = 0;

    /** 加载的 `Promise` */
    private readonly loadPromise: Promise<R>;
    /** 兑现加载对象 */
    private readonly loadResolve: (data: R) => void;

    /** 加载结果 */
    private loadedData: R | null = null;

    constructor(init: ILoadTaskInit<T, R>) {
        this.dataType = init.dataType;
        this.identifier = init.identifier;
        this.url = this.resolveURL(init.url);
        this.processor = init.processor;
        this.progress = init.progress;
        this.method = init.method;
        this.body = init.body;
        this.headers = init.headers;

        const { promise, resolve } = Promise.withResolvers<R>();
        this.loadPromise = promise;
        this.loadResolve = resolve;
    }

    private resolveURL(url: string | URL) {
        if (typeof url === 'string') {
            return `${import.meta.env.BASE_URL}${url}`;
        } else {
            return url;
        }
    }

    private processUnstreamableResponse(
        response: Response
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

    private async processResponse(response: Response) {
        const reader = response.body?.getReader();
        const contentLength = response.headers.get('Content-Length') ?? '0';
        const total = parseInt(contentLength, 10);
        this.loadedByte = 0;
        this.totalByte = total;
        this.progress.onProgress(this, 0, total);
        if (!reader) {
            const data = await this.processUnstreamableResponse(response);
            this.loadedByte = this.totalByte;
            this.contentLoaded = true;
            this.progress.onProgress(this, this.loadedByte, this.totalByte);
            const processed = await this.processor.process(data, this);
            this.loadedData = processed;
            this.loadResolve(processed);
            return;
        }
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
            this.progress.onProgress(this, received, total);
            if (done) break;
        }
        const data = this.processStreamChunkResponse(chunks);
        const processed = await this.processor.process(data, this);
        this.loadedData = processed;
        this.loadResolve(processed);
    }

    async start(): Promise<void> {
        const response = await fetch(this.url, {
            method: this.method,
            body: this.body,
            headers: this.headers
        });
        this.processResponse(response);
        return;
    }

    loaded(): Promise<R> {
        return this.loadPromise;
    }

    getLoadedData(): R | null {
        return this.loadedData;
    }
}
