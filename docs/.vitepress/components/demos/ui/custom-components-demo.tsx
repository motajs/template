import { computed, defineComponent, ref } from 'vue';

interface ItemCardProps {
    label: string;
    active?: boolean;
}

type ItemCardEmits = {
    pick: (label: string) => void;
};

interface ItemCardOptions {
    props: (keyof ItemCardProps)[];
    emits: (keyof ItemCardEmits)[];
}

const itemCardOptions: ItemCardOptions = {
    props: ['label', 'active'],
    emits: ['pick']
};

// 子组件：按 props 决定颜色，点击时发出 pick 事件，底部内容由默认 slot 填入
const ItemCard = defineComponent<
    ItemCardProps,
    ItemCardEmits,
    keyof ItemCardEmits
>((props, { emit, slots }) => {
    const fill = computed(() => (props.active ? '#2f6fed' : '#26364d'));

    return () => (
        <container
            loc={[0, 0, 200, 96]}
            onClick={() => emit('pick', props.label)}
        >
            <g-rect loc={[0, 0, 200, 96]} fillStyle={fill.value} />
            <text loc={[12, 12]} text={props.label} fillStyle="#ffffff" />
            {slots.default?.()}
        </container>
    );
}, itemCardOptions);

// 父组件：用 ref 保存选中项，把 props、事件与默认 slot 传给两个卡片
export default defineComponent(() => {
    const selected = ref('甲');

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />
            <text
                loc={[24, 28]}
                text={`当前选择：${selected.value}`}
                fillStyle="#cfe0ff"
            />
            <container loc={[24, 72]}>
                <ItemCard
                    label="甲"
                    active={selected.value === '甲'}
                    onPick={label => (selected.value = label)}
                >
                    <text loc={[12, 60]} text="点我选择" fillStyle="#cfe0ff" />
                </ItemCard>
            </container>
            <container loc={[256, 72]}>
                <ItemCard
                    label="乙"
                    active={selected.value === '乙'}
                    onPick={label => (selected.value = label)}
                >
                    <text loc={[12, 60]} text="点我选择" fillStyle="#cfe0ff" />
                </ItemCard>
            </container>
        </container>
    );
});
