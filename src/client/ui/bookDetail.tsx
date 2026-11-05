import { GameUI, SetupComponentOptions } from '@motajs/system';
import { computed, defineComponent, ref, shallowRef, watch } from 'vue';
import { ElementLocator, Font } from '@motajs/render';
import { cumsum, ITileLocator } from '@motajs/common';
import {
    adjustGrid2,
    IGameUIPropsBase,
    Scroll,
    TextContent,
    useKey
} from '@user/client-base';
import {
    IEnemyCritical,
    IEnemyView,
    EnemyView,
    IDamageSystem,
    IReadonlyEnemyContext
} from '@user/data-system';
import { IReadonlyEnemy, ISpecial } from '@user/data-base';
import { IEnemyAttr, IHeroAttr } from '@user/data-common';
import { FULL_LOC, MAIN_HEIGHT, MAIN_WIDTH } from '@/client';
import { DefaultProps } from '@motajs/render-vue';
import { EnemyOne } from './enemyOne';

/** 详情当前展示的属性模式 */
const enum DetailMode {
    /** 基础属性，即不考虑光环等加成的原始状态 */
    Base,
    /** 计算后属性，即含光环等加成的状态 */
    Computed
}

export interface BookDetailProps extends IGameUIPropsBase, DefaultProps {
    /** 怪物上下文 */
    context: IReadonlyEnemyContext<IEnemyAttr, IHeroAttr>;
    /** 要展示的怪物对象，与 `view` 同时传入时以 `view` 为准 */
    enemy?: IReadonlyEnemy<IEnemyAttr>;
    /** 要展示的怪物视图，与 `enemy` 同时传入时以 `view` 为准 */
    view?: IEnemyView<IEnemyAttr>;
    /** 怪物的定位符，当传入怪物视图时此项无效，仅当传入怪物对象时生效 */
    locator?: ITileLocator;
}

/** 怪物详情组件的 props 声明 */
const bookDetailProps = {
    props: [
        'controller',
        'instance',
        'state',
        'enemy',
        'view',
        'locator',
        'context',
        'loc',
        'width',
        'height'
    ]
} satisfies SetupComponentOptions<BookDetailProps>;

/** 属性数值字体 */
const statFont = Font.defaults({ size: 15 });
/** 特殊属性字体 */
const specialFont = Font.defaults({ size: 14 });
/** 没有特殊属性时的字体 */
const noSpecialFont = Font.defaults({ size: 24 });
/** 临界表字体 */
const criticalFont = Font.defaults({ size: 12 });

/** 顶部摘要属性的高度 */
const SUMMARY_HEIGHT = 72;
/** 顶部摘要属性与特殊属性区的间隔 */
const SUMMARY_INTERVAL = 16;
/** 摘要与特殊属性区的分割线 */
const SUMMARY_SPECIAL_DIVIDER: [number, number, number, number] = [
    16,
    SUMMARY_HEIGHT + SUMMARY_INTERVAL / 2,
    MAIN_WIDTH - 16,
    SUMMARY_HEIGHT + SUMMARY_INTERVAL / 2
];

/** 临界表数量 */
const CRITICAL_COUNT = 8;
/** 临界表高度 */
const CRITICAL_HEIGHT = 64;
/** 临界表左边缘位置 */
const CRITICAL_LEFT = 0;
/** 临界表的网格间距 */
const CRITICAL_INTERVAL = 4;

/** 特殊属性列表区域的横坐标 */
const SPECIAL_LEFT = 0;
/** 特殊属性列表区域的宽度 */
const SPECIAL_WIDTH = MAIN_WIDTH;
/** 特殊属性列表区域的起始纵坐标 */
const SPECIAL_TOP = SUMMARY_HEIGHT + SUMMARY_INTERVAL;
/** 特殊属性列表区域的高度 */
const SPECIAL_HEIGHT =
    MAIN_HEIGHT - SUMMARY_HEIGHT - SUMMARY_INTERVAL - CRITICAL_HEIGHT;
/** 每行特殊属性标题占用的高度 */
const SPECIAL_LABEL_HEIGHT = 22;
/** 描述文本首次测量前使用的回退高度 */
const SPECIAL_MIN_HEIGHT = 20;
/** 相邻两行特殊属性之间的纵向间隔 */
const SPECIAL_GAP = 10;
/** 特殊属性列表区域的外接矩形，只由既有布局常量组成 */
const SPECIAL_SCROLL_LOC: ElementLocator = [
    SPECIAL_LEFT,
    SPECIAL_TOP,
    SPECIAL_WIDTH,
    SPECIAL_HEIGHT
];

