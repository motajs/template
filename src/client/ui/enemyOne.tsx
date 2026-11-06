import { SetupComponentOptions } from '@motajs/system';
import { computed, defineComponent, ref, watch } from 'vue';
import { Font } from '@motajs/render';
import { ITileLocator } from '@motajs/common';
import { adjustGrid2, TextAlign, TextContent } from '@user/client-base';
import {
    IDamageSystem,
    IEnemyView,
    IReadonlyEnemyContext
} from '@user/data-system';
import { IReadonlyEnemy } from '@user/data-base';
import { IEnemyAttr, IHeroAttr } from '@user/data-common';
import { isNil } from 'lodash-es';
import { DefaultProps } from '@motajs/render-vue';

/** 怪物主信息组件的 props */
export interface IEnemyOneProps extends DefaultProps {
    /** 怪物所属的上下文对象 */
    context: IReadonlyEnemyContext<IEnemyAttr, IHeroAttr>;
    /** 要展示的怪物对象，与 `view` 同时传入时以 `view` 为准 */
    enemy?: IReadonlyEnemy<IEnemyAttr>;
    /** 要展示的怪物视图，与 `enemy` 同时传入时以 `view` 为准 */
    view?: IEnemyView<IEnemyAttr>;
    /** 怪物在地图上的位置 */
    locator?: ITileLocator;
    /** 是展示基础属性（false）还是展示计算后属性（true），默认为计算后属性 */
    computed?: boolean;
    /** 当前行是否处于选中态 */
    selected?: boolean;
}

/** 怪物主信息组件的 props 声明 */
const enemyOneProps = {
    props: ['enemy', 'view', 'selected', 'loc', 'width', 'height']
} satisfies SetupComponentOptions<IEnemyOneProps>;

/** 怪物图标尺寸 */
const ICON_SIZE = 48;
/** 怪物图标中心点横坐标 */
const ICON_CENTER = 48;
/** 怪物名称距离图标中心点的距离 */
const ENEMY_NAME_BOTTOM = ICON_CENTER / 2 + 4;
/** 怪物特殊属性摘要距离图标中心点的距离 */
const ENEMY_SPECIAL_TOP = ICON_CENTER / 2 + 4;
/** 怪物特殊属性摘要的最大宽度 */
const ENEMY_SPECIAL_MAX_WIDTH = 80;
/** 怪物特殊属性摘要的高度 */
const ENEMY_SPECIAL_HEIGHT = 24;

/** 属性网格的横向偏移 */
const GRID_LEFT = 96;
/** 网格信息区，数值与标签名中间的偏移量 */
const GRID_VALUE_OFFSET = 32;

/** 怪物名称字体 */
const nameFont = Font.defaults({ size: 15, weight: 700 });
/** 特殊摘要与属性字体 */
const statFont = Font.defaults({ size: 12 });

