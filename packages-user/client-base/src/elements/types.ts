import { IRenderItem, SizedCanvasImageSource } from '@motajs/render';

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
