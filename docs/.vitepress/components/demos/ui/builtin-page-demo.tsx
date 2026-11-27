import { defineComponent, ref } from 'vue';
import { Page } from '../../../../../packages-user/client-base/src/components/page';

const PAGES = ['第一页：基础设置', '第二页：声音', '第三页：按键'];

// 分页：三页内容共用一个 loc，页码条在底部
export default defineComponent(() => {
    const page = ref(0);

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <Page pages={3} v-model:page={page.value} loc={[90, 48, 300, 200]}>
                {(index: number) => (
                    <text
                        loc={[16, 16]}
                        text={PAGES[index] ?? ''}
                        fillStyle="#e8f0ff"
                    />
                )}
            </Page>
        </container>
    );
});
