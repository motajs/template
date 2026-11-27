import { defineComponent } from 'vue';

// 圆：用 circle 简写给出圆心与半径
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text
                loc={[24, 20]}
                text="圆：半径、圆心与 start / end"
                fillStyle="#e8f0ff"
            />

            <g-circle circle={[80, 100, 30]} fillStyle="#58c4dd" />
            <g-circle circle={[210, 100, 55]} fillStyle="#58c4dd" />
            <g-circle circle={[350, 100, 80]} fillStyle="#58c4dd" />

            <text loc={[65, 190]} text="r=30" fillStyle="#cfe0ff" />
            <text loc={[188, 190]} text="r=55" fillStyle="#cfe0ff" />
            <text loc={[323, 190]} text="r=80" fillStyle="#cfe0ff" />

            <g-circle circle={[90, 255, 35, 0, Math.PI]} fillStyle="#58c4dd" />
            <g-circle
                circle={[240, 255, 35, Math.PI / 2, Math.PI * 1.5]}
                stroke
                strokeStyle="#58c4dd"
                lineWidth={4}
            />
            <g-circle
                circle={[390, 255, 35, 0, Math.PI * 1.5]}
                fill
                stroke
                fillStyle="#58c4dd"
                strokeStyle="#e8f0ff"
                lineWidth={3}
            />

            <text loc={[15, 298]} text="fill 0°→180°" fillStyle="#cfe0ff" />
            <text loc={[155, 298]} text="stroke 90°→270°" fillStyle="#cfe0ff" />
            <text
                loc={[310, 298]}
                text="fill+stroke 0°→270°"
                fillStyle="#cfe0ff"
            />
        </container>
    );
});
