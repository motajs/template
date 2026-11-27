import { RafExcitation } from '@motajs/animate';
import { defineComponent, onUnmounted, ref } from 'vue';

// 载荷演示：RafExcitation 每帧广播当前时间戳
export default defineComponent(() => {
    const now = ref(0);
    const start = ref(0);
    const frames = ref(0);
    const frameGap = ref(0);

    let last = 0;
    let hasLast = false;

    const source = new RafExcitation();
    source.add({
        excited(payload: number) {
            if (frames.value === 0) start.value = payload;
            if (hasLast) frameGap.value = payload - last;
            last = payload;
            hasLast = true;
            now.value = payload;
            frames.value += 1;
        }
    });

    onUnmounted(() => {
        source.destroy();
    });

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />
            <text
                loc={[24, 16]}
                text="RafExcitation：当前载荷"
                fillStyle="#e8f0ff"
            />
            <text
                loc={[24, 40]}
                text="每帧广播 requestAnimationFrame 的时间戳"
                fillStyle="#8b98a8"
            />

            <text loc={[40, 84]} text="当前载荷" fillStyle="#cfe0ff" />
            <text
                loc={[40, 112]}
                text={`${Math.round(now.value)} ms`}
                fillStyle="#8fb6ff"
            />

            <text loc={[260, 84]} text="帧间隔" fillStyle="#f2b84b" />
            <text
                loc={[260, 112]}
                text={`${frameGap.value.toFixed(1)} ms`}
                fillStyle="#f2b84b"
            />

            <text loc={[40, 164]} text="距开始" fillStyle="#cfe0ff" />
            <text
                loc={[40, 192]}
                text={`${Math.round(now.value - start.value)} ms`}
                fillStyle="#8fb6ff"
            />

            <text loc={[260, 164]} text="帧数" fillStyle="#cfe0ff" />
            <text
                loc={[260, 192]}
                text={String(frames.value)}
                fillStyle="#8fb6ff"
            />

            <text
                loc={[40, 248]}
                text="帧间隔 = 本次时间戳 − 上一次时间戳"
                fillStyle="#8b98a8"
            />
            <text
                loc={[40, 278]}
                text="它反映相邻两帧之间过了多久"
                fillStyle="#8b98a8"
            />
        </container>
    );
});
