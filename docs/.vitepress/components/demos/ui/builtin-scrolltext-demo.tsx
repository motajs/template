import { defineComponent, onUnmounted, ref } from 'vue';
import {
    ScrollText,
    ScrollTextExpose
} from '../../../../../packages-user/client-base/src/components/misc';

const NOTICE = [
    '公告：今晚八点维护',
    '提示：记得保存进度',
    '活动：新地图开放',
    '注意：离开前先存档'
]
    .join('\n')
    .repeat(3);

// 滚动文字：内容在固定视口里向上滚动，超出视口的部分不显示
export default defineComponent(() => {
    const scroll = ref<ScrollTextExpose>();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const restart = () => {
        // 组件触发 scrollEnd 后会立刻暂停，等一小段可见停顿后再恢复
        timer = setTimeout(() => {
            timer = undefined;
            scroll.value?.rescroll();
            scroll.value?.resume();
        }, 1000);
    };

    onUnmounted(() => {
        if (timer !== undefined) clearTimeout(timer);
    });

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text loc={[40, 32]} text="公告" fillStyle="#cfe0ff" />

            <ScrollText
                ref={scroll}
                loc={[40, 60, 400, 160]}
                width={400}
                speed={80}
                text={NOTICE}
                fillStyle="#7ee787"
                onScrollEnd={restart}
            />
        </container>
    );
});
