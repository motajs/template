import { computed, defineComponent } from 'vue';

interface ItemCardProps {
    position: [number, number];
    label: string;
    color?: string;
}

interface ItemCardOptions {
    props: (keyof ItemCardProps)[];
}

const itemCardOptions: ItemCardOptions = {
    props: ['position', 'label', 'color']
};

// 子组件：只按 props 决定卡片的位置、文字与颜色
const ItemCard = defineComponent<ItemCardProps>(props => {
    // 没有传 color 时使用默认颜色
    const color = computed(() => props.color ?? '#f2b84b');

    return () => (
        <container loc={props.position}>
            <g-rect loc={[0, 0, 220, 64]} fillStyle={color.value} />
            <text loc={[16, 22]} text={props.label} fillStyle="#ffffff" />
        </container>
    );
}, itemCardOptions);

// 父组件：同一个 ItemCard 声明一次，用三次，只改传入的 props
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />
            <text
                loc={[40, 24]}
                text="同一个组件，不同的 props"
                fillStyle="#cfe0ff"
            />
            <ItemCard position={[40, 56]} label="卡片 A" color="#2f6fed" />
            <ItemCard position={[40, 144]} label="卡片 B" color="#7ee787" />
            <ItemCard position={[40, 232]} label="卡片 C" />
        </container>
    );
});
