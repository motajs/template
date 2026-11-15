import { defineComponent } from 'vue';

// 椭圆：用 ellipse 简写给出圆心、横向半径与纵向半径
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text
                loc={[24, 20]}
                text="椭圆：rx / ry 与 start / end"
                fillStyle="#e8f0ff"
            />

            <g-ellipse ellipse={[100, 95, 70, 30]} fillStyle="#c58af9" />
            <g-ellipse ellipse={[250, 95, 90, 42]} fillStyle="#c58af9" />
            <g-ellipse ellipse={[400, 95, 55, 25]} fillStyle="#c58af9" />

            <text loc={[55, 150]} text="rx=70 ry=30" fillStyle="#cfe0ff" />
            <text loc={[200, 150]} text="rx=90 ry=42" fillStyle="#cfe0ff" />
            <text loc={[355, 150]} text="rx=55 ry=25" fillStyle="#cfe0ff" />

            <g-ellipse
                ellipse={[90, 230, 60, 35, 0, Math.PI]}
                fillStyle="#c58af9"
            />
            <g-ellipse
                ellipse={[240, 230, 60, 35, Math.PI, Math.PI * 2]}
                stroke
                strokeStyle="#c58af9"
                lineWidth={4}
            />
            <g-ellipse
                ellipse={[390, 230, 60, 35, 0, Math.PI]}
                fill
                stroke
                fillStyle="#c58af9"
                strokeStyle="#e8f0ff"
                lineWidth={3}
            />

            <text loc={[30, 298]} text="fill 0°→180°" fillStyle="#cfe0ff" />
            <text
                loc={[172, 298]}
                text="stroke 180°→360°"
                fillStyle="#cfe0ff"
            />
            <text
                loc={[320, 298]}
                text="fill+stroke 0°→180°"
                fillStyle="#cfe0ff"
            />
        </container>
    );
});
