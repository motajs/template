import { ClientCore } from './client';

// TODO: 逐渐弱化 ClientCore 的单例概念，每个接口都通过参数传入 IClientCore 对象

/** 客户端实例 */
export const client = new ClientCore({
    clientURL: 'placeholder',
    // 这两个值不要随意调整，若需要调整，务必先在编辑器中调整“额外素材预留”与“额外素材单位”，否则必定会导致游戏出错
    tilesetReserve: 100000,
    tilesetUnit: 5000
});
