import { MAIN_HEIGHT, MAIN_WIDTH } from './ui';

// 本文件是游戏的底层核心配置，如果不懂的话千万不要动

//#region 常规配置

/** 渲染端的渲染画布，不懂的话就不要动 */
export const RENDER_CANVAS = '#render-main';
/** 渲染端核心配置对象，不懂的话就不要动 */
export const CLIENT_CORE_URL = 'content/client.jsonc';
/** Tileset 预留数量，用于控制最大允许注册多少个普通图块，例如填写 10000 表示最大 10000 个普通图块，不懂的话不要动 */
export const TILESET_RESERVE = 100000;
/** 一个 Tileset 的图块数量单位，例如 10000 时表示一个 Tileset 会占用 10000 或 10000 的倍数个图块，不懂的话不要动 */
export const TILESET_UNIT = 10000;

// 关于渲染的其他配置可在 ./ui/constant.ts 中修改，
// 关于高级渲染设置，请参考样板使用文档，那里会进行更详细的讲解。
/** 渲染器的渲染宽度，默认为 UI 配置中的整体宽度 */
export const RENDER_WIDTH = MAIN_WIDTH;
/** 渲染器的渲染高度，默认为 UI 配置中的整体高度 */
export const RENDER_HEIGHT = MAIN_HEIGHT;

//#endregion

//#region 调试配置

/**
 * 渲染器的激励源是否使用变速器，使用后可以通过 {@link VARIATOR_DEBUG_SPEED} 调整激励源速度，
 * 从而调整动画等内容的执行速度，方便调试
 */
export const DEBUG_VARIATOR = false;
/** 当使用变速器作为激励源调试时，变速器的速度 */
export const VARIATOR_DEBUG_SPEED = 0.2;
/**
 * 是否使用分频器调试，使用后可以通过 {@link DIVIDER_DEBUG_DIVIDER} 调整分配比例，
 * 降低画面刷新频率及每帧执行函数的执行频率，方便调试
 */
export const DEBUG_DIVIDER = false;
/** 当使用分频器调试时，分频比例 */
export const DIVIDER_DEBUG_DIVIDER = 60;

//#endregion
