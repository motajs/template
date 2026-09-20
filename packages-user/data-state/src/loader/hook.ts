import { ICoreStateCoreConfig } from '../common';
import { IMotaDataLoader, IMotaDataLoaderHooks } from './types';

export class DefaultDataLoaderHook implements IMotaDataLoaderHooks {
    awake(): void {}

    destroy(): void {}

    onCoreConfigLoaded(
        coreConfig: ICoreStateCoreConfig,
        loader: IMotaDataLoader
    ): Promise<void> {
        const content = coreConfig.content;
        loader.addExtraConfig('enemy', content.enemyDir);
        loader.addExtraConfig('item', content.itemDir);
        loader.addExtraConfig('map-list', content.mapListDir);
        loader.addExtraConfig('tile', content.tileDir);
        const defaults = content.defaults;
        loader.addExtraConfig('enemy-default', defaults.enemyDefault);
        loader.addExtraConfig('item-default', defaults.itemDefault);
        loader.addExtraConfig('map-default', defaults.mapDefault);
        loader.addExtraConfig('tile-default', defaults.tileDefault);

        return Promise.resolve();
    }
}
