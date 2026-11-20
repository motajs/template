import { CurveMode, linear, sin } from '@motajs/animate';
import { transitioned } from '@motajs/render-vue';
import { defineComponent, ref } from 'vue';

// 数值渐变：alpha、位置与进度条
export default defineComponent(() => {
    const alpha = transitioned(0.25, 600, sin(CurveMode.EaseOut))!;
    const slide = transitioned(0, 600, sin(CurveMode.EaseOut))!;
    const bar = transitioned(0.3, 600, sin(CurveMode.EaseOut))!;
    const high = ref(false);
    const smooth = ref(true);
    const slow = ref(false);

    const toggle = () => {
        high.value = !high.value;
        alpha.set(high.value ? 1 : 0.25);
        slide.set(high.value ? 1 : 0);
        bar.set(high.value ? 1 : 0.3);
    };

    const toggleCurve = () => {
        smooth.value = !smooth.value;
        const curve = smooth.value ? sin() : linear();
        alpha.mode(curve);
        slide.mode(curve);
        bar.mode(curve);
        toggle();
    };

    const toggleTime = () => {
        slow.value = !slow.value;
        const time = slow.value ? 1200 : 600;
        alpha.setTime(time);
        slide.setTime(time);
        bar.setTime(time);
        toggle();
    };

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />
            <text
                loc={[24, 16]}
                text="transitioned：数值渐变"
                fillStyle="#e8f0ff"
            />
            <text
                loc={[24, 40]}
                text="alpha 与位置都读 ref.value"
                fillStyle="#8b98a8"
            />

            <text loc={[40, 72]} text="alpha" fillStyle="#cfe0ff" />
            <g-rect
                loc={[40, 92, 120, 88]}
                fillStyle="#2f6fed"
                alpha={alpha.ref.value}
            />
            <text
                loc={[40, 190]}
                text={alpha.ref.value.toFixed(2)}
                fillStyle="#8fb6ff"
            />

            <text loc={[200, 72]} text="position" fillStyle="#cfe0ff" />
            <g-rect loc={[200, 136, 200, 8]} fillStyle="#26364d" />
            <g-circle
                circle={[204 + slide.ref.value * 192, 140, 12]}
                fillStyle="#f2b84b"
            />
            <text
                loc={[200, 190]}
                text={slide.ref.value.toFixed(2)}
                fillStyle="#8fb6ff"
            />

            <text loc={[40, 214]} text="progress" fillStyle="#cfe0ff" />
            <g-rect loc={[40, 234, 280, 12]} fillStyle="#26364d" />
            <g-rect
                loc={[40, 234, 280 * bar.ref.value, 12]}
                fillStyle="#7ee787"
            />
            <text
                loc={[330, 230]}
                text={`${Math.round(bar.ref.value * 100)}%`}
                fillStyle="#8fb6ff"
            />

            <container loc={[40, 264, 96, 32]} onClick={toggle}>
                <g-rectr
                    loc={[0, 0, 96, 32]}
                    circle={[8]}
                    fillStyle="#2f6fed"
                />
                <text loc={[12, 8]} text="切换" fillStyle="#ffffff" />
            </container>
            <container loc={[144, 264, 96, 32]} onClick={toggleCurve}>
                <g-rectr
                    loc={[0, 0, 96, 32]}
                    circle={[8]}
                    fillStyle="#33465f"
                />
                <text
                    loc={[12, 8]}
                    text={smooth.value ? '缓动' : '线性'}
                    fillStyle="#e8f0ff"
                />
            </container>
            <container loc={[248, 264, 96, 32]} onClick={toggleTime}>
                <g-rectr
                    loc={[0, 0, 96, 32]}
                    circle={[8]}
                    fillStyle="#33465f"
                />
                <text
                    loc={[12, 8]}
                    text={slow.value ? '慢速' : '快速'}
                    fillStyle="#e8f0ff"
                />
            </container>
        </container>
    );
});
