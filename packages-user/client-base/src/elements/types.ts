import { IRenderItem, SizedCanvasImageSource } from '@motajs/render';

export interface IMotaIcon extends IRenderItem {
    /** 图标id */
    readonly icon: AllNumbers;
    /** 渲染动画的第几帧 */
    readonly frame: number;
    /** 是否启用动画 */
    readonly animate: boolean;
    /** 当前动画帧数，如果没有启用动画则为 -1 */
    readonly nowFrame: number;
    /** 当前图标的动画速度，每多长时间切换至下一帧，单位毫秒 */
    readonly frameSpeed: number;

    /**
     * 设置图标
     * @param id 图标id
     */
    setIcon(id: AllIdsWithNone | AllNumbers): void;

    /**
     * 设置当前图标的帧动画速度，单位毫秒
     * @param speed 帧动画速度
     */
    setFrameSpeed(speed: number): void;

    /**
     * 设置当前图标是否启用帧动画
     * @param animate 是否启用帧动画
     */
    setAnimateStatus(animate: boolean): void;

    /**
     * 设置图标显示第几帧，如果传入负数视为启用帧动画
     * @param frame 显示图标的第几帧
     */
    setFrame(frame: number): void;
}

export interface IMotaWinskin extends IRenderItem {
    /** winskin 图片源 */
    readonly image: SizedCanvasImageSource | null;
    /** 边框尺寸 */
    readonly borderSize: number;
    /** winskin 图片名称，如果不是使用名称设置的图片的话，此值为空字符串 */
    readonly imageName: string;

    /**
     * 设置winskin图片
     * @param image winskin图片
     */
    setImage(image: SizedCanvasImageSource): void;

    /**
     * 通过图片名称设置winskin
     * @param name 图片名称
     */
    setImageByName(name: ImageIds): void;

    /**
     * 设置边框大小
     * @param size 边框大小
     */
    setBorderSize(size: number): void;
}
