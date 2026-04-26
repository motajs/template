import { IHeroAttr } from './hero';

//#region 地图相关

/** 每个地图的默认宽度 */
export const TILE_WIDTH = 13;
/** 每个地图的默认高度 */
export const TILE_HEIGHT = 13;

// 图层纵深，这些纵深与渲染系统的纵深没有关系，仅在地图图层之间生效

/** 背景层纵深 */
export const BG_ZINDEX = 0;
/** 背景层2纵深 */
export const BG2_ZINDEX = 10;
/** 事件层纵深 */
export const EVENT_ZINDEX = 20;
/** 前景层纵深 */
export const FG_ZINDEX = 30;
/** 前景层2纵深 */
export const FG2_ZINDEX = 40;

//#endregion

//#region 勇士相关

/** 默认的勇士图片 */
export const DEFAULT_HERO_IMAGE: ImageIds = 'hero.png';

/** 勇士的初始属性，数值填多少目前都无所谓，因为最终会从旧样板读取，但是必须得填 */
export const HERO_DEFAULT_ATTRIBUTE: IHeroAttr = {
    name: '',
    hp: 1,
    hpmax: 0,
    atk: 0,
    def: 0,
    mdef: 0,
    mana: 0,
    manamax: 0,
    money: 0,
    exp: 0
};

//#endregion
