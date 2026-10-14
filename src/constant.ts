import { FaceGroup } from '@user/data-common';

// 本文件是游戏的底层核心配置，如果不懂的话千万不要动

//#region 数据端配置

/** 数据端核心配置对象，不懂的话就不要动 */
export const CORE_URL = 'content/core.jsonc';
/** 勇士的默认朝向组，用于控制勇士的移动，不懂的话就不要动 */
export const HERO_FACE = FaceGroup.Dir8;

//#endregion

//#region 渲染端配置

/** 渲染端核心配置对象，不懂的话就不要动 */
export const CLIENT_CORE_URL = 'content/client.jsonc';
/** Tileset 预留数量，用于控制最大允许注册多少个普通图块，例如填写 10000 表示最大 10000 个普通图块，不懂的话不要动 */
export const TILESET_RESERVE = 100000;
/** 一个 Tileset 的图块数量单位，例如 10000 时表示一个 Tileset 会占用 10000 或 10000 的倍数个图块，不懂的话不要动 */
export const TILESET_UNIT = 10000;

//#endregion
