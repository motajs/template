import { CurveMode, pow, sec, sin, tan } from '@motajs/animate';
import { defineComponent } from 'vue';
import { createCurveRender, type CurveEntry } from './animation-curve-plot';

const CURVES: CurveEntry[] = [
    { label: 'sin()', color: '#2f6fed', curve: sin(CurveMode.EaseOut) },
    {
        label: 'pow(2)',
        color: '#7ee787',
        curve: pow(2, CurveMode.EaseOut)
    },
    { label: 'tan()', color: '#f2b84b', curve: tan(CurveMode.EaseOut) },
    { label: 'sec()', color: '#c58af9', curve: sec(CurveMode.EaseOut) }
];

// 缓动曲线：正弦、幂、正切与正割
export default defineComponent(() => {
    const render = createCurveRender(CURVES);

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />
            <text loc={[24, 16]} text="缓动曲线" fillStyle="#e8f0ff" />
            <text
                loc={[24, 38]}
                text="横轴 progress 0→1；纵轴输出"
                fillStyle="#8b98a8"
            />

            <custom loc={[36, 64, 408, 190]} render={render} />

            {CURVES.map((entry, index) => (
                <container
                    key={entry.label}
                    loc={[
                        40 + (index % 2) * 210,
                        266 + Math.floor(index / 2) * 26,
                        200,
                        20
                    ]}
                >
                    <g-line
                        line={[0, 10, 20, 10]}
                        strokeStyle={entry.color}
                        lineWidth={4}
                    />
                    <text
                        loc={[28, 0]}
                        text={entry.label}
                        fillStyle="#cfe0ff"
                    />
                </container>
            ))}
        </container>
    );
});
