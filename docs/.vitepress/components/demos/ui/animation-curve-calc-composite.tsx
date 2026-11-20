import { compositeCurve, pow, sin } from '@motajs/animate';
import { defineComponent } from 'vue';
import CurveCalcLab from './animation-curve-calc';

const OUTER = sin();
const INNER = pow(2);
const RESULT = compositeCurve(OUTER, INNER);

// 复合：外层曲线接收内层曲线的输出
export default defineComponent(() => {
    return () => (
        <CurveCalcLab
            title="compositeCurve"
            subtitle="结果 = 外层(内层(p))"
            curves={[
                { label: 'sin()', color: '#2f6fed', curve: OUTER },
                { label: 'pow(2)', color: '#f2b84b', curve: INNER },
                { label: 'compositeCurve', color: '#7ee787', curve: RESULT }
            ]}
        />
    );
});