/** 顶部怪物主信息区域的定位符 */
const MAIN_INFO_LOC: ElementLocator = [0, 0, MAIN_WIDTH, SUMMARY_HEIGHT];
/** 底部临界表区域的起始纵坐标 */
const CRITICAL_TOP = 272;
/** 临界表容器位置 */
const CRITICAL_LOC: ElementLocator = [
    CRITICAL_LEFT,
    CRITICAL_TOP,
    MAIN_WIDTH,
    CRITICAL_HEIGHT
];

interface ISpecialRow {
    /** 该行对应的特殊属性 */
    readonly special: ISpecial<unknown>;
    /** 标题的纵坐标 */
    readonly labelTop: number;
    /** 描述文本的纵坐标 */
    readonly textTop: number;
    /** 描述文本的高度 */
    readonly textHeight: number;
}

/** 怪物详细信息组件 */
export const BookDetail = defineComponent<BookDetailProps>(props => {
    /** 当前展示的属性模式 */
    const mode = ref(DetailMode.Computed);
    // 按特殊属性 code 记录实测描述高度，供后续行计算纵坐标
    const textHeights = ref<Record<number, number>>({});

    /** 临界表 */
    const criticals = shallowRef<IEnemyCritical[]>([]);

    /** 临界表网格布局 */
    const grid = computed(() =>
        adjustGrid2(
            MAIN_WIDTH,
            CRITICAL_HEIGHT,
            criticals.value.length + 1,
            1,
            CRITICAL_INTERVAL
        )
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

    /** 当前模式对应的怪物数据 */
    const current = computed(() =>
        mode.value === DetailMode.Base ? getBase() : getComputed()
    );

    /** 特殊属性列表 */
    const specials = computed(() => {
        if (current.value) {
            return [...current.value.iterateSpecials()];
        } else {
            return [];
        }
    });

    /** 左下角切换按钮的显示文本 */
    const toggleText = computed(() =>
        mode.value === DetailMode.Base ? '切换至计算后属性' : '切换至基础属性'
    );

    /**
     * 更新特殊属性的文本高度
     * @param code 特殊属性码
     * @param height 这个特殊属性的文本高度
     */
    const updateTextHeight = (code: number, height: number): void => {
        if (textHeights.value[code] === height) return;
        textHeights.value[code] = height;
    };

    // 只保留仍存在的条目；整体清空会让没有重新上报高度的条目退回最小高度、长描述重新重叠
    watch(specials, () => {
        const next: Record<number, number> = {};
        for (const special of specials.value) {
            const height = textHeights.value[special.code];
            if (height) next[special.code] = height;
        }
        textHeights.value = next;
    });

    // 一次遍历累加出每行位置；行高只在循环内使用，不写入接口
    const specialRows = computed<ISpecialRow[]>(() => {
        const hs = specials.value.map(special => {
            const measured = textHeights.value[special.code];
            return (
                (measured ?? SPECIAL_MIN_HEIGHT) +
                SPECIAL_LABEL_HEIGHT +
                SPECIAL_GAP
            );
        });
        const ends = cumsum(hs);
        return specials.value.map((special, i) => ({
            special,
            labelTop: ends[i] - hs[i],
            textTop: ends[i] - hs[i] + SPECIAL_LABEL_HEIGHT,
            textHeight: hs[i] - SPECIAL_LABEL_HEIGHT - SPECIAL_GAP
        }));
    });

    /** 获取临界生成器 */
    const getCriticalGenerator = (
        damage: IDamageSystem<IEnemyAttr, IHeroAttr>,
        target: IReadonlyEnemy<IEnemyAttr>
    ) => {
        if (mode.value === DetailMode.Base) {
            const locator = props.locator ?? null;
            return damage.calculateEnemyCritical(target, 'atk', locator);
        } else if (props.view) {
            return damage.calculateViewCritical(props.view, 'atk');
        } else {
            return damage.calculateEnemyCritical(target, 'atk', null);
        }
    };

    /**
     * 计算当前状态下的临界信息
     * @param value 当前要展示的怪物数据
     */
    const getCriticals = (value?: IReadonlyEnemy<IEnemyAttr>) => {
        const target = value ?? current.value;
        if (!target) {
            criticals.value = [];
            return;
        }
        const damage = props.state.enemyContext.getDamageSystem();
        if (!damage) {
            criticals.value = [];
            return;
        }
        const gen = getCriticalGenerator(damage, target);
        if (!gen) {
            criticals.value = [];
            return;
        }
        const list: IEnemyCritical[] = [];
        for (let i = 0; i < CRITICAL_COUNT; i++) {
            const next = gen.next();
            if (next.done) break;
            else list.push(next.value);
        }
        criticals.value = list;
    };

    // 当前怪物或模式变化后重算临界表，current 为空时置空
    watch(current, value => getCriticals(value), { immediate: true });

    /** 将数值按大数规则格式化为展示字符串 */
    const format = (value: number) => core.formatBigNumber(value);

    /** 在基础属性与计算后属性之间切换 */
    const toggleMode = () => {
        if (!props.view && !(props.enemy instanceof EnemyView)) return;
        if (mode.value === DetailMode.Base) {
            mode.value = DetailMode.Computed;
        } else {
            mode.value = DetailMode.Base;
        }
    };

    /** 关闭当前怪物详情界面 */
    const close = () => props.controller.close(props.instance);

    const key = useKey(props.state.hotkey.system)!;
    key.implement('@common/exit', close).implement('@common/confirm', close);

    return () => (
        <container loc={FULL_LOC}>
            <EnemyOne
                loc={MAIN_INFO_LOC}
                context={props.context}
                enemy={props.enemy}
                view={props.view}
                locator={props.locator}
                selected={false}
            />
            <g-line
                line={SUMMARY_SPECIAL_DIVIDER}
                lineDash={[1, 1]}
                lineWidth={1}
                strokeStyle="#999"
            />
            <Scroll noscroll loc={SPECIAL_SCROLL_LOC}>
                {specialRows.value.map(row => {
                    const textLoc: ElementLocator = [0, row.textTop];
                    const text = `[c=${row.special.getNameColor()}]${row.special.getSpecialName()}[/c]: ${row.special.getDescription()}`;
                    return [
                        <TextContent
                            text={text}
                            width={SPECIAL_WIDTH}
                            loc={textLoc}
                            font={specialFont}
                            fillStyle="#dddddd"
                            autoHeight
                            onUpdateHeight={(height: number) =>
                                updateTextHeight(row.special.code, height)
                            }
                        />
                    ];
                })}
            </Scroll>
            <text
                text="无特殊属性"
                hidden={specials.value.length > 0}
                loc={[SPECIAL_LEFT, SPECIAL_TOP + SPECIAL_HEIGHT / 2]}
                anc={[0.5, 0.5]}
                font={noSpecialFont}
                fillStyle="#888"
            />
            <container loc={CRITICAL_LOC}>
                {grid.value.locs.map((loc, index) => {
                    const bottom = loc[1]! + loc[3]!;
                    const cy = (bottom + loc[1]!) / 2;
                    const c = criticals.value[index - 1];
                    const text1 = index === 0 ? '加攻' : format(c.nextDiff);
                    const text2 = index === 0 ? '减伤' : format(c.damageDiff);
                    return [
                        <text
                            text={text1}
                            loc={[loc[0]!, cy]}
                            anc={[0, 0.5]}
                            font={criticalFont}
                        />,
                        <text
                            text={text2}
                            loc={[loc[0]!, cy]}
                            anc={[0, 0.5]}
                            font={criticalFont}
                        />
                    ];
                })}
            </container>
            {/* 左下切换按钮 / 右下返回按钮 */}
            <text
                text={toggleText.value}
                loc={[24, MAIN_HEIGHT - 18]}
                anc={[0, 1]}
                font={statFont}
                cursor="pointer"
                fillStyle="gold"
                onClick={toggleMode}
            />
            <text
                text="返回上一级"
                loc={[MAIN_WIDTH - 24, MAIN_HEIGHT - 18]}
                anc={[1, 1]}
                font={statFont}
                cursor="pointer"
                fillStyle="#ffffff"
                onClick={close}
            />
        </container>
    );
}, bookDetailProps);

/** 怪物详细信息的 UI 控制器 */
export const BookDetailUI = new GameUI('book-detail', BookDetail);
