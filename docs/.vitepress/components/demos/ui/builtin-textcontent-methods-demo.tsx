import { defineComponent, markRaw, ref } from 'vue';
import {
    TextContent,
    TextContentExpose
} from '../../../../../packages-user/client-base/src/components/textbox';
import { TextContentTyper } from '../../../../../packages-user/client-base/src/components/textboxTyper';

const TYPER = markRaw(
    new TextContentTyper({
        interval: 55,
        lineHeight: 6,
        fillStyle: '#e8f0ff'
    })
);

const TEXT =
    '这段文字会逐字显示。[w=8]等待八个字的打字时间后继续。\n' +
    '[c=#7ee787]可以用按钮重播、立即显示全文，或者读取当前高度。[/c]';

// 实例方法：重播、立即显示与读取总高度
export default defineComponent(() => {
    const content = ref<TextContentExpose>();
    const height = ref(0);

    const replay = () => {
        content.value?.retype();
    };

    const reveal = () => {
        content.value?.showAll();
    };

    const readHeight = () => {
        height.value = content.value?.getHeight() ?? 0;
    };

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text loc={[40, 24]} text="实例方法" fillStyle="#cfe0ff" />
            <text
                loc={[40, 208]}
                text={`当前高度：${Math.round(height.value)}`}
                fillStyle="#8b98a8"
            />

            <g-rect loc={[24, 52, 432, 148]} fillStyle="#101820" />
            <TextContent
                ref={content}
                loc={[40, 68, 400, 116]}
                autoHeight
                typer={TYPER}
                text={TEXT}
                onUpdateHeight={value => (height.value = value)}
            />

            <container loc={[40, 246, 100, 30]} onClick={replay}>
                <g-rectr
                    loc={[0, 0, 100, 30]}
                    circle={[6]}
                    fillStyle="#2f6fed"
                />
                <text loc={[14, 7]} text="重播" fillStyle="#ffffff" />
            </container>
            <container loc={[152, 246, 120, 30]} onClick={reveal}>
                <g-rectr
                    loc={[0, 0, 120, 30]}
                    circle={[6]}
                    fillStyle="#33465f"
                />
                <text loc={[14, 7]} text="立即显示" fillStyle="#e8f0ff" />
            </container>
            <container loc={[284, 246, 120, 30]} onClick={readHeight}>
                <g-rectr
                    loc={[0, 0, 120, 30]}
                    circle={[6]}
                    fillStyle="#33465f"
                />
                <text loc={[14, 7]} text="读取高度" fillStyle="#e8f0ff" />
            </container>
        </container>
    );
});
