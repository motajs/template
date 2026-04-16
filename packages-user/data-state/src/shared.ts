import { IHeroAttributeObject } from './hero';

/** 每个地图的默认宽度 */
export const TILE_WIDTH = 13;
/** 每个地图的默认高度 */
export const TILE_HEIGHT = 13;

//#region 勇士相关

/** 默认的勇士图片 */
export const DEFAULT_HERO_IMAGE: ImageIds = 'hero.png';

/** 勇士的初始属性，数值填多少目前都无所谓，因为最终会从旧样板读取，但是必须得填 */
export const HERO_DEFAULT_ATTRIBUTE: IHeroAttributeObject = {
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
