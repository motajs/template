import { GameUI, SetupComponentOptions } from '@motajs/system';
import { computed, defineComponent, onMounted, ref } from 'vue';
import { Font } from '@motajs/render';
import { Scroll, TextContent } from '@user/client-base';
import { IHeroState } from '@user/data-base';
import { IHeroAttr } from '@user/data-common';
import { IUIPropsBase } from '@user/client-modules';
import { IShopState, IShopSystem } from '@dp/shop';
import { FULL_LOC, MAIN_WIDTH, RENDER_WIDTH } from '@/client';

export interface IShopProps extends IUIPropsBase {
    /** 商店状态对象 */
    shop: IShopState;
    /** 勇士状态对象 */
    heroState: IHeroState<IHeroAttr>;
    /** 商店系统对象，负责执行购买与售出交易 */
    shopSystem: IShopSystem;
}

/** 商店界面组件的 props 声明 */
const shopProps = {
    props: [
        'controller',
        'instance',
        'state',
        'shop',
        'heroState',
        'shopSystem'
    ]
} satisfies SetupComponentOptions<IShopProps>;

interface IShopItemEntry {
    /** 道具图块数字 */
    readonly num: number;
    /** 道具字符串 id */
    readonly id: string;
    /** 道具名称 */
    readonly name: string;
    /** 道具描述 */
    readonly text: string;
    /** 商店库存 */
    readonly stock: number;
    /** 玩家拥有数量 */
    readonly owned: number;
    /** 道具买入价 */
    readonly buyPrice: number;
    /** 道具卖出价 */
    readonly sellPrice: number;
}

/** 顶部购买 / 售出切换栏的高度 */
const MODE_BAR_HEIGHT = 36;
/** 左侧商店列表的宽度 */
const LIST_WIDTH = 250;
/** 左侧商店列表的顶部纵坐标 */
const LIST_TOP = MODE_BAR_HEIGHT + 4;
/** 左侧商店列表的高度，底部为退出按钮留出空间 */
const LIST_HEIGHT = RENDER_WIDTH - LIST_TOP - 16;
/** 商店列表中每一行的高度 */
const ROW_HEIGHT = 40;
/** 行内图标的尺寸 */
const ROW_ICON_SIZE = 28;
/** 右侧信息区域的起始横坐标 */
const INFO_LEFT = LIST_WIDTH;
/** 右侧信息区域的宽度 */
const INFO_WIDTH = RENDER_WIDTH - INFO_LEFT;
/** 道具名称的纵坐标 */
const NAME_TOP = MODE_BAR_HEIGHT + 10;
/** 道具描述区域的顶部纵坐标 */
const DESC_TOP = NAME_TOP + 26;
/** 道具描述区域的高度 */
const DESC_HEIGHT = 116;
/** 价格信息区域每行的高度 */
const INFO_ROW_HEIGHT = 20;
/** 价格信息区域的顶部纵坐标 */
const PRICE_TOP = DESC_TOP + DESC_HEIGHT + 6;
/** 购买数量标题的纵坐标 */
const COUNT_LABEL_Y = PRICE_TOP + INFO_ROW_HEIGHT * 5 + 10;
/** 数量按钮所在行的纵坐标 */
const COUNT_ROW_Y = COUNT_LABEL_Y + 24;
/** 确认按钮的纵坐标 */
const CONFIRM_Y = COUNT_ROW_Y + 42;
/** 数量按钮每次大步进的数量 */
const COUNT_STEP = 10;

/** 标题与按钮字体 */
const titleFont = Font.defaults({ size: 14, weight: 700 });
/** 列表与信息字体 */
const textFont = Font.defaults({ size: 12 });

