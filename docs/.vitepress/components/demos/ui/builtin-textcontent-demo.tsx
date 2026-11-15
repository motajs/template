import { defineComponent } from 'vue';
import { TextContent } from '../../../../../packages-user/client-base/src/components/textbox';

const TEXT =
    '[c=#f2b84b][s=20]标题字号[/s][/c]\n' +
    '[c=#7ee787]正文颜色，长句会按 width 折行，超出宽度的部分自动换到下一行[/c]\n' +
    '[c=#8aa0b8][s=13]小字注释：[[[[ 和 ]]]] 显示为方括号[/s][/c]';

// 文本标记：颜色、字号、手动换行与方括号字面量，长句按 width 折行
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text loc={[40, 24]} text="文本标记" fillStyle="#cfe0ff" />

            <g-rect loc={[40, 56, 400, 216]} fillStyle="#101820" />
            <TextContent
                loc={[60, 80]}
                width={360}
                autoHeight
                lineHeight={8}
                text={TEXT}
                fillStyle="#e8f0ff"
            />
        </container>
    );
});
