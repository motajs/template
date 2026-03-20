import { clamp } from 'lodash-es';
import { ILoadProgressTotal, ILoadTask, LoadDataType } from './types';
import { logger } from '@motajs/common';

export class LoadProgressTotal<
    T extends LoadDataType = LoadDataType,
    R = any
> implements ILoadProgressTotal<T, R> {
    /** 当前已经附着的加载任务 */
    private readonly attached: Map<ILoadTask<T, R>, number> = new Map();
    /** 当前已经加载完毕的任务 */
    readonly loadedTasks: Set<ILoadTask<T, R>> = new Set();
    /** 当前已经添加的任务 */
    readonly addedTasks: Set<ILoadTask<T, R>> = new Set();

    /** 总加载量 */
    private total: number = 0;
    /** 当前已经加载的字节数 */
    private loaded: number = 0;

    /** 下一次触发 `onProgress` 时兑现 */
    private nextPromise: Promise<void>;
    /** 兑现当前的 `nextPromise` */
    private nextResolve: () => void;

    async *[Symbol.asyncIterator]() {
        while (true) {
            if (this.loadedTasks.size === this.addedTasks.size) {
                return;
            }
            yield this.nextPromise;
        }
    }

    constructor() {
        const { promise, resolve } = Promise.withResolvers<void>();
        this.nextPromise = promise;
        this.nextResolve = resolve;
    }

    addTask(task: ILoadTask<T, R>) {
        this.addedTasks.add(task);
    }

    onProgress(task: ILoadTask<T, R>, loaded: number, total: number): void {
        if (!this.addedTasks.has(task)) {
            logger.warn(95);
            return;
        }
        if (!this.attached.has(task)) {
            this.total += total;
        }
        if (task.contentLoaded) {
            this.loadedTasks.add(task);
        }
        const before = this.attached.getOrInsert(task, 0);
        if (total !== 0) {
            this.loaded += loaded - before;
        }
        this.attached.set(task, loaded);
        this.nextResolve();
        const { promise, resolve } = Promise.withResolvers<void>();
        this.nextPromise = promise;
        this.nextResolve = resolve;
    }

    getLoadedByte(): number {
        return this.loaded;
    }

    getTotalByte(): number {
        return this.loaded;
    }

    getLoadedTasks(): number {
        return this.loadedTasks.size;
    }

    getAddedTasks(): number {
        return this.addedTasks.size;
    }

    getTaskRatio(): number {
        return this.loadedTasks.size / this.addedTasks.size;
    }

    getByteRatio(): number {
        if (this.total === 0) return 0;
        return clamp(this.loaded / this.total, 0, 1);
    }
}
