import {
    defineCommonSerializableSpecial,
    defineNonePropertySpecial,
    SpecialCreation
} from '@user/data-base';
import { IEnemyAttr } from '@user/data-common';
import { IStateSystem } from '@user/data-system';

// 重要！！！下面这一行的注释不要删
//#region 复合属性值类型

// 对象参数名称必须命名为 ISpecial{code}Value，接口前必须添加如下格式的注释，否则不会被编辑器识别
// /** {code} - {name} */

/** 9 - 吸血 */
export interface ISpecial9Value {
    /** 吸血比例 */
    vampire: number;
    /** 是否加到自身生命值上 */
    add: boolean;
}

/** 13 - 领域 */
export interface ISpecial13Value {
    /** 领域伤害值 */
    zone: number;
    /** 矩形领域（true）还是十字形领域（false），当范围大于 1 时，十字型领域采用曼哈顿距离计算 */
    zoneSquare: boolean;
    /** 领域范围值 */
    range: number;
}

/** 21 - 退化 */
export interface ISpecial21Value {
    /** 攻击下降值 */
    atkValue: number;
    /** 防御下降值 */
    defValue: number;
}

export interface ISpecial23Value {
    /** 光环范围值 */
    haloRange: number;
    /** 光环是矩形范围（true）还是十字型范围（false），当范围大于 1 时，十字型范围采用曼哈顿距离计算 */
    haloSquare: boolean;
    /** 生命值增加比例 */
    hpBuff: number;
    /** 攻击力增加比例 */
    atkBuff: number;
    /** 防御力增加比例 */
    defBuff: number;
}

// 重要！！！下面这一行的注释不要删
//#endregion

// TODO: 注释需要更新
/**
 * 注册所有怪物特殊属性到 enemyManager
 *
 * 属性实现位置一览（'./'表示当前文件夹  '../'表示上一级文件夹）：
 * 1. 调参类属性 | 仅影响战斗过程的属性：./damage.ts calDamageWithTurn 函数
 * 2. 地图伤害：./damage.ts DamageEnemy.calMapDamage 方法
 * 3. 光环属性：./damage.ts DamageEnemy.provideHalo 方法
 * 4. 中毒的每步效果：../state/move.ts HeroMover.onStepEnd 方法
 * 5. 中毒的瞬移效果：还在脚本编辑的 moveDirectly
 * 6. 衰弱效果：../state/hero.ts getHeroStatusOf 方法
 * 7. 重生属性：还在脚本编辑的 changingFloor
 */
