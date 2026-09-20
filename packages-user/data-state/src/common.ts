import { IHeroAttr } from '@user/data-common';

//#region 数据端主配置

export interface ICoreStateContentDefaultConfig {
    /** 怪物默认对象路径 */
    readonly enemyDefault: string;
    /** 道具默认对象路径 */
    readonly itemDefault: string;
    /** 地图默认对象路径 */
    readonly mapDefault: string;
    /** 图块默认对象路径 */
    readonly tileDefault: string;
}

export interface ICoreStateContentConfig {
    /** 配置的默认对象配置路径 */
    readonly defaults: ICoreStateContentDefaultConfig;
    /** 地图文件夹路径 */
    readonly mapsDir: string;
    /** 需要加载的地图列表文件的文件路径 */
    readonly mapListDir: string;
    /** 怪物数据文件路径 */
    readonly enemyDir: string;
    /** 道具数据文件路径 */
    readonly itemDir: string;
    /** 道具效果文件路径 */
    readonly itemEffectDir: string;
    /** 图库数据文件路径 */
    readonly tileDir: string;
}

export interface ICoreStateHeroInitConfig<T> {
    /** 勇士的初始横坐标 */
    readonly x: number;
    /** 勇士的初始纵坐标 */
    readonly y: number;
    /** 勇士初始所在楼层 */
    readonly floorId: string;
    /** 勇士的初始装备栏 */
    readonly equipSlots: string[];
    /** 勇士的初始属性 */
    readonly attribute: Readonly<T>;
}

export interface ICoreStateInitConfig {
    /** 初始事件 id，游戏开始时将在执行完毕此事件后正式开始 */
    readonly startEvent: string;
    /** 勇士初始状态，包含起始位置、初始属性等 */
    readonly hero: ICoreStateHeroInitConfig<IHeroAttr>;
}

export interface ICoreStateFlagConfig {
    /** 楼层传送是否要求在楼梯边才能使用 */
    readonly flyNearStair: boolean;
    /** 楼层传送是否为平面塔模式，即传送时会传送至上一次离开此位置的位置而非楼梯口 */
    readonly flyRecordLocation: boolean;
    /** 道具在首次拾取时是否显示其文字说明 */
    readonly itemHint: boolean;
    /** 是否启用负伤机制，开启后怪物总伤害可以变为负值 */
    readonly enableNegativeDamage: boolean;
    /** 是否限制夹击最高伤害为两夹击怪物中伤害最高者 */
    readonly betweenDamageMax: boolean;
    /** 是否启用轻按机制，即可以按下空格来拾取玩家四周的物品 */
    readonly enablePick: boolean;
    /** 若在寻路时需要穿过楼梯，是否允许穿越 */
    readonly ignoreChangeFLoor: boolean;
    /** 若继续前进会导致勇士受到地图伤害而死亡，是否允许前进 */
    readonly allowDeadZone: boolean;
    /** 是否允许点击瞬移 */
    readonly enableTeleport: boolean;
    /** 是否开启录像折叠，这可以使走路的录像大幅减少，但可能导致某些机制出错，可查看文档详细了解 */
    readonly enableRouteFolding: boolean;
    /** 是否开启瞬移合并机制，开启后，连续瞬移会在录像中合并为单次瞬移，但可能导致某些机制出错 */
    readonly enableTeleportMerge: boolean;
}

export interface ICoreStateCoreConfig {
    /** 游戏的唯一标识符 */
    readonly name: string;
    /** 呈现给玩家的游戏名称 */
    readonly title: string;
    /** 游戏版本号，仅呈现作用，对游戏本身没有任何影响 */
    readonly version: string;
    /** 游戏数据配置 */
    readonly content: ICoreStateContentConfig;
    /** 游戏的初始状态数据 */
    readonly init: ICoreStateInitConfig;
    /** 游戏的全局设置 */
    readonly flag: ICoreStateFlagConfig;
}

//#endregion
