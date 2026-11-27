import { Texture } from '@motajs/render';
import { TileType } from '@user/data-common';
import type {
    IMaterialFramedData,
    ITextureManager
} from '../../../../../packages-user/client-base/src/material';

// 演示用图标：只在 demo 内生成，正文不展示生成方式
function createIconTexture(ink: string, accent: string): Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;

    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = ink;
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(8, 8, 5, 0, Math.PI * 2);
    ctx.fill();

    return new Texture(canvas);
}

function createTile(texture: Texture): IMaterialFramedData {
    return {
        texture,
        tileType: TileType.Tileset,
        frames: 1,
        // 单帧图标：offset 同时是帧宽，TextContent 用它取整张源图
        offset: texture.width,
        defaultFrame: 0
    };
}

const ICONS: Record<number, IMaterialFramedData> = {
    1: createTile(createIconTexture('#f2b84b', '#141a22')),
    2: createTile(createIconTexture('#7ee787', '#141a22'))
};

const ALIASES: Record<string, number> = {
    demo_star: 2
};

function getTile(num: number) {
    return ICONS[num] ?? null;
}

function getTileByAlias(alias: string) {
    const num = ALIASES[alias];
    return num === undefined ? null : ICONS[num];
}

export const demoMaterials = {
    getTile,
    getTileByAlias,
    tile(tile: number | string) {
        return typeof tile === 'number' ? getTile(tile) : getTileByAlias(tile);
    }
} as unknown as ITextureManager;
