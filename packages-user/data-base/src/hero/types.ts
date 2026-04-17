import { IHookBase, IHookable } from '@motajs/common';
import { FaceDirection } from '@user/data-state';

//#region 勇士属性

export interface IHeroModifier<T = unknown, V = unknown> {
    /** 修饰器优先级 */
    readonly priority: number;
    /** 修饰器参数值 */
    readonly value: V;
    /** 当前修饰器所属的勇士属性对象 */
    readonly owner: IHeroAttribute<unknown> | null;

    /**
     * 设置修饰器参数值
     * @param value 参数值
     */
    setValue(value: V): void;

    /**
     * 获取修饰器参数值
     */
    getValue(): V;

    /**
     * 绑定勇士属性对象
     * @param attribute 勇士属性对象
     */
    bindAttribute(attribute: IHeroAttribute<unknown> | null): void;

    /**
     * 对指定属性值进行修改
     * @param value 该属性值的当前属性值，即经过了优先级更高的修饰器修饰后的属性值
     * @param baseValue 该属性值的基础属性值
     * @param name 属性名称
     */
    modify(value: T, baseValue: T, name: PropertyKey): T;

    /**
     * 深拷贝此修饰器
     */
    clone(): IHeroModifier<T, V>;
}

export interface IReadonlyHeroAttribute<THero> {
    /**
     * 获取勇士的基础属性，即未经过任何 Buff 或装备等加成的属性
     * @param name 属性名称
     */
    getBaseAttribute<K extends keyof THero>(name: K): THero[K];

    /**
     * 获取勇士的最终属性，即经过了 Buff 或装备等加成的属性
     * @param name 属性名称
     */
    getFinalAttribute<K extends keyof THero>(name: K): THero[K];

    /**
     * 将指定属性标记为脏
     * @param name 属性名称
     */
    markDirty(name: keyof THero): void;

    /**
     * 将指定属性修饰器标记为脏
     * @param modifier 属性修饰器
     */
    markModifierDirty(modifier: IHeroModifier): void;

    /**
     * 深拷贝此勇士属性对象
     * @param cloneModifier 是否同时复制修饰器，默认复制
     */
    clone(cloneModifier?: boolean): IReadonlyHeroAttribute<THero>;

    /**
     * 获取此勇士属性对象的可修改副本
     */
    getModifiableClone(): IHeroAttribute<THero>;
}

export interface IHeroAttribute<THero> extends IReadonlyHeroAttribute<THero> {
    /**
     * 设置勇士的基础属性
     * @param name 属性名称
     * @param value 要设置为的值
     */
    setBaseAttribute<K extends keyof THero>(name: K, value: THero[K]): void;

    /**
     * 向一个属性添加属性修饰器
     * @param name 属性名称
     * @param modifier 属性修饰器
     */
    addModifier<K extends keyof THero>(
        name: K,
        modifier: IHeroModifier<THero[K], unknown>
    ): void;

    /**
     * 删除指定的属性修饰器
     * @param name 属性名称
     * @param modifier 属性修饰器
     */
    deleteModifier<K extends keyof THero>(
        name: K,
        modifier: IHeroModifier<THero[K], unknown>
    ): void;

    /**
     * 深拷贝此勇士属性对象
     * @param cloneModifier 是否同时复制修饰器，默认复制
     */
    clone(cloneModifier?: boolean): IHeroAttribute<THero>;
}

//#endregion

//#region 勇士移动

export const enum HeroAnimateDirection {
    /** 正向播放动画 */
    Forward,
    /** 反向播放动画 */
    Backward
}

export interface IHeroFollower {
    /** 跟随者的图块数字 */
    readonly num: number;
    /** 跟随者的标识符 */
    readonly identifier: string;
    /** 跟随者的不透明度 */
    alpha: number;
}

export interface IHeroMovingHooks extends IHookBase {
    /**
     * 当设置勇士的坐标时触发
     * @param x 勇士横坐标
     * @param y 勇士纵坐标
     */
    onSetPosition(x: number, y: number): void;

    /**
     * 当设置勇士朝向时触发
     * @param direction 勇士朝向
     */
    onTurnHero(direction: FaceDirection): void;

    /**
     * 当勇士开始移动时触发
     */
    onStartMove(): void;

    /**
     * 当移动勇士时触发
     * @param direction 移动方向
     * @param time 移动动画时长
     */
    onMoveHero(direction: FaceDirection, time: number): Promise<void>;

    /**
     * 当停止移动时触发
     */
    onEndMove(): Promise<void>;

    /**
     * 当勇士跳跃时触发
     * @param x 目标点横坐标
     * @param y 目标点纵坐标
     * @param time 跳跃动画时长
     * @param waitFollower 是否等待跟随者跳跃完毕
     */
    onJumpHero(
        x: number,
        y: number,
        time: number,
        waitFollower: boolean
    ): Promise<void>;

    /**
     * 当设置勇士图片时触发
     * @param image 勇士图片 id
     */
    onSetImage(image: ImageIds): void;

