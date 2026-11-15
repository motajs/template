import {
    computed,
    defineComponent,
    onMounted,
    onUnmounted,
    ref,
    watch
} from 'vue';

interface Item {
    id: string;
    name: string;
    count: number;
    desc: string;
}

interface ItemCellProps {
    item: Item;
    selected: boolean;
    equipped: boolean;
    size: number;
    pulse: number;
}

type ItemCellEmits = {
    select: (id: string) => void;
};

interface ItemCellOptions {
    props: (keyof ItemCellProps)[];
    emits: (keyof ItemCellEmits)[];
}

const itemCellOptions: ItemCellOptions = {
    props: ['item', 'selected', 'equipped', 'size', 'pulse'],
    emits: ['select']
};

// 完整示例把网格、详情、滚动、装备与动画放在一个文件里
const ItemCell = defineComponent<
    ItemCellProps,
    ItemCellEmits,
    keyof ItemCellEmits
>((props, { emit }) => {
    const strokeStyle = computed(() => {
        if (props.equipped) return '#7ee787';
        if (props.selected) return '#f2b84b';
        return '#33465f';
    });

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
                strokeStyle={strokeStyle.value}
                alpha={props.selected ? props.pulse : 1}
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
    pulse: number;
}

type ItemDetailEmits = {
    clear: () => void;
};

interface ItemDetailOptions {
    props: (keyof ItemDetailProps)[];
    emits: (keyof ItemDetailEmits)[];
}

const itemDetailOptions: ItemDetailOptions = {
    props: ['item', 'pulse'],
    emits: ['clear']
};

const ItemDetail = defineComponent<
    ItemDetailProps,
    ItemDetailEmits,
    keyof ItemDetailEmits
>((props, { emit }) => {
    return () => (
        <container loc={[0, 0, 196, 280]}>
            <g-rect loc={[0, 0, 196, 280]} fill fillStyle="#101820" />
            {/* 顶部亮条只改 alpha 与 scale，不重建组件 */}
            <g-rect
                loc={[0, 0, 196, 4]}
                fill
                fillStyle="#f2b84b"
                alpha={props.pulse}
                scale={[1, 0.5 + props.pulse]}
            />
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

            <container loc={[16, 236, 164, 28]} onClick={() => emit('clear')}>
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

interface ActionBarProps {
    canEquip: boolean;
    canUse: boolean;
    equipped: boolean;
}

type ActionBarEmits = {
    equip: () => void;
    use: () => void;
    close: () => void;
};

interface ActionBarOptions {
    props: (keyof ActionBarProps)[];
    emits: (keyof ActionBarEmits)[];
}

const actionBarOptions: ActionBarOptions = {
    props: ['canEquip', 'canUse', 'equipped'],
    emits: ['equip', 'use', 'close']
};

const ActionBar = defineComponent<
    ActionBarProps,
    ActionBarEmits,
    keyof ActionBarEmits
>((props, { emit }) => {
    const makeButton = (
        x: number,
        label: string,
        enabled: boolean,
        onClick: () => void
    ) => (
        <container
            loc={[x, 0, 96, 32]}
            onClick={() => {
                if (!enabled) return;
                onClick();
            }}
        >
            <g-rectr
                loc={[0, 0, 96, 32]}
                circle={[8]}
                fill
                fillStyle={enabled ? '#2f6fed' : '#26364d'}
                alpha={enabled ? 1 : 0.5}
            />
            <text loc={[12, 8]} text={label} fillStyle="#ffffff" />
        </container>
    );

    return () => (
        <container loc={[0, 0, 304, 32]}>
            {makeButton(
                0,
                props.equipped ? '已装备' : '装备',
                props.canEquip,
                () => emit('equip')
            )}
            {makeButton(104, '使用', props.canUse, () => emit('use'))}
            {makeButton(208, '关闭', true, () => emit('close'))}
        </container>
    );
}, actionBarOptions);

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

const sourceItems: Item[] = Array.from({ length: 40 }, (_, index) => ({
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
const VIEW_HEIGHT = 244;
const ROWS = Math.ceil(sourceItems.length / COLUMNS);
const MAX_START_ROW = Math.max(0, ROWS - Math.floor(VIEW_HEIGHT / ROW_PITCH));
const MAX_SCROLL = MAX_START_ROW * ROW_PITCH;

// 示例（六）的 live：完整背包面板，含动画与关闭 / 重新打开
// InventoryPanel 是唯一注册为 GameUI 的根组件
const InventoryPanel = defineComponent(() => {
    const items = ref<Item[]>(sourceItems.map(item => ({ ...item })));
    const selectedId = ref('item-1');
    const equippedId = ref('');
    const hint = ref('选择道具后可以装备或使用');
    const scrollTop = ref(0);
    const closed = ref(false);
    const pulse = ref(0.4);
    let raf = 0;

    const tick = (now: number) => {
        const phase = (now % 1600) / 1600;
        pulse.value = 0.35 + Math.sin(phase * Math.PI * 2) * 0.3;
        raf = requestAnimationFrame(tick);
    };

    onMounted(() => {
        raf = requestAnimationFrame(tick);
    });

    onUnmounted(() => {
        // 卸载后必须停掉，否则回调会继续访问已销毁的组件
        cancelAnimationFrame(raf);
    });

    const selectedItem = computed(() =>
        items.value.find(item => item.id === selectedId.value)
    );
    const canEquip = computed(() => !!selectedItem.value);
    const canUse = computed(
        () => !!selectedItem.value && selectedItem.value.count > 0
    );
    const isEquipped = computed(
        () => !!selectedId.value && equippedId.value === selectedId.value
    );
    const startRow = computed(() => Math.round(scrollTop.value / ROW_PITCH));

    const equip = () => {
        if (!selectedItem.value) return;
        equippedId.value = selectedItem.value.id;
        hint.value = `已装备：${selectedItem.value.name}`;
    };

    const use = () => {
        const item = selectedItem.value;
        if (!item || item.count <= 0) return;
        item.count -= 1;
    };

    watch(
        () => selectedItem.value?.count ?? 0,
        (next, prev) => {
            hint.value = `数量：${prev} → ${next}`;
        }
    );

    const scrollRows = (delta: number) => {
        const current = Math.round(scrollTop.value / ROW_PITCH);
        const next = Math.max(0, Math.min(MAX_START_ROW, current + delta));
        scrollTop.value = next * ROW_PITCH;
    };

    const onWheel = (ev: { wheelY: number }) => {
        scrollRows(ev.wheelY > 0 ? 1 : -1);
    };

    const thumbHeight = Math.max(
        28,
        (VIEW_HEIGHT / (ROWS * ROW_PITCH)) * VIEW_HEIGHT
    );
    const thumbY =
        MAX_SCROLL === 0
            ? 0
            : (scrollTop.value / MAX_SCROLL) * (VIEW_HEIGHT - thumbHeight);

    return () => (
        <container loc={[0, 0, 720, 480]}>
            <g-rect loc={[0, 0, 720, 480]} fill fillStyle="#0e141b" />

            <container loc={[0, 0, 720, 480]} hidden={closed.value}>
                <g-rectr
                    loc={[30, 30, 660, 420]}
                    circle={[18]}
                    fill
                    fillStyle="#1d2b45"
                    stroke
                    strokeStyle="#2f6fed"
                />

                {/* 呼吸边框只改 alpha，不每帧重建 */}
                <g-rectr
                    loc={[30, 30, 660, 420]}
                    circle={[18]}
                    stroke
                    strokeStyle="#f2b84b"
                    alpha={pulse.value * 0.6}
                />

                <text loc={[54, 52]} text="背包" fillStyle="#e8f0ff" />

                <container
                    loc={[626, 50, 56, 32]}
                    onClick={() => (closed.value = true)}
                >
                    <g-rectr
                        loc={[0, 0, 56, 32]}
                        circle={[8]}
                        fill
                        fillStyle="#7a3d3d"
                    />
                    <text loc={[14, 8]} text="关闭" fillStyle="#ffe9e9" />
                </container>

                <container loc={[54, 100, 400, 280]}>
                    <g-rect loc={[0, 0, 400, 280]} fill fillStyle="#101820" />

                    <container
                        loc={[0, 0, VIEW_WIDTH, VIEW_HEIGHT]}
                        onWheel={onWheel}
                    >
                        {items.value.map((item, index) => {
                            const row = Math.floor(index / COLUMNS);
                            if (
                                row < startRow.value ||
                                row >= startRow.value + 4
                            ) {
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
                                        equipped={item.id === equippedId.value}
                                        size={CELL_SIZE}
                                        pulse={pulse.value}
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

                    <container
                        loc={[0, 252, 90, 28]}
                        onClick={() => scrollRows(-1)}
                    >
                        <g-rectr
                            loc={[0, 0, 90, 28]}
                            circle={[6]}
                            fill
                            fillStyle="#33465f"
                        />
                        <text loc={[10, 6]} text="上一行" fillStyle="#e8f0ff" />
                    </container>
                    <container
                        loc={[100, 252, 90, 28]}
                        onClick={() => scrollRows(1)}
                    >
                        <g-rectr
                            loc={[0, 0, 90, 28]}
                            circle={[6]}
                            fill
                            fillStyle="#33465f"
                        />
                        <text loc={[10, 6]} text="下一行" fillStyle="#e8f0ff" />
                    </container>
                    <text
                        loc={[204, 258]}
                        text={`已滚动 ${scrollTop.value} / ${MAX_SCROLL}`}
                        fillStyle="#8fb6ff"
                    />
                </container>

                <container loc={[470, 100, 196, 280]}>
                    <ItemDetail
                        item={selectedItem.value}
                        pulse={pulse.value}
                        onClear={() => (selectedId.value = '')}
                    />
                </container>

                <container loc={[54, 392, 304, 32]}>
                    <ActionBar
                        canEquip={canEquip.value}
                        canUse={canUse.value}
                        equipped={isEquipped.value}
                        onEquip={equip}
                        onUse={use}
                        onClose={() => (closed.value = true)}
                    />
                </container>

                <text loc={[54, 432]} text={hint.value} fillStyle="#8fb6ff" />
            </container>

            <container loc={[0, 0, 720, 480]} hidden={!closed.value}>
                <text loc={[300, 220]} text="面板已关闭" fillStyle="#e8f0ff" />
                <container
                    loc={[300, 260, 120, 32]}
                    onClick={() => (closed.value = false)}
                >
                    <g-rectr
                        loc={[0, 0, 120, 32]}
                        circle={[8]}
                        fill
                        fillStyle="#2f6fed"
                    />
                    <text loc={[18, 8]} text="重新打开" fillStyle="#ffffff" />
                </container>
            </container>
        </container>
    );
});

export default InventoryPanel;
