import { ITileLocator } from '@motajs/common';
import {
    ILayerState,
    IMapLayer,
    IStateBase,
    IStateBaseExtended
} from '@user/data-base';

export interface ITriggerHandler<TEnemy = unknown, THero = unknown> {
    /** 当前全局状态对象 */
    readonly state: IStateBase<TEnemy, THero>;
    /** 当前楼层状态对象 */
    readonly layer?: ILayerState;
    /** 当前参与触发的图层对象 */
    readonly mapLayer?: IMapLayer;
    /** 当前触发点定位符 */
    readonly locator?: ITileLocator;
}

export type TriggerFactory<TEnemy, THero> = (
    type: number,
    state: IStateBase<TEnemy, THero>
) => ITrigger<TEnemy, THero>;

export interface ITrigger<
    TEnemy = unknown,
    THero = unknown
> extends IStateBaseExtended<TEnemy, THero> {
    /** 触发器类型标识 */
    readonly type: number;
    /** 触发器优先级 */
    readonly priority: number;

    /**
     * 使用给定上下文触发当前触发器
     * @param handler 触发上下文对象
     */
    trigger(handler: ITriggerHandler<TEnemy, THero>): Promise<void>;

    /**
     * 将当前触发器包装为单元素触发器集合
     */
    collection(): ITriggerCollection<TEnemy, THero>;
}

export interface ITriggerRegistry<
    TEnemy = unknown,
    THero = unknown
> extends IStateBaseExtended<TEnemy, THero> {
    /**
     * 注册一个按类型创建的触发器工厂
     * @param type 触发器类型
     * @param factory 触发器工厂函数
     */
    register(type: number, factory: TriggerFactory<TEnemy, THero>): void;

    /**
     * 获取指定类型的触发器工厂
     * @param type 触发器类型
     */
    get(type: number): TriggerFactory<TEnemy, THero> | null;

    /**
     * 根据触发器类型创建一个触发器实例，如果对应工厂不存在则返回 `null`
     * @param num 触发器类型
     */
    create(num: number): ITrigger<TEnemy, THero> | null;
}

export interface ITriggerCollection<TEnemy, THero> {
    /**
     * 当前集合中的触发器数量
     */
    count(): number;

    /**
     * 顺序触发当前集合中的所有触发器
     * @param handler 初始触发上下文对象
     */
    trigger(handler: ITriggerHandler<TEnemy, THero>): Promise<void>;

    /**
     * 逐个触发当前集合中的触发器，并允许为下一次推进提供新上下文
     * @param handler 初始触发上下文对象
     */
    triggerIter(
        handler: ITriggerHandler<TEnemy, THero>
    ): AsyncGenerator<
        ITrigger<TEnemy, THero>,
        void,
        ITriggerHandler<TEnemy, THero> | null
    >;

    /**
     * 迭代当前集合中的所有触发器
     */
    iterate(): Iterable<ITrigger<TEnemy, THero>>;

    /**
     * 向集合末尾追加一个触发器
     * @param trigger 要追加的触发器
     */
    push(trigger: ITrigger<TEnemy, THero>): void;

    /**
     * 向集合头部插入一个触发器
     * @param trigger 要插入的触发器
     */
    unshift(trigger: ITrigger<TEnemy, THero>): void;

    /**
     * 将当前集合与其他集合顺序拼接为一个新集合
     * @param others 要拼接的其他集合
     */
    concat(
        ...others: ITriggerCollection<TEnemy, THero>[]
    ): ITriggerCollection<TEnemy, THero>;
}

export interface ITriggerCollector<TEnemy, THero> {
    /**
     * 收集指定图层中某一点的所有触发器
     * @param x 横坐标
     * @param y 纵坐标
     * @param layer 目标图层
     */
    collect(
        x: number,
        y: number,
        layer: IMapLayer
    ): ITriggerCollection<TEnemy, THero>;

    /**
     * 绑定或清除当前 collector 使用的注册表
     * @param registry 触发器注册表
     */
    attachRegistry(registry: ITriggerRegistry<TEnemy, THero> | null): void;
}
