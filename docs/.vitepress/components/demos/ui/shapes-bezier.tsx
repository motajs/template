import { defineComponent } from 'vue';

// 三次贝塞尔：curve 依次是起点、两个控制点、终点
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text
                loc={[24, 20]}
                text="三次贝塞尔：白点 = 控制点，虚线 = 控制多边形"
                fillStyle="#e8f0ff"
            />

            {/* 控制多边形：起点 → cp1 → cp2 → 终点 */}
            <g-line
                line={[30, 110, 70, 85]}
                strokeStyle="#8a94a6"
                lineWidth={1}
                lineDash={[4, 4]}
            />
            <g-line
                line={[70, 85, 135, 90]}
                strokeStyle="#8a94a6"
                lineWidth={1}
                lineDash={[4, 4]}
            />
            <g-line
                line={[135, 90, 205, 120]}
                strokeStyle="#8a94a6"
                lineWidth={1}
                lineDash={[4, 4]}
            />

            <g-line
                line={[255, 110, 300, 60]}
                strokeStyle="#8a94a6"
                lineWidth={1}
                lineDash={[4, 4]}
            />
            <g-line
                line={[300, 60, 395, 65]}
                strokeStyle="#8a94a6"
                lineWidth={1}
                lineDash={[4, 4]}
            />
            <g-line
                line={[395, 65, 450, 120]}
                strokeStyle="#8a94a6"
                lineWidth={1}
                lineDash={[4, 4]}
            />

            <g-line
                line={[30, 235, 125, 215]}
                strokeStyle="#8a94a6"
                lineWidth={1}
                lineDash={[4, 4]}
            />
            <g-line
                line={[125, 215, 110, 255]}
                strokeStyle="#8a94a6"
                lineWidth={1}
                lineDash={[4, 4]}
            />
            <g-line
                line={[110, 255, 205, 235]}
                strokeStyle="#8a94a6"
                lineWidth={1}
                lineDash={[4, 4]}
            />

            <g-line
                line={[255, 235, 330, 205]}
                strokeStyle="#8a94a6"
                lineWidth={1}
                lineDash={[4, 4]}
            />
            <g-line
                line={[330, 205, 380, 265]}
                strokeStyle="#8a94a6"
                lineWidth={1}
                lineDash={[4, 4]}
            />
            <g-line
                line={[380, 265, 450, 235]}
                strokeStyle="#8a94a6"
                lineWidth={1}
                lineDash={[4, 4]}
            />

            <g-bezier
                curve={[30, 110, 70, 85, 135, 90, 205, 120]}
                strokeStyle="#f2b84b"
                lineWidth={4}
            />
            <g-bezier
                curve={[255, 110, 300, 60, 395, 65, 450, 120]}
                strokeStyle="#f2b84b"
                lineWidth={4}
            />
            <g-bezier
                curve={[30, 235, 125, 215, 110, 255, 205, 235]}
                strokeStyle="#f2b84b"
                lineWidth={4}
            />
            <g-bezier
                curve={[255, 235, 330, 205, 380, 265, 450, 235]}
                strokeStyle="#f2b84b"
                lineWidth={4}
            />

            {/* 每个控制点用白色小圆点标出 */}
            <g-circle circle={[70, 85, 4]} fillStyle="#ffffff" />
            <g-circle circle={[135, 90, 4]} fillStyle="#ffffff" />
            <g-circle circle={[300, 60, 4]} fillStyle="#ffffff" />
            <g-circle circle={[395, 65, 4]} fillStyle="#ffffff" />
            <g-circle circle={[125, 215, 4]} fillStyle="#ffffff" />
            <g-circle circle={[110, 255, 4]} fillStyle="#ffffff" />
            <g-circle circle={[330, 205, 4]} fillStyle="#ffffff" />
            <g-circle circle={[380, 265, 4]} fillStyle="#ffffff" />

            <text loc={[30, 145]} text="控制点靠近" fillStyle="#cfe0ff" />
            <text loc={[270, 145]} text="控制点拉远" fillStyle="#cfe0ff" />
            <text loc={[30, 292]} text="控制点交叉" fillStyle="#cfe0ff" />
            <text loc={[270, 292]} text="S 形" fillStyle="#cfe0ff" />
        </container>
    );
});
