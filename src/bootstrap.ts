import { WebLoadStarter } from '@motajs/loader';
import { createClientCore } from './client/entry';
import { IClientCore } from '@user/client-modules';
import { LoadSceneUI } from './client/ui/load';
import { createRendererFor } from '@motajs/render-vue';
import { createRendererScene } from './client/ui/scene';

declare global {
    interface Window {
        mainClient: IClientCore;
    }
}

const client = createClientCore(new WebLoadStarter());

const { createApp } = createRendererFor(client.renderer);
createApp(createRendererScene(client)).mount(client.renderer);

// 游戏副作用启动
window.mainClient = client;
client.sceneController.open(LoadSceneUI, {});
