import {
    defineCommonSerializableSpecial,
    defineNonePropertySpecial,
    IEnemyManager
} from '@user/data-base';
import { getHeroStatusOn } from '../legacy/hero';
import { IEnemyAttr } from './types';

//#region 复合属性值类型

export interface IVampireValue {
    vampire: number;
    add: boolean;
}

export interface IZoneValue {
    zone: number;
    zoneSquare: boolean;
    range: number;
}

export interface IDegradationValue {
    atkValue: number;
    defValue: number;
}

export interface IHaloValue {
    haloRange: number;
    haloSquare: boolean;
    hpBuff: number;
    atkBuff: number;
    defBuff: number;
}

//#endregion

/**
 * 注册所有怪物特殊属性到 enemyManager
 *
 * 属性实现位置一览（'./'表示当前文件夹  '../'表示上一级文件夹）：
 * 1. 调参类属性 | 仅影响战斗过程的属性：./damage.ts calDamageWithTurn 函数
 * 2. 地图伤害：./damage.ts DamageEnemy.calMapDamage 方法
 * 3. 光环属性：./damage.ts DamageEnemy.provideHalo 方法
 * 4. 仇恨 | 退化 等战后效果：packages-user/data-fallback/src/battle.ts 中的 afterBattle
 * 5. 中毒的每步效果：../state/move.ts HeroMover.onStepEnd 方法
 * 6. 中毒的瞬移效果：还在脚本编辑的 moveDirectly
 * 7. 衰弱效果：../state/hero.ts getHeroStatusOf 方法
 * 8. 重生属性：还在脚本编辑的 changingFloor
 * 9. 阻击 | 捕捉 的每步效果：packages-user/legacy-plugin-data/src/enemy/checkblock.ts
 */
