import { GameUI, SetupComponentOptions } from '@motajs/system';
import { computed, defineComponent, ref } from 'vue';
import { ElementLocator, Font } from '@motajs/render';
import { Scroll, TextContent } from '@user/client-base';
import { IHeroItemState, IHeroState } from '@user/data-base';
import { IHeroAttr } from '@user/data-common';
import { FULL_LOC, MAIN_HEIGHT, MAIN_WIDTH } from '@/client';
import { IUIPropsBase } from '@user/client-modules';

export interface ToolBoxProps extends IUIPropsBase {
    /** 勇士状态对象 */
    heroState: IHeroState<IHeroAttr>;
}

/** 道具栏组件的 props 声明 */
const toolBoxProps = {
    props: ['controller', 'instance', 'state', 'heroState']
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
const DESC_TOP = 40;
/** 道具说明区域高度，底部为退出按钮留出空间 */
const DESC_HEIGHT = MAIN_HEIGHT - DESC_TOP - 36;

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

    /** 当前选中的道具图块数字，-1 表示未选中 */
    const selected = ref(-1);

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

    /** 当前选中的道具状态，未选中时为 null */
    const selectedItem = computed<IHeroItemState<IHeroAttr> | null>(() => {
        if (selected.value < 0) return null;
        for (const item of permItems.value) {
            if (item.num === selected.value) return item;
        }
        for (const item of consItems.value) {
            if (item.num === selected.value) return item;
        }
        return null;
    });

    /**
     * 点击道具行：未选中时仅选中，再次点击已选中的道具时使用该道具
     * @param item 被点击的道具状态
     */
    const clickItem = (item: IHeroItemState<IHeroAttr>) => {
        if (selected.value === item.num) {
            hero.items.useItem(item.num);
            return;
        }
        selected.value = item.num;
    };

    /** 关闭当前道具栏界面 */
    const exit = () => props.controller.close(props.instance);

    /** 生成道具行的点击处理器，点击后按再点规则选中或使用该道具 */
    const getItemClick = (item: IHeroItemState<IHeroAttr>) => () => {
        clickItem(item);
    };

    return () => {
        const current = selectedItem.value;
        return (
            <container loc={FULL_LOC}>
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
                        const isSelected = item.num === selected.value;
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
                                onClick={getItemClick(item)}
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
                        const isSelected = item.num === selected.value;
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
                                onClick={getItemClick(item)}
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
                {/* 道具名称 */}
                <text
                    text={current ? current.raw.name : '未选择道具'}
                    loc={[INFO_LEFT + 8, 14]}
                    anc={[0, 0]}
                    font={titleFont}
                    fillStyle="gold"
                />
                {/* 道具说明 */}
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
