import { moveCurve, sin } from '@motajs/animate';
import { defineComponent } from 'vue';
import CurveCalcLab from './animation-curve-calc';

const SOURCE = sin();
const RESULT = moveCurve(SOURCE, 0.2);

// 平移：在来源曲线上加一个纵向偏移
export default defineComponent(() => {
    return () => (
        <CurveCalcLab
            title="moveCurve"
            subtitle="结果 = f(x) + move"
            curves={[
                { label: 'sin()', color: '#2f6fed', curve: SOURCE },
                { label: 'moveCurve', color: '#7ee787', curve: RESULT }
            ]}
        />
    );
});
