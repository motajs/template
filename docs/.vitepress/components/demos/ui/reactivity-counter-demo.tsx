import { defineComponent, ref } from 'vue';

// 计数器：点击按钮只改 count，文字由响应式自动更新
export default defineComponent(() => {
    const count = ref(0);

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text
                loc={[40, 36]}
                text="点击按钮改变 count"
                fillStyle="#cfe0ff"
            />

            <g-rect
                loc={[40, 96, 180, 56]}
                fillStyle="#2f6fed"
                onClick={() => count.value++}
            />
            <text loc={[64, 114]} text="点我 +1" fillStyle="#e8f0ff" noevent />

            <text
                loc={[260, 112]}
                text={`count = ${count.value}`}
                fillStyle="#ffffff"
            />
        </container>
    );
});
