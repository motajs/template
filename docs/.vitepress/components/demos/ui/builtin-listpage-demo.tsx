import { defineComponent, ref } from 'vue';
import { ListPage } from '../../../../../packages-user/client-base/src/components/list';

const ITEMS: [string, string][] = [
    ['basic', '基础设置'],
    ['sound', '声音'],
    ['key', '按键']
];
const DETAIL: Record<string, string> = {
    basic: '这里放基础设置的说明。',
    sound: '这里放音量与音效的说明。',
    key: '这里放按键改绑的说明。'
};

// 左列表、右详情：选中项高亮，右侧显示对应内容
export default defineComponent(() => {
    const selected = ref(ITEMS[0][0]);

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <ListPage
                loc={[40, 40, 400, 240]}
                list={ITEMS}
                v-model:selected={selected.value}
            >
                {(key: string) => (
                    <text
                        loc={[16, 16]}
                        text={DETAIL[key] ?? '没有内容'}
                        fillStyle="#e8f0ff"
                    />
                )}
            </ListPage>
        </container>
    );
});
