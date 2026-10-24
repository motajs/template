import { logger } from '@motajs/common';
import {
    excitationDivider,
    IClientCore,
    IClientCoreConfig,
    IClientPluginDefine
} from '@user/client-modules';
import { ICoreStateCoreConfig } from '@user/data-state';
import { ExcitationVariator } from '@motajs/animate';
import { SaveCompression } from '@user/data-common';
import { IClientHotkeySave } from '@user/client-base';
import {
    DEBUG_VARIATOR,
    VARIATOR_DEBUG_SPEED,
    DEBUG_DIVIDER,
    DIVIDER_DEBUG_DIVIDER
} from './constant';

export class MainClientPlugin implements IClientPluginDefine {
    id: string = 'main-client-plugin';
    clientDeps: readonly string[] = [];
    dataDeps: readonly string[] = [];

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

        // 按键不是跟随存档的，而是跟随游戏的，所以不进 state 的 addSaveableContent，而是单独调用 global
        const hotkey =
            await state.save.getGlobal<IClientHotkeySave>('@system/hotkey');
        if (hotkey) {
            state.hotkey.loadState(hotkey, SaveCompression.NoCompression);
        }
    }
}
