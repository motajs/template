import { GameUI, SetupComponentOptions } from '@motajs/system';
import { computed, defineComponent, nextTick, onUnmounted, ref } from 'vue';
import { ElementLocator, Font } from '@motajs/render';
import {
    IGameUIPropsBase,
    Scroll,
    TextContent,
    useKey
} from '@user/client-base';
import { IHeroItemState, IHeroState } from '@user/data-base';
import { IHeroAttr } from '@user/data-common';
import { FULL_LOC, MAIN_HEIGHT, MAIN_WIDTH } from '@/client';
import { EquipBoxUI } from './equipbox';

interface IHeroAttrItem {
    /** 勇士属性的键名 */
    readonly id: keyof IHeroAttr;
    /** 该属性在状态区域显示的中文名 */
    readonly name: string;
}

export interface ToolBoxProps extends IGameUIPropsBase {
    /** 勇士状态对象 */
    heroState: IHeroState<IHeroAttr>;
    /** 跳到装备栏时传给装备界面的属性列表，默认为空 */
    attributes?: readonly IHeroAttrItem[];
}

/** 道具栏组件的 props 声明 */
const toolBoxProps = {
    props: ['controller', 'instance', 'state', 'heroState', 'attributes']
} satisfies SetupComponentOptions<ToolBoxProps>;

/** 单列宽度，画面等分为永久道具、可消耗道具、道具信息三列 */
const COLUMN_WIDTH = MAIN_WIDTH / 3;
/** 列表标题占用的高度 */
const HEADER_HEIGHT = 28;
/** 列表区域起始纵坐标 */
const LIST_TOP = HEADER_HEIGHT + 8;
/** 列表区域高度，底部为退出按钮留出空间 */
const LIST_HEIGHT = MAIN_HEIGHT - LIST_TOP - 36;
/** 每行道具的高度 */
const ROW_HEIGHT = 46;
/** 行内图标的尺寸 */
const ROW_ICON_SIZE = 32;
/** 道具信息列起始横坐标 */
const INFO_LEFT = COLUMN_WIDTH * 2;
/** 道具说明区域起始纵坐标 */
const DESC_TOP = 88;
/** 道具说明区域高度，底部为退出按钮留出空间 */
const DESC_HEIGHT = MAIN_HEIGHT - DESC_TOP - 36;
/** 详情区图标尺寸 */
const DETAIL_ICON_SIZE = 32;

/** 列表标题字体 */
const titleFont = Font.defaults({ size: 14, weight: 700 });
/** 道具名称与数量字体 */
const itemFont = Font.defaults({ size: 13 });
/** 道具说明字体 */
const descFont = Font.defaults({ size: 12 });

