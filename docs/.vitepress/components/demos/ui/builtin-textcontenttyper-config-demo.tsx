import { Font } from '@motajs/render';
import { defineComponent, markRaw } from 'vue';
import { TextContent } from '../../../../../packages-user/client-base/src/components/textbox';
import {
    TextAlign,
    TextContentTyper
} from '../../../../../packages-user/client-base/src/components/textboxTyper';

const TEXT = '字体与字号\n行高与对齐\n颜色来自 typer';

const LEFT = markRaw(
    new TextContentTyper({
        font: new Font('Verdana', 18),
        lineHeight: 8,
        textAlign: TextAlign.Left,
        fillStyle: '#e8f0ff'
    })
);

const CENTER = markRaw(
    new TextContentTyper({
        font: new Font('Georgia', 18),
        lineHeight: 12,
        textAlign: TextAlign.Center,
        fillStyle: '#7ee787'
    })
);

const RIGHT = markRaw(
    new TextContentTyper({
        font: new Font('Courier New', 16),
        lineHeight: 6,
        textAlign: TextAlign.Right,
        fillStyle: '#f2b84b'
    })
);

// typer 配置：字体、字号、行高、对齐与填充色分别写在三个 typer 上
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <g-rect loc={[24, 52, 132, 210]} fillStyle="#101820" />
            <g-rect loc={[174, 52, 132, 210]} fillStyle="#101820" />
            <g-rect loc={[324, 52, 132, 210]} fillStyle="#101820" />

            <text loc={[32, 24]} text="左对齐" fillStyle="#8b98a8" />
            <text loc={[182, 24]} text="居中" fillStyle="#8b98a8" />
            <text loc={[332, 24]} text="右对齐" fillStyle="#8b98a8" />

            <TextContent
                loc={[32, 72, 116, 170]}
                autoHeight
                typer={LEFT}
                text={TEXT}
            />
            <TextContent
                loc={[182, 72, 116, 170]}
                autoHeight
                typer={CENTER}
                text={TEXT}
            />
            <TextContent
                loc={[332, 72, 116, 170]}
                autoHeight
                typer={RIGHT}
                text={TEXT}
            />
        </container>
    );
});
