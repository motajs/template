import { defineComponent } from 'vue';

// 三个同尺寸矩形对比不同的 alpha
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text loc={[24, 20]} text="alpha 对照" fillStyle="#cfe0ff" />

            <g-rect loc={[40, 88, 120, 120]} fillStyle="#4f8cff" alpha={1} />
            <text loc={[40, 226]} text="alpha 1" fillStyle="#8b98a8" />

            <g-rect loc={[180, 88, 120, 120]} fillStyle="#4f8cff" alpha={0.6} />
            <text loc={[180, 226]} text="alpha 0.6" fillStyle="#8b98a8" />

            <g-rect
                loc={[320, 88, 120, 120]}
                fillStyle="#4f8cff"
                alpha={0.25}
            />
            <text loc={[320, 226]} text="alpha 0.25" fillStyle="#8b98a8" />
        </container>
    );
});