/** 商店界面组件 */
export const Shop = defineComponent<IShopProps>(props => {
    /** 商店状态对象 */
    const shop = props.shop;
    /** 勇士状态对象 */
    const hero = props.heroState;

    // 打开数据端当前商店，使其成为购买 / 售出交易的作用对象
    onMounted(() => props.shopSystem.openShop(shop));

    /** 当前的购买 / 售出模式 */
    const mode = ref<'buy' | 'sell'>('buy');
    /** 当前选中的道具图块数字，-1 表示未选中 */
    const selected = ref(-1);
    /** 当前购买 / 售出数量 */
    const count = ref(0);
    /** 按道具图块数字分别记忆的购买数量 */
    const buyCounts = new Map<number, number>();
    /** 按道具图块数字分别记忆的售出数量 */
    const sellCounts = new Map<number, number>();

    /** 商店道具列表，按图块数字升序排列 */
    const entries = computed<IShopItemEntry[]>(() => {
        const list: IShopItemEntry[] = [];
        for (const pair of shop.iterateItems()) {
            const num = pair[0];
            const data = props.state.itemStore.getData(num);
            if (!data) continue;
            const id = props.state.tileStore.id(num);
            const price = shop.getPrice(num);
            list.push({
                num,
                id: id ?? '',
                name: data.name,
                text: data.text,
                stock: shop.getCount(num),
                owned: hero.items.itemCount(num),
                buyPrice: price[0],
                sellPrice: price[1]
            });
        }
        return list.sort((a, b) => a.num - b.num);
    });

    /** 当前选中的道具条目，未选中时为 null */
    const current = computed<IShopItemEntry | null>(() => {
        for (const entry of entries.value) {
            if (entry.num === selected.value) return entry;
        }
        return null;
    });

    /** 当前模式下可调整的数量上限 */
    const countLimit = () => {
        if (selected.value < 0) return 0;
        if (mode.value === 'buy') {
            const stock = shop.getCount(selected.value);
            return stock < 0 ? 0 : stock;
        }
        return hero.items.itemCount(selected.value);
    };

    /** 将当前数量限制在上限与 0 之间 */
    const clampCount = () => {
        const limit = countLimit();
        if (count.value < 0) count.value = 0;
        if (count.value > limit) count.value = limit;
    };

    /** 保存当前选中道具在当前模式下记忆的数量 */
    const saveCount = () => {
        if (selected.value < 0) return;
        const map = mode.value === 'buy' ? buyCounts : sellCounts;
        map.set(selected.value, count.value);
    };

    /** 载入选中道具在当前模式下记忆的数量并限制在合法范围 */
    const loadCount = () => {
        const map = mode.value === 'buy' ? buyCounts : sellCounts;
        const stored = selected.value < 0 ? undefined : map.get(selected.value);
        count.value = stored ?? 0;
        clampCount();
    };

    /**
     * 选中一个道具，保存原选中道具的数量并恢复新选中道具的数量
     * @param num 被选中道具的图块数字
     */
    const selectItem = (num: number) => {
        saveCount();
        selected.value = num;
        loadCount();
    };

    /**
     * 切换购买 / 售出模式，两种模式的数量分别记忆
     * @param next 切换到的模式
     */
    const changeMode = (next: 'buy' | 'sell') => {
        saveCount();
        mode.value = next;
        loadCount();
    };

    /**
     * 调整数量，按步进上下调整后限制在合法范围
     * @param delta 数量的变化量
     */
    const adjustCount = (delta: number) => {
        count.value += delta;
        clampCount();
    };

    /** 执行当前模式下的交易，数量为 0 时不执行 */
    const confirm = () => {
        if (selected.value < 0 || count.value === 0) return;
        if (mode.value === 'buy') {
            props.shopSystem.buyItem(selected.value, count.value);
        } else {
            props.shopSystem.sellItem(selected.value, count.value);
        }
        count.value = 0;
        saveCount();
    };

    /** 关闭当前商店界面 */
    const exit = () => props.controller.close(props.instance);

    return () => {
        const entry = current.value;
        let total = 0;
        if (entry) {
            const price =
                mode.value === 'buy' ? entry.buyPrice : entry.sellPrice;
            total = count.value * price;
        }
        return (
            <container loc={FULL_LOC}>
                {/* 顶部购买 / 售出切换栏 */}
                <container loc={[0, 0, MAIN_WIDTH, MODE_BAR_HEIGHT]}>
                    <text
                        text="购买选项"
                        loc={[MAIN_WIDTH / 2 - 70, MODE_BAR_HEIGHT / 2]}
                        anc={[0.5, 0.5]}
                        font={titleFont}
                        cursor="pointer"
                        fillStyle={mode.value === 'buy' ? 'gold' : '#888888'}
                        onClick={() => changeMode('buy')}
                    />
                    <text
                        text="售出选项"
                        loc={[MAIN_WIDTH / 2 + 70, MODE_BAR_HEIGHT / 2]}
                        anc={[0.5, 0.5]}
                        font={titleFont}
                        cursor="pointer"
                        fillStyle={mode.value === 'sell' ? 'gold' : '#888888'}
                        onClick={() => changeMode('sell')}
                    />
                </container>
                {/* 商店列表 */}
                <Scroll loc={[0, LIST_TOP, LIST_WIDTH, LIST_HEIGHT]}>
                    {entries.value.map((item, i) => {
                        const isSelected = item.num === selected.value;
                        return (
                            <container
                                key={item.num}
                                loc={[
                                    0,
                                    i * ROW_HEIGHT,
                                    LIST_WIDTH,
                                    ROW_HEIGHT
                                ]}
                                cursor="pointer"
                                onClick={() => selectItem(item.num)}
                            >
                                <g-rectr
                                    loc={[4, 2, LIST_WIDTH - 8, ROW_HEIGHT - 4]}
                                    circle={[4]}
                                    fill
                                    fillStyle={
                                        isSelected
                                            ? 'rgba(255, 204, 0, 0.28)'
                                            : 'rgba(255, 255, 255, 0.05)'
                                    }
                                />
                                <icon
                                    icon={item.num}
                                    loc={[10, 6, ROW_ICON_SIZE, ROW_ICON_SIZE]}
                                />
                                <text
                                    text={item.name}
                                    loc={[46, ROW_HEIGHT / 2]}
                                    anc={[0, 0.5]}
                                    font={textFont}
                                    fillStyle="#eeeeee"
                                />
                                <text
                                    text={core.formatBigNumber(item.stock)}
                                    loc={[LIST_WIDTH - 10, ROW_HEIGHT / 2]}
                                    anc={[1, 0.5]}
                                    font={textFont}
                                    fillStyle="#cccccc"
                                />
                            </container>
                        );
                    })}
                </Scroll>
                {/* 选中道具名称 */}
                <text
                    text={entry ? entry.name : '未选择道具'}
                    loc={[INFO_LEFT + 14, NAME_TOP + 13]}
                    anc={[0, 0.5]}
                    font={titleFont}
                    fillStyle="gold"
                />
                {/* 选中道具描述 */}
                <Scroll
                    noscroll
                    loc={[INFO_LEFT, DESC_TOP, INFO_WIDTH, DESC_HEIGHT]}
                >
                    <TextContent
                        text={entry ? entry.text : ''}
                        width={INFO_WIDTH - 28}
                        loc={[14, 4, INFO_WIDTH - 28, DESC_HEIGHT - 8]}
                        font={textFont}
                        fillStyle="#dddddd"
                    />
                </Scroll>
                {/* 价格信息 */}
                <container
                    loc={[
                        INFO_LEFT,
                        PRICE_TOP,
                        INFO_WIDTH,
                        INFO_ROW_HEIGHT * 5
                    ]}
                >
                    <text
                        text="买价"
                        loc={[14, 10]}
                        anc={[0, 0.5]}
                        font={textFont}
                        fillStyle="#dddddd"
                    />
                    <text
                        text={
                            entry ? core.formatBigNumber(entry.buyPrice) : '-'
                        }
                        loc={[INFO_WIDTH - 14, 10]}
                        anc={[1, 0.5]}
                        font={textFont}
                        fillStyle="lightgreen"
                    />
                    <text
                        text="卖价"
                        loc={[14, 30]}
                        anc={[0, 0.5]}
                        font={textFont}
                        fillStyle="#dddddd"
                    />
                    <text
                        text={
                            entry ? core.formatBigNumber(entry.sellPrice) : '-'
                        }
                        loc={[INFO_WIDTH - 14, 30]}
                        anc={[1, 0.5]}
                        font={textFont}
                        fillStyle="lightcoral"
                    />
                    <text
                        text="存货"
                        loc={[14, 50]}
                        anc={[0, 0.5]}
                        font={textFont}
                        fillStyle="#dddddd"
                    />
                    <text
                        text={entry ? core.formatBigNumber(entry.stock) : '-'}
                        loc={[INFO_WIDTH - 14, 50]}
                        anc={[1, 0.5]}
                        font={textFont}
                        fillStyle="#cccccc"
                    />
                    <text
                        text="拥有"
                        loc={[14, 70]}
                        anc={[0, 0.5]}
                        font={textFont}
                        fillStyle="#dddddd"
                    />
                    <text
                        text={entry ? core.formatBigNumber(entry.owned) : '-'}
                        loc={[INFO_WIDTH - 14, 70]}
                        anc={[1, 0.5]}
                        font={textFont}
                        fillStyle="#cccccc"
                    />
                    <text
                        text="总价"
                        loc={[14, 90]}
                        anc={[0, 0.5]}
                        font={textFont}
                        fillStyle="#dddddd"
                    />
                    <text
                        text={core.formatBigNumber(total)}
                        loc={[INFO_WIDTH - 14, 90]}
                        anc={[1, 0.5]}
                        font={textFont}
                        fillStyle="gold"
                    />
                </container>
                {/* 数量选择 */}
                <text
                    text={mode.value === 'buy' ? '购买数量' : '售出数量'}
                    loc={[INFO_LEFT + INFO_WIDTH / 2, COUNT_LABEL_Y]}
                    anc={[0.5, 0.5]}
                    font={textFont}
                    fillStyle="#cccccc"
                />
                <text
                    text="<<"
                    loc={[INFO_LEFT + INFO_WIDTH / 2 - 70, COUNT_ROW_Y]}
                    anc={[0.5, 0.5]}
                    font={titleFont}
                    cursor="pointer"
                    fillStyle="#ffffff"
                    onClick={() => adjustCount(-COUNT_STEP)}
                />
                <text
                    text="<"
                    loc={[INFO_LEFT + INFO_WIDTH / 2 - 40, COUNT_ROW_Y]}
                    anc={[0.5, 0.5]}
                    font={titleFont}
                    cursor="pointer"
                    fillStyle="#ffffff"
                    onClick={() => adjustCount(-1)}
                />
                <text
                    text={String(count.value)}
                    loc={[INFO_LEFT + INFO_WIDTH / 2, COUNT_ROW_Y]}
                    anc={[0.5, 0.5]}
                    font={titleFont}
                    fillStyle="gold"
                />
                <text
                    text=">"
                    loc={[INFO_LEFT + INFO_WIDTH / 2 + 40, COUNT_ROW_Y]}
                    anc={[0.5, 0.5]}
                    font={titleFont}
                    cursor="pointer"
                    fillStyle="#ffffff"
                    onClick={() => adjustCount(1)}
                />
                <text
                    text=">>"
                    loc={[INFO_LEFT + INFO_WIDTH / 2 + 70, COUNT_ROW_Y]}
                    anc={[0.5, 0.5]}
                    font={titleFont}
                    cursor="pointer"
                    fillStyle="#ffffff"
                    onClick={() => adjustCount(COUNT_STEP)}
                />
                {/* 购买 / 售出确认按钮 */}
                <container loc={[INFO_LEFT, CONFIRM_Y, INFO_WIDTH, 30]}>
                    <g-rectr
                        loc={[14, 0, INFO_WIDTH - 28, 30]}
                        circle={[15]}
                        fill
                        stroke
                        fillStyle="rgba(50, 54, 159, 0.7)"
                        strokeStyle="gold"
                        lineWidth={2}
                    />
                    <text
                        text={mode.value === 'buy' ? '确认购买' : '确认售出'}
                        loc={[INFO_WIDTH / 2, 15]}
                        anc={[0.5, 0.5]}
                        font={titleFont}
                        cursor="pointer"
                        fillStyle="#ffffff"
                        onClick={confirm}
                    />
                </container>
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
}, shopProps);

/** 商店界面的 UI 控制器 */
export const ShopUI = new GameUI('shop', Shop);
