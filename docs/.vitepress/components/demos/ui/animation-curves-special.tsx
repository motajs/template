import { CurveMode, cosh, sech, tanh } from '@motajs/animate';
import { defineComponent } from 'vue';
import { createCurveRender, type CurveEntry } from './animation-curve-plot';

const CURVES: CurveEntry[] = [
    {
        label: 'cosh()',
        color: '#2f6fed',
        curve: cosh(2, CurveMode.EaseOut)
    },
    {
        label: 'tanh()',
        color: '#7ee787',
        curve: tanh(2, CurveMode.EaseOut)
    },
    {
        label: 'sech()',
        color: '#f2b84b',
        curve: sech(1, CurveMode.EaseOut)
    }
];

// 双曲曲线：双曲余弦、双曲正切与双曲正割
export default defineComponent(() => {
    // 三条曲线都在 0 到 1 之间，纵轴固定为 0 到 1
    const render = createCurveRender(CURVES);

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />
            <text loc={[24, 16]} text="双曲曲线" fillStyle="#e8f0ff" />
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
