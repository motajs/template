import { WebLoadStarter } from '@motajs/loader';
import { createClientCore } from './client/entry';
import { IClientCore } from '@user/client-modules';

declare global {
    interface Window {
        mainClient: IClientCore;
    }
}

const client = await createClientCore(new WebLoadStarter());
window.mainClient = client;
