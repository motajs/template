import { IMapLayer } from '@user/data-base';
import {
    IBlockStatus,
    IMapRenderer,
    IMapVertexStatus,
    IOverlayBlock
} from './types';
import { IMaterialFramedData } from '../material';

//#region 图块状态

export class StaticBlockStatus implements IBlockStatus {
    /**
     * @param layer 图层对象
     * @param vertex 顶点数组生成器对象
     * @param x 图块横坐标
     * @param y 图块纵坐标
     */
    constructor(
        readonly layer: IMapLayer,
        readonly vertex: IMapVertexStatus,
        readonly x: number,
        readonly y: number
    ) {}

    setAlpha(alpha: number): void {
        this.vertex.setStaticAlpha(this.layer, this.x, this.y, alpha);
    }

    getAlpha(): number {
        return this.vertex.getStaticAlpha(this.layer, this.x, this.y);
    }

    useGlobalFrame(): void {
        this.vertex.setStaticFrame(this.layer, this.x, this.y, -1);
    }

    useSpecifiedFrame(frame: number): void {
        this.vertex.setStaticFrame(this.layer, this.x, this.y, frame);
    }

    getFrame(): number {
        return this.vertex.getStaticFrame(this.layer, this.x, this.y);
    }
}

//#endregion

//#region 覆盖层图块

export class OverlayBlock implements IOverlayBlock {
    readonly layer: IMapLayer;
    readonly priority: number;
    readonly index: number;
    readonly renderer: IMapRenderer;
    texture: IMaterialFramedData;
    readonly tile: number;
    x: number = 0;
    y: number = 0;

    constructor(
        layer: IMapLayer,
        priority: number,
        index: number,
        texture: IMaterialFramedData,
        tile: number,
        renderer: IMapRenderer
    ) {
        this.layer = layer;
        this.priority = priority;
        this.index = index;
        this.texture = texture;
        this.tile = tile;
        this.renderer = renderer;
    }

    setPos(x: number, y: number): void {
        this.x = x;
        this.y = y;
        // TODO: 通知更新
        this.renderer.vertex.updateOverlay(this, false);
    }

    setTexture(texture: IMaterialFramedData): void {
        if (texture === this.texture) return;
        this.texture = texture;
        this.renderer.vertex.updateOverlay(this, true);
    }

    setAlpha(alpha: number): void {
        this.renderer.vertex.setDynamicAlpha(this.index, alpha);
    }

    getAlpha(): number {
        return this.renderer.vertex.getDynamicAlpha(this.index);
    }

    useGlobalFrame(): void {
        this.renderer.vertex.setDynamicFrame(this.index, -1);
    }

    useSpecifiedFrame(frame: number): void {
        this.renderer.vertex.setDynamicFrame(this.index, frame);
    }

    getFrame(): number {
        return this.renderer.vertex.getDynamicFrame(this.index);
    }

    useDefaultFrame(): void {
        if (!this.renderer.manager.getTile(this.tile)) return;
        const defaultFrame = this.renderer.manager.getDefaultFrame(this.tile);
        this.useSpecifiedFrame(defaultFrame);
    }

    destroy(): void {
        this.renderer.deleteOverlayBlock(this);
    }

    toStatic(layer: IMapLayer, x: number, y: number): void {
        this.renderer.vertex.toStatic(this, layer, x, y);
    }
}

//#endregion
