import {
    IEnemyContext,
    IMotaDataLoader,
    ISaveableContent,
    IStateBase
} from '@user/data-base';
import { IEnemyAttr } from './enemy';
import { IHeroAttr } from './hero';
import { ILoadProgressTotal } from '@motajs/loader';
import { ISaveSystem } from './save';

export interface ISaveableExecutor<T, TEnemy = IEnemyAttr, THero = IHeroAttr> {
    /**
     * 当数据读取后执行的函数，允许对其他存档对象进行读取
     * @param data 对应可存档对象的存档数据
     * @param state 当前的基础状态
     */
    afterLoad(data: T, state: IStateBase<TEnemy, THero>): void;
}

export interface ICoreState extends IStateBase<IEnemyAttr, IHeroAttr> {
    /** 加载进度对象 */
    readonly loadProgress: ILoadProgressTotal;
    /** 数据端加载对象 */
    readonly dataLoader: IMotaDataLoader;
    /** 怪物上下文 */
    readonly enemyContext: IEnemyContext<IEnemyAttr, IHeroAttr>;

    /** 存档系统 */
    readonly saveSystem: ISaveSystem;

    /**
     * 将某个存档执行器绑定至指定的可存档对象，一个可存档对象只能绑定一个执行器，
     * 但一个执行器可以绑定多个可存档对象，主要用来在读档后进行一些全局性的操作
     * @param content 可存档对象或其注册 id
     * @param executor 可存档对象对应的执行器
     */
    bindSaveableExecuter<T>(
        content: ISaveableContent<T> | string,
        executor: ISaveableExecutor<T>
    ): void;
}
