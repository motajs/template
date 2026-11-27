import { defineComponent } from 'vue';

// 同一变换在左上角锚点与中心锚点下的对比；白点 = 锚点
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text
                loc={[24, 14]}
                text="同一变换，不同锚点"
                fillStyle="#cfe0ff"
            />
            <text
                loc={[24, 34]}
                text="白点 = 锚点：分别对比绕左上角与绕中心"
                fillStyle="#8b98a8"
            />

            {/* scale：左上角锚点 */}
            <container loc={[12, 52, 224, 124]}>
                <g-rect loc={[0, 0, 224, 124]} fillStyle="#1a2330" />
                <text
                    loc={[10, 8]}
                    text="scale · anc [0, 0]"
                    fillStyle="#cfe0ff"
                />
                <container
                    loc={[84, 58, 76, 42]}
                    anc={[0, 0]}
                    scale={[1.35, 0.7]}
                    nocache
                >
                    <g-rect loc={[0, 0, 76, 42]} fillStyle="#2f6fed" />
                    <g-circle circle={[14, 12, 7]} fillStyle="#f2b84b" />
                </container>
                <g-circle circle={[84, 58, 5]} fillStyle="#e8f0ff" />
            </container>

            {/* scale：中心锚点 */}
            <container loc={[244, 52, 224, 124]}>
                <g-rect loc={[0, 0, 224, 124]} fillStyle="#1a2330" />
                <text
                    loc={[10, 8]}
                    text="scale · anc [0.5, 0.5]"
                    fillStyle="#cfe0ff"
                />
                <container
                    loc={[84, 58, 76, 42]}
                    anc={[0.5, 0.5]}
                    scale={[1.35, 0.7]}
                    nocache
                >
                    <g-rect loc={[0, 0, 76, 42]} fillStyle="#2f6fed" />
                    <g-circle circle={[14, 12, 7]} fillStyle="#f2b84b" />
                </container>
                <g-circle circle={[84, 58, 5]} fillStyle="#e8f0ff" />
            </container>

            {/* rotate：左上角锚点 */}
            <container loc={[12, 180, 224, 124]}>
                <g-rect loc={[0, 0, 224, 124]} fillStyle="#1a2330" />
                <text
                    loc={[10, 8]}
                    text="rotate · anc [0, 0]"
                    fillStyle="#cfe0ff"
                />
                <container
                    loc={[84, 58, 76, 42]}
                    anc={[0, 0]}
                    rotate={Math.PI / 12}
                    nocache
                >
                    <g-rect loc={[0, 0, 76, 42]} fillStyle="#c58af9" />
                    <g-circle circle={[14, 12, 7]} fillStyle="#f2b84b" />
                </container>
                <g-circle circle={[84, 58, 5]} fillStyle="#e8f0ff" />
            </container>

            {/* rotate：中心锚点 */}
            <container loc={[244, 180, 224, 124]}>
                <g-rect loc={[0, 0, 224, 124]} fillStyle="#1a2330" />
                <text
                    loc={[10, 8]}
                    text="rotate · anc [0.5, 0.5]"
                    fillStyle="#cfe0ff"
                />
                <container
                    loc={[84, 58, 76, 42]}
                    anc={[0.5, 0.5]}
                    rotate={Math.PI / 12}
                    nocache
                >
                    <g-rect loc={[0, 0, 76, 42]} fillStyle="#c58af9" />
                    <g-circle circle={[14, 12, 7]} fillStyle="#f2b84b" />
                </container>
                <g-circle circle={[84, 58, 5]} fillStyle="#e8f0ff" />
            </container>
        </container>
    );
});
