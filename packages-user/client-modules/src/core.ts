import { state } from '@user/data-state';
import { ClientCore } from './client';

/** 客户端实例 */
export const client = new ClientCore(state);
