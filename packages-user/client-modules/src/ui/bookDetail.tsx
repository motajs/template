import { GameUI, SetupComponentOptions } from '@motajs/system';
import { computed, defineComponent, ref } from 'vue';
import { Font } from '@motajs/render';
import { ITileLocator } from '@motajs/common';
import { Scroll, TextContent } from '@user/client-base';
import { IEnemyCritical, IEnemyView, EnemyView } from '@user/data-system';
import { IEnemy, IReadonlyEnemy } from '@user/data-base';
import { IEnemyAttr } from '@user/data-common';
import { FULL_LOC, MAIN_HEIGHT, MAIN_WIDTH } from '../shared';
import { IUIPropsBase } from './types';

/** 详情当前展示的属性模式 */
const enum DetailMode {
    /** 基础属性，即不考虑光环等加成的原始状态 */
    Base,
    /** 计算后属性，即含光环等加成的状态 */
    Computed
}

export interface BookDetailProps extends IUIPropsBase {
    enemy: IEnemy<IEnemyAttr> | IEnemyView<IEnemyAttr>;
}

/** 怪物详情组件的 props 声明 */
const bookDetailProps = {
    props: ['controller', 'instance', 'state', 'enemy']
} satisfies SetupComponentOptions<BookDetailProps>;

/** 怪物名称字体 */
const nameFont = Font.defaults({ size: 20, weight: 700 });
/** 属性数值字体 */
const statFont = Font.defaults({ size: 15 });
/** 特殊属性字体 */
const specialFont = Font.defaults({ size: 14 });

