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

// 网格、详情与父组件共享同一份道具数据
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

interface ItemGridProps {
    items: Item[];
    selectedId: string;
    columns: number;
    cellSize: number;
    gap: number;
}

type ItemGridEmits = {
    select: (id: string) => void;
};

interface ItemGridOptions {
    props: (keyof ItemGridProps)[];
    emits: (keyof ItemGridEmits)[];
}

const itemGridOptions: ItemGridOptions = {
    props: ['items', 'selectedId', 'columns', 'cellSize', 'gap'],
    emits: ['select']
};

const ItemGrid = defineComponent<
    ItemGridProps,
    ItemGridEmits,
    keyof ItemGridEmits
>((props, { emit }) => {
    return () => (
        <container loc={[0, 0, 0, 0]}>
            {props.items.map((item, index) => {
                const col = index % props.columns;
                const row = Math.floor(index / props.columns);
                const x = col * (props.cellSize + props.gap);
                const y = row * (props.cellSize + props.gap);
                return (
                    <container loc={[x, y]}>
                        <ItemCell
                            item={item}
                            selected={item.id === props.selectedId}
                            size={props.cellSize}
                            onSelect={id => emit('select', id)}
                        />
                    </container>
                );
            })}
        </container>
    );
}, itemGridOptions);

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

// 右侧详情：没有选中时显示提示，有选中时显示名称、数量与描述
// 详情只接收选中的道具，没有选中时显示提示
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

            {/* 两块都渲染，用 hidden 切换 */}
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
                <text
                    loc={[16, 156]}
                    text="live 用 text 等价展示说明"
                    fillStyle="#4f6d94"
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

// 假数据只用于演示，可替换成存档数据
const items: Item[] = [
    { id: 'potion-red', name: '红药水', count: 3, desc: '恢复少量生命。' },
    { id: 'potion-blue', name: '蓝药水', count: 1, desc: '恢复少量魔力。' },
    { id: 'key-yellow', name: '黄钥匙', count: 5, desc: '打开黄色的门。' },
    { id: 'key-blue', name: '蓝钥匙', count: 2, desc: '打开蓝色的门。' },
    { id: 'sword-wood', name: '木剑', count: 1, desc: '最基础的武器。' },
    { id: 'shield-wood', name: '木盾', count: 1, desc: '最基础的防具。' },
    { id: 'gem-red', name: '红宝石', count: 4, desc: '镶嵌用的素材。' },
    { id: 'gem-blue', name: '蓝宝石', count: 2, desc: '镶嵌用的素材。' },
    { id: 'scroll', name: '回城卷轴', count: 1, desc: '回到起点。' },
    { id: 'bread', name: '面包', count: 6, desc: '恢复少量生命。' }
];

// 示例（三）的 live：骨架 + 网格 + 选中态 + 详情区
export default defineComponent(() => {
    const selectedId = ref('potion-red');
    const selectedItem = computed(() =>
        items.find(item => item.id === selectedId.value)
    );

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
                <ItemGrid
                    items={items}
                    selectedId={selectedId.value}
                    columns={5}
                    cellSize={66}
                    gap={8}
                    onSelect={id => (selectedId.value = id)}
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
