import {
    ILoadProgressTotal,
    LoadDataType,
    ILoadTask,
    ILoadTaskProcessor
} from '@motajs/loader';
import { CustomLoadFunc, IMotaDataLoader } from './types';
import { LoadJSONProcessor } from './processor';

interface LoadTaskStore<T extends LoadDataType = LoadDataType, R = any> {
    /** 加载任务对象 */
    readonly task: ILoadTask<T, R>;
    /** 当 `onLoaded` 兑现后兑现的 `Promise` */
    readonly loadPromise: Promise<R>;
    /** 兑现 `loadPromise` */
    readonly loadResolve: (data: R) => void;
    /** 当加载任务完成时执行的函数 */
    readonly onLoaded: CustomLoadFunc<R>;
}

export class MotaDataLoader implements IMotaDataLoader {
    /** 当前已添加的加载任务 */
    private readonly tasks: Set<LoadTaskStore> = new Set();

    readonly jsonProcessor: ILoadTaskProcessor<LoadDataType.JSON, any>;

    constructor(readonly progress: ILoadProgressTotal) {
        this.jsonProcessor = new LoadJSONProcessor();
    }

    //#region 对外接口

    initSystemLoadTask(): void {}

    addCustomLoadTask<R>(
        task: ILoadTask<LoadDataType, R>,
        onLoaded: CustomLoadFunc<R>
    ): Promise<R> {
        this.progress.addTask(task);
        const { promise, resolve } = Promise.withResolvers<R>();
        const store: LoadTaskStore<LoadDataType, R> = {
            task,
            onLoaded,
            loadPromise: promise,
            loadResolve: resolve
        };
        this.tasks.add(store);
        return promise;
    }

    async load(): Promise<void> {
        const tasks = [...this.tasks].map(async task => {
            task.task.start();
            const data = await task.task.loaded();
            await task.onLoaded(data);
            task.loadResolve(data);
            return data;
        });
        await Promise.all(tasks);
    }

    //#endregion
}
