import { linear, mulCurve, sin } from '@motajs/animate';
import { defineComponent } from 'vue';
import CurveCalcLab from './animation-curve-calc';

const SOURCE_1 = sin();
const SOURCE_2 = linear();
const RESULT = mulCurve(SOURCE_1, SOURCE_2);

// 相乘：两条来源曲线的逐点积
export default defineComponent(() => {
    return () => (
        <CurveCalcLab
            title="mulCurve"
            subtitle="结果 = f(x) · g(x)"
            curves={[
                { label: 'sin()', color: '#2f6fed', curve: SOURCE_1 },
                { label: 'linear()', color: '#f2b84b', curve: SOURCE_2 },
                { label: 'mulCurve', color: '#7ee787', curve: RESULT }
            ]}
        />
    );
});
