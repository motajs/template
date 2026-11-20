import { oppositeCurve, sin } from '@motajs/animate';
import { defineComponent } from 'vue';
import CurveCalcLab from './animation-curve-calc';

const SOURCE = sin();
const RESULT = oppositeCurve(SOURCE, 1);

// 取反：以 move 为基准翻转来源曲线
export default defineComponent(() => {
    return () => (
        <CurveCalcLab
            title="oppositeCurve"
            subtitle="结果 = move - f(x)"
            curves={[
                { label: 'sin()', color: '#2f6fed', curve: SOURCE },
                { label: 'oppositeCurve', color: '#7ee787', curve: RESULT }
            ]}
        />
    );
});
