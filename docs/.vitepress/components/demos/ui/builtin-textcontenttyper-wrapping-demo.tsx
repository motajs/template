import { Font } from '@motajs/render';
import { defineComponent, markRaw } from 'vue';
import { TextContent } from '../../../../../packages-user/client-base/src/components/textbox';
import {
    TextContentTyper,
    WordBreak
} from '../../../../../packages-user/client-base/src/components/textboxTyper';

const TEXT =
    'alpha beta gamma Supercalifragilisticexpialidocious delta epsilon';

const NONE = markRaw(
    new TextContentTyper({
        font: new Font('Verdana', 14),
        lineHeight: 4,
        wordBreak: WordBreak.None,
        fillStyle: '#f2b84b'
    })
);

const SPACE = markRaw(
    new TextContentTyper({
        font: new Font('Verdana', 14),
        lineHeight: 4,
        wordBreak: WordBreak.Space,
        fillStyle: '#7ee787'
    })
);

const ALL = markRaw(
    new TextContentTyper({
        font: new Font('Verdana', 14),
        lineHeight: 4,
        wordBreak: WordBreak.All,
        fillStyle: '#58c4dd'
    })
);

// 折行规则：None 一行到底，Space 在空格与 CJK 处折行，All 任意字符可折行
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <g-rect loc={[20, 52, 136, 220]} fillStyle="#101820" />
            <g-rect loc={[172, 52, 136, 220]} fillStyle="#101820" />
            <g-rect loc={[324, 52, 136, 220]} fillStyle="#101820" />

            <text loc={[28, 24]} text="None" fillStyle="#8b98a8" />
            <text loc={[180, 24]} text="Space" fillStyle="#8b98a8" />
            <text loc={[332, 24]} text="All" fillStyle="#8b98a8" />

            <TextContent
                loc={[28, 72, 120, 180]}
                autoHeight
                typer={NONE}
                text={TEXT}
            />
            <TextContent
                loc={[180, 72, 120, 180]}
                autoHeight
                typer={SPACE}
                text={TEXT}
            />
            <TextContent
                loc={[332, 72, 120, 180]}
                autoHeight
                typer={ALL}
                text={TEXT}
            />
        </container>
    );
});
