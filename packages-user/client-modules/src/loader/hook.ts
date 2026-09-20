import {
    IMotaDataLoader,
    IMotaDataLoaderHooks,
    ICoreStateCoreConfig
} from '@user/data-state';

export class RenderLoaderHooks implements IMotaDataLoaderHooks {
    constructor(readonly clientDir: string) {}

    awake(): void {}

    destroy(): void {}

    onCoreConfigLoaded?(
        _: ICoreStateCoreConfig,
        loader: IMotaDataLoader
    ): Promise<void> {
        loader.addExtraConfig('client', this.clientDir);

        return Promise.resolve();
    }
}
