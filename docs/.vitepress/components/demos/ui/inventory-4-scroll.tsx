import { computed, defineComponent, ref } from 'vue';

interface Item {
    id: string;
    name: string;
    count: number;
    desc: string;
}

interface ItemCellProps {
    item: Item;
    selected: boolean;
    size: number;
}

type ItemCellEmits = {
    select: (id: string) => void;
};

interface ItemCellOptions {
    props: (keyof ItemCellProps)[];
    emits: (keyof ItemCellEmits)[];
}

const itemCellOptions: ItemCellOptions = {
    props: ['item', 'selected', 'size'],
    emits: ['select']
};

// 滚动演示沿用网格与详情的组件结构
const ItemCell = defineComponent<
    ItemCellProps,
    ItemCellEmits,
    keyof ItemCellEmits
>((props, { emit }) => {
    return () => (
        <container
            loc={[0, 0, props.size, props.size]}
            onClick={() => emit('select', props.item.id)}
        >
            <g-rectr
                loc={[0, 0, props.size, props.size]}
                circle={[10]}
                fill
                fillStyle={props.selected ? '#2f6fed' : '#26364d'}
            />
            <g-rectr
                loc={[1, 1, props.size - 2, props.size - 2]}
                circle={[9]}
                stroke
                strokeStyle={props.selected ? '#f2b84b' : '#33465f'}
            />
            <text loc={[8, 10]} text={props.item.name} fillStyle="#ffffff" />
            <text
                loc={[8, props.size - 24]}
                text={`× ${props.item.count}`}
                fillStyle="#cfe0ff"
            />
        </container>
    );
}, itemCellOptions);

interface ItemDetailProps {
    item?: Item;
}

type ItemDetailEmits = {
    clear: () => void;
};

interface ItemDetailOptions {
    props: (keyof ItemDetailProps)[];
    emits: (keyof ItemDetailEmits)[];
}

const itemDetailOptions: ItemDetailOptions = {
    props: ['item'],
    emits: ['clear']
};

const ItemDetail = defineComponent<
    ItemDetailProps,
    ItemDetailEmits,
    keyof ItemDetailEmits
>((props, { emit }) => {
    const clear = () => emit('clear');

    return () => (
        <container loc={[0, 0, 196, 330]}>
            <g-rect loc={[0, 0, 196, 330]} fill fillStyle="#101820" />
            <text loc={[16, 16]} text="详情" fillStyle="#8fb6ff" />

            <container hidden={!!props.item}>
                <text loc={[16, 52]} text="请选择道具" fillStyle="#4f6d94" />
            </container>

            <container hidden={!props.item}>
                <text
                    loc={[16, 52]}
                    text={props.item ? props.item.name : ''}
                    fillStyle="#e8f0ff"
                />
                <text
                    loc={[16, 84]}
                    text={props.item ? `数量：${props.item.count}` : ''}
                    fillStyle="#cfe0ff"
                />
                <text
                    loc={[16, 120]}
                    text={props.item ? props.item.desc : ''}
                    fillStyle="#8fb6ff"
                />
            </container>

            <container loc={[16, 286, 164, 28]} onClick={clear}>
                <g-rectr
                    loc={[0, 0, 164, 28]}
                    circle={[6]}
                    fill
                    fillStyle="#33465f"
                />
                <text loc={[12, 6]} text="取消选择" fillStyle="#e8f0ff" />
            </container>
        </container>
    );
}, itemDetailOptions);

const NAMES = [
    '红药水',
    '蓝药水',
    '黄钥匙',
    '蓝钥匙',
    '木剑',
    '木盾',
    '红宝石',
    '蓝宝石',
    '回城卷轴',
    '面包'
];

// 40 个假道具用来撑出可滚动的内容
const items: Item[] = Array.from({ length: 40 }, (_, index) => ({
    id: `item-${index + 1}`,
    name: NAMES[index % NAMES.length],
    count: (index % 6) + 1,
    desc: `第 ${index + 1} 个道具。`
}));

const COLUMNS = 5;
const CELL_SIZE = 66;
const GAP = 8;
const ROW_PITCH = CELL_SIZE + GAP;
const VIEW_WIDTH = 372;
const VIEW_HEIGHT = 294;
const ROWS = Math.ceil(items.length / COLUMNS);
const CONTENT_HEIGHT = ROWS * ROW_PITCH;
const MAX_START_ROW = Math.max(0, ROWS - Math.floor(VIEW_HEIGHT / ROW_PITCH));
const MAX_SCROLL = MAX_START_ROW * ROW_PITCH;