    /**
     * 当设置勇士不透明度时执行
     * @param alpha 不透明度
     */
    onSetAlpha(alpha: number): void;

    /**
     * 添加跟随者时触发
     * @param follower 跟随者的图块数字
     * @param identifier 跟随者的标识符
     */
    onAddFollower(follower: number, identifier: string): void;

    /**
     * 当移除跟随者时触发
     * @param identifier 跟随者的标识符
     * @param animate 填 `true` 的话，如果删除了中间的跟随者，后续跟随者会使用移动动画移动到下一格，否则瞬移至下一格
     */
    onRemoveFollower(identifier: string, animate: boolean): void;

    /**
     * 当移除所有跟随者时触发
     */
    onRemoveAllFollowers(): void;

    /**
     * 设置跟随者的不透明度
     * @param identifier 跟随者标识符
     * @param alpha 跟随者不透明度
     */
    onSetFollowerAlpha(identifier: string, alpha: number): void;
}

export interface IHeroMover extends IHookable<IHeroMovingHooks> {
    /** 勇士横坐标 */
    readonly x: number;
    /** 勇士纵坐标 */
    readonly y: number;
    /** 勇士朝向 */
    readonly direction: FaceDirection;
    /** 勇士图片 */
    readonly image?: ImageIds;
    /** 跟随者列表 */
    readonly followers: readonly IHeroFollower[];
    /** 勇士当前的不透明度 */
    readonly alpha: number;

    /**
     * 设置勇士位置
     * @param x 横坐标
     * @param y 纵坐标
     */
    setPosition(x: number, y: number): void;

    /**
     * 设置勇士朝向
     * @param direction 勇士朝向，不填表示顺时针旋转
     */
    turn(direction?: FaceDirection): void;

    /**
     * 开始勇士移动，在移动前必须先调用此方法将勇士切换为移动状态
     */
    startMove(): void;

    /**
     * 移动勇士。能否移动的逻辑暂时不在这里，目前作为过渡作用，仅服务于渲染
     * @param dir 移动方向
     * @param time 移动动画时长，默认 100ms
     * @returns 移动的 `Promise`，当相关的移动动画结束后兑现
     */
    move(dir: FaceDirection, time?: number): Promise<void>;

    /**
     * 结束勇士移动
     * @returns 当移动动画结束后兑现的 `Promise`
     */
    endMove(): Promise<void>;

    /**
     * 跳跃勇士至目标点
     * @param x 目标点横坐标
     * @param y 目标点纵坐标
     * @param time 跳跃动画时长，默认 500ms
     * @param waitFollower 是否等待跟随者跳跃完毕，默认不等待
     * @returns 跳跃的 `Promise`，当相关的移动动画结束后兑现
     */
    jumpHero(
        x: number,
        y: number,
        time?: number,
        waitFollower?: boolean
    ): Promise<void>;

    /**
     * 设置勇士图片
     * @param image 图片 id
     */
    setImage(image: ImageIds): void;

    /**
     * 设置勇士的不透明度
     * @param alpha 不透明度
     */
    setAlpha(alpha: number): void;

    /**
     * 添加一个跟随者
     * @param follower 跟随者的图块数字
     * @param identifier 跟随者的标识符，可以用来移除
     */
    addFollower(follower: number, identifier: string): void;

    /**
     * 移除指定的跟随者
     * @param identifier 跟随者的标识符
     * @param animate 填 `true` 的话，如果删除了中间的跟随者，后续跟随者会使用移动动画移动到下一格，否则瞬移至下一格
     */
    removeFollower(identifier: string, animate?: boolean): void;

    /**
     * 移除所有跟随者
     */
    removeAllFollowers(): void;

    /**
     * 设置指定跟随者的不透明度
     * @param identifier 跟随者标识符
     * @param alpha 跟随者不透明度
     */
    setFollowerAlpha(identifier: string, alpha: number): void;
}

//#endregion

//#region 勇士状态

export interface IHeroState<THero> {
    /** 勇士移动对象 */
    readonly mover: IHeroMover;
    /** 勇士属性对象 */
    readonly attribute: IReadonlyHeroAttribute<THero>;

    /**
     * 绑定勇士移动对象
     * @param mover 勇士移动对象
     */
    attachMover(mover: IHeroMover): void;

    /**
     * 获取勇士移动对象
     */
    getHeroMover(): IHeroMover;

    /**
     * 绑定勇士属性对象
     * @param attribute 勇士属性对象
     */
    attachAttribute(attribute: IHeroAttribute<THero>): void;

    /**
     * 获取可修改勇士对象
     */
    getModifiableAttribute(): IHeroAttribute<THero>;

    /**
     * 获取只读勇士对象
     */
    getAttribute(): IReadonlyHeroAttribute<THero>;

    /**
     * 获取独立勇士属性对象，修改此对象不会影响勇士本身的属性
     */
    getIsolatedAttribute(): IHeroAttribute<THero>;
}

//#endregion
