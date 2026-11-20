import { CurveMode, sin } from '@motajs/animate';
import { cycledTransition } from '@motajs/render-vue';
import { defineComponent, ref, watch } from 'vue';
import { Slider } from '../../../../../packages-user/client-base/src/components/slider';

// 循环渐变：两个滑动条调整循环的起点与终点
export default defineComponent(() => {
    const minValue = ref(0.25);
    const maxValue = ref(0.9);
    const glow = cycledTransition(
        minValue.value,
        maxValue.value,
        900,
        sin(CurveMode.EaseOut)
    )!;

    const applyRange = () => {
        // 两个端点保持一前一后，避免区间塌成一个点
        if (maxValue.value - minValue.value < 0.05) {
            if (minValue.value <= 0.95) {
                maxValue.value = minValue.value + 0.05;
            } else {
                minValue.value = maxValue.value - 0.05;
            }
        }
        glow.setRange(minValue.value, maxValue.value);
    };

    watch([minValue, maxValue], applyRange);

    return () => {
        const trackLeft = 64;
        const trackWidth = 352;
        const trackY = 130;
        const minX = trackLeft + minValue.value * trackWidth;
        const maxX = trackLeft + maxValue.value * trackWidth;
        const currentX = trackLeft + glow.ref.value * trackWidth;

        return (
            <container loc={[0, 0, 480, 320]}>
                <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />
                <text
                    loc={[24, 16]}
                    text="cycledTransition：循环渐变"
                    fillStyle="#e8f0ff"
                />
                <text
                    loc={[24, 40]}
                    text="拖动两个滑动条调整循环的起点与终点"
                    fillStyle="#8b98a8"
                />

                <text loc={[24, 76]} text="当前值" fillStyle="#cfe0ff" />
                <text
                    loc={[24, 98]}
                    text={glow.ref.value.toFixed(2)}
                    fillStyle="#7ee787"
                />

                <g-line
                    line={[trackLeft, trackY, trackLeft + trackWidth, trackY]}
                    strokeStyle="#26364d"
                    lineWidth={8}
                    lineCap="round"
                />
                <g-line
                    line={[minX, trackY, maxX, trackY]}
                    strokeStyle="#2f6fed"
                    lineWidth={8}
                    lineCap="round"
                />
                <g-line
                    line={[minX, trackY - 12, minX, trackY + 12]}
                    strokeStyle="#8fb6ff"
                    lineWidth={2}
                />
                <g-line
                    line={[maxX, trackY - 12, maxX, trackY + 12]}
                    strokeStyle="#8fb6ff"
                    lineWidth={2}
                />
                <g-circle circle={[currentX, trackY, 9]} fillStyle="#f2b84b" />

                <text
                    loc={[minX, trackY + 22]}
                    anc={[0.5, 0]}
                    text={`min ${minValue.value.toFixed(2)}`}
                    fillStyle="#8fb6ff"
                />
                <text
                    loc={[maxX, trackY + 22]}
                    anc={[0.5, 0]}
                    text={`max ${maxValue.value.toFixed(2)}`}
                    fillStyle="#8fb6ff"
                />

                <text loc={[64, 196]} text="起点" fillStyle="#cfe0ff" />
                <Slider
                    loc={[108, 192, 300, 24]}
                    v-model:value={minValue.value}
                    min={0}
                    max={1}
                    step={0.05}
                    valueWidth={44}
                    filledStyle="#2f6fed"
                    emptyStyle="#26364d"
                />

                <text loc={[64, 244]} text="终点" fillStyle="#cfe0ff" />
                <Slider
                    loc={[108, 240, 300, 24]}
                    v-model:value={maxValue.value}
                    min={0}
                    max={1}
                    step={0.05}
                    valueWidth={44}
                    filledStyle="#2f6fed"
                    emptyStyle="#26364d"
                />
            </container>
        );
    };
});
