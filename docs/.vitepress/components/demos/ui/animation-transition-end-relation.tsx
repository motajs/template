import { EndRelation } from '@motajs/animate';
import { useTransition } from '@motajs/render-vue';
import { defineComponent, onMounted, ref } from 'vue';

// 半程曲线在 1 处输出 0.5，回程曲线在 1 处回到 0
const HALF = (p: number) => p * 0.5;
const RETURN = (p: number) => Math.sin(p * Math.PI) * 0.5;

const curves = [
    { label: '半程曲线', curve: HALF, time: 600 },
    { label: '回程曲线', curve: RETURN, time: 900 }
];

// 同一目标配同一条曲线，比较 Target 与 Curve 两种结尾参考
export default defineComponent(() => {
    const targetValue = ref(0);
    const curveValue = ref(0);
    const index = ref(0);
    const transition = useTransition()!;

    const play = () => {
        const item = curves[index.value];
        targetValue.value = 0;
        curveValue.value = 0;
        transition
            .transition(targetValue)
            .curve(item.curve)
            .to(1, item.time, EndRelation.Target);
        transition
            .transition(curveValue)
            .curve(item.curve)
            .to(1, item.time, EndRelation.Curve);
    };

    const next = () => {
        index.value = (index.value + 1) % curves.length;
        play();
    };

    onMounted(() => {
        requestAnimationFrame(play);
    });

    return () => {
        const item = curves[index.value];
        const endpoint = item.curve(1);
        const targetX = 24 + targetValue.value * 400;
        const curveX = 24 + curveValue.value * 400;
        const endX = 24 + endpoint * 400;

        return (
            <container loc={[0, 0, 480, 320]}>
                <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />
                <text
                    loc={[24, 16]}
                    text="Transition：EndRelation"
                    fillStyle="#e8f0ff"
                />
                <text
                    loc={[24, 40]}
                    text="同一条曲线：Target 结束于目标值，Curve 停在曲线终点"
                    fillStyle="#8b98a8"
                />

                <text
                    loc={[24, 72]}
                    text="Target：结束写目标值"
                    fillStyle="#cfe0ff"
                />
                <g-rect loc={[24, 96, 400, 14]} fillStyle="#26364d" />
                <g-rect
                    loc={[24, 96, 400 * targetValue.value, 14]}
                    fillStyle="#2f6fed"
                />
                <g-rect loc={[targetX - 1, 86, 2, 34]} fillStyle="#f2b84b" />
                <text
                    loc={[24, 120]}
                    text={`当前 ${targetValue.value.toFixed(2)} · 终点 1.00`}
                    fillStyle="#8fb6ff"
                />

                <text
                    loc={[24, 150]}
                    text="Curve：结束写曲线终点"
                    fillStyle="#cfe0ff"
                />
                <g-rect loc={[24, 174, 400, 14]} fillStyle="#26364d" />
                <g-rect
                    loc={[24, 174, 400 * curveValue.value, 14]}
                    fillStyle="#7ee787"
                />
                <g-rect loc={[curveX - 1, 164, 2, 34]} fillStyle="#58c4dd" />
                <g-rect loc={[endX - 1, 164, 2, 34]} fillStyle="#f2b84b" />
                <text
                    loc={[24, 198]}
                    text={`当前 ${curveValue.value.toFixed(2)} · 终点 ${endpoint.toFixed(2)}`}
                    fillStyle="#8fb6ff"
                />

                <text
                    loc={[24, 226]}
                    text={`曲线：${item.label} · ${item.time}ms · 终点 ${endpoint.toFixed(2)}`}
                    fillStyle="#8b98a8"
                />

                <container
                    loc={[24, 254, 100, 30]}
                    cursor="pointer"
                    onClick={play}
                >
                    <g-rectr
                        loc={[0, 0, 100, 30]}
                        circle={[8]}
                        fillStyle="#2f6fed"
                    />
                    <text loc={[14, 7]} text="重播" fillStyle="#ffffff" />
                </container>
                <container
                    loc={[140, 254, 160, 30]}
                    cursor="pointer"
                    onClick={next}
                >
                    <g-rectr
                        loc={[0, 0, 160, 30]}
                        circle={[8]}
                        fillStyle="#33465f"
                    />
                    <text
                        loc={[14, 7]}
                        text="换曲线与时长"
                        fillStyle="#e8f0ff"
                    />
                </container>
            </container>
        );
    };
});
