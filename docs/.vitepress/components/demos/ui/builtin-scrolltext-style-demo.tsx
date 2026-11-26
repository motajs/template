import { Font } from '@motajs/render';
import { defineComponent, markRaw, onUnmounted, ref } from 'vue';
import {
    ScrollText,
    ScrollTextExpose
} from '../../../../../packages-user/client-base/src/components/misc';
import { TextContentTyper } from '../../../../../packages-user/client-base/src/components/textboxTyper';

const TYPER = markRaw(
    new TextContentTyper({
        font: new Font('Verdana', 18),
        lineHeight: 10,
        fillStyle: '#e8f0ff',
        strokeStyle: '#58c4dd',
        strokeWidth: 2
    })
);

const NOTICE = [
    '字体：Verdana 18px。',
    '行距：lineHeight 为 10。',
    '填充：浅色文字；描边：蓝色，线宽 2。',
    '间距：pad 让文字先从视口下方进入。'
]
    .join('\n')
    .repeat(2);

// 文本样式：typer 控制字体、行距、填充与描边，文字宽度与视口一致
export default defineComponent(() => {
    const scroll = ref<ScrollTextExpose>();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const restart = () => {
        timer = setTimeout(() => {
            timer = undefined;
            scroll.value?.rescroll();
            scroll.value?.resume();
        }, 1200);
    };

    onUnmounted(() => {
        if (timer !== undefined) clearTimeout(timer);
    });

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text loc={[40, 24]} text="文本样式" fillStyle="#cfe0ff" />

            <g-rect loc={[40, 56, 400, 190]} fillStyle="#101820" />

            <ScrollText
                ref={scroll}
                loc={[40, 56, 400, 190]}
                width={400}
                speed={55}
                pad={32}
                fill
                stroke
                typer={TYPER}
                text={NOTICE}
                onScrollEnd={restart}
            />
        </container>
    );
});
