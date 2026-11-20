import { defineComponent } from 'vue';

// 绘制模式：同一个矩形分别用 fill、stroke、fill + stroke 与 strokeAndFill
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text loc={[24, 16]} text="四种绘制模式" fillStyle="#e8f0ff" />

            <text loc={[40, 48]} text="fill" fillStyle="#cfe0ff" />
            <text loc={[260, 48]} text="stroke" fillStyle="#cfe0ff" />
            <text loc={[40, 180]} text="fill + stroke" fillStyle="#cfe0ff" />
            <text loc={[260, 180]} text="strokeAndFill" fillStyle="#cfe0ff" />

            <g-rect loc={[40, 84, 180, 80]} fillStyle="#2f6fed" />
            <g-rect
                loc={[260, 84, 180, 80]}
                stroke
                strokeStyle="#7ee787"
                lineWidth={10}
            />
            <g-rect
                loc={[40, 218, 180, 80]}
                fill
                stroke
                fillStyle="#2f6fed"
                strokeStyle="#f2b84b"
                lineWidth={14}
            />
            <g-rect
                loc={[260, 218, 180, 80]}
                strokeAndFill
                fillStyle="#2f6fed"
                strokeStyle="#f2b84b"
                lineWidth={14}
            />
        </container>
    );
});
