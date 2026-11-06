import { Mota } from '@user/entry-data';
import * as Render from '@motajs/render';
import * as RenderVue from '@motajs/render-vue';
import * as System from '@motajs/system';
import * as UserClientBase from '@user/client-base';
import * as ClientModules from '@user/client-modules';

export function create() {
    Mota.register('@motajs/render', Render);
    Mota.register('@motajs/render-vue', RenderVue);
    Mota.register('@motajs/system', System);
    Mota.register('@user/client-base', UserClientBase);
    Mota.register('@user/client-modules', ClientModules);
}
