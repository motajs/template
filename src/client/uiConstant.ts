import { ElementLocator, Font } from '@motajs/render';

// 本文件为 UI 配置文件，你可以修改下面的每个常量来控制 UI 的显示参数，每个常量都有注释说明

//#region 地图配置

/** 每个格子的宽度 */
export const CELL_WIDTH = 32;
/** 每个格子的高度 */
export const CELL_HEIGHT = 32;
/** 地图画面的格子宽度，即在正常情况下，游戏画面横向会显示多少格子，同时作为分块宽度使用 */
export const MAP_BLOCK_WIDTH = 13;
/** 地图画面的格子高度，即在正常情况下，游戏画面纵向会显示多少格子，同时作为分块宽度使用 */
export const MAP_BLOCK_HEIGHT = 13;
/** 地图像素宽度 */
export const MAP_WIDTH = CELL_WIDTH * MAP_BLOCK_WIDTH;
/** 地图像素高度 */
export const MAP_HEIGHT = CELL_HEIGHT * MAP_BLOCK_HEIGHT;
/** 地图宽度的一半 */
export const HALF_MAP_WIDTH = MAP_WIDTH / 2;
/** 地图高度的一半 */
export const HALF_MAP_HEIGHT = MAP_HEIGHT / 2;

//#endregion

//#region 状态栏配置

/** 状态栏像素宽度 */
export const STATUS_BAR_WIDTH = 180;
/** 状态栏像素高度 */
export const STATUS_BAR_HEIGHT = 32 * MAP_BLOCK_HEIGHT;
/** 右侧状态栏的横坐标 */
export const RIGHT_STATUS_POS = STATUS_BAR_WIDTH + MAP_WIDTH;
/** 是否启用右侧状态栏 */
export const ENABLE_RIGHT_STATUS_BAR = false;
/** 状态栏数量，启用右侧状态栏为两个，不启用为一个 */
export const STATUS_BAR_COUNT = ENABLE_RIGHT_STATUS_BAR ? 2 : 1;
/** 状态栏宽度的一半 */
export const HALF_STATUS_WIDTH = STATUS_BAR_WIDTH / 2;

//#endregion

//#region 游戏画面

/** 游戏画面像素宽度，宽=地图宽度+状态栏宽度*状态栏数量 */
export const MAIN_WIDTH = MAP_WIDTH + STATUS_BAR_WIDTH * STATUS_BAR_COUNT;
/** 游戏画面像素高度 */
export const MAIN_HEIGHT = MAP_HEIGHT;
/** 游戏画面宽度的一半 */
export const HALF_WIDTH = MAIN_WIDTH / 2;
/** 游戏画面高度的一半 */
export const HALF_HEIGHT = MAIN_HEIGHT / 2;
/** 全屏显示的 loc */
export const FULL_LOC: ElementLocator = [0, 0, MAIN_WIDTH, MAIN_HEIGHT];
/** 居中显示的 loc */
export const CENTER_LOC: ElementLocator = [HALF_WIDTH, HALF_HEIGHT];

//#endregion

//#region 通用配置

/** 弹框的宽度，使用在内置 UI 与组件中，包括确认框、选择框、等待框等 */
export const POP_BOX_WIDTH = MAP_WIDTH / 2;
/** 默认字体 */
export const DEFAULT_FONT = new Font('Verdana', 16);

//#endregion
