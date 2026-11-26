import { defineComponent, markRaw } from 'vue';
import { TextContent } from '../../../../../packages-user/client-base/src/components/textbox';
import { TextContentTyper } from '../../../../../packages-user/client-base/src/components/textboxTyper';

const FIXED_TYPER = markRaw(
    new TextContentTyper({
        lineHeight: 8,
        fillStyle: '#e8f0ff'
    })
);

const AUTO_TYPER = markRaw(
    new TextContentTyper({
        lineHeight: 8,
        fillStyle: '#e8f0ff'
    })
);

const TEXT =
    '同一段文字放在固定高度与自适应高度的组件里。固定高度只保留前几行，' +
    '更多内容会被裁掉；自适应高度会按实际排版结果重新计算高度。';

// 高度：左侧固定高度，右侧 autoHeight 按内容长高
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <g-rect loc={[24, 64, 212, 212]} fillStyle="#101820" />
            <g-rect loc={[244, 64, 212, 212]} fillStyle="#101820" />

            <text loc={[40, 32]} text="固定高度 64" fillStyle="#f2b84b" />
            <text loc={[260, 32]} text="autoHeight" fillStyle="#7ee787" />

            <TextContent
                loc={[40, 80, 180, 64]}
                typer={FIXED_TYPER}
                text={TEXT}
            />
            <TextContent
                loc={[260, 80, 180, 64]}
                autoHeight
                typer={AUTO_TYPER}
                text={TEXT}
            />

            <text
                loc={[40, 248]}
                text="固定高度：多出的行被裁掉"
                fillStyle="#8b98a8"
            />
            <text
                loc={[260, 248]}
                text="autoHeight：占用高度随内容增加"
                fillStyle="#8b98a8"
            />
        </container>
    );
});