/** 道具栏组件 */
export const ToolBox = defineComponent<ToolBoxProps>(props => {
    /** 勇士状态对象 */
    const hero = props.heroState;

    /** 当前所在的道具列 */
    const mode = ref<'permanent' | 'consumable'>('consumable');
    /** 当前列中选中的行号 */
    const index = ref(0);
    /** 使用失败提示是否正在显示 */
    const failTip = ref(false);
    /** 使用失败提示的清除定时器 */
    let failTimer: ReturnType<typeof setTimeout> | null = null;

    /**
     * 枚举背包内该消耗类型的道具，过滤掉在道具栏隐藏的道具，
     * 并按数量从多到少排序，数量相同时按图块数字升序
     * @param consumable 保留的道具是否为可消耗道具
     */
    const collect = (consumable: boolean) => {
        const list: IHeroItemState<IHeroAttr>[] = [];
        for (const pair of hero.items.iterateItems()) {
            const item = pair[1];
            if (item.raw.hideInToolbox === true) continue;
            if (item.consumable === consumable) list.push(item);
        }
        return list.sort((a, b) =>
            a.count !== b.count ? b.count - a.count : a.num - b.num
        );
    };

    /** 永久道具列表 */
    const permItems = computed(() => collect(false));
    /** 可消耗道具列表 */
    const consItems = computed(() => collect(true));
    /** 跳到装备栏时传递的属性列表 */
    const attributes = props.attributes ?? [];

    /** 当前列选中的道具状态，未选中时为 null */
    const selectedItem = computed<IHeroItemState<IHeroAttr> | null>(() => {
        const list =
            mode.value === 'permanent' ? permItems.value : consItems.value;
        return list[index.value] ?? null;
    });

    /** 显示使用失败提示，并在约 2 秒后自动清除 */
    const showFailure = () => {
        failTip.value = true;
        if (failTimer) clearTimeout(failTimer);
        failTimer = setTimeout(() => {
            failTip.value = false;
        }, 2000);
    };

    /** 使用当前选中的道具 */
    const useSelected = () => {
        const item = selectedItem.value;
        if (!item) return;
        const canUse = item.raw.effect.canUse?.(item.raw, props.state) ?? true;
        if (!canUse) {
            showFailure();
            return;
        }
        const hold = props.controller.keep();
        props.controller.close(props.instance);
        nextTick(() => {
            hero.items.useItem(item.num);
            hold.safelyUnload();
        });
    };

    /**
     * 生成道具行的点击处理器，再次点击当前项时使用道具
     * @param item 被点击的道具状态
     * @param column 被点击的道具列
     */
    const getItemClick =
        (item: IHeroItemState<IHeroAttr>, column: 'permanent' | 'consumable') =>
        () => {
            const list =
                column === 'permanent' ? permItems.value : consItems.value;
            const row = list.indexOf(item);
            if (mode.value === column && index.value === row) {
                useSelected();
                return;
            }
            mode.value = column;
            index.value = row < 0 ? 0 : row;
        };

    /** 切换到目标道具列，并把行号夹到该列范围内 */
    const switchColumn = (column: 'permanent' | 'consumable') => {
        if (mode.value === column) return;
        mode.value = column;
        const list = column === 'permanent' ? permItems.value : consItems.value;
        const max = list.length - 1;
        if (index.value > max) index.value = max < 0 ? 0 : max;
    };

    /**
     * 按给定步长移动选中行，并限制在当前列范围内
     * @param delta 移动的步长
     */
    const moveRow = (delta: number) => {
        const list =
            mode.value === 'permanent' ? permItems.value : consItems.value;
        const max = list.length - 1;
        if (max < 0) return;
        index.value = Math.min(Math.max(index.value + delta, 0), max);
    };

    /** 打开装备栏界面 */
    const toEquip = () => {
        props.controller.keep();
        props.controller.close(props.instance);
        props.controller.open(EquipBoxUI, {
            heroState: props.heroState,
            attributes
        });
    };

    /** 关闭当前道具栏界面 */
    const exit = () => props.controller.close(props.instance);

    onUnmounted(() => {
        if (failTimer) clearTimeout(failTimer);
    });

    const key = useKey(props.state.hotkey.system)!;
    key.implement('@common/select-left', () => switchColumn('permanent'))
        .implement('@common/select-right', () => switchColumn('consumable'))
        .implement('@common/select-up', () => moveRow(-1))
        .implement('@common/select-down', () => moveRow(1))
        .implement('@common/confirm', useSelected)
        .implement('@common/exit', exit)
        .implement('@ui/toolbox', exit);

    return () => {
        const current = selectedItem.value;
        return (
            <container loc={FULL_LOC}>
                {/* 右上角跳到装备栏 */}
                <text
                    text="装备栏 →"
                    loc={[MAIN_WIDTH - 8, HEADER_HEIGHT / 2]}
                    anc={[1, 0.5]}
                    font={titleFont}
                    cursor="pointer"
                    fillStyle="gold"
                    onClick={toEquip}
                />
                {/* 永久道具列 */}
                <text
                    text="永久道具"
                    loc={[8, HEADER_HEIGHT / 2]}
                    anc={[0, 0.5]}
                    font={titleFont}
                    fillStyle="gold"
                />
                {/* 可消耗道具列 */}
                <text
                    text="可消耗道具"
                    loc={[COLUMN_WIDTH + 8, HEADER_HEIGHT / 2]}
                    anc={[0, 0.5]}
                    font={titleFont}
                    fillStyle="gold"
                />
                <Scroll noscroll loc={[0, LIST_TOP, COLUMN_WIDTH, LIST_HEIGHT]}>
                    {/* 每行行底、图标、名称与数量，直接作为 Scroll 子项 */}
                    {permItems.value.map((item, i) => {
                        const y = i * ROW_HEIGHT;
                        const isSelected =
                            mode.value === 'permanent' && i === index.value;
                        const cellLoc: ElementLocator = [
                            4,
                            y + 2,
                            COLUMN_WIDTH - 8,
                            ROW_HEIGHT - 4
                        ];
                        return [
                            <g-rectr
                                loc={cellLoc}
                                circle={[4]}
                                fill
                                fillStyle={
                                    isSelected
                                        ? 'rgba(255, 204, 0, 0.28)'
                                        : 'rgba(255, 255, 255, 0.05)'
                                }
                                cursor="pointer"
                                onClick={getItemClick(item, 'permanent')}
                            />,
                            <icon
                                icon={item.num}
                                loc={[10, y + 7, ROW_ICON_SIZE, ROW_ICON_SIZE]}
                                noevent
                            />,
                            <text
                                text={item.raw.name}
                                loc={[50, y + ROW_HEIGHT / 2]}
                                anc={[0, 0.5]}
                                font={itemFont}
                                fillStyle="#eeeeee"
                                noevent
                            />,
                            <text
                                text={core.formatBigNumber(item.count)}
                                loc={[COLUMN_WIDTH - 8, y + ROW_HEIGHT / 2]}
                                anc={[1, 0.5]}
                                font={itemFont}
                                fillStyle="#cccccc"
                                noevent
                            />
                        ];
                    })}
                </Scroll>
                <Scroll
                    noscroll
                    loc={[COLUMN_WIDTH, LIST_TOP, COLUMN_WIDTH, LIST_HEIGHT]}
                >
                    {/* 每行行底、图标、名称与数量，直接作为 Scroll 子项 */}
                    {consItems.value.map((item, i) => {
                        const y = i * ROW_HEIGHT;
                        const isSelected =
                            mode.value === 'consumable' && i === index.value;
                        const cellLoc: ElementLocator = [
                            4,
                            y + 2,
                            COLUMN_WIDTH - 8,
                            ROW_HEIGHT - 4
                        ];
                        return [
                            <g-rectr
                                loc={cellLoc}
                                circle={[4]}
                                fill
                                fillStyle={
                                    isSelected
                                        ? 'rgba(255, 204, 0, 0.28)'
                                        : 'rgba(255, 255, 255, 0.05)'
                                }
                                cursor="pointer"
                                onClick={getItemClick(item, 'consumable')}
                            />,
                            <icon
                                icon={item.num}
                                loc={[10, y + 7, ROW_ICON_SIZE, ROW_ICON_SIZE]}
                                noevent
                            />,
                            <text
                                text={item.raw.name}
                                loc={[50, y + ROW_HEIGHT / 2]}
                                anc={[0, 0.5]}
                                font={itemFont}
                                fillStyle="#eeeeee"
                                noevent
                            />,
                            <text
                                text={core.formatBigNumber(item.count)}
                                loc={[COLUMN_WIDTH - 8, y + ROW_HEIGHT / 2]}
                                anc={[1, 0.5]}
                                font={itemFont}
                                fillStyle="#cccccc"
                                noevent
                            />
                        ];
                    })}
                </Scroll>
                {/* 详情图标、名称与类型 */}
                <icon
                    icon={current ? current.num : 0}
                    loc={[INFO_LEFT + 8, 8, DETAIL_ICON_SIZE, DETAIL_ICON_SIZE]}
                    noevent
                    hidden={!current}
                />
                {/* 道具名称 */}
                <text
                    text={current ? current.raw.name : '未选择道具'}
                    loc={[INFO_LEFT + 48, 12]}
                    anc={[0, 0]}
                    font={titleFont}
                    fillStyle="gold"
                />
                <text
                    text={
                        current
                            ? current.consumable
                                ? '消耗道具'
                                : '永久道具'
                            : ''
                    }
                    loc={[INFO_LEFT + 48, 34]}
                    anc={[0, 0]}
                    font={descFont}
                    fillStyle="#bbbbbb"
                />
                <text
                    text="点击该物品以使用"
                    loc={[INFO_LEFT + 8, 58]}
                    anc={[0, 0]}
                    font={descFont}
                    fillStyle="#dddddd"
                    hidden={!current}
                />
                <text
                    text="当前无法使用该道具！"
                    loc={[INFO_LEFT + 8, 74]}
                    anc={[0, 0]}
                    font={descFont}
                    fillStyle="lightcoral"
                    hidden={!failTip.value}
                />
                {/* 道具说明 */}
                {/* 未选择道具时的说明占位 */}
                <text
                    text="未选择道具"
                    loc={[INFO_LEFT + 8, DESC_TOP + 4]}
                    anc={[0, 0]}
                    font={descFont}
                    fillStyle="#888888"
                    hidden={!!current}
                />
                <Scroll
                    noscroll
                    loc={[INFO_LEFT, DESC_TOP, COLUMN_WIDTH, DESC_HEIGHT]}
                >
                    <TextContent
                        text={current ? current.raw.text : ''}
                        width={COLUMN_WIDTH - 16}
                        loc={[8, 4, COLUMN_WIDTH - 16, DESC_HEIGHT - 8]}
                        font={descFont}
                        fillStyle="#dddddd"
                    />
                </Scroll>
                {/* 右下角退出按钮 */}
                <text
                    text="退出"
                    loc={[MAIN_WIDTH - 12, MAIN_HEIGHT - 10]}
                    anc={[1, 1]}
                    font={titleFont}
                    cursor="pointer"
                    fillStyle="#ffffff"
                    onClick={exit}
                />
            </container>
        );
    };
}, toolBoxProps);

/** 道具栏的 UI 控制器 */
export const ToolBoxUI = new GameUI('toolbox', ToolBox);
