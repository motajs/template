import { defineComponent } from 'vue';

// 路径：path 接收一个 Path2D，默认填充
export default defineComponent(() => {
    const polyline = new Path2D();
    polyline.moveTo(40, 230);
    polyline.lineTo(85, 140);
    polyline.lineTo(125, 215);
    polyline.lineTo(160, 150);

    const polygon = new Path2D();
    polygon.moveTo(195, 230);
    polygon.lineTo(285, 230);
    polygon.lineTo(240, 135);
    polygon.closePath();

    const arc = new Path2D();
    arc.moveTo(455, 180);
    arc.arc(390, 180, 65, 0, Math.PI * 1.5);

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text
                loc={[24, 20]}
                text="路径：折线、闭合填充与圆弧"
                fillStyle="#e8f0ff"
            />

            <g-path
                path={polyline}
                stroke
                strokeStyle="#58c4dd"
                lineWidth={3}
            />
            <g-path path={polygon} fillStyle="#7ee787" />
            <g-path path={arc} stroke strokeStyle="#f2b84b" lineWidth={3} />

            <text loc={[50, 285]} text="折线" fillStyle="#cfe0ff" />
            <text loc={[205, 285]} text="闭合填充" fillStyle="#cfe0ff" />
            <text loc={[374, 285]} text="圆弧" fillStyle="#cfe0ff" />
        </container>
    );
});
