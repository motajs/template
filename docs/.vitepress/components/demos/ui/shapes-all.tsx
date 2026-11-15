import { defineComponent } from 'vue';

// 八种图形放在一起：矩形、圆、椭圆、直线、三次贝塞尔、二次贝塞尔、路径、圆角矩形
export default defineComponent(() => {
    const badge = new Path2D();
    badge.moveTo(300, 205);
    badge.lineTo(345, 230);
    badge.lineTo(333, 280);
    badge.lineTo(267, 280);
    badge.lineTo(255, 230);
    badge.closePath();

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />
            <text loc={[24, 14]} text="八种图形" fillStyle="#e8f0ff" />

            <g-rect loc={[20, 72, 80, 62]} fillStyle="#2f6fed" />
            <g-circle circle={[180, 103, 34]} fillStyle="#58c4dd" />
            <g-ellipse ellipse={[300, 103, 50, 32]} fillStyle="#c58af9" />
            <g-line
                line={[370, 133, 460, 75]}
                strokeStyle="#7ee787"
                lineWidth={4}
            />

            <g-bezier
                curve={[20, 275, 45, 205, 80, 280, 105, 212]}
                strokeStyle="#f2b84b"
                lineWidth={4}
            />
            <g-quad
                curve={[140, 270, 180, 205, 220, 270]}
                strokeStyle="#58c4dd"
                lineWidth={4}
            />
            <g-path path={badge} fillStyle="#7ee787" />
            <g-rectr
                loc={[370, 215, 80, 62]}
                circle={[24]}
                fillStyle="#f2b84b"
            />

            <text loc={[44, 146]} text="矩形" fillStyle="#cfe0ff" />
            <text loc={[170, 146]} text="圆" fillStyle="#cfe0ff" />
            <text loc={[285, 146]} text="椭圆" fillStyle="#cfe0ff" />
            <text loc={[405, 146]} text="直线" fillStyle="#cfe0ff" />

            <text loc={[20, 292]} text="三次贝塞尔" fillStyle="#cfe0ff" />
            <text loc={[140, 292]} text="二次贝塞尔" fillStyle="#cfe0ff" />
            <text loc={[290, 292]} text="路径" fillStyle="#cfe0ff" />
            <text loc={[380, 292]} text="圆角矩形" fillStyle="#cfe0ff" />
        </container>
    );
});
