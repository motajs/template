import { defineComponent, ref } from 'vue';
import { List } from '../../../../../packages-user/client-base/src/components/list';

const ITEMS: [string, string][] = [
    ['basic', '基础设置'],
    ['sound', '声音'],
    ['key', '按键'],
    ['about', '关于']
];

// 列表：四项由 list 渲染，选中项显示闪烁光标
export default defineComponent(() => {
    const selected = ref(ITEMS[0][0]);

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <List
                loc={[40, 40, 300, 160]}
                list={ITEMS}
                lineHeight={32}
                color="#2b4a6f"
                border="#6fa8ff"
                alphaRange={[0.6, 0.9]}
                v-model:selected={selected.value}
            />
        </container>
    );
});
