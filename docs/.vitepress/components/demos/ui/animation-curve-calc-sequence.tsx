import { linear, sequenceCurve, sin } from '@motajs/animate';
import { defineComponent } from 'vue';
import CurveCalcLab from './animation-curve-calc';

const SEGMENT_1 = linear();
const SEGMENT_2 = sin();
const RESULT = sequenceCurve(
    [SEGMENT_1, SEGMENT_2],
    [0.5, 0.5],
    [1, 1],
    [0, 0]
);

// 拼接：两条来源段按各占一半时长合成一条曲线
export default defineComponent(() => {
    return () => (
        <CurveCalcLab
            title="sequenceCurve"
            subtitle="来源段按 0.5 / 0.5 的时长拼接"
            curves={[
                { label: 'linear()', color: '#2f6fed', curve: SEGMENT_1 },
                { label: 'sin()', color: '#f2b84b', curve: SEGMENT_2 },
                { label: 'sequenceCurve', color: '#7ee787', curve: RESULT }
            ]}
        />
    );
});
