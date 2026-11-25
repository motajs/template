import { WebLoadStarter } from '@motajs/loader';
import { createClientCore } from './client/entry';
import { IClientCore } from '@user/client-modules';
import { LoadSceneUI } from './client/ui/load';

declare global {
    interface Window {
        mainClient: IClientCore;
    }
}

const client = createClientCore(new WebLoadStarter());

// 游戏副作用启动
window.mainClient = client;
client.sceneController.open(LoadSceneUI, {});
