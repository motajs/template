import { logger } from '@motajs/common';
import {
    excitationDivider,
    IClientCore,
    IClientCoreConfig,
    IClientPluginDefine
} from '@user/client-modules';
import { ICoreStateCoreConfig } from '@user/data-state';
import {
    DEBUG_DIVIDER,
    DEBUG_VARIATOR,
    DIVIDER_DEBUG_DIVIDER,
    VARIATOR_DEBUG_SPEED
} from '../constant';
import { ExcitationVariator } from '@motajs/animate';

export class MainClientPlugin implements IClientPluginDefine {
    id: string = 'main-client-plugin';
    clientDeps: readonly string[] = [];

    awake(state: IClientCore): void {
        // 渲染调试配置
        if (DEBUG_VARIATOR) {
            const variator = new ExcitationVariator();
            variator.bindExcitation(state.rafExcitation);
            variator.setSpeed(VARIATOR_DEBUG_SPEED);
            excitationDivider.bindExcitation(variator);
        } else {
            excitationDivider.bindExcitation(state.rafExcitation);
        }

        if (DEBUG_DIVIDER) {
            excitationDivider.setDivider(DIVIDER_DEBUG_DIVIDER);
        }
    }

    async initialize(): Promise<void> {}

    async afterLoad(state: IClientCore): Promise<void> {
        const core = state.loader.getConfig<ICoreStateCoreConfig>('core');
        const client = state.loader.getConfig<IClientCoreConfig>('client');
        if (!core) {
            logger.error(79, 'Data');
            return;
        }
        if (!client) {
            logger.error(79, 'Client');
            return;
        }

        // 存档初始化
        state.save.init(`@game/${core.name}`);
    }
}
