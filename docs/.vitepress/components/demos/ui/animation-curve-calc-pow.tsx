import { constant, linear, powCurve } from '@motajs/animate';
import { defineComponent } from 'vue';
import CurveCalcLab from './animation-curve-calc';

const SOURCE_1 = linear();
const SOURCE_2 = constant(2);
const RESULT = powCurve(SOURCE_1, SOURCE_2);

// 取幂：第一条曲线为底，第二条曲线为指数
export default defineComponent(() => {
    return () => (
        <CurveCalcLab
            title="powCurve"
            subtitle="结果 = f(x) ^ g(x)"
            curves={[
                { label: 'linear()', color: '#2f6fed', curve: SOURCE_1 },
                { label: 'constant(2)', color: '#f2b84b', curve: SOURCE_2 },
                { label: 'powCurve', color: '#7ee787', curve: RESULT }
            ]}
        />
    );
});
