import { defineComponent } from 'vue';

// 最基本的一行文字：内容写在 text，位置由 loc 决定
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text loc={[40, 60]} text="一行文字" fillStyle="#ffffff" />
            <text loc={[40, 110]} text="第二行文字" fillStyle="#58c4dd" />
        </container>
    );
});
