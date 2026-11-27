import { Font } from '@motajs/render';
import { SetupComponentOptions } from '@motajs/system';
import { defineComponent } from 'vue';
import { createCurveRender, type CurveEntry } from './animation-curve-plot';

const LABEL_FONT = new Font('Verdana', 12);

export interface ICurveCalcLabProps {
    /** 计算函数名称，显示在标题位置 */
    title: string;
    /** 来源与结果的简短说明 */
    subtitle: string;
    /** 来源曲线与结果曲线；通常前两项是来源，最后一项是结果 */
    curves: CurveEntry[];
}

const curveCalcLabProps = {
    props: ['title', 'subtitle', 'curves']
} satisfies SetupComponentOptions<ICurveCalcLabProps>;

const RANGE_SAMPLES = 120;

// 按来源与结果曲线的实际采样计算显示范围，避免把越界输出截断
function getDisplayRange(curves: CurveEntry[]): {
    min: number;
    max: number;
} {
    let min = Infinity;
    let max = -Infinity;

    for (const entry of curves) {
        for (let i = 0; i <= RANGE_SAMPLES; i++) {
            const value = entry.curve(i / RANGE_SAMPLES);
            if (!Number.isFinite(value)) continue;
            min = Math.min(min, value);
            max = Math.max(max, value);
        }
    }

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
        return { min: 0, max: 1 };
    }

    // 0 是进度映射的基准，显示范围需要包含它
    min = Math.min(min, 0);
    max = Math.max(max, 0);

    const span = max - min;
    const padding = span > 0 ? span * 0.1 : 0.1;

    return { min: min - padding, max: max + padding };
}

// 曲线计算实验台：标题、说明、来源与结果曲线图
const CurveCalcLab = defineComponent<ICurveCalcLabProps>((props, { slots }) => {
    return () => {
        const render = createCurveRender(
            props.curves,
            getDisplayRange(props.curves)
        );

        return (
            <container loc={[0, 0, 480, 320]}>
                <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />
                <text loc={[24, 16]} text={props.title} fillStyle="#e8f0ff" />
                <text
                    loc={[24, 38]}
                    text={props.subtitle}
                    fillStyle="#8b98a8"
                />

                <custom loc={[36, 64, 408, 190]} render={render} />

                {props.curves.map((entry, index) => (
                    <container
                        key={entry.label}
                        loc={[40 + index * 140, 266, 132, 20]}
                    >
                        <g-line
                            line={[0, 10, 18, 10]}
                            strokeStyle={entry.color}
                            lineWidth={4}
                        />
                        <text
                            loc={[24, 4]}
                            text={entry.label}
                            font={LABEL_FONT}
                            fillStyle="#cfe0ff"
                        />
                    </container>
                ))}

                {slots.default?.()}
            </container>
        );
    };
}, curveCalcLabProps);

export default CurveCalcLab;
