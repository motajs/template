import { defineComponent, markRaw } from 'vue';
import { TextContent } from '../../../../../packages-user/client-base/src/components/textbox';
import { TextContentTyper } from '../../../../../packages-user/client-base/src/components/textboxTyper';

const FILL = markRaw(
    new TextContentTyper({
        fillStyle: '#58c4dd',
        lineHeight: 4
    })
);

const STROKE = markRaw(
    new TextContentTyper({
        fillStyle: '#58c4dd',
        strokeStyle: '#e8f0ff',
        strokeWidth: 3,
        lineHeight: 4
    })
);

const BOTH = markRaw(
    new TextContentTyper({
        fillStyle: '#58c4dd',
        strokeStyle: '#e8f0ff',
        strokeWidth: 3,
        lineHeight: 4
    })
);

// 填充与描边：fill、stroke 是模式开关，颜色与线宽来自 typer
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text loc={[40, 36]} text="只填充" fillStyle="#8b98a8" />
            <TextContent
                loc={[40, 62, 400, 34]}
                autoHeight
                typer={FILL}
                text="fill 默认开启，颜色来自 typer 的 fillStyle。"
            />

            <text loc={[40, 118]} text="只描边" fillStyle="#8b98a8" />
            <TextContent
                loc={[40, 144, 400, 34]}
                autoHeight
                fill={false}
                stroke
                typer={STROKE}
                text="只描边要写 fill={false} stroke，颜色与线宽来自 typer。"
            />

            <text loc={[40, 200]} text="填充加描边" fillStyle="#8b98a8" />
            <TextContent
                loc={[40, 226, 400, 34]}
                autoHeight
                fill
                stroke
                typer={BOTH}
                text="同时写 fill 与 stroke，两种样式会一起画出来。"
            />
        </container>
    );
});
