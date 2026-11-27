import { constant, linear, step } from '@motajs/animate';
import { defineComponent } from 'vue';
import { createCurveRender, type CurveEntry } from './animation-curve-plot';

const CURVES: CurveEntry[] = [
    { label: 'linear()', color: '#7ee787', curve: linear() },
    { label: 'step(5)', color: '#f2b84b', curve: step(5) },
    { label: 'constant(0.5)', color: '#c58af9', curve: constant(0.5) }
];

// 基础曲线：线性、阶梯与常数
export default defineComponent(() => {
    const render = createCurveRender(CURVES);

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />
            <text loc={[24, 16]} text="基础曲线" fillStyle="#e8f0ff" />
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
