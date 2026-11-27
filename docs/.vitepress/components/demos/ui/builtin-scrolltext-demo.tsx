import { defineComponent, markRaw, onUnmounted, ref } from 'vue';
import {
    ScrollText,
    ScrollTextExpose
} from '../../../../../packages-user/client-base/src/components/misc';
import { TextContentTyper } from '../../../../../packages-user/client-base/src/components/textboxTyper';

const TYPER = markRaw(
    new TextContentTyper({
        lineHeight: 8,
        fillStyle: '#7ee787'
    })
);

const NOTICE = [
    '公告：今晚八点维护',
    '提示：记得保存进度',
    '活动：新地图开放',
    '注意：离开前先存档'
]
    .join('\n')
    .repeat(3);

// 基本滚动：内容在固定视口里向上滚动，滚到底后停顿再从头开始
export default defineComponent(() => {
    const scroll = ref<ScrollTextExpose>();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const restart = () => {
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

            <text loc={[40, 28]} text="滚动公告" fillStyle="#cfe0ff" />

            <g-rect loc={[40, 60, 400, 170]} fillStyle="#101820" />
            <ScrollText
                ref={scroll}
                loc={[40, 60, 400, 170]}
                width={400}
                speed={70}
                typer={TYPER}
                text={NOTICE}
                onScrollEnd={restart}
            />
        </container>
    );
});
