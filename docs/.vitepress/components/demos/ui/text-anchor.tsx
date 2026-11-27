import { defineComponent } from 'vue';

// 三行文字分别用不同锚点，白点标出 loc 的位置
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text loc={[24, 20]} text="白点 = loc 的位置" fillStyle="#cfe0ff" />

            {/* anc=[0, 0]：loc 是文字左上角 */}
            <text loc={[40, 56]} text="anc=[0, 0]" fillStyle="#8b98a8" />
            <text
                loc={[160, 60]}
                anc={[0, 0]}
                text="左对齐"
                fillStyle="#ffffff"
            />
            <g-circle circle={[160, 60, 5]} fillStyle="#ffffff" />

            {/* anc=[0.5, 0.5]：loc 是文字中心 */}
            <text loc={[40, 146]} text="anc=[0.5, 0.5]" fillStyle="#8b98a8" />
            <text
                loc={[280, 150]}
                anc={[0.5, 0.5]}
                text="居中"
                fillStyle="#58c4dd"
            />
            <g-circle circle={[280, 150, 5]} fillStyle="#ffffff" />

            {/* anc=[1, 0]：loc 是文字右边缘 */}
            <text loc={[40, 246]} text="anc=[1, 0]" fillStyle="#8b98a8" />
            <text
                loc={[420, 250]}
                anc={[1, 0]}
                text="右对齐"
                fillStyle="#f2b84b"
            />
            <g-circle circle={[420, 250, 5]} fillStyle="#ffffff" />
        </container>
    );
});
