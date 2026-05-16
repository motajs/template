import { ITileLocator } from '@motajs/common';
import { ILayerState, IMapLayer, IStateBase } from '@user/data-base';

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

export type TriggerFactory = (type: number) => ITrigger;

export type TriggerStringFactory = () => ITrigger;

export interface ITrigger {
    /** 触发器类型标识 */
    readonly type: number;
    /** 触发器优先级 */
    readonly priority: number;

    /**
     * 使用给定上下文触发当前触发器
     * @param handler 触发上下文对象
     */
    trigger<TEnemy = unknown, THero = unknown>(
        handler: ITriggerHandler<TEnemy, THero>
    ): Promise<void>;

    /**
     * 将当前触发器包装为单元素触发器集合
     */
    collection(): ITriggerCollection;
}

export interface ITriggerRegistry {
    /**
     * 注册一个按类型创建的触发器工厂
     * @param type 触发器类型
     * @param factory 触发器工厂函数
     */
    register(type: number, factory: TriggerFactory): void;

    /**
     * 获取指定类型的触发器工厂
     * @param type 触发器类型
     */
    get(type: number): TriggerFactory | null;

    /**
     * 根据触发器类型创建一个触发器实例，如果对应工厂不存在则返回 `null`
     * @param num 触发器类型
     */
    create(num: number): ITrigger | null;

    /**
     * 注册一个按字符串 id 查询的触发器工厂
     * @param id 触发器字符串 id
     * @param factory 触发器工厂函数
     */
    registerString(id: string, factory: TriggerStringFactory): void;

    /**
     * 获取指定字符串 id 对应的触发器工厂
     * @param id 触发器字符串 id
     */
    getString(id: string): TriggerStringFactory | null;

    /**
     * 根据字符串 id 创建一个触发器实例，如果对应工厂不存在则返回 `null`
     * @param id 触发器字符串 id
     */
    createByString(id: string): ITrigger | null;
}

export interface ITriggerCollection {
    /**
     * 当前集合中的触发器数量
     */
    count(): number;

    /**
     * 顺序触发当前集合中的所有触发器
     * @param handler 初始触发上下文对象
     */
    trigger<TEnemy = unknown, THero = unknown>(
        handler: ITriggerHandler<TEnemy, THero>
    ): Promise<void>;

    /**
     * 逐个触发当前集合中的触发器，并允许为下一次推进提供新上下文
     * @param handler 初始触发上下文对象
     */
    triggerIter<TEnemy = unknown, THero = unknown>(
        handler: ITriggerHandler<TEnemy, THero>
    ): AsyncGenerator<ITrigger, void, ITriggerHandler<TEnemy, THero> | null>;

    /**
     * 迭代当前集合中的所有触发器
     */
    iterate(): Iterable<ITrigger>;

    /**
     * 向集合末尾追加一个触发器
     * @param trigger 要追加的触发器
     */
    push(trigger: ITrigger): void;

    /**
     * 向集合头部插入一个触发器
     * @param trigger 要插入的触发器
     */
    unshift(trigger: ITrigger): void;

    /**
     * 将当前集合与其他集合顺序拼接为一个新集合
     * @param others 要拼接的其他集合
     */
    concat(...others: ITriggerCollection[]): ITriggerCollection;
}

export interface ITriggerCollector {
    /**
     * 收集指定图层中某一点的所有触发器
     * @param x 横坐标
     * @param y 纵坐标
     * @param layer 目标图层
     */
    collect(x: number, y: number, layer: IMapLayer): ITriggerCollection;

    /**
     * 绑定或清除当前 collector 使用的注册表
     * @param registry 触发器注册表
     */
    attachRegistry(registry: ITriggerRegistry | null): void;
}
