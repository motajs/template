import {
    ILoadProgressTotal,
    ILoadTask,
    ILoadTaskProcessor,
    LoadDataType
} from '@motajs/loader';

export type CustomLoadFunc<R> = (data: R) => Promise<void>;

export interface IMotaDataLoader {
    /** 加载进度对象 */
    readonly progress: ILoadProgressTotal;

    /** json 处理器 */
    readonly jsonProcessor: ILoadTaskProcessor<LoadDataType.JSON, any>;

    /**
     * 初始化系统加载任务
     */
    initSystemLoadTask(): void;

    /**
     * 添加自定义加载任务
     * @param task 自定义加载任务
     * @param onLoad 当任务加载完成时执行
     * @returns 一个 `Promise`，当添加的任务加载完毕，且 `onLoad` 返回的 `Promise` 兑现后兑现
     */
    addCustomLoadTask<R>(
        task: ILoadTask<LoadDataType, R>,
        onLoad: CustomLoadFunc<R>
    ): Promise<R>;

    /**
     * 开始所有加载任务的加载工作
     * @returns 一个 `Promise`，当所有加载任务加载完成后兑现
     */
    load(): Promise<void>;
}
