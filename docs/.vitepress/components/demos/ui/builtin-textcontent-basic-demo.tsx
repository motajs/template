import { defineComponent, markRaw } from 'vue';
import { TextContent } from '../../../../../packages-user/client-base/src/components/textbox';
import { TextContentTyper } from '../../../../../packages-user/client-base/src/components/textboxTyper';

const TYPER = markRaw(
    new TextContentTyper({
        lineHeight: 8,
        fillStyle: '#e8f0ff'
    })
);

const TEXT =
    '这段文字只给了 loc 的四个值：位置、折行宽度与高度。' +
    '超出宽度的部分会自动换到下一行，行与行之间留出 8 像素额外间距。';

// 基本用法：loc 四项同时给位置、折行宽度与高度，长句按宽度折行
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text loc={[40, 24]} text="loc 的四个值" fillStyle="#cfe0ff" />

            <g-rect loc={[24, 56, 432, 200]} fillStyle="#101820" />
            <TextContent loc={[40, 72, 400, 168]} typer={TYPER} text={TEXT} />
        </container>
    );
});
