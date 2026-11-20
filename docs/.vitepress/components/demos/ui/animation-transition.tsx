import { linear, sin } from '@motajs/animate';
import { useTransition } from '@motajs/render-vue';
import { defineComponent, onMounted, ref } from 'vue';

// 单值渐变：Transition 让当前值走向目标值
export default defineComponent(() => {
    const value = ref(0.18);
    const target = ref(0.82);
    const transition = useTransition()!;

    // 设定新的目标值，执行器从当前值继续渐变
    const moveTo = (next: number, curve = sin()) => {
        target.value = next;
        transition.transition(value).curve(curve).to(next, 900);
    };

    onMounted(() => {
        // 等执行器绑定到根激励源后再启动首段渐变
        requestAnimationFrame(() => moveTo(0.82));
    });

    return () => {
        const current = value.value;
        const goal = target.value;
        const targetX = 40 + goal * 400;

        return (
            <container loc={[0, 0, 480, 320]}>
                <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />
                <text
                    loc={[24, 16]}
                    text="Transition：单值渐变"
                    fillStyle="#e8f0ff"
                />
                <text
                    loc={[24, 40]}
                    text="当前值由执行器逐帧写入，目标值由 to 设定"
                    fillStyle="#8b98a8"
                />

                <text loc={[40, 80]} text="当前值" fillStyle="#cfe0ff" />
                <text
                    loc={[40, 100]}
                    text={current.toFixed(2)}
                    fillStyle="#8fb6ff"
                />
                <text loc={[160, 80]} text="目标值" fillStyle="#cfe0ff" />
                <text
                    loc={[160, 100]}
                    text={goal.toFixed(2)}
                    fillStyle="#f2b84b"
                />

                <g-rect loc={[40, 140, 400, 16]} fillStyle="#26364d" />
                <g-rect
                    loc={[40, 140, 400 * current, 16]}
                    fillStyle="#2f6fed"
                />
                <g-rect loc={[targetX - 1, 128, 2, 40]} fillStyle="#f2b84b" />
                <g-circle circle={[targetX, 148, 6]} fillStyle="#f2b84b" />

                <container
                    loc={[40, 208, 120, 32]}
                    onClick={() => moveTo(0.82)}
                >
                    <g-rectr
                        loc={[0, 0, 120, 32]}
                        circle={[8]}
                        fillStyle="#2f6fed"
                    />
                    <text loc={[12, 8]} text="去 0.82" fillStyle="#ffffff" />
                </container>
                <container
                    loc={[176, 208, 120, 32]}
                    onClick={() => moveTo(0.18, linear())}
                >
                    <g-rectr
                        loc={[0, 0, 120, 32]}
                        circle={[8]}
                        fillStyle="#33465f"
                    />
                    <text loc={[12, 8]} text="回 0.18" fillStyle="#e8f0ff" />
                </container>

                <text
                    loc={[40, 264]}
                    text={`当前值 ${current.toFixed(2)} → 目标值 ${goal.toFixed(2)}`}
                    fillStyle="#8b98a8"
                />
            </container>
        );
    };
});
