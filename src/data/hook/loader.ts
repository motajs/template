import {
    ICoreState,
    IMotaDataLoader,
    IMotaDataLoaderHooks
} from '@user/data-state';

export class MainMotaDataLoaderHooks implements IMotaDataLoaderHooks {
    constructor(readonly state: ICoreState) {}

    async onCoreConfigLoaded(loader: IMotaDataLoader): Promise<void> {
        // 删除下面这两行注释开始编写你自己的核心配置加载后钩子
        void loader;
    }

    async onExtraConfigLoaded(loader: IMotaDataLoader): Promise<void> {
        // 删除下面这两行注释开始编写你自己的额外配置加载后钩子
        void loader;
    }
}
