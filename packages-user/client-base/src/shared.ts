import { ElementLocator, Font } from '@motajs/render';

//#region 地图

/** 每个格子的默认宽度，现阶段用处不大 */
export const CELL_WIDTH = 32;
/** 每个格子的默认高度，现阶段用处不大 */
export const CELL_HEIGHT = 32;
/** 每个格子的宽高 */
export const CELL_SIZE = 32;
/** 地图格子宽度，此处仅影响画面，不影响游戏内逻辑，游戏内逻辑地图大小请在 core.js 中修改 */
export const MAP_BLOCK_WIDTH = 13;
/** 地图格子高度，此处仅影响画面，不影响游戏内逻辑，游戏内逻辑地图大小请在 core.js 中修改 */
export const MAP_BLOCK_HEIGHT = 13;
/** 地图像素宽度 */
export const MAP_WIDTH = CELL_SIZE * MAP_BLOCK_WIDTH;
/** 地图像素高度 */
export const MAP_HEIGHT = CELL_SIZE * MAP_BLOCK_HEIGHT;
/**
 * 动态内容预留，不明白含义的话不要动。地图上所有正在移动的图块称为动态内容，这些内容的数量无法预测，因此需要预留数组大小，
 * 如果不够再临时扩充。如果你的塔中有大量的移动操作，可以适当提高此值，避免频繁的内存扩充行为，可以一定程度上提高性能表现。
 */
export const DYNAMIC_RESERVE = 16;
/**
 * 移动图块容忍度，不明白含义的话不要动。如果移动图块的数量长期小于当前预留数量，那么将会降低预留数量，提升性能表现。
 * 调整此值可以调整频率，值越大，越不容易因为数量小于预留数量而减小预留。
 */
export const MOVING_TOLERANCE = 60;
/** 开关门动画的动画时长 */
export const DOOR_ANIMATE_INTERVAL = 50;

//#endregion
