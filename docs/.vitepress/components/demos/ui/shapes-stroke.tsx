import { defineComponent } from 'vue';

// 描边：线宽、虚线、端点与拐角四组对比
export default defineComponent(() => {
    const joinMiter = new Path2D();
    joinMiter.moveTo(275, 210);
    joinMiter.lineTo(300, 268);
    joinMiter.lineTo(325, 210);

    const joinRound = new Path2D();
    joinRound.moveTo(345, 210);
    joinRound.lineTo(370, 268);
    joinRound.lineTo(395, 210);

    const joinBevel = new Path2D();
    joinBevel.moveTo(415, 210);
    joinBevel.lineTo(440, 268);
    joinBevel.lineTo(465, 210);

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text
                loc={[24, 16]}
                text="描边：线宽、虚线、端点与拐角"
                fillStyle="#e8f0ff"
            />

            {/* 线宽 */}
            <text loc={[30, 48]} text="线宽 lineWidth" fillStyle="#cfe0ff" />
            <g-line
                line={[30, 80, 200, 80]}
                strokeStyle="#7ee787"
                lineWidth={2}
            />
            <g-line
                line={[30, 110, 200, 110]}
                strokeStyle="#7ee787"
                lineWidth={6}
            />
            <g-line
                line={[30, 140, 200, 140]}
                strokeStyle="#7ee787"
                lineWidth={12}
            />
            <text loc={[214, 72]} text="2" fillStyle="#cfe0ff" />
            <text loc={[214, 102]} text="6" fillStyle="#cfe0ff" />
            <text loc={[214, 132]} text="12" fillStyle="#cfe0ff" />

            {/* 虚线 */}
            <text loc={[240, 48]} text="虚线 lineDash" fillStyle="#cfe0ff" />
            <g-line
                line={[340, 80, 456, 80]}
                strokeStyle="#58c4dd"
                lineWidth={3}
                lineDash={[8, 6]}
            />
            <g-line
                line={[340, 110, 456, 110]}
                strokeStyle="#58c4dd"
                lineWidth={3}
                lineDash={[2, 6]}
            />
            <g-line
                line={[340, 140, 456, 140]}
                strokeStyle="#58c4dd"
                lineWidth={3}
                lineDash={[16, 6, 2, 6]}
            />
            <text loc={[240, 72]} text="8,6" fillStyle="#cfe0ff" />
            <text loc={[240, 102]} text="2,6" fillStyle="#cfe0ff" />
            <text loc={[240, 132]} text="16,6,2,6" fillStyle="#cfe0ff" />

            {/* 端点 */}
            <text loc={[30, 168]} text="端点 lineCap" fillStyle="#cfe0ff" />
            <g-line
                line={[105, 210, 210, 210]}
                strokeStyle="#f2b84b"
                lineWidth={16}
                lineCap="butt"
            />
            <g-line
                line={[105, 245, 210, 245]}
                strokeStyle="#f2b84b"
                lineWidth={16}
                lineCap="round"
            />
            <g-line
                line={[105, 280, 210, 280]}
                strokeStyle="#f2b84b"
                lineWidth={16}
                lineCap="square"
            />
            <text loc={[30, 202]} text="butt" fillStyle="#cfe0ff" />
            <text loc={[30, 237]} text="round" fillStyle="#cfe0ff" />
            <text loc={[30, 272]} text="square" fillStyle="#cfe0ff" />

            {/* 拐角 */}
            <text loc={[260, 168]} text="拐角 lineJoin" fillStyle="#cfe0ff" />
            <g-path
                path={joinMiter}
                stroke
                strokeStyle="#c58af9"
                lineWidth={14}
                lineJoin="miter"
            />
            <g-path
                path={joinRound}
                stroke
                strokeStyle="#c58af9"
                lineWidth={14}
                lineJoin="round"
            />
            <g-path
                path={joinBevel}
                stroke
                strokeStyle="#c58af9"
                lineWidth={14}
                lineJoin="bevel"
            />
            <text loc={[277, 296]} text="miter" fillStyle="#cfe0ff" />
            <text loc={[347, 296]} text="round" fillStyle="#cfe0ff" />
            <text loc={[417, 296]} text="bevel" fillStyle="#cfe0ff" />
        </container>
    );
});
