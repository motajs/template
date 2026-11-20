import { ExcitationVariator, RafExcitation } from '@motajs/animate';
import { defineComponent, onUnmounted, ref } from 'vue';

// 变速曲线：最后两次激励时间戳与时间差
export default defineComponent(() => {
    const speed = ref(1);
    const progress = ref(0);
    const prevTs = ref(0);
    const lastTs = ref(0);
    const gap = ref(0);
    const running = ref(false);

    let base = 0;
    let hasBase = false;
    let hasPrev = false;
    let curveStart = 0;
    const curveTime = 3000;

    const source = new RafExcitation();
    const variator = new ExcitationVariator();
    variator.bindExcitation(source);

    variator.add({
        excited(payload: number) {
            if (!hasBase) {
                base = payload;
                hasBase = true;
            }
            if (hasPrev) prevTs.value = lastTs.value;
            lastTs.value = payload - base;
            if (hasPrev) gap.value = lastTs.value - prevTs.value;
            hasPrev = true;
            speed.value = variator.speed;

            if (running.value) {
                const elapsed = source.payload() - curveStart;
                progress.value = Math.min(elapsed / curveTime, 1);
                if (progress.value >= 1) running.value = false;
            }
        }
    });

    const runCurve = () => {
        if (running.value) return;
        curveStart = source.payload();
        running.value = true;
        progress.value = 0;
        void variator.curveSpeed(p => 1.5 - 1.25 * p, curveTime);
    };

    const resetSpeed = () => {
        variator.endAllCurves();
        variator.setSpeed(1);
        speed.value = 1;
        running.value = false;
        progress.value = 0;
    };

    onUnmounted(() => {
        variator.destroy();
        source.destroy();
    });

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />
            <text
                loc={[24, 16]}
                text="curveSpeed：时间流速随时间变化"
                fillStyle="#e8f0ff"
            />
            <text
                loc={[24, 40]}
                text="曲线速度从 1.5× 降到 0.25×，持续 3 秒"
                fillStyle="#8b98a8"
            />

            <text
                loc={[40, 72]}
                text="输出端时间（相对开始）"
                fillStyle="#cfe0ff"
            />
            <text
                loc={[40, 98]}
                text={`${lastTs.value.toFixed(1)} ms`}
                fillStyle="#8fb6ff"
            />

            <text loc={[260, 72]} text="当前速度" fillStyle="#cfe0ff" />
            <text
                loc={[260, 98]}
                text={`${speed.value.toFixed(2)}×`}
                fillStyle="#7ee787"
            />

            <g-rect loc={[40, 122, 400, 92]} fillStyle="#1b2433" />
            <text loc={[52, 134]} text="最后两次激励" fillStyle="#cfe0ff" />
            <text
                loc={[52, 158]}
                text={`上次 = ${prevTs.value.toFixed(1)} ms`}
                fillStyle="#8fb6ff"
            />
            <text
                loc={[52, 180]}
                text={`本次 = ${lastTs.value.toFixed(1)} ms`}
                fillStyle="#8fb6ff"
            />
            <text loc={[252, 158]} text="时间差" fillStyle="#cfe0ff" />
            <text
                loc={[252, 180]}
                text={`${gap.value.toFixed(2)} ms`}
                fillStyle="#f2b84b"
            />

            <text
                loc={[40, 220]}
                text="速度越高，输出端时间推进越快，时间差越大"
                fillStyle="#8b98a8"
            />

            <text loc={[40, 248]} text="曲线进度" fillStyle="#cfe0ff" />
            <g-rect loc={[40, 266, 300, 10]} fillStyle="#26364d" />
            <g-rect
                loc={[40, 266, 300 * progress.value, 10]}
                fillStyle="#7ee787"
            />
            <text
                loc={[352, 262]}
                text={`${Math.round(progress.value * 100)}%`}
                fillStyle="#8fb6ff"
            />

            <container loc={[40, 286, 140, 32]} onClick={runCurve}>
                <g-rectr
                    loc={[0, 0, 140, 32]}
                    circle={[8]}
                    fillStyle={running.value ? '#26364d' : '#2f6fed'}
                />
                <text
                    loc={[26, 8]}
                    text={running.value ? '曲线运行中' : '运行曲线'}
                    fillStyle="#ffffff"
                />
            </container>
            <container loc={[196, 286, 140, 32]} onClick={resetSpeed}>
                <g-rectr
                    loc={[0, 0, 140, 32]}
                    circle={[8]}
                    fillStyle="#33465f"
                />
                <text loc={[26, 8]} text="重置为 1×" fillStyle="#e8f0ff" />
            </container>
        </container>
    );
});
