import { logger } from '@motajs/common';
import { ILoadTask, ILoadTaskProcessor, LoadDataType } from '@motajs/loader';

export class PrefixedJSONCProcessor<T> implements ILoadTaskProcessor<
    LoadDataType.Text,
    T
> {
    constructor(readonly prefixSplit: string) {}

    process(
        response: string,
        task: ILoadTask<LoadDataType.Text, T>
    ): Promise<T> {
        const splitted = response.split(this.prefixSplit);
        if (splitted.length !== 2) {
            logger.error(66, task.url, this.prefixSplit);
            return Promise.resolve({} as T);
        }

        const raw = splitted[1];
        try {
            const obj = JSON.parse(raw);
            return Promise.resolve(obj as T);
        } catch (e) {
            logger.error(67, task.url, String(e));
            return Promise.resolve({} as T);
        }
    }
}