// 示例（四）的 live：用元素层等价实现 Scroll 的滚动窗口与滚动条
// 滚动位置只保存在本地 ref，滚动条由计算出的位置绘制
export default defineComponent(() => {
    const selectedId = ref('item-1');
    const scrollTop = ref(0);
    const selectedItem = computed(() =>
        items.find(item => item.id === selectedId.value)
    );
    const startRow = computed(() => Math.round(scrollTop.value / ROW_PITCH));

    // 滚轮与按钮都只调整 scrollTop
    const scrollRows = (delta: number) => {
        const current = Math.round(scrollTop.value / ROW_PITCH);
        const next = Math.max(0, Math.min(MAX_START_ROW, current + delta));
        scrollTop.value = next * ROW_PITCH;
    };

    const onWheel = (ev: { wheelY: number }) => {
        scrollRows(ev.wheelY > 0 ? 1 : -1);
    };

    const backToTop = () => {
        scrollTop.value = 0;
    };

    const toBottom = () => {
        scrollTop.value = MAX_SCROLL;
    };

    const thumbHeight = Math.max(
        28,
        (VIEW_HEIGHT / CONTENT_HEIGHT) * VIEW_HEIGHT
    );
    const thumbY =
        MAX_SCROLL === 0
            ? 0
            : (scrollTop.value / MAX_SCROLL) * (VIEW_HEIGHT - thumbHeight);

    return () => (
        <container loc={[0, 0, 720, 480]}>
            <g-rect loc={[0, 0, 720, 480]} fill fillStyle="#0e141b" />

            <g-rectr
                loc={[30, 30, 660, 420]}
                circle={[18]}
                fill
                fillStyle="#1d2b45"
                stroke
                strokeStyle="#2f6fed"
            />

            <text loc={[54, 52]} text="背包" fillStyle="#e8f0ff" />

            <container loc={[626, 50, 56, 32]}>
                <g-rectr
                    loc={[0, 0, 56, 32]}
                    circle={[8]}
                    fill
                    fillStyle="#7a3d3d"
                />
                <text loc={[14, 8]} text="关闭" fillStyle="#ffe9e9" />
            </container>

            <container loc={[54, 110, 400, 330]}>
                <g-rect loc={[0, 0, 400, 330]} fill fillStyle="#101820" />

                <container
                    loc={[0, 0, VIEW_WIDTH, VIEW_HEIGHT]}
                    onWheel={onWheel}
                >
                    {items.map((item, index) => {
                        const row = Math.floor(index / COLUMNS);
                        // 只渲染视口附近的行，等价于 Scroll 的虚拟滚动
                        if (row < startRow.value || row >= startRow.value + 5) {
                            return null;
                        }
                        const col = index % COLUMNS;
                        return (
                            <container
                                key={item.id}
                                loc={[
                                    col * ROW_PITCH,
                                    (row - startRow.value) * ROW_PITCH
                                ]}
                            >
                                <ItemCell
                                    item={item}
                                    selected={item.id === selectedId.value}
                                    size={CELL_SIZE}
                                    onSelect={id => (selectedId.value = id)}
                                />
                            </container>
                        );
                    })}
                </container>

                <g-rect
                    loc={[378, 0, 6, VIEW_HEIGHT]}
                    fill
                    fillStyle="#1b2634"
                />
                <g-rectr
                    loc={[378, thumbY, 6, thumbHeight]}
                    circle={[3]}
                    fill
                    fillStyle="#3f6fa8"
                />

                <container loc={[0, 302, 90, 28]} onClick={backToTop}>
                    <g-rectr
                        loc={[0, 0, 90, 28]}
                        circle={[6]}
                        fill
                        fillStyle="#2f6fed"
                    />
                    <text loc={[10, 6]} text="回到顶部" fillStyle="#ffffff" />
                </container>
                <container loc={[100, 302, 90, 28]} onClick={toBottom}>
                    <g-rectr
                        loc={[0, 0, 90, 28]}
                        circle={[6]}
                        fill
                        fillStyle="#33465f"
                    />
                    <text loc={[10, 6]} text="滚到底部" fillStyle="#e8f0ff" />
                </container>
                <text
                    loc={[204, 308]}
                    text={`已滚动 ${scrollTop.value} / ${MAX_SCROLL}`}
                    fillStyle="#8fb6ff"
                />
            </container>

            <container loc={[470, 110, 196, 330]}>
                <ItemDetail
                    item={selectedItem.value}
                    onClear={() => (selectedId.value = '')}
                />
            </container>
        </container>
    );
});
