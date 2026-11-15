import { defineComponent } from 'vue';

// 二次贝塞尔：curve 依次是起点、控制点、终点
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text
                loc={[24, 20]}
                text="二次贝塞尔：白点 = 控制点，虚线 = 控制多边形"
                fillStyle="#e8f0ff"
            />

            {/* 控制多边形：起点 → 控制点 → 终点 */}
            <g-line
                line={[30, 110, 120, 65]}
                strokeStyle="#8a94a6"
                lineWidth={1}
                lineDash={[4, 4]}
            />
            <g-line
                line={[120, 65, 210, 110]}
                strokeStyle="#8a94a6"
                lineWidth={1}
                lineDash={[4, 4]}
            />

            <g-line
                line={[255, 110, 345, 155]}
                strokeStyle="#8a94a6"
                lineWidth={1}
                lineDash={[4, 4]}
            />
            <g-line
                line={[345, 155, 450, 110]}
                strokeStyle="#8a94a6"
                lineWidth={1}
                lineDash={[4, 4]}
            />

            <g-line
                line={[100, 270, 85, 250]}
                strokeStyle="#8a94a6"
                lineWidth={1}
                lineDash={[4, 4]}
            />
            <g-line
                line={[85, 250, 210, 270]}
                strokeStyle="#8a94a6"
                lineWidth={1}
                lineDash={[4, 4]}
            />

            <g-line
                line={[260, 270, 395, 250]}
                strokeStyle="#8a94a6"
                lineWidth={1}
                lineDash={[4, 4]}
            />
            <g-line
                line={[395, 250, 370, 270]}
                strokeStyle="#8a94a6"
                lineWidth={1}
                lineDash={[4, 4]}
            />

            <g-quad
                curve={[30, 110, 120, 65, 210, 110]}
                strokeStyle="#58c4dd"
                lineWidth={4}
            />
            <g-quad
                curve={[255, 110, 345, 155, 450, 110]}
                strokeStyle="#58c4dd"
                lineWidth={4}
            />
            <g-quad
                curve={[100, 270, 85, 250, 210, 270]}
                strokeStyle="#58c4dd"
                lineWidth={4}
            />
            <g-quad
                curve={[260, 270, 395, 250, 370, 270]}
                strokeStyle="#58c4dd"
                lineWidth={4}
            />

            {/* 每个控制点用白色小圆点标出 */}
            <g-circle circle={[120, 65, 4]} fillStyle="#ffffff" />
            <g-circle circle={[345, 155, 4]} fillStyle="#ffffff" />
            <g-circle circle={[85, 250, 4]} fillStyle="#ffffff" />
            <g-circle circle={[395, 250, 4]} fillStyle="#ffffff" />

            <text loc={[30, 145]} text="控制点在上" fillStyle="#cfe0ff" />
            <text loc={[270, 145]} text="控制点在下" fillStyle="#cfe0ff" />
            <text loc={[30, 292]} text="控制点在左" fillStyle="#cfe0ff" />
            <text loc={[270, 292]} text="控制点在右" fillStyle="#cfe0ff" />
        </container>
    );
});
