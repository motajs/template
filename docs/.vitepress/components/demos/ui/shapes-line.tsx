import { defineComponent } from 'vue';

// 直线：用 line 简写给出两个端点，默认描边
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text
                loc={[24, 20]}
                text="直线：端点、线宽、虚线与颜色"
                fillStyle="#e8f0ff"
            />

            <g-line
                line={[40, 80, 210, 80]}
                strokeStyle="#7ee787"
                lineWidth={2}
            />
            <g-line
                line={[260, 80, 440, 80]}
                strokeStyle="#58c4dd"
                lineWidth={14}
            />
            <g-line
                line={[40, 185, 210, 185]}
                strokeStyle="#f2b84b"
                lineWidth={4}
                lineDash={[18, 12]}
            />
            <g-line
                line={[260, 240, 440, 170]}
                strokeStyle="#c58af9"
                lineWidth={6}
            />

            <text loc={[40, 96]} text="细 lineWidth=2" fillStyle="#cfe0ff" />
            <text loc={[260, 110]} text="粗 lineWidth=14" fillStyle="#cfe0ff" />
            <text loc={[40, 203]} text="虚线 lineDash" fillStyle="#cfe0ff" />
            <text loc={[260, 254]} text="斜线，改端点" fillStyle="#cfe0ff" />
        </container>
    );
});
