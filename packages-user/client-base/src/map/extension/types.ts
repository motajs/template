import { ITexture } from '@motajs/render';
import { IFaceManager } from '@user/data-common';
import { IHeroLocation, IMapLayer } from '@user/data-base';

export interface IMapExtensionManager {
    /** 勇士状态至勇士渲染器的映射 */
    readonly heroMap: Map<IHeroLocation, IMapHeroRenderer>;
    /** 地图图层到门渲染器的映射 */
    readonly doorMap: Map<IMapLayer, IMapDoorRenderer>;

    /**
     * 添加勇士渲染拓展
     * @param state 勇士状态
     * @param layer 勇士所在图层
     */
    addHero(
        state: IHeroLocation,
        layer: IMapLayer,
        faceManager: IFaceManager
    ): IMapHeroRenderer | null;

    /**
     * 移除勇士渲染拓展
     * @param state 勇士状态
     */
    removeHero(state: IHeroLocation): void;

    /**
     * 添加开门动画拓展
     */
    addDoor(layer: IMapLayer): IMapDoorRenderer | null;

    /**
     * 移除开门动画拓展
     */
    removeDoor(layer: IMapLayer): void;

    /**
     * 摧毁这个拓展管理对象，释放相关资源
     */
    destroy(): void;
}

export interface IMapHeroRenderer {
    /**
     * 设置勇士图片
     * @param image 勇士使用的图片
     */
    setImage(image: ITexture): void;

    /**
     * 添加跟随者
     * @param image 跟随者图块数字
     * @param id 跟随者的 id，用于删除操作
     */
    addFollower(image: number, id: string): void;

    /**
     * 取消跟随者
     * @param follower 跟随者的 id
     * @param animate 填 `true` 的话，如果删除了中间的跟随者，后续跟随者会使用移动动画移动到下一格，否则瞬移至下一格
     */
    removeFollower(follower: string, animate: boolean): Promise<void>;

    /**
     * 移除所有跟随者
     */
    removeAllFollowers(): void;

    /**
     * 设置勇士不透明度
     * @param alpha 不透明度
     */
    setAlpha(alpha: number): void;

    /**
     * 设置跟随者的不透明度
     * @param identifier 跟随者标识符
     * @param alpha 跟随者不透明度
     */
    setFollowerAlpha(identifier: string, alpha: number): void;

    /**
     * 摧毁这个勇士渲染拓展，释放相关资源
     */
    destroy(): void;
}

export interface IMapDoorRenderer {
    /**
     * 开启指定位置的门，播放开门动画
     * @param x 门横坐标
     * @param y 门纵坐标
     */
    openDoor(x: number, y: number): Promise<void>;

    /**
     * 在指定位置执行关门动画
     * @param num 门图块数字
     * @param x 门横坐标
     * @param y 门纵坐标
     */
    closeDoor(num: number, x: number, y: number): Promise<void>;

    /**
     * 设置开关门动画两帧之间的间隔
     * @param interval 开门动画间隔
     */
    setAnimateInterval(interval: number): void;

    /**
     * 摧毁这个门动画拓展，释放相关资源
     */
    destroy(): void;
}
