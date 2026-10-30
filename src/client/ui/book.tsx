import { GameUI, SetupComponentOptions } from '@motajs/system';
import { computed, defineComponent } from 'vue';
import { Font } from '@motajs/render';
import { ITileLocator } from '@motajs/common';
import { Scroll } from '@user/client-base';
import { IEnemyView } from '@user/data-system';
import { IReadonlyEnemy } from '@user/data-base';
import { IEnemyAttr } from '@user/data-common';
import { BookDetailUI } from './bookDetail';
import { FULL_LOC, MAIN_HEIGHT, MAIN_WIDTH } from '@/client';
import { IUIPropsBase } from '@user/client-modules';

export interface BookProps extends IUIPropsBase {}

/** 怪物手册组件的 props 声明 */
const bookProps = {
    props: ['controller', 'instance', 'state']
} satisfies SetupComponentOptions<BookProps>;

/** 列表中每一行的高度 */
const ROW_HEIGHT = 72;
/** 列表区域的起始纵坐标 */
const LIST_TOP = 44;
/** 列表区域的横坐标 */
const LIST_LEFT = 16;
/** 列表区域的宽度 */
const LIST_WIDTH = MAIN_WIDTH - 32;
/** 列表区域的高度，底部留出退出按钮的空间 */
const LIST_HEIGHT = MAIN_HEIGHT - LIST_TOP - 36;
/** 数值列区域的起始横坐标 */
const STAT_LEFT = 240;

/** 怪物名称字体 */
const nameFont = Font.defaults({ size: 15, weight: 700 });
/** 特殊名与属性字体 */
const statFont = Font.defaults({ size: 12 });

