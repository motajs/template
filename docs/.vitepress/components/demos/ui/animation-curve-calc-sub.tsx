import { constant, linear, subCurve } from '@motajs/animate';
import { defineComponent } from 'vue';
import CurveCalcLab from './animation-curve-calc';

const SOURCE_1 = constant(0.8);
const SOURCE_2 = linear();
const RESULT = subCurve(SOURCE_1, SOURCE_2);

// 相减：两条来源曲线的逐点差
export default defineComponent(() => {
    return () => (
        <CurveCalcLab
            title="subCurve"
            subtitle="结果 = f(x) - g(x)"
            curves={[
                { label: 'constant(0.8)', color: '#2f6fed', curve: SOURCE_1 },
                { label: 'linear()', color: '#f2b84b', curve: SOURCE_2 },
                { label: 'subCurve', color: '#7ee787', curve: RESULT }
            ]}
        />
    );
});
