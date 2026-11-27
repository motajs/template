import { defineComponent } from 'vue';

// 同一组重叠图形分别使用 source-over、multiply 与 screen
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text loc={[24, 20]} text="composite 对照" fillStyle="#cfe0ff" />
            <text
                loc={[24, 48]}
                text="默认 source-over，可换成 multiply / screen"
                fillStyle="#8b98a8"
            />

            <container loc={[25, 76, 140, 150]}>
                <g-rect loc={[0, 0, 140, 150]} fillStyle="#1b2430" />
                <g-circle circle={[50, 50, 50]} fillStyle="#2f6fed" />
                <g-rect
                    loc={[40, 60, 100, 90]}
                    fillStyle="#f2b84b"
                    composite="source-over"
                />
            </container>

            <container loc={[170, 76, 140, 150]}>
                <g-rect loc={[0, 0, 140, 150]} fillStyle="#1b2430" />
                <g-circle circle={[50, 50, 50]} fillStyle="#2f6fed" />
                <g-rect
                    loc={[40, 60, 100, 90]}
                    fillStyle="#f2b84b"
                    composite="multiply"
                />
            </container>

            <container loc={[315, 76, 140, 150]}>
                <g-rect loc={[0, 0, 140, 150]} fillStyle="#1b2430" />
                <g-circle circle={[50, 50, 50]} fillStyle="#2f6fed" />
                <g-rect
                    loc={[40, 60, 100, 90]}
                    fillStyle="#f2b84b"
                    composite="screen"
                />
            </container>

            <text loc={[25, 244]} text="source-over" fillStyle="#8b98a8" />
            <text loc={[170, 244]} text="multiply" fillStyle="#8b98a8" />
            <text loc={[315, 244]} text="screen" fillStyle="#8b98a8" />
            <text
                loc={[24, 286]}
                text="composite 只影响绘制结果，不改变布局与命中"
                fillStyle="#8b98a8"
            />
        </container>
    );
});
