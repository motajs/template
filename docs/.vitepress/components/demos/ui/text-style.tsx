import { defineComponent } from 'vue';

// 填充、描边颜色与描边宽度的对照
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text loc={[32, 50]} text="白色填充" fillStyle="#ffffff" />
            <text loc={[32, 104]} text="蓝色填充" fillStyle="#58c4dd" />
            <text
                loc={[32, 158]}
                text="填充 + 描边 2"
                fillStyle="#ffffff"
                strokeStyle="#f2b84b"
                strokeWidth={2}
            />
            <text
                loc={[32, 222]}
                text="填充 + 描边 6"
                fillStyle="#ffffff"
                strokeStyle="#c58af9"
                strokeWidth={6}
            />
        </container>
    );
});
