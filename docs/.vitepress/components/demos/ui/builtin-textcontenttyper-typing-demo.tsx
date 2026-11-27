import { defineComponent, markRaw, nextTick, ref } from 'vue';
import {
    TextContent,
    TextContentExpose
} from '../../../../../packages-user/client-base/src/components/textbox';
import { TextContentTyper } from '../../../../../packages-user/client-base/src/components/textboxTyper';

const TYPER = markRaw(
    new TextContentTyper({
        interval: 80,
        lineHeight: 6,
        fillStyle: '#e8f0ff'
    })
);

const TEXT =
    '第一行：点击开始后逐字出现。\n' +
    '[c=#f2b84b]第二行：interval 控制每个字的间隔。[/c]\n' +
    '[w=8]等待八个字的打字时间后继续。\n' +
    '[c=#7ee787]最后一行：可以随时立即显示全文。[/c]';

// 打字演示：初始不开始，按按钮后才逐字显示；重播与立即显示都是真实方法
export default defineComponent(() => {
    const content = ref<TextContentExpose>();
    const started = ref(false);
    const status = ref('等待开始');

    const start = async () => {
        if (!started.value) {
            started.value = true;
            await nextTick();
        }
        content.value?.retype();
    };

    const reveal = () => {
        content.value?.showAll();
    };

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text loc={[40, 24]} text="打字演示" fillStyle="#cfe0ff" />
            <text loc={[40, 48]} text={status.value} fillStyle="#8b98a8" />

            <g-rect loc={[24, 76, 432, 150]} fillStyle="#101820" />
            <TextContent
                ref={content}
                loc={[40, 90, 400, 120]}
                autoHeight
                typer={TYPER}
                text={started.value ? TEXT : ''}
                onTypeStart={() => {
                    if (started.value) status.value = '正在打字';
                }}
                onTypeEnd={() => {
                    if (started.value) status.value = '打字结束';
                }}
            />

            <container loc={[40, 246, 120, 30]} onClick={start}>
                <g-rectr
                    loc={[0, 0, 120, 30]}
                    circle={[6]}
                    fillStyle="#2f6fed"
                />
                <text loc={[14, 7]} text="开始 / 重播" fillStyle="#ffffff" />
            </container>
            <container loc={[176, 246, 120, 30]} onClick={reveal}>
                <g-rectr
                    loc={[0, 0, 120, 30]}
                    circle={[6]}
                    fillStyle="#33465f"
                />
                <text loc={[14, 7]} text="立即显示" fillStyle="#e8f0ff" />
            </container>
        </container>
    );
});
