import { defineComponent } from 'vue';

// 矩形：用 loc 简写给出左上角与宽高
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text
                loc={[24, 20]}
                text="矩形：改 loc 对比位置与宽高"
                fillStyle="#e8f0ff"
            />

            <g-rect loc={[50, 70, 70, 55]} fillStyle="#2f6fed" />
            <g-rect loc={[250, 70, 170, 55]} fillStyle="#2f6fed" />
            <g-rect loc={[50, 170, 70, 95]} fillStyle="#2f6fed" />
            <g-rect loc={[250, 170, 170, 95]} fillStyle="#2f6fed" />

            <text loc={[50, 135]} text="小 70×55" fillStyle="#cfe0ff" />
            <text loc={[250, 135]} text="宽 170×55" fillStyle="#cfe0ff" />
            <text loc={[50, 275]} text="高 70×95" fillStyle="#cfe0ff" />
            <text loc={[250, 275]} text="大 170×95" fillStyle="#cfe0ff" />
        </container>
    );
});
