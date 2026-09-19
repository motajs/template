import { clamp } from 'lodash-es';
import { ILoadManager, ILoadManagerHooks, ILoadTask } from './types';
import {
    Hookable,
    HookController,
    IHookController,
    logger
} from '@motajs/common';

export class LoadManager
    extends Hookable<ILoadManagerHooks>
    implements ILoadManager
{
    /** 当前已经附着的加载任务 */
    private readonly attached: Map<ILoadTask, number> = new Map();
    /** 当前已经加载完毕的任务 */
    readonly loadedTasks: Set<ILoadTask> = new Set();
    /** 当前已经添加的任务 */
    readonly addedTasks: Set<ILoadTask> = new Set();

    /** 总加载量 */
    private total: number = 0;
    /** 当前已经加载的字节数 */
    private loaded: number = 0;

    /** 下一次触发 `onProgress` 时兑现 */
    private nextPromise: Promise<void>;
    /** 兑现当前的 `nextPromise` */
    private nextResolve: () => void;

    constructor() {
        super();
        const { promise, resolve } = Promise.withResolvers<void>();
        this.nextPromise = promise;
        this.nextResolve = resolve;
    }

    protected createController(
        hook: Partial<ILoadManagerHooks>
    ): IHookController<ILoadManagerHooks> {
        return new HookController(this, hook);
    }

    addTask(task: ILoadTask) {
        this.addedTasks.add(task);
        task.addHook({
            onProgress: (loaded, total) => this.onProgress(task, loaded, total)
        });
    }

    async *load(): AsyncIterable<number> {
        while (true) {
            if (this.loadedTasks.size === this.addedTasks.size) {
                return;
            }
            await this.nextPromise;
            yield this.loaded;
        }
    }

    onProgress(task: ILoadTask, loaded: number, total: number): void {
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