/** 怪物主信息组件，供怪物手册列表与详情页共用 */
export const EnemyOne = defineComponent<IEnemyOneProps>(props => {
    /** 当前是展示计算后属性还是基础属性 */
    const showComputed = ref(props.computed ?? true);

    const width = computed(() => props.loc?.[2] ?? props.width ?? 300);
    const height = computed(() => props.loc?.[3] ?? props.height ?? 100);

    /** 网格布局 */
    const grid = computed(() =>
        adjustGrid2(width.value - GRID_LEFT, height.value, 3, 3, 2)
    );

    /** 将数值按大数规则格式化为展示字符串 */
    const format = (value: number) => {
        return core.formatBigNumber(value);
    };

    watch(
        () => props.computed,
        value => {
            showComputed.value = value ?? true;
        }
    );

    /** 获取基础属性，视图取基础怪物，否则取入参本身 */
    const getBase = (): IReadonlyEnemy<IEnemyAttr> | undefined => {
        if (props.view) {
            return props.view.getBaseEnemy();
        } else {
            return props.enemy;
        }
    };

    /** 获取计算后属性，视图走计算接口，否则取入参本身 */
    const getComputed = (): IReadonlyEnemy<IEnemyAttr> | undefined => {
        if (props.view) {
            return props.view.getComputedEnemy();
        } else {
            return props.enemy;
        }
    };

    /** 当前的怪物属性 */
    const enemy = computed(() =>
        showComputed.value ? getComputed() : getBase()
    );

    const specials = computed((): string => {
        if (!enemy.value) return '无属性';
        const specials = [...enemy.value.iterateSpecials()].sort(
            (a, b) => a.code - b.code
        );
        const names = specials.map(v => [v.getSpecialName(), v.getNameColor()]);
        if (names.length === 0) return '无属性';
        else if (names.length === 1)
            return `[c=${names[0][1]}]${names[0][0]}[/c]`;
        else if (names.length === 2) {
            if (names[0].length + names[1].length > 12) {
                return `[c=${names[0][1]}]${names[0][0]}[/c]...`;
            } else {
                return `[c=${names[0][1]}]${names[0][0]}[/c] [c=${names[1][1]}]${names[1][0]}[/c]`;
            }
        } else {
            if (names[0].length + names[1].length > 12) {
                return `[c=${names[0][1]}]${names[0][0]}[/c]...`;
            } else {
                return `[c=${names[0][1]}]${names[0][0]}[/c] [c=${names[1][1]}]${names[1][0]}[/c]...`;
            }
        }
    });

    /**
     * 获取临界生成器
     * @param system 伤害计算系统
     */
    const getCritical = function* (
        system: IDamageSystem<IEnemyAttr, IHeroAttr>
    ) {
        const loc = props.locator ?? null;
        if (showComputed.value) {
            const view = props.view;
            const computed = getComputed();
            if (view) {
                yield* system.calculateViewCritical(view, 'atk');
            } else if (computed) {
                yield* system.calculateEnemyCritical(computed, 'atk', loc);
            } else {
                return;
            }
        } else {
            const base = getBase();
            if (base) {
                yield* system.calculateEnemyCritical(base, 'atk', loc);
            } else {
                return;
            }
        }
    };

    /** 获取怪物的伤害、临界等信息 */
    const damageData = computed(() => {
        const enemy = showComputed.value ? getComputed() : getBase();
        const system = props.context.getDamageSystem();
        if (!system || !enemy) return ['无法战斗', '0', '0', '0'];
        const state = props.context.state;
        const critical = getCritical(system);
        const first = critical.next();
        const hero = state.hero.getAttribute();
        const isolated = state.hero.getIsolatedAttribute();
        isolated.add('def', 1);
        const system2 = system.with(isolated);
        const def1 = system2.getDamageInfoByComputed(enemy);
        if (!first.done) {
            // 有临界，正常算
            const value = first.value;
            const def = def1?.damage ?? value.baseInfo.damage;
            return [
                format(value.baseInfo.damage),
                format(value.nextDiff),
                format(value.damageDiff),
                format(value.baseInfo.damage - def)
            ];
        } else {
            // 此时有两种情况，一种是没有下一个临界了，一种是还没破防
            const curr = system.getDamageInfoByComputed(enemy);
            const def = enemy.getAttribute('def');
            if (hero.getFinalAttribute('atk') <= enemy.getAttribute('def')) {
                // 未破防
                isolated.add('def', -1);
                isolated.set('atk', def + 1);
                const dam2 = system2.getDamageInfoByComputed(enemy);
                if (!dam2) {
                    // 还没破防，说明可能是特殊机制怪，那么就直接按 0 算
                    return ['无法战斗', '0', '0', '0'];
                } else {
                    // 破防了，那么显示破防临界
                    return [
                        isNil(curr?.damage) ? '无法战斗' : format(curr.damage),
                        format(def + 1 - hero.getFinalAttribute('atk')),
                        `-> ${dam2.damage}`,
                        '0'
                    ];
                }
            } else {
                // 已破防，那么应该是没有临界了
                if (!curr) {
                    // 先计算当前伤害，但是如果没有，那么可能是机制怪
                    return ['无法战斗', '0', '0', '0'];
                } else {
                    const def = def1?.damage ?? curr.damage;
                    return [
                        format(curr.damage),
                        '0',
                        '0',
                        format(def - curr.damage)
                    ];
                }
            }
        }
    });

    return () => {
        const items = [
            {
                label: '生命',
                value: format(enemy.value?.getAttribute('hp') ?? 0),
                color: 'lightgreen'
            },
            {
                label: '攻击',
                value: format(enemy.value?.getAttribute('atk') ?? 0),
                color: 'lightcoral'
            },
            {
                label: '防御',
                value: format(enemy.value?.getAttribute('def') ?? 0),
                color: 'lightblue'
            },
            {
                label: '金币',
                value: format(enemy.value?.getAttribute('money') ?? 0),
                color: 'lightyellow'
            },
            {
                label: '经验',
                value: format(enemy.value?.getAttribute('exp') ?? 0),
                color: 'lawngreen'
            },
            { label: '伤害', value: damageData.value[0], color: 'red' },
            { label: '临界', value: damageData.value[1], color: 'lightsalmon' },
            { label: '减伤', value: damageData.value[2], color: 'lightpink' },
            { label: '1 防', value: damageData.value[3], color: 'cyan' }
        ];
        return (
            <container>
                <g-rectr
                    loc={[1, 1, width.value - 2, height.value - 2]}
                    circle={[10]}
                    hidden={!props.selected}
                    stroke
                    strokeStyle="gold"
                    lineWidth={1.5}
                    noevent
                />
                <icon
                    icon={enemy.value?.code ?? 0}
                    loc={[ICON_CENTER, height.value / 2, ICON_SIZE, ICON_SIZE]}
                    anc={[0.5, 0.5]}
                    noevent
                />
                <text
                    text={enemy.value?.getAttribute('name') ?? '新怪物'}
                    loc={[ICON_CENTER, height.value / 2 - ENEMY_NAME_BOTTOM]}
                    anc={[0.5, 1]}
                    font={nameFont}
                    fillStyle="#ffffff"
                    noevent
                />
                {/* 因为不同属性名颜色不同，所以要用 TextContent 来支持解析 */}
                <TextContent
                    text={specials.value}
                    width={ENEMY_SPECIAL_MAX_WIDTH}
                    height={ENEMY_SPECIAL_HEIGHT}
                    textAlign={TextAlign.Center}
                    loc={[ICON_CENTER, height.value / 2 + ENEMY_SPECIAL_TOP]}
                    anc={[0.5, 0]}
                    font={statFont}
                    fillStyle="#ffd27f"
                    noevent
                />
                <container
                    loc={[GRID_LEFT, 0, width.value - GRID_LEFT, height.value]}
                >
                    {grid.value.locs.map((loc, index) => {
                        const item = items[index];
                        return [
                            <text
                                text={item.label}
                                loc={[loc[0], loc[1]]}
                                font={statFont}
                                fillStyle={item.color}
                            />,
                            <text
                                text={item.value}
                                loc={[loc[0]! + GRID_VALUE_OFFSET, loc[1]]}
                                font={statFont}
                                fillStyle={item.color}
                            />
                        ];
                    })}
                </container>
            </container>
        );
    };
}, enemyOneProps);
