import { CurveMode, sin } from '@motajs/animate';
import { transitionedColor } from '@motajs/render-vue';
import { defineComponent, ref } from 'vue';

// 颜色渐变：填充色与描边色
export default defineComponent(() => {
    const fill = transitionedColor('#2f6fed', 600, sin(CurveMode.EaseOut))!;
    const stroke = transitionedColor(
        'rgba(242, 184, 75, 0.9)',
        600,
        sin(CurveMode.EaseOut)
    )!;
    const warm = ref(true);

    const toggle = () => {
        warm.value = !warm.value;
        fill.set(warm.value ? '#2f6fed' : '#f2b84b');
        stroke.set(warm.value ? 'rgba(242, 184, 75, 0.9)' : '#7ee787');
    };

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />
            <text
                loc={[24, 16]}
                text="transitionedColor：颜色渐变"
                fillStyle="#e8f0ff"
            />
            <text
                loc={[24, 40]}
                text="填充与描边都读 ref.value"
                fillStyle="#8b98a8"
            />

            <text loc={[40, 64]} text="fillStyle" fillStyle="#cfe0ff" />
            <g-rectr
                loc={[40, 88, 180, 140]}
                circle={[16]}
                fillStyle={fill.ref.value}
            />
            <text loc={[60, 144]} text="color" fillStyle="#ffffff" />

            <text loc={[280, 64]} text="strokeStyle" fillStyle="#cfe0ff" />
            <g-circle
                circle={[320, 158, 56]}
                stroke
                strokeStyle={stroke.ref.value}
                lineWidth={10}
            />

            <container loc={[40, 264, 120, 32]} onClick={toggle}>
                <g-rectr
                    loc={[0, 0, 120, 32]}
                    circle={[8]}
                    fillStyle="#33465f"
                />
                <text loc={[12, 8]} text="切换颜色" fillStyle="#e8f0ff" />
            </container>
        </container>
    );
});
