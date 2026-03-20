import { logger } from '@motajs/common';
import { IStreamLoader, IStreamReader } from './types';

export class StreamLoader implements IStreamLoader {
    /** 传输目标 */
    private target: Set<IStreamReader> = new Set();
    /** 读取流对象 */
    private stream: ReadableStream | null = null;

    loading: boolean = false;

    constructor(public readonly url: string) {}

    /**
     * 将加载流传递给字节流读取对象
     * @param reader 字节流读取对象
     */
    pipe(reader: IStreamReader) {
        if (this.loading) {
            logger.warn(46);
            return;
        }
        this.target.add(reader);
        reader.piped(this);
    }

    unpipe(reader: IStreamReader): void {
        if (this.loading) {
            logger.warn(46);
            return;
        }
        this.target.delete(reader);
    }

    async start() {
        if (this.loading) return;
        this.loading = true;
        const response = await window.fetch(this.url);
        const stream = response.body;
        if (!stream) {
            logger.error(23);
            return;
        }
        // 获取读取器
        this.stream = stream;
        const reader = response.body?.getReader();
        const targets = [...this.target];
        await Promise.all(targets.map(v => v.start(stream, this, response)));
        if (reader && reader.read) {
            // 开始流传输
            while (true) {
                const { value, done } = await reader.read();
                await Promise.all(
                    targets.map(v => v.pump(value, done, response))
                );
                if (done) break;
            }
        } else {
            // 如果不支持流传输
            const buffer = await response.arrayBuffer();
            const data = new Uint8Array(buffer);
            await Promise.all(targets.map(v => v.pump(data, true, response)));
        }
        this.loading = false;
        targets.forEach(v => v.end(true));
    }

    cancel(reason?: string) {
        if (!this.stream) return;
        this.stream.cancel(reason);
        this.loading = false;
        this.target.forEach(v => v.end(false, reason));
    }
}