/** 怪物手册列表组件 */
export const Book = defineComponent<BookProps>(props => {
    /** 当前地图的怪物上下文 */
    const ctx = props.state.enemyContext;

    // 按怪物图块数字去重，每个数字保留一个代表视图
    const enemies = computed(() => {
        const map = new Map<number, IEnemyView<IEnemyAttr>>();
        for (const pair of ctx.iterateEnemy()) {
            const base = pair[1].getBaseEnemy();
            if (!map.has(base.code)) map.set(base.code, pair[1]);
        }
        return Array.from(map.values());
    });

    /** 将数值按大数规则格式化为展示字符串 */
    const format = (value: number) => {
        return core.formatBigNumber(value);
    };

    /**
     * 以基础属性路径计算怪物临界信息，已达临界上界或未绑定伤害系统时返回 null
     */
    const getCritical = (
        base: IReadonlyEnemy<IEnemyAttr>,
        locator: ITileLocator | null
    ) => {
        const damage = ctx.getDamageSystem();
        // TODO: 伤害系统未绑定或已达临界上界时，伤害 / 临界 / 减伤 / 「1 防」留空
        if (!damage) return null;
        const first = damage
            .calculateEnemyCritical(base, 'atk', locator)
            .next();
        if (first.done) return null;
        return first.value;
    };

    /**
     * 以基础属性路径计算「1 防」时的伤害信息，即隔离属性增加 1 点防御后的战斗信息
     */
    const getDef1 = (
        base: IReadonlyEnemy<IEnemyAttr>,
        locator: ITileLocator | null
    ) => {
        const damage = ctx.getDamageSystem();
        if (!damage) return null;
        const isolated = props.state.hero.getIsolatedAttribute();
        isolated.add('def', 1);
        const first = damage
            .with(isolated)
            .calculateEnemyCritical(base, 'atk', locator)
            .next();
        if (first.done) return null;
        return first.value;
    };

    /** 拼接怪物全部特殊属性的名称，以空格分隔 */
    const specialText = (base: IReadonlyEnemy<IEnemyAttr>) => {
        const names: string[] = [];
        for (const special of base.iterateSpecials()) {
            names.push(special.getSpecialName());
        }
        return names.join(' ');
    };

    /** 计算第 index 个数值列的中心横坐标 */
    const statX = (index: number) => {
        return STAT_LEFT + (index * (MAIN_WIDTH - STAT_LEFT)) / 5;
    };

    /** 打开指定怪物视图的详细信息界面 */
    const openDetail = (view: IEnemyView<IEnemyAttr>) => {
        props.controller.open(BookDetailUI, { enemy: view });
    };

    /** 关闭当前怪物手册界面 */
    const exit = () => props.controller.close(props.instance);

    return () => (
        <container loc={FULL_LOC}>
            {/* 标题 */}
            <text
                text="怪物手册"
                loc={[24, 22]}
                anc={[0, 0]}
                font={nameFont}
                fillStyle="gold"
            />
            {/* 怪物列表区 */}
            <Scroll
                noscroll
                loc={[LIST_LEFT, LIST_TOP, LIST_WIDTH, LIST_HEIGHT]}
            >
                {enemies.value.map((view, i) => {
                    const base = view.getBaseEnemy();
                    const locator = ctx.getEnemyLocatorByView(view);
                    const critical = getCritical(base, locator);
                    const def1 = getDef1(base, locator);
                    const y = i * ROW_HEIGHT;
                    return (
                        <container
                            key={base.code}
                            loc={[0, y, LIST_WIDTH, ROW_HEIGHT]}
                            cursor="pointer"
                            onClick={() => openDetail(view)}
                        >
                            <icon icon={base.code} loc={[8, 16, 40, 40]} />
                            <text
                                text={base.getAttribute('name')}
                                loc={[56, 14]}
                                anc={[0, 0]}
                                font={nameFont}
                                fillStyle="#ffffff"
                            />
                            <text
                                text={specialText(base)}
                                loc={[56, 36]}
                                anc={[0, 0]}
                                font={statFont}
                                fillStyle="#ffd27f"
                            />
                            {/* 数值列表区 */}
                            <text
                                text={`生命 ${format(base.getAttribute('hp'))}`}
                                loc={[statX(0), 22]}
                                anc={[0, 0.5]}
                                font={statFont}
                                fillStyle="lightgreen"
                            />
                            <text
                                text={`攻击 ${format(base.getAttribute('atk'))}`}
                                loc={[statX(1), 22]}
                                anc={[0, 0.5]}
                                font={statFont}
                                fillStyle="lightcoral"
                            />
                            <text
                                text={`防御 ${format(base.getAttribute('def'))}`}
                                loc={[statX(2), 22]}
                                anc={[0, 0.5]}
                                font={statFont}
                                fillStyle="lightblue"
                            />
                            <text
                                text={`金币 ${format(base.getAttribute('money'))}`}
                                loc={[statX(3), 22]}
                                anc={[0, 0.5]}
                                font={statFont}
                                fillStyle="lightyellow"
                            />
                            <text
                                text={`经验 ${format(base.getAttribute('exp'))}`}
                                loc={[statX(4), 22]}
                                anc={[0, 0.5]}
                                font={statFont}
                                fillStyle="lawngreen"
                            />
                            {/* 临界信息区 */}
                            {critical && (
                                <text
                                    text={`伤害 ${format(critical.baseInfo.damage)}`}
                                    loc={[statX(0), 52]}
                                    anc={[0, 0.5]}
                                    font={statFont}
                                    fillStyle="#ffffff"
                                />
                            )}
                            {critical && (
                                <text
                                    text={`临界 ${format(critical.nextDiff)}`}
                                    loc={[statX(1), 52]}
                                    anc={[0, 0.5]}
                                    font={statFont}
                                    fillStyle="lightsalmon"
                                />
                            )}
                            {critical && (
                                <text
                                    text={`减伤 ${format(-critical.damageDiff)}`}
                                    loc={[statX(2), 52]}
                                    anc={[0, 0.5]}
                                    font={statFont}
                                    fillStyle="lightpink"
                                />
                            )}
                            {critical && def1 && (
                                <text
                                    text={`1 防 ${format(critical.baseInfo.damage - def1.baseInfo.damage)}`}
                                    loc={[statX(3), 52]}
                                    anc={[0, 0.5]}
                                    font={statFont}
                                    fillStyle="cyan"
                                />
                            )}
                        </container>
                    );
                })}
            </Scroll>
            {/* 右下角退出按钮 */}
            <text
                text="退出"
                loc={[MAIN_WIDTH - 16, MAIN_HEIGHT - 16]}
                anc={[1, 1]}
                font={nameFont}
                cursor="pointer"
                fillStyle="#ffffff"
                onClick={exit}
            />
        </container>
    );
}, bookProps);

/** 怪物手册列表的 UI 控制器 */
export const BookUI = new GameUI('book', Book);