/** 怪物详细信息组件 */
export const BookDetail = defineComponent<BookDetailProps>(props => {
    /** 当前展示的属性模式 */
    const mode = ref(DetailMode.Base);

    /** 若入参为怪物视图则返回该视图，否则返回 null */
    const getView = (): IEnemyView<IEnemyAttr> | null => {
        if (props.enemy instanceof EnemyView) return props.enemy;
        return null;
    };

    /** 获取基础属性，视图取基础怪物，否则取入参本身 */
    const getBase = (): IReadonlyEnemy<IEnemyAttr> => {
        if (props.enemy instanceof EnemyView) return props.enemy.getBaseEnemy();
        return props.enemy;
    };

    /** 获取计算后属性，视图走计算接口，否则取入参本身 */
    const getComputed = (): IReadonlyEnemy<IEnemyAttr> => {
        if (props.enemy instanceof EnemyView)
            return props.enemy.getComputedEnemy();
        return props.enemy;
    };

    // TODO: 后续支持「在地图中打开指定 View 详情」时，locator 需按实际位置补全
    const getLocator = (): ITileLocator | null => {
        const view = getView();
        if (!view) return null;
        return view.context.getEnemyLocatorByView(view);
    };

    /** 当前模式对应的怪物数据 */
    const current = computed(() =>
        mode.value === DetailMode.Base ? getBase() : getComputed()
    );

    // 详情仅展示特殊属性列表，不展示光环
    const specials = computed(() =>
        Array.from(current.value.iterateSpecials())
    );

    /**
     * 计算当前模式下的临界信息，基础模式走裸怪物临界接口，
     * 计算模式走怪物视图临界接口，已达上界时返回 null
     */
    const critical = computed<IEnemyCritical | null>(() => {
        const damage = props.state.enemyContext.getDamageSystem();
        if (!damage) return null;
        if (mode.value === DetailMode.Base) {
            const first = damage
                .calculateEnemyCritical(getBase(), 'atk', getLocator())
                .next();
            return first.done ? null : first.value;
        }
        const view = getView();
        if (!view) return null;
        const first = damage.calculateViewCritical(view, 'atk').next();
        return first.done ? null : first.value;
    });

    /** 将数值按大数规则格式化为展示字符串 */
    const format = (value: number) => core.formatBigNumber(value);

    /** 计算第 index 个数值列的中心横坐标 */
    const statX = (index: number) => 24 + (index * (MAIN_WIDTH - 48)) / 5;

    /** 在基础属性与计算后属性之间切换 */
    const toggleMode = () => {
        if (!(props.enemy instanceof EnemyView)) return;
        mode.value =
            mode.value === DetailMode.Base
                ? DetailMode.Computed
                : DetailMode.Base;
    };

    /** 关闭当前怪物详情界面 */
    const close = () => props.controller.close(props.instance);

    /** 左下角切换按钮的显示文本 */
    const toggleText = computed(() =>
        mode.value === DetailMode.Base ? '切换至计算后属性' : '切换至基础属性'
    );

    return () => {
        const enemy = current.value;
        return (
            <container loc={FULL_LOC}>
                {/* 标题 */}
                <text
                    text={enemy.getAttribute('name')}
                    loc={[24, 22]}
                    anc={[0, 0]}
                    font={nameFont}
                    fillStyle="gold"
                />
                {/* 属性数值区 */}
                <text
                    text={`生命 ${format(enemy.getAttribute('hp'))}`}
                    loc={[statX(0), 64]}
                    anc={[0, 0.5]}
                    font={statFont}
                    fillStyle="lightgreen"
                />
                <text
                    text={`攻击 ${format(enemy.getAttribute('atk'))}`}
                    loc={[statX(1), 64]}
                    anc={[0, 0.5]}
                    font={statFont}
                    fillStyle="lightcoral"
                />
                <text
                    text={`防御 ${format(enemy.getAttribute('def'))}`}
                    loc={[statX(2), 64]}
                    anc={[0, 0.5]}
                    font={statFont}
                    fillStyle="lightblue"
                />
                <text
                    text={`金币 ${format(enemy.getAttribute('money'))}`}
                    loc={[statX(3), 64]}
                    anc={[0, 0.5]}
                    font={statFont}
                    fillStyle="lightyellow"
                />
                <text
                    text={`经验 ${format(enemy.getAttribute('exp'))}`}
                    loc={[statX(4), 64]}
                    anc={[0, 0.5]}
                    font={statFont}
                    fillStyle="lawngreen"
                />
                {/* 特殊属性列表区 */}
                <Scroll noscroll loc={[24, 92, MAIN_WIDTH - 48, 150]}>
                    {specials.value.map((special, i) => {
                        const y = i * 44;
                        return (
                            <container
                                key={special.code}
                                loc={[0, y, MAIN_WIDTH - 48, 44]}
                            >
                                <text
                                    text={`${special.getSpecialName()}：`}
                                    loc={[0, 6]}
                                    anc={[0, 0]}
                                    font={specialFont}
                                    fillStyle={special.getNameColor()}
                                />
                                <TextContent
                                    text={special.getDescription()}
                                    width={MAIN_WIDTH - 48}
                                    loc={[0, 24, MAIN_WIDTH - 48, 20]}
                                    font={specialFont}
                                    fillStyle="#dddddd"
                                />
                            </container>
                        );
                    })}
                </Scroll>
                <text
                    text="临界"
                    loc={[24, 258]}
                    anc={[0, 0.5]}
                    font={specialFont}
                    fillStyle="#fffa9e"
                />
                {/* 临界信息区 */}
                {critical.value && (
                    <text
                        text={`加攻 ${format(critical.value.nextDiff)}`}
                        loc={[24, 282]}
                        anc={[0, 0.5]}
                        font={statFont}
                        fillStyle="lightsalmon"
                    />
                )}
                {critical.value && (
                    <text
                        text={`减伤 ${format(-critical.value.damageDiff)}`}
                        loc={[160, 282]}
                        anc={[0, 0.5]}
                        font={statFont}
                        fillStyle="lightpink"
                    />
                )}
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
    };
}, bookDetailProps);

/** 怪物详细信息的 UI 控制器 */
export const BookDetailUI = new GameUI('book-detail', BookDetail);
