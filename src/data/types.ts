import { IDataPluginDefine } from '@user/data-state';
import { ICombatWeakHandler } from './enemy';

export interface IDataMainPlugin extends IDataPluginDefine {
    /** 虚弱处理对象 */
    readonly weak: ICombatWeakHandler;
}