export function registerSpecials(manager: IEnemyManager<IEnemyAttr>): void {
    manager.setAttributeDefaults('guard', new Set());

    // 0 - 空
    manager.registerSpecial(
        0,
        defineNonePropertySpecial(0, {
            getSpecialName: () => '空',
            getDescription: () => '空',
            fromLegacyEnemy: () => {}
        })
    );

    // 1 - 先攻
    manager.registerSpecial(
        1,
        defineNonePropertySpecial(1, {
            getSpecialName: () => '先攻',
            getDescription: () => '怪物首先攻击。',
            fromLegacyEnemy: () => {}
        })
    );

    // 2 - 魔攻
    manager.registerSpecial(
        2,
        defineNonePropertySpecial(2, {
            getSpecialName: () => '魔攻',
            getDescription: () => '怪物攻击无视勇士的防御。',
            fromLegacyEnemy: () => {}
        })
    );

    // 3 - 坚固
    manager.registerSpecial(
        3,
        defineNonePropertySpecial(3, {
            getSpecialName: () => '坚固',
            getDescription: () => '怪物防御不小于勇士攻击-1。',
            fromLegacyEnemy: () => {}
        })
    );

    // 4 - 2连击
    manager.registerSpecial(
        4,
        defineNonePropertySpecial(4, {
            getSpecialName: () => '2连击',
            getDescription: () => '怪物每回合攻击2次。',
            fromLegacyEnemy: () => {}
        })
    );

    // 5 - 3连击
    manager.registerSpecial(
        5,
        defineNonePropertySpecial(5, {
            getSpecialName: () => '3连击',
            getDescription: () => '怪物每回合攻击3次。',
            fromLegacyEnemy: () => {}
        })
    );

    // 6 - n连击
    manager.registerSpecial(
        6,
        defineCommonSerializableSpecial(6, 4, {
            getSpecialName: special => `${special.value}连击`,
            getDescription: special => `怪物每回合攻击${special.value}次。`,
            fromLegacyEnemy: enemy => enemy.n ?? 4
        })
    );

    // 7 - 破甲
    manager.registerSpecial(
        7,
        defineCommonSerializableSpecial(7, 0, {
            getSpecialName: () => '破甲',
            getDescription: special =>
                `战斗前，附加角色防御的${special.value || core.values.breakArmor}%作为伤害。`,
            fromLegacyEnemy: enemy => enemy.breakArmor ?? 0
        })
    );

    // 8 - 反击
    manager.registerSpecial(
        8,
        defineCommonSerializableSpecial(8, 0, {
            getSpecialName: () => '反击',
            getDescription: special =>
                `战斗时，怪物每回合附加角色攻击的${special.value || core.values.counterAttack}%作为伤害，无视角色防御。`,
            fromLegacyEnemy: enemy => enemy.counterAttack ?? 0
        })
    );

    // 9 - 净化
    manager.registerSpecial(
        9,
        defineCommonSerializableSpecial(9, 0, {
            getSpecialName: () => '净化',
            getDescription: special =>
                `战斗前，怪物附加角色护盾的${special.value || core.values.purify}倍作为伤害。`,
            fromLegacyEnemy: enemy => enemy.purify ?? 0
        })
    );

    // 10 - 模仿
    manager.registerSpecial(
        10,
        defineNonePropertySpecial(10, {
            getSpecialName: () => '模仿',
            getDescription: () => '怪物的攻防与勇士相同。',
            fromLegacyEnemy: () => {}
        })
    );

    // 11 - 吸血
    manager.registerSpecial(
        11,
        defineCommonSerializableSpecial<IVampireValue>(
            11,
            { vampire: 0, add: false },
            {
                getSpecialName: () => '吸血',
                getDescription: special => {
                    const { vampire, add } = special.value;
                    return (
                        `战斗前，怪物首先吸取角色的${vampire}%生命` +
                        `（约${Math.floor((vampire / 100) * getHeroStatusOn('hp'))}点）作为伤害` +
                        (add ? `，并把伤害数值加到自身生命上。` : `。`)
                    );
                },
                fromLegacyEnemy: enemy => ({
                    vampire: enemy.vampire ?? 0,
                    add: enemy.add ?? false
                })
            }
        )
    );

    // 12 - 中毒
    manager.registerSpecial(
        12,
        defineNonePropertySpecial(12, {
            getSpecialName: () => '中毒',
            getDescription: () =>
                `战斗后，角色陷入中毒状态，每一步损失生命${core.values.poisonDamage}点。`,
            fromLegacyEnemy: () => {}
        })
    );

    // 13 - 衰弱
    manager.registerSpecial(
        13,
        defineNonePropertySpecial(13, {
            getSpecialName: () => '衰弱',
            getDescription: () => {
                const weak = core.values.weakValue;
                if (weak < 1) {
                    return `战斗后，角色陷入衰弱状态，攻防暂时下降${Math.floor(weak * 100)}%`;
                } else {
                    return `战斗后，角色陷入衰弱状态，攻防暂时下降${weak}点`;
                }
            },
            fromLegacyEnemy: () => {}
        })
    );

    // 14 - 诅咒
    manager.registerSpecial(
        14,
        defineNonePropertySpecial(14, {
            getSpecialName: () => '诅咒',
            getDescription: () =>
                '战斗后，角色陷入诅咒状态，战斗无法获得金币和经验。',
            fromLegacyEnemy: () => {}
        })
    );

    // 15 - 领域
    manager.registerSpecial(
        15,
        defineCommonSerializableSpecial<IZoneValue>(
            15,
            { zone: 0, zoneSquare: false, range: 1 },
            {
                getSpecialName: () => '领域',
                getDescription: special => {
                    const { zone, zoneSquare, range } = special.value;
                    return `经过怪物周围${zoneSquare ? '九宫格' : '十字'}范围内${range}格时自动减生命${zone}点。`;
                },
                fromLegacyEnemy: enemy => ({
                    zone: enemy.zone ?? 0,
                    zoneSquare: enemy.zoneSquare ?? false,
                    range: enemy.range ?? 1
                })
            }
        )
    );

    // 16 - 夹击
    manager.registerSpecial(
        16,
        defineNonePropertySpecial(16, {
            getSpecialName: () => '夹击',
            getDescription: () =>
                '经过两只相同的怪物中间，角色生命值变成一半。',
            fromLegacyEnemy: () => {}
        })
    );

    // 17 - 仇恨
    manager.registerSpecial(
        17,
        defineNonePropertySpecial(17, {
            getSpecialName: () => '仇恨',
            getDescription: () =>
                `战斗前，怪物附加之前积累的仇恨值作为伤害；战斗后，释放一半的仇恨值。（每杀死一个怪物获得${core.values.hatred}点仇恨值）。`,
            fromLegacyEnemy: () => {}
        })
    );

    // 18 - 阻击
    manager.registerSpecial(
        18,
        defineCommonSerializableSpecial(18, 0, {
            getSpecialName: () => '阻击',
            getDescription: special =>
                `经过怪物十字范围内时怪物后退一格，同时对勇士造成${special.value}点伤害。`,
            fromLegacyEnemy: enemy => enemy.repulse ?? 0
        })
    );

    // 19 - 自爆
    manager.registerSpecial(
        19,
        defineNonePropertySpecial(19, {
            getSpecialName: () => '自爆',
            getDescription: () => '战斗后角色的生命值变成1。',
            fromLegacyEnemy: () => {}
        })
    );

    // 20 - 无敌
    manager.registerSpecial(
        20,
        defineNonePropertySpecial(20, {
            getSpecialName: () => '无敌',
            getDescription: () => '角色无法打败怪物，除非拥有十字架。',
            fromLegacyEnemy: () => {}
        })
    );

    // 21 - 退化
    manager.registerSpecial(
        21,
        defineCommonSerializableSpecial<IDegradationValue>(
            21,
            { atkValue: 0, defValue: 0 },
            {
                getSpecialName: () => '退化',
                getDescription: special => {
                    const { atkValue, defValue } = special.value;
                    return `战斗后角色永久下降${atkValue}点攻击和${defValue}点防御。`;
                },
                fromLegacyEnemy: enemy => ({
                    atkValue: enemy.atkValue ?? 0,
                    defValue: enemy.defValue ?? 0
                })
            }
        )
    );

    // 22 - 固伤
    manager.registerSpecial(
        22,
        defineCommonSerializableSpecial(22, 0, {
            getSpecialName: () => '固伤',
            getDescription: special =>
                `战斗前，怪物对角色造成${special.value}点固定伤害，未开启负伤时无视角色护盾。`,
            fromLegacyEnemy: enemy => enemy.damage ?? 0
        })
    );

    // 23 - 重生
    manager.registerSpecial(
        23,
        defineNonePropertySpecial(23, {
            getSpecialName: () => '重生',
            getDescription: () =>
                '怪物被击败后，角色转换楼层则怪物将再次出现。',
            fromLegacyEnemy: () => {}
        })
    );

    // 24 - 激光
    manager.registerSpecial(
        24,
        defineCommonSerializableSpecial(24, 0, {
            getSpecialName: () => '激光',
            getDescription: special =>
                `经过怪物同行或同列时自动减生命${special.value}点。`,
            fromLegacyEnemy: enemy => enemy.laser ?? 0
        })
    );

    // 25 - 光环
    manager.registerSpecial(
        25,
        defineCommonSerializableSpecial<IHaloValue>(
            25,
            {
                haloRange: 0,
                haloSquare: false,
                hpBuff: 0,
                atkBuff: 0,
                defBuff: 0
            },
            {
                getSpecialName: () => '光环',
                getDescription: special => {
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
                fromLegacyEnemy: enemy => ({
                    haloRange: enemy.haloRange ?? 0,
                    haloSquare: enemy.haloSquare ?? false,
                    hpBuff: enemy.hpBuff ?? 0,
                    atkBuff: enemy.atkBuff ?? 0,
                    defBuff: enemy.defBuff ?? 0
                })
            }
        )
    );

    // 26 - 支援
    manager.registerSpecial(
        26,
        defineNonePropertySpecial(26, {
            getSpecialName: () => '支援',
            getDescription: () =>
                '当周围一圈的怪物受到攻击时将上前支援，并组成小队战斗。',
            fromLegacyEnemy: () => {}
        })
    );

    // 27 - 捕捉
    manager.registerSpecial(
        27,
        defineNonePropertySpecial(27, {
            getSpecialName: () => '捕捉',
            getDescription: () => '当走到怪物十字范围内时会进行强制战斗。',
            fromLegacyEnemy: () => {}
        })
    );
}
