import { constant, divCurve, linear } from '@motajs/animate';
import { defineComponent } from 'vue';
import CurveCalcLab from './animation-curve-calc';

const SOURCE_1 = linear();
const SOURCE_2 = constant(0.5);
const RESULT = divCurve(SOURCE_1, SOURCE_2);

// 相除：两条来源曲线的逐点商，分母取常数避免过零
export default defineComponent(() => {
    return () => (
        <CurveCalcLab
            title="divCurve"
            subtitle="结果 = f(x) / g(x)"
            curves={[
                { label: 'linear()', color: '#2f6fed', curve: SOURCE_1 },
                { label: 'constant(0.5)', color: '#f2b84b', curve: SOURCE_2 },
                { label: 'divCurve', color: '#7ee787', curve: RESULT }
            ]}
        />
    );
});