export function createSpecials(
    state: IStateSystem
): ReadonlyMap<number, SpecialCreation<any, IEnemyAttr>> {
    const hero = state.hero;

    const map = new Map<number, SpecialCreation<any, IEnemyAttr>>();

    // 注意，不需要参数的特殊属性，如先攻、魔攻、坚固这些纯机制，
    // 不需要一个数值来描述的特殊属性，使用 defineNonePropertySpecial 定义。
    // 需要参数的特殊属性，如连击、领域、破甲这些需要一个或多个数值来描述的特殊属性，
    // 使用 defineCommonSerializableSpecial 定义。
    // 特殊属性的参数可以填写数值、字符串，也可以填写对象，参考吸血、领域、退化、光环的写法。

    // 注意，每个属性定义前必须添加注释 // {code} - {name}，这会作为编辑器识别的匹配模式。

    // 重要！！！下面这一行的注释不要删
    //#region 属性定义

    // 0 - 空
    map.set(
        0,
        defineNonePropertySpecial(0, {
            name: '空',
            desc: '空',
            color: '#FFF'
        })
    );

    // 1 - 先攻
    map.set(
        1,
        defineNonePropertySpecial(1, {
            name: '先攻',
            desc: '怪物首先攻击。',
            color: '#FC3'
        })
    );

    // 2 - 魔攻
    map.set(
        2,
        defineNonePropertySpecial(2, {
            name: '魔攻',
            desc: '怪物攻击无视勇士的防御。',
            color: '#BBB0FF'
        })
    );

    // 3 - 坚固
    map.set(
        3,
        defineNonePropertySpecial(3, {
            name: '坚固',
            desc: '怪物防御不小于勇士攻击-1。',
            color: '#C0B088'
        })
    );

    // 4 - n连击
    map.set(
        4,
        defineCommonSerializableSpecial(4, 2, {
            name: special => `${special.value}连击`,
            desc: special => `怪物每回合攻击${special.value}次。`,
            color: '#FE7'
        })
    );

    // 5 - 破甲
    map.set(
        5,
        defineCommonSerializableSpecial(5, 0, {
            name: '破甲',
            desc: special =>
                `战斗前，附加角色防御的${special.value}%作为伤害。`,
            color: '#88C0FF'
        })
    );

    // 6 - 反击
    map.set(
        6,
        defineCommonSerializableSpecial(6, 0, {
            name: '反击',
            desc: special =>
                `战斗时，怪物每回合附加角色攻击的${special.value}%作为伤害，无视角色防御。`,
            color: '#FA4'
        })
    );

    // 7 - 净化
    map.set(
        7,
        defineCommonSerializableSpecial(7, 0, {
            name: '净化',
            desc: special =>
                `战斗前，怪物附加角色护盾的${special.value}倍作为伤害。`,
            color: '#80EED6'
        })
    );

    // 8 - 模仿
    map.set(
        8,
        defineNonePropertySpecial(8, {
            name: '模仿',
            desc: '怪物的攻防与勇士相同。',
            color: '#B0C0DD'
        })
    );

    // 9 - 吸血
    map.set(
        9,
        defineCommonSerializableSpecial<ISpecial9Value>(
            9,
            { vampire: 0, add: false },
            {
                name: '吸血',
                desc: special => {
                    const { vampire, add } = special.value;
                    const attr = hero.getAttribute();
                    return (
                        `战斗前，怪物首先吸取角色的${vampire}%生命` +
                        `（约${Math.floor((vampire / 100) * attr.getFinalAttribute('hp'))}点）作为伤害` +
                        (add ? `，并把伤害数值加到自身生命上。` : `。`)
                    );
                },
                color: '#DD4448'
            }
        )
    );

    // 10 - 中毒
    map.set(
        10,
        defineCommonSerializableSpecial(10, 0, {
            name: '中毒',
            desc: special =>
                `战斗后，角色陷入中毒状态，每一步损失生命${special.value}点，多次触发时，${state.flags.getFieldValueDefaults('poisonAdd', false) ? '与已有中毒值叠加' : '取最高值'}。`,
            color: '#9E8'
        })
    );

    // 11 - 衰弱
    map.set(
        11,
        defineCommonSerializableSpecial(11, 0, {
            name: '衰弱',
            desc: special => {
                const weak = special.value;
                const suffix = '，多次触发时取最高值。';
                if (weak < 1) {
                    return (
                        `战斗后，角色陷入衰弱状态，攻防暂时下降${Math.floor(weak * 100)}%` +
                        suffix
                    );
                } else {
                    return (
                        `战斗后，角色陷入衰弱状态，攻防暂时下降${weak}点` +
                        suffix
                    );
                }
            },
            color: '#F0BBCC'
        })
    );

    // 12 - 诅咒
    map.set(
        12,
        defineNonePropertySpecial(12, {
            name: '诅咒',
            desc: '战斗后，角色陷入诅咒状态，战斗无法获得金币和经验。',
            color: '#BBEEF0'
        })
    );

    // 13 - 领域
    map.set(
        13,
        defineCommonSerializableSpecial<ISpecial13Value>(
            13,
            { zone: 0, zoneSquare: false, range: 1 },
            {
                name: '领域',
                desc: special => {
                    const { zone, zoneSquare, range } = special.value;
                    return `经过怪物周围${zoneSquare ? '九宫格' : '十字'}范围内${range}格时自动减生命${zone}点。`;
                },
                color: '#C677DD'
            }
        )
    );

    // 14 - 夹击
    map.set(
        14,
        defineNonePropertySpecial(14, {
            name: '夹击',
            desc: '经过两只相同的怪物中间，角色生命值变成一半。',
            color: '#B9E'
        })
    );

    // 15 - 仇恨
    map.set(
        15,
        defineNonePropertySpecial(15, {
            name: '仇恨',
            desc: `战斗前，怪物附加之前积累的仇恨值作为伤害；战斗后，释放一半的仇恨值。（每杀死一个怪物获得${state.flags.getFieldValueDefaults('hatred', 1)}点仇恨值）。`,
            color: '#B0B666'
        })
    );

    // 16 - 阻击
    map.set(
        16,
        defineCommonSerializableSpecial(16, 0, {
            name: '阻击',
            desc: special =>
                `经过怪物十字范围内时怪物后退一格，同时对勇士造成${special.value}点伤害。`,
            color: '#8888E6'
        })
    );

    // 17 - 自爆
    map.set(
        17,
        defineNonePropertySpecial(17, {
            name: '自爆',
            desc: '战斗后角色的生命值变成1。',
            color: '#F66'
        })
    );

    // 18 - 无敌
    map.set(
        18,
        defineNonePropertySpecial(18, {
            name: '无敌',
            desc: '角色无法打败怪物，除非拥有十字架。',
            color: '#AAA'
        })
    );

    // 19 - 退化
    map.set(
        19,
        defineCommonSerializableSpecial<ISpecial21Value>(
            19,
            { atkValue: 0, defValue: 0 },
            {
                name: '退化',
                desc: special => {
                    const { atkValue, defValue } = special.value;
                    return `战斗后角色永久下降${atkValue}点攻击和${defValue}点防御。`;
                },
                color: '#FFF'
            }
        )
    );

    // 20 - 固伤
    map.set(
        20,
        defineCommonSerializableSpecial(20, 0, {
            name: '固伤',
            desc: special =>
                `战斗前，怪物对角色造成${special.value}点固定伤害，未开启负伤时无视角色护盾。`,
            color: '#F97'
        })
    );

    // 21 - 重生
    map.set(
        21,
        defineNonePropertySpecial(21, {
            name: '重生',
            desc: '怪物被击败后，角色转换楼层则怪物将再次出现。',
            color: '#A0E0FF'
        })
    );

    // 22 - 激光
    map.set(
        22,
        defineCommonSerializableSpecial(22, 0, {
            name: '激光',
            desc: special =>
                `经过怪物同行或同列时自动减生命${special.value}点。`,
            color: '#D0A0DD'
        })
    );

    // 23 - 光环
    map.set(
        23,
        defineCommonSerializableSpecial<ISpecial23Value>(
            23,
            {
                haloRange: 0,
                haloSquare: false,
                hpBuff: 0,
                atkBuff: 0,
                defBuff: 0
            },
            {
                name: '光环',
                desc: special => {
                    const { haloRange, haloSquare, hpBuff, atkBuff, defBuff } =
                        special.value;
                    let str = '';
                    if (haloRange > 0) {
                        if (haloSquare) {
                            str += '对于该怪物九宫格';
                        } else {
                            str += '对于该怪物十字';
                        }
                        str += `${haloRange}格范围内所有怪物`;
                    } else {
                        str += '同楼层所有怪物';
                    }
                    if (hpBuff) {
                        str += `，生命提升${hpBuff}%`;
                    }
                    if (atkBuff) {
                        str += `，攻击提升${atkBuff}%`;
                    }
                    if (defBuff) {
                        str += `，防御提升${defBuff}%`;
                    }
                    str += `，线性叠加。`;
                    return str;
                },
                color: '#E6E099'
            }
        )
    );

    // 24 - 支援
    map.set(
        24,
        defineNonePropertySpecial(24, {
            name: '支援',
            desc: '当周围一圈的怪物受到攻击时将上前支援，并组成小队战斗。',
            color: '#77C0B6'
        })
    );

    // 25 - 捕捉
    map.set(
        25,
        defineNonePropertySpecial(27, {
            name: '捕捉',
            desc: '当走到怪物十字范围内时会进行强制战斗。',
            color: '#C0DDBB'
        })
    );

    // TODO: 26 - 特殊光环

    // 重要！！！下面这一行的注释不要删
    //#endregion

    return map;
}
