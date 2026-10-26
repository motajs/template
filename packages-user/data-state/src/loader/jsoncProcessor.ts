import { logger } from '@motajs/common';
import { ILoadTask, ILoadTaskProcessor, LoadDataType } from '@motajs/loader';

export class PrefixedJSONCProcessor<T> implements ILoadTaskProcessor<
    LoadDataType.Text,
    T
> {
    constructor(readonly prefixSplit: string) {}

    /**
     * 反序列化并输出
     * @param str JSON 字符串内容
     * @param task 加载任务对象
     */
    private output(
        str: string,
        task: ILoadTask<LoadDataType.Text, T>
    ): Promise<T> {
        try {
            const obj = JSON.parse(str);
            return Promise.resolve(obj as T);
        } catch (e) {
            logger.error(67, task.url, String(e));
            return Promise.resolve({} as T);
        }
    }

    process(
        response: string,
        task: ILoadTask<LoadDataType.Text, T>
    ): Promise<T> {
        const splitted = response.split(this.prefixSplit);
        if (splitted.length === 1) {
            return this.output(response, task);
        }

        if (splitted.length !== 2) {
            logger.error(66, task.url, this.prefixSplit);
            return Promise.resolve({} as T);
        }

        return this.output(splitted[1], task);
    }
}
