import { logger } from '@motajs/common';
import { IMotaDataLoader, IMotaDataLoaderHooks } from '@user/data-state';
import { IClientConfig } from '../common';

export class RenderLoaderHooks implements IMotaDataLoaderHooks {
    constructor() {}

    awake(): void {}

    destroy(): void {}

    onCoreConfigLoaded?(loader: IMotaDataLoader): Promise<void> {
        const client = loader.getConfig<IClientConfig>('client');
        if (!client) {
            logger.error(69, 'Client');
            return Promise.resolve();
        }

        const content = client.content;
        loader.addExtraConfig('texture-list', content.textureListDir);
        loader.addExtraConfig('audio-list', content.audioListDir);
        loader.addExtraConfig('animation-list', content.animationListDir);
        loader.addExtraConfig('font-list', content.fontListDir);
        const defaults = content.defaults;
        loader.addExtraConfig('texture-default', defaults.textureDefault);
        loader.addExtraConfig('audio-default', defaults.audioDefault);
        loader.addExtraConfig('animation-default', defaults.animationDefault);
        loader.addExtraConfig('font-default', defaults.fontDefault);

        return Promise.resolve();
    }
}
