import { defineComponent } from 'vue';

export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <container loc={[8, 8, 228, 148]}>
                <g-rect
                    loc={[110, 70, 100, 60]}
                    anc={[0, 0]}
                    fillStyle="#2f6fed"
                    alpha={0.6}
                />
                <g-circle circle={[110, 70, 6]} fillStyle="#e8f0ff" />
                <text loc={[8, 122]} text="锚点 0, 0" fillStyle="#cfe0ff" />
            </container>

            <container loc={[244, 8, 228, 148]}>
                <g-rect
                    loc={[110, 70, 100, 60]}
                    anc={[0.5, 0.5]}
                    fillStyle="#f2b84b"
                    alpha={0.6}
                />
                <g-circle circle={[110, 70, 6]} fillStyle="#ffe9b0" />
                <text loc={[8, 122]} text="锚点 0.5, 0.5" fillStyle="#ffe9b0" />
            </container>

            <container loc={[8, 164, 228, 148]}>
                <g-rect
                    loc={[110, 70, 100, 60]}
                    anc={[1, 1]}
                    fillStyle="#58c4dd"
                    alpha={0.6}
                />
                <g-circle circle={[110, 70, 6]} fillStyle="#e8f0ff" />
                <text loc={[8, 122]} text="锚点 1, 1" fillStyle="#cfe0ff" />
            </container>

            <container loc={[244, 164, 228, 148]}>
                <g-rect
                    loc={[110, 70, 160, 100]}
                    anc={[0.5, 0.5]}
                    fillStyle="#c58af9"
                    alpha={0.5}
                />
                <g-circle circle={[110, 70, 6]} fillStyle="#f3e8ff" />
                <text
                    loc={[8, 122]}
                    text="中心锚点，尺寸更大"
                    fillStyle="#f3e8ff"
                />
            </container>
        </container>
    );
});
