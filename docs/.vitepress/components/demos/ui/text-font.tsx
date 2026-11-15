import { Font, FontWeight } from '@motajs/render';
import { defineComponent } from 'vue';

// 同内容不同字号、字重与斜体的对照
export default defineComponent(() => {
    const small = new Font('Verdana', 14, 'px', FontWeight.Normal);
    const bold = new Font('Verdana', 20, 'px', FontWeight.Bold);
    const italic = new Font('Verdana', 24, 'px', FontWeight.Normal, true);
    const title = new Font('Verdana', 32, 'px', FontWeight.Bold);

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text
                loc={[32, 40]}
                text="14px 常规文字"
                font={small}
                fillStyle="#ffffff"
            />
            <text
                loc={[32, 80]}
                text="20px 粗体文字"
                font={bold}
                fillStyle="#58c4dd"
            />
            <text
                loc={[32, 124]}
                text="24px 斜体文字"
                font={italic}
                fillStyle="#f2b84b"
            />
            <text
                loc={[32, 176]}
                text="32px 粗体标题"
                font={title}
                fillStyle="#e8f0ff"
            />
        </container>
    );
});
