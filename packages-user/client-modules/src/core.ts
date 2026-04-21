import { state } from '@user/data-state';
import { ClientCore } from './client';

// TODO: 逐渐弱化 ClientCore 的单例概念，每个接口都通过参数传入 IClientCore 对象

/** 客户端实例 */
export const client = new ClientCore(state);
