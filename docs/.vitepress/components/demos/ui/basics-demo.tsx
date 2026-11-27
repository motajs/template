import { defineComponent } from 'vue';

// UI 入门演示：一个 480×320 的容器，里面放一行文字和一个矩形
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            {/* 一行文字 */}
            <text loc={[24, 24]} text="你好，UI" fillStyle="#e8f0ff" />
            {/* 一个矩形 */}
            <g-rect loc={[24, 64, 160, 80]} fill fillStyle="#2f6fed" />
        </container>
    );
});
